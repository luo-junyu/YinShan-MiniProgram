import { uGetMedicalHistoryQT, uRegMedicalHistoryQT } from '../../utils/api/api'

const app = getApp()
Page({
  data: {
    surveyArray: []
  },
  onLoad: function (options) {
    app.api.get({
      url: uGetMedicalHistoryQT
    })
      .then(response => {
        console.log(response)
        response.qt.forEach(item => { item.value = '' })
        if (response.qt) {
          this.setData({
            surveyArray: response.qt
          })
        }
      })
      .catch(error => {
        console.log(error)
      })
  },
  bindUserInput (e) {
    this.data.surveyArray[+e.target.id].value = e.detail.value
  },
  bindRadioChange (e) {
    this.data.surveyArray[+e.target.id].value = e.detail.value
  },
  bindCheckChange (e) {
    this.data.surveyArray[+e.target.id].value = e.detail.value
  },
  bindDateChange (e) {
    this.data.surveyArray[+e.target.id].value = e.detail.value
    const state = `surveyArray[${e.target.id}].value`
    this.setData({
      [state]: e.detail.value
    })
  },
  submitResult () {
    const validateItem = this.data.surveyArray.find(item => !item.value || item.value === '')
    if (validateItem) {
      this.selectComponent('#survey-toast').showToast(validateItem.title + '还没有填写')
      return
    }
    app.api.post({
      url: uRegMedicalHistoryQT,
      data: {
        qt: this.data.surveyArray
      }
    })
      .then(response => {
        console.log(response)
        if (response.qt_status === 0) {
          this.selectComponent('#survey-toast').showToast('提交失败！')
        } else {
          this.selectComponent('#survey-toast').showToast('提交成功')
          setTimeout(() => {
            wx.navigateBack()
          }, 2000)
        }
      })
      .catch(error => {
        console.log(error)
      })
  }
})
