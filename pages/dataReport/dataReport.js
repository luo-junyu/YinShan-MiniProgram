/// index.js
import { uGetStatistic } from '../../utils/api/api.js'
// 获取应用实例
const app = getApp()
Page({
  data: {
    user: {},
    qSessionTime: '',
    highest: '',
    lowest: '',
    sessionName: '',
    classIndex: 1
  },
  oAuth: null,
  oToast: null,
  onShow () {
  },
  onLoad (options) {
    app.initShare()
    const sessionName = app.globalData.sessionname
    const tempDate = '第' + app.globalData.sessionWeek + '周 第' + (app.globalData.sessionNo + 1) + '课'
    this.oToast = this.selectComponent('#toast')
    this.oAuth = this.selectComponent('#auth')
    this.setData({ user: wx.getStorageSync('user'), sessionName, qSessionTime: tempDate })
    app.api.post({
      url: uGetStatistic, data: { cslId: app.globalData.cslId }
    }).then(res => {
      res.sessionStartTime = res.sessionStartTime.replace(/\..*$/g, '')
      res.sessionStartTime = res.sessionStartTime.replace(/T|:\d{2}$/g, ' ')
      res.sessionFinishTime = res.sessionFinishTime.replace(/\..*$/g, '')
      res.sessionFinishTime = res.sessionFinishTime.replace(/^\d{4}-\d{2}-\d{2}T|:\d{2}$/g, ' ')
      let highest = 0
      let lowest = 100
      res.actionList = res.actionList.map((item, index) => {
        if (Number(item.actionScore) > highest) {
          highest = Number(item.actionScore)
        }
        if (Number(item.actionScore) < lowest) {
          lowest = Number(item.actionScore)
        }
        return item
      })
      console.log('动作详情', { ...res, highest, lowest })
      this.setData({ ...res, highest, lowest })
    })
  }
})
