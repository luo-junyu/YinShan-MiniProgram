Page({
  data: {
    currentVolume: 0
  },
  onLoad: function (options) {
  },
  sliderChange (event) {
    console.log(event)
    this.setData({
      currentVolume: event.detail.value
    })
  }
})
