const dayjs = require('../../utils/dayjs/dayjs.min')
Page({
  data: {
    week: ['日', '一', '二', '三', '四', '五', '六'],
    monthData: [
      {
        month: '2022-05',
        days: []
      },
      {
        month: '2022-06',
        days: []
      }
    ]
  },
  onLoad: function (options) {
    this.data.monthData.map(el => el.month).forEach((item, index) => {
      this.data.monthData[index].days = this.generateMonthData(item)
      this.data.monthData[index].month = dayjs(item).format('M月')
    })
    this.setData({
      monthData: this.data.monthData
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
        date: temp.toDate(),
        dayValue: temp.date(),
        status: 2,
        currentMonth: false
      })
    }
    for (let i = 0; i < days; i++) {
      monthDay.push({
        date: month.add(i, 'day').toDate(),
        dayValue: i + 1,
        status: 1,
        currentMonth: true
      })
    }
    for (let i = 0; i < monthDay.length % 7; i++) {
      monthDay.push({
        date: month.add(i + days, 'day').toDate(),
        status: 1,
        dayValue: i + 1,
        currentMonth: false
      })
    }
    return monthDay
  }
})
