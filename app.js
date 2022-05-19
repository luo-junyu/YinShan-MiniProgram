// app.js
import { promisifyAll } from 'miniprogram-api-promise'
import api from 'utils/request.js'
const wxp = {}
// promisify all wx's api
promisifyAll(wx, wxp)
App({
  onLaunch: function () {
    api.init(this)
    wx.setKeepScreenOn({
      keepScreenOn: true
    })
    // this.initShare();
    this.initAudio()
  },
  initShare () {
    // wx.onAppRoute(res=>{
    const pages = getCurrentPages()
    // 获取当前页面的对象
    const view = pages[pages.length - 1]
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage'],
      success: () => {

      }
    })
    view.onShareAppMessage = function () {
      return {
        title: '肩颈腰腿疼运动康复，就来银杉健康',
        path: '/pages/login/login',
        imageUrl: 'https://kangfu-action-video-1258481652.cos.ap-beijing.myqcloud.com/picture/appsharepage.png'
      }
    }

    // })
  },
  initAudio () {
    this.globalData.oAudio = wx.createInnerAudioContext({ useWebAudioImplement: true })
    // wx.playBackgroundAudio({dataUrl:'http://f3.htqyy.com/play9/882/mp3/6'})
    // this.globalData.oAudio.src = this.globalData.sCountAudioUrl;
    // this.globalData.oAudio.play();
    // this.globalData.oAudio.onEnded((event) => {
    //   console.log('音频结束')
    // })
    // this.data.oAudio = oAudio;
  },
  api,
  globalData: {
    appName: '银杉健康',
    scope: { camera: false, userInfo: false, record: false },
    sdkAppID: '1400602604',
    phoneCode: '',
    host: 'https://kangfu.tangyuhao.cn:8443/api',
    // host:'http://101.43.151.154:8000/api',
    wsUrl: 'wss://socket.tangyuhao.cn:11890',
    // wsUrl: 'ws://127.0.0.1:8181',
    oWs: '',
    oAudio: null,
    sCountAudioUrl: '',
    courseId: 1, // 总课程id
    clientId: '', // 用户id
    sessionId: '', // 课程id
    sessionname: '', // 课程名
    sessionWeek: '', // 第几周
    sessionNo: '', // 第几课
    aAction: [], // 课程动作数组
    cslId: '',
    nWidth: '',
    nHeight: '',
    hasSkip: false// 是否跳过了动作
  }
})
