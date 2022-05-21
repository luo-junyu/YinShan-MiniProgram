const groupBy = function (xs, key) {
  return xs.reduce(function (rv, x) {
    (rv[x[key]] = rv[x[key]] || []).push(x)
    return rv
  }, {})
}

const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : '0' + n
}

const findWeek = (sDate, sCreateTime) => {
  // date格式：2022-03-13T05:23:16.000+00:00 ,去掉T,以及.和后面的部分,-换成/
  sDate = sDate.replace(/T|\..*$/g, ' ')
  sDate = sDate.replace(/-/g, '/')
  sCreateTime = sCreateTime.replace(/T|\..*$/g, ' ')
  sCreateTime = sCreateTime.replace(/-/g, '/')
  const date00 = new Date(new Date(sDate).toLocaleDateString()).getTime() + 24 * 60 * 60 * 1000// ai课0点时间戳
  const createTime = new Date(new Date(sCreateTime).toLocaleDateString()).getTime() // 直播那天24点时间戳
  // 待处理周数计算 qtemp
  return Math.ceil((date00 - createTime) / (7 * 24 * 60 * 60 * 1000))
}

const parseData = (str) => {
  if (typeof str === 'string') {
    try {
      const obj = JSON.parse(str)
      return { data: obj, type: 'obj' }
    } catch (e) {
      return { data: str, type: 'str' }
    }
  } else {
    return str
  }
}
module.exports = {
  groupBy,
  formatTime,
  findWeek,
  parseData
}
