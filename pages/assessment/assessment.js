import { uAssessStatus } from '../../utils/api/api'

const app = getApp()
Page({
  data: {
    stepArray: [
      {
        title: '病史采集',
        required: true,
        desc: '了解您的症状、既往病史、心理情况等',
        useNoIcon: true,
        skipable: false,
        route: '/pages/survey/survey'
      },
      {
        title: '体格检查',
        required: true,
        desc: '评估您的腰部活动度、腰部核心稳定力量水平',
        useNoIcon: true,
        skipable: false,
        route: '/pages/examination/examination'
      },
      {
        title: '资料上传',
        required: false,
        desc: '上传病例资料、影像学图片，带给您更优服务',
        useNoIcon: true,
        skipable: true,
        finished: false,
        route: '/pages/assessment/uploadFile'
      },
      {
        title: '评估报告',
        required: false,
        desc: '提供全面的评估结果和科学有效的康复训练方案',
        useNoIcon: false,
        skipable: false,
        finished: false
      }
    ],
    currentStep: 4
  },
  onLoad: function (options) {
    // const temp = this.data.stepArray.slice()
    // temp[2].finished = options.examDone === 'true'
    // temp[3].finished = options.reportDone === 'true'
    // this.setData({
    //   currentStep: +options.currentStep,
    //   stepArray: temp
    // })
  },
  onShow () {
    app.api.get({
      url: uAssessStatus
    })
      .then(res => {
        const stepVarNameArray = ['medicalHistoryAvailable', 'poseAssessAvailable', 'physicalExamAvailable', 'reportAvailable']
        const temp = this.data.stepArray.slice()
        temp[2].finished = res.physicalExamDone
        temp[3].finished = res.reportDone
        this.setData({
          currentStep: stepVarNameArray.findIndex((item) => res[item]) + 1, // 当前步骤
          stepArray: temp
        })
      })
  },
  handleStepItemClicked (e) {
    const tapStep = e.currentTarget.dataset.index
    if (tapStep + 1 !== this.data.currentStep) return
    if (this.data.stepArray[tapStep].route) {
      wx.navigateTo({
        url: this.data.stepArray[tapStep].route
      })
    }
  }
})
