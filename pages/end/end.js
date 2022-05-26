/// index.js
import { uPostFeedback } from '../../utils/api/api.js'
// 获取应用实例
const app = getApp()
Page({
  data: {
    bTotalEnded: true, // 完成还是中途放弃,1完成,0没有
    checkedCom: '',
    checkedDiff: '',
    aQuestions: [],
    canSend: false
  },
  aValues: [], // 用于判断是否选中了动作
  oAuth: null,
  oToast: null,
  onShow () {
    const that = this
  },
  onLoad (options) {
    const that = this
    app.initShare()
    const tempAction = app.globalData.aAction.map((item) => {
      return {
        actionName: item.actionName,
        actionId: item.actionId
      }
    })
    this.setData({
      bTotalEnded: app.globalData.hasSkip === false,
      aQuestions: tempAction
    })
    // this.setData({
    //   aQuestions: [{
    //     actionName: '腰方肌拉伸',
    //     actionId: 1
    //   }]
    // })
    this.oToast = this.selectComponent('#toast')
    this.oAuth = this.selectComponent('#auth')

    // this.oAuth.loginASession(this.getCourseInfo)
  },
  checkboxChange (e) {
    console.log('checkbox发生change事件，携带value值为：', e.detail.value)
    const items = this.data.aQuestions
    const values = e.detail.value
    this.aValues = values
    if (values.length >= 0) {
      // this.
    }
    for (let i = 0, lenI = items.length; i < lenI; ++i) {
      items[i].actionComfort = 0
      for (let j = 0, lenJ = values.length; j < lenJ; ++j) {
        if (items[i].actionId === values[j]) {
          items[i].actionComfort = 1
          break
        }
      }
    }
    this.setData({ canSend: this.checkCanSend() })
  },
  sendFeedback () {
    debugger
    if (!this.checkCanSend()) {
      this.oToast.showToast('反馈填写不完整哦')
      return
    }
    let postData = {}
    postData = {
      cslId: app.globalData.cslId,
      difficulty: this.data.checkedDiff,
      comfort: this.data.checkedCom
    }
    postData.actionFeedback = this.data.aQuestions.map((item, index) => {
      if (item.actionComfort !== 1) {
        item.actionComfort = 0
      }
      return {
        actionId: item.actionId,
        actionComfort: item.actionComfort
      }
    })
    console.log('反馈', postData)
    app.api.post({
      url: uPostFeedback,
      data: postData
    }).then(res => {
      this.oToast.showToast('反馈成功')
      wx.redirectTo({
        url: '/pages/dataReport/dataReport'
      })
    })
  },
  checkCanSend () {
    if (!this.data.checkedCom || !this.data.checkedDiff) {
      // 未选
      return false
    } else if (this.data.checkedCom === 'compromised' || this.data.checkedCom === 'uncomfortable') {
      // 未选具体动作
      if (this.aValues.length === 0) {
        return false
      } else {
        return true
      }
    } else {
      return true
    }
  },
  handleTapCom (e) {
    console.log('选中的id', e)
    this.setData({
      checkedCom: e.currentTarget.dataset.id,
      canSend: this.checkCanSend()
    })
  },
  handleTapDiff (e) {
    console.log('选中的id', e)
    this.setData({
      checkedDiff: e.currentTarget.dataset.id,
      canSend: this.checkCanSend()
    })
  }

})
