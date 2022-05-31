Page({
  data: {
    pageDirection: 'vertical',
    currentStep: 1
  },
  onLoad: function (options) {
    const height = wx.getSystemInfoSync().windowHeight
    const width = wx.getSystemInfoSync().windowWidth
    this.setData({
      pageDirection: height > width ? 'vertical' : 'horizontal'
    })
  },
  onResize (options) {
    this.setData({
      pageDirection: options.size.windowHeight > options.size.windowWidth ? 'vertical' : 'horizontal'
    })
  }
})
