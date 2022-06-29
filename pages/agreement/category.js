Page({
  data: {},
  onLoad: function (options) {
  },
  goToAgreement () {
    wx.navigateTo({
      url: '/pages/agreement/agreement'
    })
  },
  goToPrivacy () {
    wx.navigateTo({
      url: '/pages/agreement/privacy'
    })
  }
})
