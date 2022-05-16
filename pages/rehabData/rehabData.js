import { uGetClientStatistic } from '../../utils/api/api'

const app = getApp()
Page({
  data: {
    userName: '',
    userPic: '',
    totalAction: 0,
    totalDays: 0,
    totalTime: 0,
    sessionList: []
  },
  onLoad: function (options) {
    const user = wx.getStorageSync('user')
    this.setData({ userName: user.clientName, userPic: user.clientAvatarUrl })
    app.api.get({
      url: uGetClientStatistic
    })
      .then(response => {
        console.log(response)
        if (response) {
          response.sessionStatisticDtos.forEach(item => {
            let diffIndex = [...item.sessionStartTime].findIndex((chr, i) => chr !== item.sessionFinishTime[i])
            if (diffIndex > -1) {
              if (diffIndex > item.sessionFinishTime.length - 5) diffIndex = item.sessionFinishTime.length - 5
              item.sessionDuration = `${item.sessionStartTime}-${item.sessionFinishTime.substring(diffIndex, item.sessionFinishTime.length)}`
            } else {
              item.sessionDuration = `${item.sessionStartTime}-${item.sessionFinishTime}`
            }
          })
          this.setData({
            totalAction: response.totalAction,
            totalDays: response.totalDays,
            totalTime: response.totalTime,
            sessionList: response.sessionStatisticDtos
          })
        }
      })
      .catch(error => {
        console.log(error)
      })
  }
})
