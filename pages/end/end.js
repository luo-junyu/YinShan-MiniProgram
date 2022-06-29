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
    suggestion: '',
    showBottomBar: true,
    canSend: false
  },
  aValuesDifficulty: [],
  aValuesComfort: [],
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
  checkboxChangeDifficulty (e) {
    const items = this.data.aQuestions
    const values = e.detail.value
    this.aValuesDifficulty = values
    for (let i = 0, lenI = items.length; i < lenI; ++i) {
      items[i].actionDifficulty = 0
    }
    for (let j = 0, lenJ = values.length; j < lenJ; ++j) {
      items[values[j]].actionDifficulty = 1
    }
    this.setData({
      canSend: this.checkCanSend(),
    })
  },
  checkboxChangeComfortable (e) {
    const items = this.data.aQuestions
    const values = e.detail.value
    this.aValuesComfort = values
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
      cslId: app.globalData.cslId,
      difficulty: this.data.checkedDiff,
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
        actionDifficulty: item.actionDifficulty
      }
    })
    postData.suggestion = this.data.suggestion
    console.log('反馈', postData)
    app.api.post({
      url: uPostFeedback,
      data: postData
    }).then(res => {
      this.oToast.showToast('反馈成功')
      app.globalData.oAudio.stop()
      app.globalData.oAudio.src = ''
      wx.redirectTo({
        url: '/pages/dataReport/dataReport'
      })
    })
  },
  checkCanSend () {
    let canSendFlag = true
    if (!this.data.checkedCom || !this.data.checkedDiff) {
      canSendFlag = false
    }
    if ((this.data.checkedCom === 'compromised' || this.data.checkedCom === 'uncomfortable') && this.data.aQuestions.length !== 0) {
      if (this.aValuesComfort.length === 0) {
        canSendFlag = false
      }
    }
    if (this.data.checkedDiff === 'hard' && this.data.aQuestions.length !== 0) {
      if (this.aValuesDifficulty.length === 0) {
        canSendFlag = false
      } 
    }
    return canSendFlag
  },
  handleTapCom (e) {
    this.setData({
      checkedCom: e.currentTarget.dataset.id,
    })
    this.aValuesComfort = []
    const items = this.data.aQuestions
    for (let i = 0, lenI = items.length; i < lenI; ++i) {
      items[i].actionComfort = 0
    }
    this.setData({
      canSend: this.checkCanSend(),
      aQuestions: items,
    })
  },
  handleTapDiff (e) {
    this.setData({
      checkedDiff: e.currentTarget.dataset.id,
    })
    this.aValuesDifficulty = []
    const items = this.data.aQuestions
    for (let i = 0, lenI = items.length; i < lenI; ++i) {
      items[i].actionDifficulty = 0
    }
    this.setData({
      canSend: this.checkCanSend(),
      aQuestions: items,
    })
  },
  bindUserInput (e) {
    this.data.suggestion = e.detail.value
  },
  bindFocus (e) {
    this.setData({
      showBottomBar: false
    })
  },
  bindUnFocus (e){
    this.setData({
      showBottomBar: true
    })
  },
})
