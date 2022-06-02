import { uPhysicalExamStart } from '../../utils/api/api'
import TRTC from '../../utils/trtc-wx'
import { genTestUserSig } from '../../utils/GenerateTestUserSig'
import WebsocketHeartbeat from '../../utils/heart'

const app = getApp()
Page({
  data: {
    pageDirection: 'vertical',
    currentStep: 1,
    startLoading: false,
    physicalExamList: [],
    _rtcConfig: {
      sdkAppID: '', // 必要参数 开通实时音视频服务创建应用后分配的 sdkAppID
      userID: '', // 必要参数 用户 ID 可以由您的帐号系统指定
      userSig: '' // 必要参数 身份签名，相当于登录密码的作用
    },
    bShowLivePusher: true, // 是否有推流图
    bShowVideo: true,
    pusher: null,
    playerList: [],
    localAudio: false,
    localVideo: false,
    bSmallPusher: true,
    needBlur: false, // 需要高斯模糊背景
    fullBodyCheck: true
  },
  TRTC: null,
  aiServerUrl: '',
  oVideo: null,
  oCanvas: null,
  oCtx: null,
  aBone: [], // 骨骼数组
  onShow () {
    wx.setKeepScreenOn({
      keepScreenOn: true
    })
  },
  onHide () {
    wx.setKeepScreenOn({
      keepScreenOn: false
    })
  },
  onLoad: function (options) {
    const height = wx.getSystemInfoSync().windowHeight
    const width = wx.getSystemInfoSync().windowWidth
    this.setData({
      pageDirection: height > width ? 'vertical' : 'horizontal'
    })
    app.api.post({
      url: uPhysicalExamStart
    }).then(res => {
      // 从返回中获取streamId并入_rtcConfig
      Object.assign(this.data._rtcConfig, { streamId: res.streamId })
      // 从返回中获取动作列表并存储
      this.setData({ physicalExamList: res.pysicalExamList })
      // 如返回中指定了AIServerUrl则使用，否则使用全局默认socketUrl
      this.aiServerUrl = res.aiServerUrl || app.globalData.wsUrl
      // 初始化腾讯实时音视频
      this.initTrtc()
      // 绑定实时音视频事件
      this.bindTRTCRoomEvent()
      // 进入房间开始推流
      this.enterRoom()
      // 绘图canvas相关初始化
      this.initDrawDebug()
      // 媒体播放相关初始化
      this.initMedia()
    }).catch(_ => {
      wx.navigateBack()
    })
  },
  onResize (options) {
    // TODO: need set pusher/video orientation?
    this.setData({
      pageDirection: options.size.windowHeight > options.size.windowWidth ? 'vertical' : 'horizontal'
    })
  },
  initTrtc () {
    // 初始化trtc、音频、视频、socket
    this.TRTC = new TRTC(this)
    // pusher 初始化参数
    const pusherConfig = {
      beautyLevel: 0,
      localMirror: 'auto',
      enableRemoteMirror: true,
      audioVolumeType: 'media',
      videoWidth: 288,
      videoHeight: 368
    }
    const pusher = this.TRTC.createPusher(pusherConfig)
    this.setData({
      _rtcConfig: {
        userID: app.globalData.clientId,
        sdkAppID: app.globalData.sdkAppID,
        userSig: genTestUserSig(app.globalData.clientId).userSig
      },
      pusher: pusher.pusherAttributes,
      playerList: [],
      localAudio: true,
      localVideo: true
    })
  },
  bindTRTCRoomEvent () {
    const TRTC_EVENT = this.TRTC.EVENT
    // 初始化事件订阅
    this.TRTC.on(TRTC_EVENT.LOCAL_JOIN, (event) => {
      console.log('* room LOCAL_JOIN', event)
      if (this.data.localVideo) {
        this.setPusherAttributesHandler({ enableCamera: true })
      }
      if (this.data.localAudio) {
        this.setPusherAttributesHandler({ enableMic: true })
      }
    })
    this.TRTC.on(TRTC_EVENT.LOCAL_LEAVE, (event) => {
      console.log('* room LOCAL_LEAVE', event)
    })
    this.TRTC.on(TRTC_EVENT.ERROR, (event) => {
      console.log('* room ERROR', event)
    })
    this.TRTC.on(TRTC_EVENT.REMOTE_USER_JOIN, (event) => {
      console.log('* room REMOTE_USER_JOIN', event)
      const { userID } = event.data
      wx.showToast({
        title: `${userID} 进入了房间`,
        icon: 'none',
        duration: 2000
      })
    })
    // 远端用户退出
    this.TRTC.on(TRTC_EVENT.REMOTE_USER_LEAVE, (event) => {
      console.log('* room REMOTE_USER_LEAVE', event)
      const {
        userID,
        playerList
      } = event.data
      this.setData({
        playerList
      })
      wx.showToast({
        title: `${userID} 离开了房间`,
        icon: 'none',
        duration: 2000
      })
    })
    // 远端用户推送视频
    this.TRTC.on(TRTC_EVENT.REMOTE_VIDEO_ADD, (event) => {
      console.log('* room REMOTE_VIDEO_ADD', event)
      const { player } = event.data
      // 开始播放远端的视频流，默认是不播放的
      this.setPlayerAttributesHandler(player, { muteVideo: false })
    })
    // 远端用户取消推送视频
    this.TRTC.on(TRTC_EVENT.REMOTE_VIDEO_REMOVE, (event) => {
      console.log('* room REMOTE_VIDEO_REMOVE', event)
      const { player } = event.data
      this.setPlayerAttributesHandler(player, { muteVideo: true })
    })
    // 远端用户推送音频
    this.TRTC.on(TRTC_EVENT.REMOTE_AUDIO_ADD, (event) => {
      console.log('* room REMOTE_AUDIO_ADD', event)
      const { player } = event.data
      this.setPlayerAttributesHandler(player, { muteAudio: false })
    })
    // 远端用户取消推送音频
    this.TRTC.on(TRTC_EVENT.REMOTE_AUDIO_REMOVE, (event) => {
      console.log('* room REMOTE_AUDIO_REMOVE', event)
      const { player } = event.data
      this.setPlayerAttributesHandler(player, { muteAudio: true })
    })
    this.TRTC.on(TRTC_EVENT.REMOTE_AUDIO_VOLUME_UPDATE, (event) => {
      console.log('* room REMOTE_AUDIO_VOLUME_UPDATE', event)
      const { playerList } = event.data
      this.setData({
        playerList
      })
    })
    this.TRTC.on(TRTC_EVENT.LOCAL_AUDIO_VOLUME_UPDATE, (event) => {
      // console.log('* room LOCAL_AUDIO_VOLUME_UPDATE', event)
      const { pusher } = event.data
      this.setData({
        pusher
      })
    })
  },
  enterRoom () {
    const roomID = app.globalData.clientId
    // 参数中放入音视频roomId
    const config = Object.assign(this.data._rtcConfig, { roomID })
    this.setData({
      pusher: this.TRTC.enterRoom(config)
    }, () => {
      this.TRTC.getPusherInstance().start() // 开始推流
    })
  },

  exitRoom () {
    const result = this.TRTC.exitRoom()
    this.setData({
      pusher: result.pusher,
      playerList: result.playerList
    })
  },
  // 设置 pusher 属性
  setPusherAttributesHandler (options) {
    this.setData({
      pusher: this.TRTC.setPusherAttributes(options)
    })
  },

  // 设置某个 player 属性
  setPlayerAttributesHandler (player, options) {
    this.setData({
      playerList: this.TRTC.setPlayerAttributes(player.streamID, options)
    })
  },

  _pusherStateChangeHandler (event) {
    this.TRTC.pusherEventHandler(event)
  },
  _pusherNetStatusHandler (event) {
    this.TRTC.pusherNetStatusHandler(event)
  },
  _pusherErrorHandler (event) {
    this.TRTC.pusherErrorHandler(event)
  },
  _pusherBGMStartHandler (event) {
    this.TRTC.pusherBGMStartHandler(event)
  },
  _pusherBGMProgressHandler (event) {
    this.TRTC.pusherBGMProgressHandler(event)
  },
  _pusherBGMCompleteHandler (event) {
    this.TRTC.pusherBGMCompleteHandler(event)
  },
  _pusherAudioVolumeNotify (event) {
    this.TRTC.pusherAudioVolumeNotify(event)
  },
  _playerStateChange (event) {
    this.TRTC.playerEventHandler(event)
  },
  _playerFullscreenChange (event) {
    this.TRTC.playerFullscreenChange(event)
  },
  _playerNetStatus (event) {
    this.TRTC.playerNetStatus(event)
  },
  _playerAudioVolumeNotify (event) {
    this.TRTC.playerAudioVolumeNotify(event)
  },
  initMedia () {
    // 获取video标签
    this.oVideo = wx.createVideoContext('main-video')
  },
  initDrawDebug () {
    const that = this
    const query = wx.createSelectorQuery()
    query.select('#debug-canvas')
      .fields({
        node: true,
        size: true,
        boundingClientRect: true
      })
      .exec((res) => {
        that.oCanvas = res[0].node
        that.oCtx = that.oCanvas.getContext('2d')
        // const dpr = wx.getSystemInfoSync().pixelRatio
        that.oCanvas.width = res[0].width
        that.oCanvas.height = res[0].height
        that.oCtx.lineWidth = '6'
        // 初始化Socket连接
        this.initSocket()
      })
  },
  initSocket () {
    WebsocketHeartbeat({
      miniprogram: wx,
      connectSocketParams: {
        url: app.globalData.wsUrl,
        repeatLimit: 30
      }
    }).then(task => {
      app.globalData.oWs = task
      task.onOpen = () => { // 钩子函数
        console.log('[WebSocket] open a new ws connection')
        app.globalData.oWs.send({
          data: JSON.stringify({
            type: 'register_client',
            url: this.aiServerUrl
          }),
          success: () => {
            console.log('[WebSocket] reg ai service ok!')
            // 向Socket Server注册后发送当前手机屏幕分辨率
            // TODO: required???
            // this.sendResolution()
          }
        })
      }
      task.onClose = () => { // 钩子函数
        console.log('onClose')
      }
      task.onError = e => { // 钩子函数
        console.log('onError：', e)
      }
      task.onMessage = res => { // 钩子函数
        // 分发socket收到的消息
        this.handleReceiveMsg(res.data)
      }
      task.onReconnect = () => { // 钩子函数
        console.log('onReconnect...')
      }
    })
  },
  handleReceiveMsg (msg) {
    console.log(msg)
  }
})
