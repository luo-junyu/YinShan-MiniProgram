import WebsocketHeartbeat from '../../utils/heart.js'
// 获取应用实例
const app = getApp()
// const io = require('../../utils/weapp.socket.io.js')
Page({
  data: {
    total1: 10,
    current1: 0,
    ratio1: 0,
    total2: 10,
    current2: 0,
    ratio2: 0,
    aAudioUrl: [],
    sVideoUrl: 'http://vfx.mtime.cn/Video/2019/03/19/mp4/190319212559089721.mp4',
    oVideoUrl: {
      explain: 'http://vjs.zencdn.net/v/oceans.mp4',
      class0: 'http://vfx.mtime.cn/Video/2019/03/19/mp4/190319212559089721.mp4',
      class1: 'http://vfx.mtime.cn/Video/2019/02/04/mp4/190204084208765161.mp4',
      class2: 'http://vfx.mtime.cn/Video/2019/03/21/mp4/190321153853126488.mp4',
      class3: 'http://vfx.mtime.cn/Video/2019/03/19/mp4/190319212559089721.mp4',
      class4: 'http://vfx.mtime.cn/Video/2019/02/04/mp4/190204084208765161.mp4',
      class5: 'http://vfx.mtime.cn/Video/2019/03/21/mp4/190321153853126488.mp4'
    },
    oAudioUrl: {
      count: 'https://downsc.chinaz.net/Files/DownLoad/sound1/201806/10278.wav',
      class: 'https://downsc.chinaz.net/Files/DownLoad/sound1/201907/11730.mp3'
    }

  },
  oCircle1: null,
  oCircle2: null,
  oAudio: null,
  oShortAudio: null,
  oShortAudioUrl: {
    good: 'https://downsc.chinaz.net/Files/DownLoad/sound1/202112/15130.mp3',
    warning: 'https://downsc.chinaz.net/Files/DownLoad/sound1/202102/13954.mp3',
    error: 'https://downsc.chinaz.net/Files/DownLoad/sound1/202006/13010.mp3'
  },

  /* 通用变量 start */
  /* 通用函数 start */
  onShow () {

  },
  handleTransEnd () {
    console.log('动画结束')
    this.oVideo.stop()
    this.oAudio.stop()
  },
  handleTap () {
    this.setData({ startLoading: true }, () => {
      this.oAudio.play()
      this.oVideo.play()
    })
  },

  handleTapStop () {
    this.oAudio.stop()
  },
  initSocket () {
    console.log('初始化socket')
    WebsocketHeartbeat({
      miniprogram: wx,
      connectSocketParams: {
        url: app.globalData.wsUrl,
        repeatLimit: 10
      }
    }).then(task => {
      app.globalData.oWs = task
      task.onOpen = () => { // 钩子函数
        console.log('open------------------------------------------------------------------------------', task)
        // app.globalData.oWs.send({
        //   data:JSON.stringify({
        //     type:'register_client',
        //     url:  this.aiServerUrl
        //   }),
        //   success: ()=>{
        //     // this.sendResolution();
        //   }
        // })
      }
      task.onClose = () => { // 钩子函数
        console.log('close')
      }
      task.onError = e => { // 钩子函数
        console.log('onError：', e)
      }
      task.onMessage = res => { // 钩子函数
        console.log('onMsg：', res)
      }
      task.onReconnect = () => { // 钩子函数
        // app.globalData.oWs.send({
        //   data:JSON.stringify({
        //     type:'register_client',
        //     url:  this.aiServerUrl
        //   })
        // })
        console.log('reconnect...')
      }
    })
  },
  inputAudio (data) {
    if (this.data.aAudioUrl.length === 0) {
      console.log('数1组', this.data.aAudioUrl)
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
    console.log('数组', this.data.aAudioUrl)
  },
  onLoad (options) {
    console.log('090-1')
    this.inputAudio({ prior: 1 })
    this.inputAudio({ prior: 4 })
    this.inputAudio({ prior: 2 })
    this.inputAudio({ prior: 3 })
    // return
    // this.initSocket()
    // wx.connectSocket(
    //   {
    //     url:'ws://127.0.0.1:8181',
    //     success:()=>{console.log('连接111成功')}
    //   }
    // )
    // return
    // this.oCircle = this.selectComponent("#circle");
    // this.oCircle.init();
    // this.oCircle1 = this.selectComponent('#done-charts1')
    // this.oCircle2 = this.selectComponent('#done-charts2')
    // this.oCircle.drawCanvas();
    // setInterval(() => {
    //   this.setData({
    //     total1: 10,
    //     current1: this.data.current1 + 1,
    //     ratio1: this.data.ratio1 < 1 ? this.data.ratio1 + 0.1 : 1,
    //     total2: 15,
    //     current2: this.data.current2 + 1.5,
    //     ratio2: this.data.ratio2 < 1 ? this.data.ratio2 + 0.2 : 1
    //   }, () => {
    //     this.oCircle1.drawCanvas()
    //     this.oCircle2.drawCanvas()
    //   })
    // }, 2000)
    // this.oVideo = wx.createVideoContext('main-video')
    // this.initAudio()
    // this.setData({ startLoading: true }, () => {
    //   this.oAudio.play()
    //   this.oVideo.play()
    // })
    // this.initShortAudio()
  },

  initShortAudio () {
    this.oShortAudio = wx.createInnerAudioContext({ useWebAudioImplement: true })
    this.oShortAudio.onEnded((event) => {
      console.log('短音频结束')
    })
  },
  // 初始化音频对象
  initAudio () {
    this.oAudio = wx.createInnerAudioContext({ useWebAudioImplement: true })
    this.oAudio.src = this.data.oAudioUrl.count
    this.oAudio.onEnded((event) => {
      console.log('音频结束')
    })
  }
  /* 页面事件 end */
})
