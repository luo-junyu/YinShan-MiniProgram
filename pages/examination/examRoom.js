import { uPhysicalExamStart } from '../../utils/api/api'
import TRTC from '../../utils/trtc-wx'
import { genTestUserSig } from '../../utils/GenerateTestUserSig'
import WebsocketHeartbeat from '../../utils/heart'
import { parseData } from '../../utils/util'

const app = getApp()
Page({
  data: {
    navHeight: wx.getSystemInfoSync().statusBarHeight + 44,
    pageDirection: 'vertical',
    currentStep: 1, // 1=TEST 2=LOADING 3=EXAMINING 4=BREAK
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
    currentActionIndex: -1,
    countDown: null,
    currentAction: null,
    breakCountDown: 10,
    bNeedBreak: false,
  },
  breakCountDownTimer: null,
  TRTC: null,
  aiServerUrl: '',
  oVideo: null,
  skeleton: [[22, 20], [20, 18], [18, 16], [21, 19], [19, 17], [17, 15], [15, 16], [15, 14], [16, 14], [14, 13], [13, 12], [12, 4], [12, 5], [4, 5], [11, 9], [9, 7], [7, 5], [10, 8], [8, 6], [6, 4], [4, 1], [1, 2], [1, 3], [2, 0], [3, 0], [4, 15], [5, 16]],
  oCanvas: null,
  oCtx: null,
  countDownAudioUrl: 'https://kangfu-action-video-1258481652.cos.ap-beijing.myqcloud.com/audio/sound-effect/countdown.mp3',
  aBone: [], // 骨骼数组
  bodyCheckFailedTimestamp: null,
  bodyCheckSuccessTimestamp: null,
  aCeqiaoVideoList: ['https://kangfu-action-video-1258481652.cos.ap-beijing.myqcloud.com/action/pinggushipin/hexincefangjirounailiceshizuoce/hexincefangjirounailiceshizuoce.mp4'],
  aFuwobeiqiVideoList: ['https://kangfu-action-video-1258481652.cos.ap-beijing.myqcloud.com/action/pinggushipin/yaobushenjinailiceshi1/yaobushenjinailiceshi1.mp4'],
  aNiaoquanshiVideoList: ['https://kangfu-action-video-1258481652.cos.ap-beijing.myqcloud.com/action/pinggushipin/beibuduoliejinailiceshi2/beibuduoliejinailiceshi2.mp4', 'https://kangfu-action-video-1258481652.cos.ap-beijing.myqcloud.com/action/pinggushipin/beibuduoliejinailiceshi1/beibuduoliejinailiceshi1.mp4'],
  bFirstConnect: true,
  oCountAudio: null,
  oShortAudio: null,
  actionList: null,
  onShow () {
    wx.setKeepScreenOn({
      keepScreenOn: true
    })
  },
  onHide () {
    wx.setKeepScreenOn({
      keepScreenOn: false
    })
    this.oShortAudio.pause()
    this.oCountAudio.pause()
    this.classEnd('break')
    wx.showModal({
      title: '提示',
      content: '您在做体格检查时退出小程序，请重新开始体格检查。',
      showCancel: false,
      complete (res) {
        wx.navigateBack({ delta: 1 })
      }
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
      console.log('uPhysicalExamStart返回：', res)
      // 从返回中获取streamId并入_rtcConfig
      Object.assign(this.data._rtcConfig, { streamId: res.streamId })
      // 从返回中获取动作列表并存储
      // 增加是否横屏属性，并插入id为0的横屏检测动作方便判断
      app.globalData.aAction = res.physicalExamList
      res.physicalExamList.forEach((item, index) => {
        item.isHorizontal = item.type === 'strength'
      })
      const horizontalIndex = res.physicalExamList.findIndex(item => item.isHorizontal)
      if (horizontalIndex > -1) {
        res.physicalExamList.splice(horizontalIndex, 0, {
          ruleIndex: 0,
          isHorizontal: true
        })
      }
      res.physicalExamList.unshift({
        ruleIndex: 0,
        isHorizontal: false
      })
      this.setData({
        physicalExamList: res.physicalExamList
      })
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
      // 初始化Socket连接
      this.initSocket()
      // 初始化计时器语音
      this.initCountAudio()
      this.initShortAudio()
      // TEST: test break countdown timer
      // this.beginBreak()
    }).catch(_ => {
      wx.navigateBack()
    })
  },
  onUnload () {
    // this.classEnd('break')
  },
  initCountAudio () {
    this.oCountAudio = wx.createInnerAudioContext({ useWebAudioImplement: true })
    this.oCountAudio.src = this.countDownAudioUrl
    this.oCountAudio.loop = true
    this.oCountAudio.onError((event) => {
      console.log('计时音频播放出错：', event)
      this.oCountAudio.src = this.countDownAudioUrl
      }
    )
  },
  initShortAudio () {
    this.oShortAudio = wx.createInnerAudioContext({ useWebAudioImplement: true })
    this.oShortAudio.onError((event) => {
      console.log('短音频播放出错：', event)
      }
    )
  },
  classEnd(status) {
    this.oVideo.stop()
    this.oShortAudio.stop()
    this.oShortAudio.src = ''
    this.oCountAudio.stop()
    app.globalData.oWs.send({
      data: JSON.stringify({
        type: 'finish_class'
      })
    })
    app.globalData.oWs.forbidConnect()
    app.globalData.oWs.close()
    this.exitRoom()
    if (status === 'auto') {
      wx.redirectTo({
        url: '/pages/examination/examQt',
        complete (res) {
          console.log(res)
        }
      })
    }
  },
  onResize (options) {
    const direction = options.size.windowHeight > options.size.windowWidth ? 'vertical' : 'horizontal'
    this.setData({
      pageDirection: direction
    })
    // 只在test和exam阶段进行屏幕方向不正确提示
    if (this.data.currentStep === 1 || this.data.currentStep === 3) {
      console.log(this.data.currentAction.isHorizontal)
      console.log(direction === 'vertical')
      this.data.currentAction.isHorizontal === (direction === 'vertical') ? this.pauseAction() : this.resumeAction()
    }
  },
  sendResolution () {
    app.globalData.oWs.send({
      data: JSON.stringify({
        type: 'change_resolution',
        height: this.oCanvas.height,
        width: this.oCanvas.width
      }),
      success: () => {
      }
    })
  },
  pauseAction () {
    console.log('pauseAction')
    this.setData({
      needBlur: true
    })
    // 有检测中的动作，暂停视频播放
    if (this.data.currentAction.ruleIndex && this.oVideo) {
      this.oVideo.pause()
    }
    this.oCountAudio.pause()
    this.oShortAudio.pause()
    app.globalData.oWs.send({
      data: JSON.stringify({
        type: 'pause_class'
      })
    })
  },
  resumeAction () {
    console.log('resumeAction')
    this.setData({
      needBlur: false
    })
    app.globalData.oWs.send({
      data: JSON.stringify({
        type: 'resume_class'
      })
    })
    // 有检测中的动作，恢复视频播放
    if (this.data.currentAction.ruleIndex && this.oVideo) {
      this.oVideo.play()
    }
    // 需要继续测试动作
    if (this.data.currentAction.ruleIndex === 0) {
      this.initDrawDebug()
      this.beginTest()
    }
  },
  nextAction () {
    console.log('Next Action')
    if ((this.data.currentActionIndex + 1) < this.data.physicalExamList.length) {
      const newIndex = this.data.currentActionIndex + 1
      this.setData({
        currentActionIndex: newIndex,
        currentAction: this.data.physicalExamList[newIndex]
      }, () => {
        if (this.data.currentAction.ruleIndex === 0) {
          // 进入横屏检测, 先暂停
          if (this.data.currentAction.isHorizontal && this.data.pageDirection === 'vertical') {
            this.pauseAction()
            // 播放语音：请将手机横屏
            this.oShortAudio.src = 'https://kangfu-action-video-1258481652.cos.ap-beijing.myqcloud.com/audio-tts/action/pingguqianduanyuyin/pinggu-front-24.mp3'
            this.oShortAudio.play()

            this.replayChangePhoneDirectAudio = setInterval(() => {
              this.oShortAudio.src = 'https://kangfu-action-video-1258481652.cos.ap-beijing.myqcloud.com/audio-tts/action/pingguqianduanyuyin/pinggu-front-24.mp3'
              this.oShortAudio.play()
            }, 7000);
          } else {
            this.beginTest()
          }
        } else {
          this.beginLoading()
        }
      })
    } else {
      this.classEnd('auto')
    }
  },
  beginTest () {
    clearInterval(this.replayChangePhoneDirectAudio)
    this.bodyCheckFailedTimestamp = null
    this.bodyCheckSuccessTimestamp = null
    this.setData({
      countDown: null,
      fullBodyCheck: false,
      bShowLivePusher: true,
      bSmallPusher: false,
      bNeedBreak: false,
      bShowDebug: false,
      currentStep: 1
    }, () => {
      app.globalData.oWs.send({
        data: JSON.stringify({
          type: 'resume_class'
        })
      })
      app.globalData.oWs.send({
        data: JSON.stringify({
          type: 'change_check',
          action_id: 0,
          screen_toward: this.data.pageDirection
        })
      })
      // 播放指导语音
      if (this.data.pageDirection === 'vertical') {
        this.oShortAudio.src = 'https://kangfu-action-video-1258481652.cos.ap-beijing.myqcloud.com/audio-tts/action/pingguqianduanyuyin/pinggu-front-2.mp3'
      } else {
        this.oShortAudio.src = 'https://kangfu-action-video-1258481652.cos.ap-beijing.myqcloud.com/audio-tts/action/pingguqianduanyuyin/pinggu-front-23.mp3'
      }
      this.oShortAudio.play()
    })
  },
  beginLoading () {
    if (this.oVideo) {
      this.oVideo.stop()
    }
    const currentVideoUrl = this.data.currentAction.videoUrl
    // 休息10s
    this.pauseAction()
    let breakTime = 0
    if (this.data.bNeedBreak) {
      this.beginBreak(5)
      breakTime = 5000
    }
    setTimeout(() => {
      this.setData({
        currentStep: 2,
        needBlur: true,
        bShowVideo: true,
        bShowLivePusher: true,
        bSmallPusher: true,
        bShowDebug: false,
        sVideoUrl: currentVideoUrl
      }, () => {
        let beginTime = 0
        if (this.data.currentAction.type === 'strength') {
          // 只有激力检查需要休息
          this.setData({ bNeedBreak: true, })
        }
        if (this.data.currentActionIndex === 1 ) {
          // 播放模块开始语音
          console.log('播放模块开始语音')
          beginTime = 3000
          this.oShortAudio.src = 'https://kangfu-action-video-1258481652.cos.ap-beijing.myqcloud.com/audio-tts/action/pingguqianduanyuyin/pinggu-front-5.mp3'
          this.oShortAudio.play()
        } else if (this.data.currentActionIndex === 5) {
          beginTime = 2500
          this.oShortAudio.src = 'https://kangfu-action-video-1258481652.cos.ap-beijing.myqcloud.com/audio-tts/action/pingguqianduanyuyin/pinggu-front-14.mp3'
          this.oShortAudio.play()
        }
        setTimeout(() => {
          this.setData({
            startLoading: true
          }, () => {
            console.log('播报第几个动作: ', this.data.currentAction.captionUrl)
            // 播报第几个动作
            this.oShortAudio.src = this.data.currentAction.captionUrl
            this.oShortAudio.play()
            setTimeout(() => {
              // 播报指导
              console.log('播报指导: ', this.data.currentAction.introUrl)
              this.oShortAudio.src = this.data.currentAction.introUrl
              this.oShortAudio.play()
            }, 3000);
            setTimeout(() => {
              this.beginExamining()
            }, 10000)
          })
        }, beginTime);
      })
    }, breakTime);
    
  },
  beginExamining () {
    this.resumeAction()
    this.setData({
      startLoading: false,
      needBlur: false,
      bShowVideoControl: false,
      bShowDebug: true,
      currentStep: 3
    }, () => {
      this.oVideo.play()
      app.globalData.oWs.send({
        data: JSON.stringify({
          type: 'change_check',
          action_id: this.data.currentAction.ruleIndex,
          screen_toward: this.data.pageDirection
        })
      })
    })
    // TEST: add auto jump to next action
    // setTimeout(() => {
    //   this.nextAction()
    // }, 5000)
  },
  beginBreak (time) {
    this.oShortAudio.src = 'https://kangfu-action-video-1258481652.cos.ap-beijing.myqcloud.com/audio-tts/action/aikeqianduanyinpin/front-5.mp3'
    this.oShortAudio.play()

    this.setData({
      needBlur: true,
      currentStep: 4,
      breakCountDown: time
    })
    this.breakCountDownTimer = setInterval(() => {
      if (this.data.breakCountDown < 1) {
        clearInterval(this.breakCountDownTimer)
      } else {
        this.setData({
          breakCountDown: this.data.breakCountDown - 1
        })
      }
    }, 1000)
  },
  handleVideoError () {
    // 尝试加入加载错误处理，并重新设置视频播放地址
    this.setData({
      sVideoUrl: this.data.sVideoUrl
    })
  },
  initTrtc () {
    // 初始化trtc、音频、视频、socket
    this.TRTC = new TRTC(this)
    // pusher 初始化参数
    const pusherConfig = {
      beautyLevel: 3,
      whitenessLevel: 3,
      localMirror: 'auto',
      enableRemoteMirror: true,
      audioVolumeType: 'auto',
      videoWidth: 368,
      videoHeight: 368,
      enableMic: false,
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
        this.sendResolution()
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
            this.sendResolution()
            if (this.bFirstConnect === true) {
              this.nextAction()
              this.bFirstConnect = false
            }
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
              this.nextAction()
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
          }, 7000)
        }
        if (this.nNowActionId !== data.cur_action) {
          this.setData({
            nNowActionId: data.cur_action
          })
        }
        if (this.oCountAudio.paused) {
          if (data.status === 'good' || data.status === 'warning') {
            if (data.curSuccessRatio < 100) {
              this.oCountAudio.play()
            }
          }
        } else {
          if (data.curSuccessRatio >= 100) {
            this.oCountAudio.stop()
          } 
          if (data.status != 'good' && data.status != 'warning') {
            this.oCountAudio.pause()
          }
        }
      } else if (data.type === 'finish_class_confirm') {
        console.log('收到结束课程确认消息')
        app.globalData.oWs.forbidConnect()
        app.globalData.oWs.close()
        this.exitRoom()
        wx.navigateBack({
          delta: 2
        })
      } else if (data.type === 'audio_encourage') {
        console.log('收到激励语音', data)
        if (data.path !== undefined) {
          console.log('[debug] 播放', data.path)
          this.oShortAudio.src = data.path
          this.oShortAudio.play()
        }
      } else if (data.type === 'level_reduction' || data.type === 'estimation_change_side') {
        // 动作降阶 || 换侧
        // 行为：暂停、更换视频
        this.pauseAction()
        let breakTime = 5
        this.beginBreak(breakTime)
        this.oVideo.stop()
        // 更换动作视频
        console.log('更换动作视频: ', this.data.currentAction.name)
        if (this.data.currentAction.name === '俯卧背起') {
          this.setData({ sVideoUrl: this.aFuwobeiqiVideoList[0] })
        } else if (this.data.currentAction.name === '侧桥') {
          this.setData({ sVideoUrl: this.aCeqiaoVideoList[0] })
        } else if (this.data.currentAction.name === '鸟犬式') {
          let index = 0
          if (this.oVideo.src === this.aNiaoquanshiVideoList[0]) {
            index = 1
          }
          this.setData({ sVideoUrl: this.aNiaoquanshiVideoList[index] })
        }
        setTimeout(() => {
          this.oVideo.play()
          this.resumeAction() 
          this.setData({
            currentStep: 3,
            needBlur: false,
            bShowVideo: true,
            bShowDebug: true,
            bShowLivePusher: true,
            bSmallPusher: true,
          })
        }, breakTime * 1000);
      }
    }
  },
  // 骨骼图绘制
  drawDebug (aBone) {
    const ctx = this.oCtx
    // eslint-disable-next-line no-self-assign
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
