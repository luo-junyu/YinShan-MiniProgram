/// show.js
import TRTC from '../../utils/trtc-wx'
import WebsocketHeartbeat from '../../utils/heart.js'
import { uControlStart } from '../../utils/api/api.js'
import { parseData } from '../../utils/util.js'
import { genTestUserSig } from '../../utils/GenerateTestUserSig.js'
// 获取应用实例
const app = getApp()
// const io = require('../../utils/weapp.socket.io.js')
Page({
  data: {
    sStep: '', // 康复步骤：test准备阶段,ing训练阶段
    startLoading: false,
    _rtcConfig: {
      sdkAppID: '', // 必要参数 开通实时音视频服务创建应用后分配的 sdkAppID
      userID: '', // 必要参数 用户 ID 可以由您的帐号系统指定
      userSig: '' // 必要参数 身份签名，相当于登录密码的作用
    },
    sVideoUrl: '',
    oVideoUrl: {
      explain: 'http://vjs.zencdn.net/v/oceans.mp4'
    },
    aAudioUrl: [],
    bShowVideoControl: true, // 是否显示视频播放条
    bShowLivePusher: true, // 是否有推流图
    bShowFishDialog: false,
    bShowVideo: true,
    pusher: null,
    localAudio: false,
    localVideo: false,
    bSmallPusher: true,
    bShowDebug: true,
    // 课程中相关数据
    aAction: [],
    oExeing: {}, // websocket返回的数据
    sEncourage: '', // 激励文
    nAction: 0, // 当前动作,
    showCircle: true// 展示两个圈
  },
  bFinished: true, // 一组动作是否结束
  bPlayingCountTime: false, // 正在播放计时器音效
  bEnded: false, // 最小化后置true
  nNowActionId: '', // 当前动作的id
  skeleton: [[22, 20], [20, 18], [18, 16], [21, 19], [19, 17], [17, 15], [15, 16], [15, 14], [16, 14], [14, 13], [13, 12], [12, 4], [12, 5], [4, 5], [11, 9], [9, 7], [7, 5], [10, 8], [8, 6], [6, 4], [4, 1], [1, 2], [1, 3], [2, 0], [3, 0], [4, 15], [5, 16]], // [15,13],[13,11],[16,14],[14,12],[11,12],[5,11],[6,12],[5,6],[5,7],[6,8],[7,9],[8,10],[1,2],[0,1],[0,2],[1,3],[2,4],[3,5],[4,6]
  TRTC: null,
  oOptions: {},
  aiServerUrl: '',
  oCanvas: null,
  oCtx: null,
  aBone: [], // 骨骼数组
  oToast: null,
  oPause: null,
  oVideo: null,
  oCircleNum: null,
  oCircleTime: null,
  oShortAudio: null,
  oCountAudio: null,
  oBackgroundAudio: null,
  oShortAudioUrl: {
    excellent: 'https://kangfu-action-video-1258481652.cos.ap-beijing.myqcloud.com/audio/sound-effect/excellent.mp3',
    well: 'https://kangfu-action-video-1258481652.cos.ap-beijing.myqcloud.com/audio/sound-effect/well.mp3',
    fair: 'https://kangfu-action-video-1258481652.cos.ap-beijing.myqcloud.com/audio/sound-effect/fair.mp3'
  },
  backgroundAudioUrl: 'https://kangfu-action-video-1258481652.cos.ap-beijing.myqcloud.com/audio/background/meihaodeyitian.mp3',
  idxAudioUrl: [
    'https://kangfu-action-video-1258481652.cos.ap-beijing.myqcloud.com/audio/xuhao/diyigedongzuo.m4a',
    'https://kangfu-action-video-1258481652.cos.ap-beijing.myqcloud.com/audio/xuhao/diergedongzuo.m4a',
    'https://kangfu-action-video-1258481652.cos.ap-beijing.myqcloud.com/audio/xuhao/disangedongzuo.m4a',
    'https://kangfu-action-video-1258481652.cos.ap-beijing.myqcloud.com/audio/xuhao/disigedongzuo.m4a',
    'https://kangfu-action-video-1258481652.cos.ap-beijing.myqcloud.com/audio/xuhao/diwugedongzuo.m4a',
    'https://kangfu-action-video-1258481652.cos.ap-beijing.myqcloud.com/audio/xuhao/diliugedongzuo.m4a',
    'https://kangfu-action-video-1258481652.cos.ap-beijing.myqcloud.com/audio/xuhao/diqigedongzuo.m4a',
    'https://kangfu-action-video-1258481652.cos.ap-beijing.myqcloud.com/audio/xuhao/dibagedongzuo.m4a',
    'https://kangfu-action-video-1258481652.cos.ap-beijing.myqcloud.com/audio/xuhao/dijiugedongzuo.m4a',
    'https://kangfu-action-video-1258481652.cos.ap-beijing.myqcloud.com/audio/xuhao/dishigedongzuo.m4a'
  ],
  finishClassEncourageAudio: 'https://kangfu-action-video-1258481652.cos.ap-beijing.myqcloud.com/audio/yuyinjili/wanchengyundongchufanggongxini-wanchenglebencixunlian.m4a',
  unfinishClassEncourageAudio: 'https://kangfu-action-video-1258481652.cos.ap-beijing.myqcloud.com/audio/yuyinjili/wanchengyundongchufangxiacijiayou-jianchiwanchengxunliano.m4a',
  finishActionEncourageAudio: 'https://kangfu-action-video-1258481652.cos.ap-beijing.myqcloud.com/audio/yuyinjili/dangedongzuowanchengyuyinjilimubiaodacheng.m4a',
  sStatus: 'init', // 当前状态，对比用
  /* 通用变量 start */
  /* 通用函数 start */
  onShow () {
    // if(this.bEnded){
    //   return;
    // }
    // 设置屏幕常亮
    wx.setKeepScreenOn({
      keepScreenOn: true
    })
    // socket连接存在并调用Pause控件的恢复方法
    app.globalData.oWs && this.data.oPause.resumeAction()
  },
  onHide () {
    console.log('hide')
    // 恢复屏幕非常亮
    wx.setKeepScreenOn({
      keepScreenOn: false
    })
    // 结束课程资源回收
    this.endClass()
    // FIXME: 该变量未使用
    this.bEnded = true
    // this.trtcRoomContext.exitRoom();
  },
  onLoad (options) {
    // FIXME: 暂无options使用
    this.oOptions = options
    // 初始化页面Share设置
    app.initShare()
    // 获取Toast控件
    this.oToast = this.selectComponent('#toast')
    // 获取Pause蒙层控件
    this.data.oPause = this.selectComponent('#pause')
    // 全局音频播放组件的结束事件注册
    app.globalData.oAudio.onEnded((event) => {
      console.log('音频结束')
      if (this.data.aAudioUrl.length > 0) {
        this.playAudioList()
      }
    })
    // 全局变量当前是否跳过课程默认值
    app.globalData.hasSkip = false
    // 调用接口开始上课
    app.api.post({
      url: uControlStart,
      data: {
        sessionId: app.globalData.sessionId,
        courseId: app.globalData.courseId
      }
    }).then(res => {
      // 从返回中获取streamId并入_rtcConfig
      Object.assign(this.data._rtcConfig, { streamId: res.streamId })
      // 从返回中获取动作列表并存储
      this.setData({ aAction: res.actionList })
      // 保存这一次AI康复科课的记录号到全局变量中
      app.globalData.cslId = res.cslId
      // 保存这次的动作列表到全局变量中
      app.globalData.aAction = res.actionList
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
    })
  },

  initMedia () {
    // 初始化音频、视频
    // 获取video标签
    this.oVideo = wx.createVideoContext('main-video')
    // 初始化短音频播放组件
    this.initShortAudio()
    // 初始化倒数音频组件
    this.initCountAudio()
    // 初始化背景音乐音频组件
    this.initBackgroundAudio()
  },
  initShortAudio () {
    this.oShortAudio = wx.createInnerAudioContext({ useWebAudioImplement: true })
    this.oShortAudio.onEnded((event) => {
      console.log('短音频结束')
    })
  },
  initBackgroundAudio () {
    this.oBackgroundAudio = wx.createInnerAudioContext({ useWebAudioImplement: true })
    this.oBackgroundAudio.src = this.backgroundAudioUrl
    this.oBackgroundAudio.loop = true
    this.oBackgroundAudio.volume = 0.3
    this.oBackgroundAudio.onEnded((event) => {
      console.log('短音频结束')
    })
    this.oBackgroundAudio.play()
  },
  initCountAudio () {
    this.oCountAudio = wx.createInnerAudioContext({ useWebAudioImplement: true })
    this.oCountAudio.src = 'https://kangfu-action-video-1258481652.cos.ap-beijing.myqcloud.com/audio/sound-effect/countdown.mp3'
    this.oCountAudio.loop = true
    this.oCountAudio.onEnded((event) => {
      console.log('短音频结束')
    })
  },
  initSocket () {
    WebsocketHeartbeat({
      miniprogram: wx,
      connectSocketParams: {
        url: app.globalData.wsUrl,
        repeatLimit: 10
      }
    }).then(task => {
      app.globalData.oWs = task
      task.onOpen = () => { // 钩子函数
        console.log('open------------------------------------------------------------------------------')
        app.globalData.oWs.send({
          data: JSON.stringify({
            type: 'register_client',
            url: this.aiServerUrl
          }),
          success: () => {
            // 向Socket Server注册后发送当前手机屏幕分辨率
            this.sendResolution()
          }
        })
      }
      task.onClose = () => { // 钩子函数
        console.log('close')
      }
      task.onError = e => { // 钩子函数
        console.log('onError：', e)
      }
      task.onMessage = res => { // 钩子函数
        // 分发socket收到的消息
        this.handleReceiveMsg(res.data)
      }
      task.onReconnect = () => { // 钩子函数
        app.globalData.oWs.send({
          data: JSON.stringify({
            type: 'register_client',
            url: this.aiServerUrl
          })
        })
        console.log('reconnect...')
      }
    })
  },
  sendResolution () {
    app.globalData.oWs.send({
      data: JSON.stringify({
        type: 'change_resolution',
        height: app.globalData.nHeight,
        width: app.globalData.nWidth
      }),
      success: () => {
        this.switchStep('ing-loading')
      }
    })
  },
  initDrawDebug () {
    const that = this
    const query = wx.createSelectorQuery()
    this.oCircleNum = this.selectComponent('#countnum')
    this.oCircleTime = this.selectComponent('#counttime')
    console.log('初始化圆画布')
    query.select('#debug-canvas')
      .fields({ node: true, size: true, boundingClientRect: true })
      .exec((res) => {
        app.globalData.nWidth = res[0].width
        app.globalData.nHeight = res[0].height
        that.oCanvas = res[0].node
        that.oCtx = that.oCanvas.getContext('2d')
        // const dpr = wx.getSystemInfoSync().pixelRatio
        that.oCanvas.width = res[0].width
        that.oCanvas.height = res[0].height
        that.oCtx.lineWidth = '6'
        // 初始化Socket连接
        this.initSocket()
      })
    console.log('屏幕信息', app.globalData.nWidth, app.globalData.nHeight, wx.getSystemInfoSync().pixelRatio)
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
  handleReceiveMsg (str) {
    const { data, type } = parseData(str)
    if (type === 'obj') {
      // 发送回来的是json
      console.log('接收到的:', data)
      if (data.type === 'update_client_info') {
        this.drawDebug(data.cur_pose)
        // this.sStatus = 'init';
        if (!this.bPlayingCountTime && data.cur_duration_ratio > 0) {
          this.bPlayingCountTime = true
          this.oCountAudio.play()
        } else if (this.bPlayingCountTime && data.cur_duration_ratio === 0) {
          this.bPlayingCountTime = false
          this.oCountAudio.stop()
        }
        this.setData({
          oExeing: data
          // sEncourage:'init'
        }, () => {
          if (data.action_id !== this.nNowActionId && this.bFinished) {
            this.nNowActionId = data.action_id
            this.bFinished = false
          } else {
            if (data.cur_finish_ratio >= 100 && !this.bFinished) {
              // 一个动作结束
              this.bFinished = true
              console.log('动作完成比例超过了100', data)
              console.log('计数', this.data.nAction, this.data.aAction)
              app.globalData.oAudio.src = this.finishActionEncourageAudio
              console.log('[debug] 目标达成 finishActionEncourageAudio')
              app.globalData.oAudio.play()
              setTimeout(() => {
                this.nextAction()
              }, 1000);
            } else {
                if (this.nNowActionId !== data.action_id) {
                    this.nNowActionId = data.action_id
                }
              this.oCircleNum.drawCanvas()
              this.oCircleTime.drawCanvas()
            }
          }
        })
      } else if (data.type === 'audio_encourage') {
        console.log('收到激励语音', data)
        if (data.autio_type === 'encourage') {
          this.sStatus = data.name
          this.oShortAudio.src = this.oShortAudioUrl[this.sStatus]
          this.oShortAudio.play()
          this.setData({ sEncourage: this.sStatus }, () => {
            setTimeout(() => {
              this.sStatus = 'init'
              this.setData({ sEncourage: this.sStatus })
            }, 2000)
          })
        } else {
          this.inputAudio(data)
        }
        this.playAudioList()
      } else if (data.type === 'finish_class_confirm') {
        console.log('收到结束课程确认消息')
        app.globalData.oWs.close()
        this.exitRoom()
        wx.redirectTo({
          url: '/pages/end/end'
        })
      }
    }
  },
  // 存入音频进列表
  inputAudio (data) {
    if (this.data.aAudioUrl.length === 0) {
      this.data.aAudioUrl.push(data)
      return
    }
    for (let i = 0; i < this.data.aAudioUrl.length; i++) {
      if (data.prior >= this.data.aAudioUrl[i].prior) {
        this.data.aAudioUrl.splice(i, 0, data)
        break
      } else if (i === this.data.aAudioUrl.length - 1) {
        this.data.aAudioUrl.push(data)
        break
      }
    }
  },
  // 动作讲解
  explainAction () {

  },
  // 播放语音列表
  playAudioList () {
    if(!this.startLoading) {
      const oUrl = this.data.aAudioUrl.shift()
      if (oUrl !== undefined) {
        console.log('[debug] 播放', oUrl.path)
        app.globalData.oAudio.src = oUrl.path
        app.globalData.oAudio.play()
      }
    }
  },
  // 暂停课程
  pauseAction () {
    console.log('课程暂停--------')
    app.globalData.oWs.send({
      data: JSON.stringify({
        type: 'pause_class'
      })
    })
    this.oVideo.pause()
    app.globalData.oAudio.pause()
    this.oShortAudio.pause()
    this.oCountAudio.pause()
    this.oBackgroundAudio.pause()
    this.data.oPause.showPause((this.data.nAction + 1) < this.data.aAction.length)
  },
  // 继续课程
  resumeAction () {
    app.globalData.oWs.send({
      data: JSON.stringify({
        type: 'resume_class'
      })
    })
    this.oVideo.play()
    this.oBackgroundAudio.play()
    app.globalData.oAudio.play()
  },
  // 下一个动作
  nextAction () {
    if ((this.data.nAction + 1) < this.data.aAction.length) {
      this.setData({ nAction: this.data.nAction + 1 }, () => {
        this.switchStep('ing-loading', 'ing')
      })
    } else {
      this.endClass()
    }
  },
  onUnload () {
    console.log('unload show')
    wx.setKeepScreenOn({
      keepScreenOn: false
    })
    this.oVideo.stop()
    this.oBackgroundAudio.stop()
    this.oShortAudio.stop()
    this.oCountAudio.stop()
    
    this.oShortAudio.destroy()
    this.oCountAudio.destroy()
    this.oBackgroundAudio.destroy()
    console.log('退出小程序')
    app.globalData.hasSkip = true
    app.globalData.oWs.send({
      data: JSON.stringify(
        {
          type: 'finish_class'
        }
      )
    })
  },
  // 结束课程
  endClass () {
    this.oVideo.stop()
    this.oShortAudio.destroy()
    this.oCountAudio.destroy()
    this.oBackgroundAudio.pause()
    app.globalData.oAudio.pause()
    console.log('结束课程')
    if (!app.globalData.hasSkip && (this.data.nAction + 1) === this.data.aAction.length) {
      app.globalData.oAudio.src = this.finishClassEncourageAudio
      app.globalData.oAudio.play()
    } else {
      app.globalData.oAudio.src = this.unfinishClassEncourageAudio
      app.globalData.oAudio.play()
    }
    app.globalData.oWs.send({
      data: JSON.stringify(
        {
          type: 'finish_class'
        }
      )
    })
  },
  // trtc事件监听
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
      const { userID, playerList } = event.data
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
  // 进入房间
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
  // 将LivePusher的事件转发到实时音视频组件处理
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
  // 控制当前所在步骤相关逻辑方法
  switchStep (sNew, sOld) {
    // 整个阶段：test-explain(系统说明) -> test(人物检测) -> ing-loading(课程加载) -> ing(课程进行中) ->
    switch (sOld) {
      case 'test-explain':
        this.handleLeaveTestExplain()
        break
      case 'test':
        this.handleLeaveTest()
        break
      case 'ing-loading':
        this.handleLeaveIngLoading()
        break
      case 'ing':
        this.handleLeaveIng()
        break
    }
    switch (sNew) {
      case 'test-explain':
        this.handleEnterTestExplain()
        break
      case 'test':
        this.handleEnterTest()
        break
      case 'ing-loading':
        this.handleEnterIngLoading()
        break
      case 'ing':
        this.handleEnterIng()
        break
    }
  },
  // 进入训练准备中的解释阶段test-explain:播放准备视频，显示播放控制条，
  handleEnterTestExplain () {
    console.log('进入test-explain阶段')
    this.setData({ sStep: 'test-explain', bShowVideoControl: true, sVideoUrl: this.data.oVideoUrl.explain }, () => {
      this.oVideo.play()
    })
  },
  // 离开训练准备中的解释阶段:音乐关闭，视频关闭，
  handleLeaveTestExplain () {
    console.log('离开test-explain')
    this.oVideo.stop()
    this.setData({ bShowVideo: false })
  },
  // 进入训练准备中的检测阶段：初始化trtc，进入房间，绑定trtc事件
  handleEnterTest () {
    console.log('进入test阶段')
    this.setData({ sStep: 'test', bShowLivePusher: true }, () => {

    })
  },
  // 离开训练准备中的检测阶段
  handleLeaveTest () {
    console.log('离开test')
  },
  // 进入训练中加载阶段：开始加载动画，加载倒计时音频
  handleEnterIngLoading () {
    console.log('进入ing-loading')
    if (this.oBackgroundAudio.paused) {
        this.oBackgroundAudio.play()
    }
    // 清空待播放列表
    this.data.aAudioUrl = []
    this.setData({
      sStep: 'ing-loading',
      bShowVideo: true,
      bShowLivePusher: true,
      bSmallPusher: true,
      sVideoUrl: this.data.aAction[this.data.nAction].actionAnimeUrl
    }, () => {
      this.setData({ startLoading: true }, () => {
        this.data.aAudioUrl = []
        app.globalData.oAudio.src = this.idxAudioUrl[this.data.nAction]
        app.globalData.oAudio.play()
        const tempAction = this.data.aAction[this.data.nAction] || {}
        console.log('准备开始', tempAction)
        setTimeout(() => {
          app.globalData.oAudio.src = tempAction.actionAudioUrl
          app.globalData.oAudio.play()
        }, 2000)
      })
      // 播放加载倒计时
    })
  },
  // 离开训练中加载阶段：隐藏浮层，倒计时音频停止
  handleLeaveIngLoading () {
    console.log('离开ing-loading')
    app.globalData.oAudio.stop()
    this.oVideo.stop()
    this.setData({ showCircle: true })
  },
  // 进入训练中正式阶段：开始播放动作视频，动作音频,关掉视频播放条
  handleEnterIng () {
    console.log('进入ing')
    // this.setData({sStep:'ing',startLoading:false,bShowVideoControl:false,sVideoUrl:'http://vjs.zencdn.net/v/oceans.mp4'}, () => {
    this.setData({ sStep: 'ing', startLoading: false, bShowVideoControl: false }, () => {
      // app.globalData.oAudio.src = this.data.oAudioUrl.class;
      // app.globalData.oAudio.play();
      this.oVideo.play()
      const tempAction = this.data.aAction[this.data.nAction] || {}
      console.log('发送信息', tempAction)
      app.globalData.oWs.send({
        data: JSON.stringify({
          type: 'change_action',
          // action_name: 'tunqiao',//qtemp
          action_id: tempAction.actionRuleIndex
        })
      })
    })
  },
  // 离开训练中正式阶段
  handleLeaveIng () {
    console.log('离开ing')
    app.globalData.oAudio.stop()
    this.oCountAudio.stop()
    // 圆圈隐藏
    this.setData({ showCircle: false })
  },
  /* ready 函数start */

  handleVideoEnded () {
    console.log('视频播放停止')
    // this.oVideo.stop();
    if (this.data.sStep === 'test-explain') {
      // this.switchStep('test','test-explain');
      this.switchStep('ing-loading', 'test-explain') // qtemp
    }
  },
  handleTransEnd (e) {
    console.log('动画加载结束', e)
    // this.selectComponent("#count-num").init();
    // this.selectComponent("#count-time").init();
    // this.oPause.showPause();
    this.switchStep('ing', 'ing-loading')
  },
  /* ready 函数end */
  /* 页面事件 start */
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
    // aBone.forEach((item,index) => {
    //   if(index < aBone.length - 1){
    //     drawLine([aBone[index],aBone[index+1]]);
    //   }
    // })
    // ctx.fillStyle="rgba(248, 143, 44, 1.0)";
    ctx.fillStyle = 'rgba(255, 0,0, 1.0)'
    for (let index = 0; index < aBone.length; index++) {
      if (aBone[index][2] < 0.2) {
        continue
      }
      ctx.beginPath()
      ctx.arc(aBone[index][0], aBone[index][1], 2, 0, Math.PI * 2, false)
      ctx.fill()
    }
  },
  skipExplain () {
    // this.switchStep('test','test-explain')
    this.switchStep('ing-loading', 'test-explain') // qtemp
  }
  /* 页面事件 end */
})
