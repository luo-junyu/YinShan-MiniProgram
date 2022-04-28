//app.js
import { promisifyAll, promisify } from 'miniprogram-api-promise';
import api from 'utils/request.js'
const wxp = {}
// promisify all wx's api
promisifyAll(wx, wxp)
App({ 
  onLaunch: function () {
    api.init(this);
    wx.setKeepScreenOn({
      keepScreenOn: true
    })
    // this.initShare();
    this.initAudio();
  },
  initShare(){
    // wx.onAppRoute(res=>{
      let pages = getCurrentPages();
      //获取当前页面的对象
      let view = pages[pages.length - 1];
      wx.showShareMenu({
        withShareTicket: true,
        menus: ['shareAppMessage'],
        success: ()=>{
          
        } 
      })
      view.onShareAppMessage = function(){
          return {
            title:'银杉1健康',
            path:"/pages/login/login?courseId=1",
            imageUrl: 'https://image.baidu.com/search/detail?ct=503316480&z=undefined&tn=baiduimagedetail&ipn=d&word=%E4%B9%9D%E5%AF%A8%E6%B2%9F&step_word=&ie=utf-8&in=&cl=2&lm=-1&st=undefined&hd=undefined&latest=undefined&copyright=undefined&cs=1100170378,2263328691&os=1912318745,480731773&simid=3495939032,395514222&pn=0&rn=1&di=7077204560107798529&ln=1799&fr=&fmq=1650450547291_R&fm=&ic=undefined&s=undefined&se=&sme=&tab=0&width=undefined&height=undefined&face=undefined&is=0,0&istype=0&ist=&jit=&bdtype=0&spn=0&pi=0&gsm=0&objurl=https%3A%2F%2Fgimg2.baidu.com%2Fimage_search%2Fsrc%3Dhttp%253A%252F%252Fdpic.tiankong.com%252Fpl%252Fmf%252FQJ9125899859.jpg%26refer%3Dhttp%253A%252F%252Fdpic.tiankong.com%26app%3D2002%26size%3Df9999%2C10000%26q%3Da80%26n%3D0%26g%3D0n%26fmt%3Dauto%3Fsec%3D1653042547%26t%3Dc4c3d015759ca5f5ca86a23a67461c3b&rpstart=0&rpnum=0&adpicid=0&nojc=undefined&dyTabStr=MCwzLDEsNiw1LDQsOCw3LDIsOQ%3D%3D'
          }
      }
      
    // })
  },
  initAudio(){
    this.globalData.oAudio = wx.createInnerAudioContext({useWebAudioImplement:true});
    // wx.playBackgroundAudio({dataUrl:'http://f3.htqyy.com/play9/882/mp3/6'})
    // this.globalData.oAudio.src = this.globalData.sCountAudioUrl;
    // this.globalData.oAudio.play();
    // this.globalData.oAudio.onEnded((event) => {
    //   console.log('音频结束')
    // })
    // this.data.oAudio = oAudio;
  },
  api: api,
  globalData: {
    appName: '银杉健康',
    scope:{camera:false,userInfo:false,record:false},
    sdkAppID: '1400602604',
    phoneCode:'',
    host:'https://kangfu.tangyuhao.cn:8443/api',
    // host:'http://101.43.151.154:8000/api',
    wsUrl: 'wss://socket.tangyuhao.cn:11890',
    // wsUrl: 'ws://127.0.0.1:8181',
    oWs:'',
    oAudio: null,
    sCountAudioUrl: 'https://downsc.chinaz.net/Files/DownLoad/sound1/201806/10278.wav',
    phoneCode: '',
    courseId:1,//总课程id
    clientId: '',//用户id
    sessionId: '',//课程id
    sessionname: '',//课程名
    sessionWeek:'',//第几周
    sessionNo:'',//第几课
    aAction:[],//课程动作数组
    cslId:'',
    nWidth:'',
    nHeight:'',
    hasSkip: false//是否跳过了动作
  }
})  