/// index.js
import {} from '../../utils/api/api.js'
// 获取应用实例
const app = getApp()
Page({
  data: {
    userName: '',
    userPic: '',
    single: true
  },
  oAuth: null,
  oToast: null,
  onShow () {
  },
  onLoad (options) {
    app.initShare()
    const user = wx.getStorageSync('user')
    console.log('用户信息', user)
    this.setData({
      userName: user.clientName,
      userPic: user.clientAvatarUrl
    })
    this.oToast = this.selectComponent('#toast')
    this.oAuth = this.selectComponent('#auth')
    // this.oAuth.loginASession(this.getCourseInfo)
  },
  showUserSafety () {
    wx.navigateTo({
      url: '/pages/agreement/safety'
    })
  },
  showInstruction () {
    wx.navigateTo({
      url: '/pages/agreement/instruction'
    })
  },
  showUserContract () {
    wx.navigateTo({
      url: '/pages/agreement/category'
    })
  },
  handlePinggu () {
    this.oToast.showToast('我们正在加紧开发中哦~')
  },
  handleMusic () {
    this.oToast.showToast('我们正在加紧开发中哦~')
  },
  gotoCalendar () {
    wx.navigateTo({
      url: '/pages/schedule/schedule'
    })
  },
  gotoExeData () {
    wx.navigateTo({
      url: '/pages/rehabData/rehabData'
    })
  }
})
