/// index.js
import { findWeek } from '../../utils/util.js'
// 获取应用实例
const app = getApp()
Page({
  data: {
    userName: '',
    courseScript: '',
    courseCoach: {}, // such as {name: 'x', photo: 'x', abstract: 'xxx',},
    sessionActionList: [

    ], // such as  [{name: 'XXX', class_id: xx, index: 2, actions: 10, status: 0, time: '2月5日 5:00' , photo: 'x'}, ...] // list of json
    clientList: []
    // 或者可以做分别加载,这个取决于前端的考虑
  },
  oAuth: null,
  oToast: null,
  onShow () {
  },
  onLoad (options) {
    app.initShare()
    this.oToast = this.selectComponent('#toast')
    this.oAuth = this.selectComponent('#auth')
    const userName = wx.getStorageSync('userName')
    this.setData({ userName })
    // this.oAuth.loginASession(this.getCourseInfo)
  },
  formatData (data, createTime) {
    const aReturn = []
    let nowWeek
    let nWeek
    if (data != null) {
      for (let i = 0; i < data.length; i++) {
        nWeek = findWeek(data[i].sessionStartTime, createTime)
        if (i === 0) {
          // 第一节课
          nowWeek = nWeek
          aReturn.push({
            nWeek,
            aSession: [data[i]]
          })
        } else if (nWeek === nowWeek) {
          // 同一周的其他课
          aReturn.aSession.push([data[i]])
        } else {
          // 新一周的课
          nowWeek = nWeek
          aReturn.push({
            nWeek,
            aSession: [data[i]]
          })
        }
      }
    }
    return aReturn
  },
  gotoReport (e) {
    const sessionName = e.currentTarget.dataset.sessionname
    wx.redirectTo({
      url: '/pages/dataReport/dataReport?name=' + sessionName
    })
  }

})
