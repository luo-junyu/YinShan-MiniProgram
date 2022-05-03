/// index.js
import { uGetCourse } from '../../utils/api/api.js'
import { findWeek } from '../../utils/util.js'
// 获取应用实例
const app = getApp()
Page({
  data: {
    // courseName: '',
    // courseScript: '',
    // courseCoach: {}, // such as {name: 'x', photo: 'x', abstract: 'xxx',},
    // sessionActionList: [

    // ], //such as  [{name: 'XXX', class_id: xx, index: 2, actions: 10, status: 0, time: '2月5日 5:00' , photo: 'x'}, ...] // list of json
    // clientList: []
    //     //或者可以做分别加载,这个取决于前端的考虑
  },
  oAuth: null,
  oToast: null,
  onShow () {
  },
  onLoad (options) {
    this.oToast = this.selectComponent('#toast')
    this.oAuth = this.selectComponent('#auth')
    app.initShare()
    app.api.get({ url: uGetCourse }).then(res => {
      res.aSession = this.formatData(res.sessionList, res.courseCreateTime)
      this.setData(res)
    })
    // this.oAuth.loginASession(this.getCourseInfo)
  },
  handleCalendar () {
    this.oToast.showToast('我们正在加紧开发中哦~')
  },
  gotoMine () {
    wx.redirectTo({
      url: '/pages/mine/mine'
    })
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
  handleTapClass (e) {
    console.log('点击卡片')
    const bActive = e.currentTarget.dataset.active
    app.globalData.sessionId = e.currentTarget.dataset.sessionid
    app.globalData.sessionname = e.currentTarget.dataset.sessionname
    app.globalData.sessionWeek = e.currentTarget.dataset.week
    app.globalData.sessionNo = e.currentTarget.dataset.no

    if (bActive) {
      wx.redirectTo({
        url: '/pages/session/session'
      })
    } else {
      wx.showModal({

        title: '',

        content: '该运动处方尚未解锁，请您先完成这一周已解锁的康复训练。',

        confirmText: '好的',
        confirmColor: '#16b297',

        showCancel: false,

        success: function (res) {
          if (res.confirm) {
            console.log('用户点击主操作')
          }
        }

      })
    }
  },
  gotoReport (e) {
    app.globalData.sessionId = e.currentTarget.dataset.sessionid
    app.globalData.sessionname = e.currentTarget.dataset.sessionname
    app.globalData.sessionWeek = e.currentTarget.dataset.week
    app.globalData.sessionNo = e.currentTarget.dataset.no
    app.globalData.cslId = e.currentTarget.dataset.cslid
    wx.redirectTo({
      url: '/pages/dataReport/dataReport'
    })
  },
  startClass (e) {
    app.globalData.sessionId = e.currentTarget.dataset.sessionid
    app.globalData.sessionname = e.currentTarget.dataset.sessionname
    app.globalData.sessionWeek = e.currentTarget.dataset.week
    app.globalData.sessionNo = e.currentTarget.dataset.no
    console.log('开始上课', app.globalData.sessionname, app.globalData.sessionWeek, app.globalData.sessionNo)
    wx.redirectTo({
      url: '/pages/main/main'
    })
  }

})
