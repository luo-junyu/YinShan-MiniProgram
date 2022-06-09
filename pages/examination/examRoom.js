import { uPhysicalExamStart } from '../../utils/api/api'
import TRTC from '../../utils/trtc-wx'
import { genTestUserSig } from '../../utils/GenerateTestUserSig'
import WebsocketHeartbeat from '../../utils/heart'
import { parseData } from '../../utils/util'

const app = getApp()
Page({
  behaviors: [require('miniprogram-computed').behavior],
  data: {
    navHeight: wx.getSystemInfoSync().statusBarHeight + 44,
    pageDirection: 'vertical',
    currentStep: 1, // 1=TEST 2=LOADING 3=EXAMINING 4=OUTSIDE
    startLoading: false,
    physicalExamList: [],
    _rtcConfig: {
      sdkAppID: '', // 必要参数 开通实时音视频服务创建应用后分配的 sdkAppID
      userID: '', // 必要参数 用户 ID 可以由您的帐号系统指定
      userSig: '' // 必要参数 身份签名，相当于登录密码的作用
    },
    bShowLivePusher: true, // 是否有推流图
    bShowVideo: true,
    bShowVideoControl: true,
    bShowDebug: false,
    sVideoUrl: null,
    pusher: null,
    playerList: [],
    localAudio: false,
    localVideo: false,
    bSmallPusher: false,
    bFinished: true,
    nNowActionId: '',
    needBlur: false, // 需要高斯模糊背景
    fullBodyCheck: false,
    currentActionIndex: 0,
    countDown: null
  },
  computed: {
    currentAction (data) {
      if (data.physicalExamList.length > 0 && data.currentActionIndex < data.physicalExamList.length) {
        return data.physicalExamList[data.currentActionIndex]
      }
      return {
        name: '',
        script: ''
      }
    }
  },
  TRTC: null,
  aiServerUrl: '',
  oVideo: null,
  skeleton: [[22, 20], [20, 18], [18, 16], [21, 19], [19, 17], [17, 15], [15, 16], [15, 14], [16, 14], [14, 13], [13, 12], [12, 4], [12, 5], [4, 5], [11, 9], [9, 7], [7, 5], [10, 8], [8, 6], [6, 4], [4, 1], [1, 2], [1, 3], [2, 0], [3, 0], [4, 15], [5, 16]],
  oCanvas: null,
  oCtx: null,
  aBone: [], // 骨骼数组
  bodyCheckFailedTimestamp: null,
  bodyCheckSuccessTimestamp: null,
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
      this.setData({ physicalExamList: res.physicalExamList })
      // 如返回中指定了AIServerUrl则使用，否则使用全局默认socketUrl
      this.aiServerUrl = res.aiServerUrl
      // || app.globalData.wsUrl
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
  onUnload () {
    if (this.oVideo) {
      this.oVideo.stop()
    }
    app.globalData.oWs.send({
      data: JSON.stringify({
        type: 'finish_class'
      })
    })
    if (app.globalData.oWs.status === 'loss') {
      app.globalData.oWs.forbidConnect()
      app.globalData.oWs.close()
      this.exitRoom()
      wx.navigateBack()
    }
  },
  onResize (options) {
    const direction = options.size.windowHeight > options.size.windowWidth ? 'vertical' : 'horizontal'
    this.setData({
      pageDirection: direction
    })
    if (this.data.physicalExamList.length > 0 && this.data.currentActionIndex < this.data.physicalExamList.length) {
      const currentAction = this.data.physicalExamList[this.data.currentActionIndex]
      if (currentAction.type === 'flexibility') {
        direction === 'horizontal' ? this.pauseAction() : this.resumeAction()
      } else if (currentAction.type === 'strength') {
        direction === 'vertical' ? this.pauseAction() : this.resumeAction()
      }
    }
  },
  sendResolution (needStartTest = false) {
    console.log(this.oCanvas)
    console.log(this.oCanvas.height)
    console.log(this.oCanvas.width)
    app.globalData.oWs.send({
      data: JSON.stringify({
        type: 'change_resolution',
        height: this.oCanvas.height,
        width: this.oCanvas.width
      }),
      success: () => {
        if (needStartTest) {
          this.beginTest()
        }
      }
    })
  },
  pauseAction () {
    if (this.oVideo) {
      this.oVideo.pause()
    }
    app.globalData.oWs.send({
      data: JSON.stringify({
        type: 'pause_class'
      })
    })
    this.setData({
      needBlur: true
    })
  },
  resumeAction () {
    this.sendResolution()
    app.globalData.oWs.send({
      data: JSON.stringify({
        type: 'resume_class'
      })
    })
    this.setData({
      needBlur: false
    })
    if (this.oVideo) {
      this.oVideo.play()
    }
  },
  nextAction () {
    if ((this.data.currentActionIndex + 1) < this.data.physicalExamList.length) {
      this.setData({ currentActionIndex: this.data.currentActionIndex + 1 }, () => {
        const currentActionType = this.data.physicalExamList[this.data.currentActionIndex].type
        const lastActionType = this.data.physicalExamList[this.data.currentActionIndex - 1].type
        if (currentActionType !== lastActionType) {
          this.pauseAction()
        } else {
          this.beginLoading()
        }
      })
    } else {
      this.endRoom()
    }
  },
  beginTest () {
    this.setData({
      bShowLivePusher: true,
      bSmallPusher: false,
      currentStep: 1
    })
  },
  beginLoading () {
    const currentVideoUrl = this.data.physicalExamList[this.data.currentActionIndex].videoUrl
    console.log(currentVideoUrl)
    this.setData({
      currentStep: 2,
      needBlur: true,
      bShowVideo: true,
      bShowLivePusher: true,
      bSmallPusher: true,
      sVideoUrl: currentVideoUrl
    }, () => {
      this.setData({
        startLoading: true
      })
    })
  },
  beginExamining () {
    this.setData({
      startLoading: false,
      needBlur: false,
      bShowVideoControl: false,
      bShowDebug: true,
      currentStep: 3
    }, () => {
      this.oVideo.play()
      const currentAction = this.data.physicalExamList[this.data.currentActionIndex]
      app.globalData.oWs.send({
        data: JSON.stringify({
          type: 'resume_class'
        })
      })
      app.globalData.oWs.send({
        data: JSON.stringify({
          type: 'change_check',
          action_id: currentAction.ruleIndex,
          screen_toward: this.data.pageDirection
        })
      })
    })
  },
  endRoom () {
    this.oVideo.stop()
    app.globalData.oAudio.pause()
    app.globalData.oWs.send({
      data: JSON.stringify({
        type: 'finish_check'
      })
    })
    if (app.globalData.oWs.status === 'loss') {
      app.globalData.oWs.forbidConnect()
      app.globalData.oWs.close()
      this.exitRoom()
      wx.navigateBack()
    }
  },
  handleTransEnd (e) {
    this.beginExamining()
  },
  handleVideoError (error) {
    // 尝试加入加载错误处理，并重新设置视频播放地址
    console.log(error)
    this.setData({
      sVideoUrl: this.data.sVideoUrl
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
        console.log(res)
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
            this.sendResolution(true)
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
    const {
      data,
      type
    } = parseData(msg)
    if (type === 'obj') {
      // 发送回来的是json
      console.log('接收到的:', data)
      if (data.type === 'update_check_info') {
        // 分别记录最后一次的check成功/失败时间戳
        if (!this.bodyCheckFailedTimestamp) this.bodyCheckFailedTimestamp = Date.now()
        if (!this.bodyCheckSuccessTimestamp) this.bodyCheckSuccessTimestamp = Date.now()
        // TEST: set full body check to true for Test step switch
        // data.full_body_check = true
        if (!data.full_body_check) {
          this.bodyCheckFailedTimestamp = Date.now()
          // 检测false时，如果当前时间离上次最后true时间的间隔大于3s，则显示全屏提示
          const isFailedCheckTimeout = Date.now() - this.bodyCheckSuccessTimestamp > 3000
          if (this.data.currentStep === 3) {
            this.setData({
              fullBodyCheck: !isFailedCheckTimeout,
              needBlur: isFailedCheckTimeout
            })
          }
          if (this.data.currentStep === 1) {
            this.setData({
              fullBodyCheck: false,
              countDown: null
            })
          }
        } else {
          this.bodyCheckSuccessTimestamp = Date.now()
          if (this.data.currentStep === 1) {
            // 一旦检测到true，则开始倒数计时3s，当小于1时则进入下一步
            const countDownNumber = 3 - Math.floor((Date.now() - this.bodyCheckFailedTimestamp) / 1000)
            if (countDownNumber < 1) {
              this.beginLoading()
            } else {
              this.setData({
                fullBodyCheck: true,
                countDown: countDownNumber
              })
            }
          }
        }
        if (this.data.currentStep === 3) {
          this.drawDebug(data.cur_pose)
        }
        if (data.cur_action !== this.data.nNowActionId && this.data.bFinished) {
          // 已经切换到下一个动作了，更换状态到下一个动作
          this.setData({
            nNowActionId: data.cur_action,
            bFinished: false
          })
        } else if (data.curSuccessRatio >= 100 && !this.data.bFinished) {
          // 第一次完成该动作
          this.setData({
            bFinished: true
          })
          app.globalData.oWs.send({
            data: JSON.stringify({
              type: 'finish_check_action'
            })
          })
          setTimeout(() => {
            this.nextAction()
          }, 1000)
        }
        if (this.nNowActionId !== data.cur_action) {
          this.setData({
            nNowActionId: data.cur_action,
          })
        }
      } else if (data.type === 'finish_class_confirm') {
        console.log('收到结束课程确认消息')
        app.globalData.oWs.forbidConnect()
        app.globalData.oWs.close()
        this.exitRoom()
        wx.navigateBack()
      }
    }
  },
  // 骨骼图绘制
  drawDebug (aBone) {
    const ctx = this.oCtx
    this.oCanvas.width = this.oCanvas.width // Warning: This line can not be removed (by junyu)
    const drawLine = (aTwoP = [[], []]) => {
      ctx.beginPath()
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
      ctx.moveTo(aTwoP[0][0], aTwoP[0][1])
      ctx.lineTo(aTwoP[1][0], aTwoP[1][1])
      ctx.stroke()
      ctx.closePath()
    }
    this.skeleton.forEach((item, index) => {
      if (aBone[item[0]][2] >= 0.2 && aBone[item[1]][2] >= 0.2) {
        drawLine([aBone[item[0]], aBone[item[1]]])
      }
    })
    ctx.fillStyle = 'rgba(255,255,255)'
    for (let index = 0; index < aBone.length; index++) {
      if (aBone[index][2] < 0.2) {
        continue
      }
      ctx.beginPath()
      ctx.arc(aBone[index][0], aBone[index][1], 2, 0, Math.PI * 2, false)
      ctx.fill()
    }
  }

})
