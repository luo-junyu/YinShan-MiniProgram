import { uLogin } from './api/api'
let isRefreshing = true
let subscribers = []
let that = null
const _this = {}
function onAccessTokenFetched () {
  subscribers.forEach((callback) => {
    callback()
  })
  subscribers = []
}

function addSubscriber (callback) {
  subscribers.push(callback)
}

_this.request = ({ url, data = {}, method, header = 'application/json', callback = '' } = {}) => {
  // _this = this;
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${that.globalData.host}${url}`,
      data,
      method,
      header: {
        Authorization: 'Bearer ' + wx.getStorageSync('token'),
        'content-type': header
      },
      callback,
      fail (res) {
        reject(res)
      },
      complete: res => {
        if (callback) return callback(res.data)
        const statusCode = res.statusCode
        if (statusCode === 404) {
          console.log('接口不存在')
        } else if (statusCode === 401) {
          // 将需要重新执行的接口缓存到一个队列中
          addSubscriber(() => {
            _this.request({ url: `${url}`, data, method, callback: resolve })
          })

          if (isRefreshing) {
            getNewToken(url, data).then(() => {
              // 依次去执行缓存的接口
              onAccessTokenFetched()
              isRefreshing = true
            })
          }
          isRefreshing = false
        } else if (statusCode === 200) {
          if (res.data.code === '-1' || res.data.code === '500') {
            wx.showModal({ content: res.data.message, showCancel: false })
          } else {
            resolve(res.data)
          }
        } else if (statusCode === 500) {
          wx.showModal({ content: '服务器错误，请刷新重试', showCancel: false })
        }
      }
    })
  })
}

// 获取token
const getNewToken = () => {
  return new Promise((resolve, reject) => {
    wx.login({
      success (res) {
        wx.request({
          url: `${that.globalData.host}${uLogin}`,
          data: {
            jsCode: res.code,
            phoneCode: that.globalData.phoneCode,
            openId: 1234576
          },
          method: 'POST',
          success (res) {
            // 将所有存储到观察者数组中的请求重新执行。
            console.log('重新登录成功')
            wx.setStorageSync('token', res.data.token)
            wx.setStorageSync('phone', res.data.tphoneNumber)
            wx.setStorageSync('clientId', res.data.tclientId)
            resolve(res)
          }
        })
      },
      fail (err) {
        reject()
        console.error('wx login fail', err)
      }
    })
  })
}

// 封装get方法
const get = ({ url, data = {}, header = '', callback = '' } = {}) => {
  return _this.request({ url, data, method: 'get', header, callback })
}
// 封装post方法
const post = ({ url, data = {}, header = '', callback = '' } = {}) => {
  return _this.request({ url, data, method: 'post', header, callback })
}
const init = (_this) => {
  that = _this
}
module.exports = {
  get,
  post,
  init
}
