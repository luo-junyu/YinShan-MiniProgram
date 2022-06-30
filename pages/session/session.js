/// index.js
import { uGetSession } from '../../utils/api/api.js'
// 获取应用实例
const app = getApp()
Page({
  data: {
    className: '腰部康复课程腰部康复课程腰部康复课程腰部康复课程腰部康复课程腰部康复课程腰部康复课程腰部康复课程',
    classIndex: 1,
    classEquipment: [
      { name: '椅子', photo: '../../assets/check.png' },
      { name: '椅子', photo: '../../assets/check.png' },
      { name: '椅子', photo: '../../assets/check.png' },
      { name: '椅子', photo: '../../assets/check.png' },
      { name: '椅子', photo: '../../assets/check.png' }
    ],
    classActionList: [
      { name: '臀桥', action_id: 1, group: 4, time: 15, photo: '../../assets/check.png' },
      { name: '臀桥', action_id: 2, group: 4, time: 15, photo: '../../assets/check.png' },
      { name: '臀桥', action_id: 3, group: 4, time: 15, photo: '../../assets/check.png' },
      { name: '臀桥', action_id: 4, group: 4, time: 15, photo: '../../assets/check.png' },
      { name: '臀桥', action_id: 5, group: 4, time: 15, photo: '../../assets/check.png' },
      { name: '臀桥', action_id: 6, group: 4, time: 15, photo: '../../assets/check.png' },
      { name: '臀桥', action_id: 7, group: 4, time: 15, photo: '../../assets/check.png' }

    ]
  },
  oAuth: null,
  oToast: null,
  onShow () {
  },
  onLoad (options) {
    app.initShare()
    this.oToast = this.selectComponent('#toast')
    this.oAuth = this.selectComponent('#auth')
    app.api.post({
      url: uGetSession,
      data: { courseId: app.globalData.courseId, sessionId: app.globalData.sessionId }
    }).then(res => {
      this.setData(res)
    })
  },
  startExe () {
    wx.navigateTo({
      url: '/pages/main/main'
    })
  },
  showInstruction () {
    wx.navigateTo({
      url: '/pages/agreement/instruction'
    })
  },
})
