import Dialog from '../../miniprogram_npm/@vant/weapp/dialog/dialog'
import { groupBy } from '../../utils/util'

const dayjs = require('../../utils/dayjs/dayjs.min')
const isBetween = require('../../utils/dayjs/plugin/isBetween')
dayjs.extend(isBetween)
const app = getApp()
Page({
  data: {
    week: ['日', '一', '二', '三', '四', '五', '六'],
    weekHighlight: [false, false, false, false, false, false, false],
    monthData: [
      {
        month: '2022-05',
        days: []
      },
      {
        month: '2022-06',
        days: []
      }
    ],
    sessionList: []
  },
  onLoad: function (options) {
    this.data.sessionList = wx.getStorageSync('sessionList')
    const groupByWeek = groupBy(this.data.sessionList, 'week')
    this.data.sessionList.forEach(item => {
      item.sessionMonth = dayjs(item.sessionStartTime).format('YYYY-MM')
      item.sessionDay = dayjs(item.sessionStartTime).date()
      item.sessionLocked = dayjs().isBefore(dayjs(item.sessionStartTime))
      item.sessionWeekdayNo = groupByWeek[item.week].findIndex(ele => item.sessionId === ele.sessionId) + 1
    })
    const monthArray = this.data.sessionList.map(item => item.sessionMonth)
    this.data.monthData = Array.from(new Set(monthArray)).map(item => ({
      month: item,
      days: []
    }))
    this.data.monthData.map(el => el.month).forEach((item, index) => {
      this.data.monthData[index].days = this.generateMonthData(item)
      this.data.monthData[index].month = dayjs(item).format('M月')
    })
    this.setData({
      monthData: this.data.monthData,
      weekHighlight: this.data.weekHighlight
    })
  },
  // 生成日历月份天数数组
  generateMonthData (monthDate) {
    const monthDay = []
    const month = dayjs(monthDate)
    const days = month.daysInMonth()
    const currentDay = month.day()
    for (let i = 0; i < currentDay; i++) {
      const temp = month.subtract(i + 1, 'day')
      monthDay.unshift({
        date: temp.format('YYYY-MM-DD'),
        dayValue: temp.date(),
        status: 0,
        currentMonth: false
      })
    }
    // Status 由多个状态合并决定：A:是否拥有cslId（是否已完成）B:开始时间是否小于当前时间 C:时间是否在本周
    /*
    Status：
    ATrue = 1(已完成)
    A False + B True + C True = 2(待训练)
    A False + B True + C False = 3(待补课)
    A False + B False + C True = 4(待解锁)
    A False + B False + C False = 5(已排课)
     */
    const nowTime = dayjs()
    const weekStart = dayjs().startOf('week')
    const weekEnd = dayjs().endOf('week')
    for (let i = 0; i < days; i++) {
      const currentDate = month.add(i, 'day')
      const currentDateSession = this.data.sessionList.find(item => dayjs(item.sessionStartTime).isSame(currentDate, 'day'))
      let status = 0
      if (currentDateSession) {
        const currentSessionTime = dayjs(currentDateSession.sessionStartTime)
        this.data.weekHighlight[currentSessionTime.day()] = true
        if (currentDateSession.cslId) {
          status = 1
        } else if (currentSessionTime.isBefore(nowTime)) {
          status = currentSessionTime.isBetween(weekStart, weekEnd) ? 2 : 3
        } else {
          status = currentSessionTime.isBetween(weekStart, weekEnd) ? 4 : 5
        }
      }
      monthDay.push({
        date: currentDate.format('YYYY-MM-DD'),
        dayValue: i + 1,
        status,
        currentMonth: true
      })
    }
    for (let i = 0; i < monthDay.length % 7; i++) {
      monthDay.push({
        date: month.add(i + days, 'day').format('YYYY-MM-DD'),
        status: 0,
        dayValue: i + 1,
        currentMonth: false
      })
    }
    return monthDay
  },
  itemClicked (e) {
    const item = e.currentTarget.dataset.item
    const currentDateSession = this.data.sessionList.find(ele => dayjs(ele.sessionStartTime).isSame(dayjs(item.date), 'day'))
    if (!item.status) return
    if (item.status === 4) {
      this.lockHint()
    } else if (item.status === 1) {
      this.goToReport(currentDateSession)
    } else if (item.status === 2 || item.status === 3) {
      this.goToClass(currentDateSession)
    }
  },
  goToReport (session) {
    app.globalData.sessionId = session.sessionId
    app.globalData.sessionname = session.sessionName
    app.globalData.sessionWeek = session.week
    app.globalData.sessionNo = session.sessionWeekdayNo
    app.globalData.cslId = session.cslId
    wx.navigateTo({
      url: '/pages/dataReport/dataReport'
    })
  },
  goToClass (session) {
    app.globalData.sessionId = session.sessionId
    app.globalData.sessionname = session.sessionName
    app.globalData.sessionWeek = session.week
    app.globalData.sessionNo = session.sessionWeekdayNo
    console.log('开始上课', app.globalData.sessionname, app.globalData.sessionWeek, app.globalData.sessionNo)
    wx.navigateTo({
      url: '/pages/main/main'
    })
  },
  lockHint () {
    Dialog.alert({
      message: '该运动处方尚未解锁，请您先完成这一周已解锁的康复训练。',
      theme: 'round-button',
      confirmButtonText: '好的'
    }).then(() => {
    })
  }
})
