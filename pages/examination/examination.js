import { uPhysicalExam } from '../../utils/api/api'

const app = getApp()
Page({
  data: {
    tools: [],
    flexItems: [],
    strengthItems: []
  },
  onLoad: function (options) {
    this.fetchPhysicalExam()
  },
  fetchPhysicalExam () {
    app.api.get({
      url: uPhysicalExam
    })
      .then(response => {
        console.log(response)
        this.setData({
          tools: response.examTools,
          flexItems: response.flexibilityItems,
          strengthItems: response.strengthItems
        })
      })
      .catch(error => {
        console.log(error)
      })
  }
})
