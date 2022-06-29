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
    classIndex: 1,
    coachDto: {
      avatarPath: 'https://kangfu-user-1258481652.cos.ap-beijing.myqcloud.com/image/fuyingjie.jpeg',
      nickName: '付英杰'
    },
    bestActionPicUrl: null,
    worstActionPicUrl: null,
    bestActionComment: '侧抬腿做得非常标准，骨盆始终垂直地面，躯干稳定，没有发生任何旋转或侧倾。侧抬腿可以有效地锻炼臀中肌，有助于行走或跑步时维持骨盆中立位。',
    worstActionComment: '鸟犬式（标准）有点塌腰，抬起对侧上下肢时身体有晃动，核心控制需要进一步加强，在做的过程中需要集中注意力，保持收腹。',
    highestActionName: '侧抬腿',
    lowestActionName: '鸟犬式'
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
          res.highestActionName = item.actionName
        }
        if (Number(item.actionScore) < lowest) {
          lowest = Number(item.actionScore)
          res.lowestActionName = item.actionName
        }
        return item
      })
      console.log('动作详情', { ...res, highest, lowest })
      this.setData({ ...res, highest, lowest })
    })
  }
})
