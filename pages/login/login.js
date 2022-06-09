/// index.js
import { uLogin } from '../../utils/api/api.js'
// 获取应用实例
const app = getApp()
Page({
  data: {
    // sLoged: ''
    callback: '',
    checked: false,
    single: true // false 只显示一个按钮，如果想显示两个改为true即可
  },
  phoneCode: '',
  oAuth: null,
  oToast: null,
  onShow () {
  },
  shareNormal () {
    const that = this
    that.courseId = app.globalData.courseId
    that.coursePic = app.globalData.coursePic
  },
  onLoad (options) {
    app.initShare()
    const user = wx.getStorageSync('user')
    if (user && user.phoneNumber && user.clientName) {
      app.globalData.clientId = String(user.clientId)
      this.setData({ sLoged: 'loged' })
      this.fnLogin()
    } else {
      this.setData({ sLoged: 'unloged' })
    }
    this.oToast = this.selectComponent('#toast')
    this.oAuth = this.selectComponent('#auth')

    // this.oAuth.loginASession(this.getCourseInfo)
  },
  handleCoverTap () {
    if (!this.data.checked) {
      this.oToast.showToast('请先同意用户协议')
    }
  },
  // 点击按钮事件处理，判断有没有授权和登录
  handleTap (e) {
    if (this.data.sLoged === 'loged') {
      this.setData({ callback: this.gotoNext }, () => {
        this.oAuth.checkAuth(['camera', 'record'])
      })
    } else if (this.data.sLoged === 'unloged') {
      if (e.detail.errMsg === 'getPhoneNumber:ok') {
        this.phoneCode = e.detail.code
        this.setData({ callback: this.fnLogin }, () => {
          this.oAuth.checkAuth(['camera', 'record'])
        })
      } else {
        this.oToast.showToast(e.detail.errMsg)
      }
    }
  },
  fnLogin () {
    wx.login().then(res => {
      if (res.code) {
        // wx.redirectTo({
        //   url: '/pages/fillname/fillname'
        // })
        // return ;//qdemo
        app.api.post({
          url: uLogin,
          data: {
            jsCode: res.code,
            phoneCode: this.phoneCode
            // openId: 1234576
          }
        }).then(res => {
          // 登录成功
          wx.setStorageSync('user', res.clientInfo)
          app.globalData.clientId = String(res.clientInfo.clientId)
          wx.setStorageSync('token', res.token)
          if (res.clientInfo.clientName && res.clientInfo.clientAvatarUrl) {
            wx.switchTab({
              url: '/pages/course/course'
            })
          } else {
            wx.redirectTo({
              url: '/pages/fillname/fillname'
            })
          }
        }).catch(res => {
          this.oToast.showToast('操作失败，请关闭重试' + JSON.stringify(res))
        })
      }
    })
  },
  handleChange (e) {
    this.setData({ checked: !this.data.checked })
  },
  showUserContract () {
    wx.navigateTo({
      url: '/pages/agreement/agreement'
    })
  },
  showSecretContract () {
    wx.navigateTo({
      url: '/pages/agreement/privacy'
    })
  },
  gotoNext () {
    wx.switchTab({
      url: '/pages/course/course'
    })
  }
})
