///index.js
import {} from '../../utils/api/api.js'
//获取应用实例
const app = getApp()
Page({
  data: {
    userName:'',
    userPic:''
  },
  oAuth: null,
  oToast: null,
  onShow(){
    let that=this;
  },
  onLoad(options) {
    let that = this;
    app.initShare();
    let user = wx.getStorageSync('user');
    console.log('用户信息',user)
    this.setData({userName:user.clientName,userPic:user.clientAvatarUrl})
    this.oToast = this.selectComponent("#toast"); 
    this.oAuth = this.selectComponent("#auth");
    // this.oAuth.loginASession(this.getCourseInfo)
  },
  handlePinggu(){
    this.oToast.showToast('我们正在加紧开发中哦~');
  },
  handleMusic(){
    this.oToast.showToast('我们正在加紧开发中哦~');
  },
  gotoCalendar(){
    this.oToast.showToast('我们正在加紧开发中哦~');
  },
  gotoExe(){
    wx.redirectTo({
      url: '/pages/course/course'
    })
  },
  gotoExeData(){
    this.oToast.showToast('我们正在加紧开发中哦~');
  },
})
