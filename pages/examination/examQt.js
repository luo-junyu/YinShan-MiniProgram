/// index.js
import { uPostFeedback } from '../../utils/api/api.js'
// 获取应用实例
const app = getApp()
Page({
  data: {
    checkedCom: '',
    aQuestions: [],
    suggestion: '',
    showBottomBar: true,
    canSend: false,
    aValuesComfort: [],
  },
  oAuth: null,
  oToast: null,
  onShow () {
    const that = this
  },
  onHide() {
    app.globalData.oAudio.stop()
    app.globalData.oAudio.src = ''
  },
  onUnload () {
    app.globalData.oAudio.stop()
    app.globalData.oAudio.src = ''
  },
  onLoad (options) {
    app.initShare()
    let actionList = []
    for (let idx=0; idx<app.globalData.aAction.length; idx++) {
      let tempAction = app.globalData.aAction[idx]
      if (tempAction.ruleIndex) {
        actionList.push({
          actionName: tempAction.name,
          actionId: tempAction.id
        })
      }
    }
    this.setData({
      aQuestions: actionList
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
  checkboxChangeComfortable (e) {
    const items = this.data.aQuestions
    const values = e.detail.value
    this.setData({ aValuesComfort: values})
    for (let i = 0, lenI = items.length; i < lenI; ++i) {
      items[i].actionComfort = 0
    }
    for (let j = 0, lenJ = values.length; j < lenJ; ++j) {
      items[values[j]].actionComfort = 1
    }
    this.setData({
      canSend: this.checkCanSend(),
    })
  },
  sendFeedback () {
    if (!this.checkCanSend()) {
      this.oToast.showToast('反馈填写不完整哦')
      return
    }
    let postData = {}
    postData = {
      comfort: this.data.checkedCom,
      suggestion: this.data.suggestion
    }
    postData.actionFeedback = this.data.aQuestions.map((item, index) => {
      if (item.actionComfort !== 1) {
        item.actionComfort = 0
      }
      if (item.actionDifficulty !== 1) {
        item.actionDifficulty = 0
      }
      return {
        actionId: item.actionId,
        actionComfort: item.actionComfort,
      }
    })
    postData.suggestion = this.data.suggestion
    // app.api.post({
    //   url: uPostFeedback,
    //   data: postData
    // }).then(res => {
    //   this.oToast.showToast('反馈成功')
    //   app.globalData.oAudio.stop()
    //   app.globalData.oAudio.src = ''
    //   wx.redirectTo({
    //     url: '/pages/assessment/assessment'
    //   })
    // })
    this.oToast.showToast('反馈成功')
    wx.redirectTo({
      url: '/pages/assessment/assessment'
    })
  },
  checkCanSend () {
    console.log('checkCanSend: ', this.data.aQuestions)
    if (this.data.checkedCom === '') {
      return false
    }
    if (this.data.checkedCom === 'true') {
      if (this.data.aValuesComfort.length === 0) {
        return false
      } else {
        for (const index in this.data.aValuesComfort) {
          if (this.data.aQuestions[index].actionSuggestion === '') {
            return false
          }
        }
      }
    }
    return true
  },
  handleTapComTrue (e) {
    this.setData({
      checkedCom: 'true',
    })
    this.setData({ aValuesComfort: []})
    const items = this.data.aQuestions
    for (let i = 0, lenI = items.length; i < lenI; ++i) {
      items[i].actionComfort = 0
      items[i].actionSuggestion = ''
    }
    this.setData({
      canSend: this.checkCanSend(),
      aQuestions: items,
    })
  },
  handleTapComFalse (e) {
    this.setData({
      checkedCom: 'false',
    })
    this.setData({ aValuesComfort: []})
    const items = this.data.aQuestions
    for (let i = 0, lenI = items.length; i < lenI; ++i) {
      items[i].actionComfort = 0
      items[i].actionSuggestion = ''
    }
    this.setData({
      canSend: this.checkCanSend(),
      aQuestions: items,
    })
  },
  bindFocus (e) {
    this.setData({
      showBottomBar: false
    })
  },
  bindUnFocus (e){
    console.log(e)
    this.setData({
      canSend: this.checkCanSend(),
      showBottomBar: true
    })
  },
  handleUserInput (e) {
    console.log(e)
    let index = e.target.id
    this.data.aQuestions[index].actionSuggestion = e.detail.value
  },
})
