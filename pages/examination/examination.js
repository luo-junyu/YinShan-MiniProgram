import { uPhysicalExam } from '../../utils/api/api'

const app = getApp()
Page({
  data: {},
  onLoad: function (options) {
    this.fetchPhysicalExam()
  },
  fetchPhysicalExam () {
    app.api.get({
      url: uPhysicalExam
    })
      .then(response => {
        console.log(response)
      })
      .catch(error => {
        console.log(error)
      })
  }
})
