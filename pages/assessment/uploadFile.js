Page({
  data: {},
  onLoad: function (options) {

  },
  addCaseClicked () {
    this.addFile('case')
  },
  addRadiologyClicked () {
    this.addFile('radiology')
  },
  addFile (type) {
    wx.showActionSheet({
      itemList: ['图片', '聊天记录中文件'],
      success (res) {
        console.log(res.tapIndex)
        if (res.tapIndex === 0) {
          wx.chooseImage({
          })
        } else if (res.tapIndex === 1) {
          wx.chooseMessageFile({
            count: 3
          })
        }
      },
      fail (res) {
        console.log(res.errMsg)
      }
    })
  }
})
