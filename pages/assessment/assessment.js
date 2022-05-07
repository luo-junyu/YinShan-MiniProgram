Page({
  data: {
    stepArray: [
      {
        title: '病史采集',
        required: true,
        desc: '了解您的症状、既往病史、心理情况等',
        useNoIcon: true,
        skipable: false
      },
      {
        title: '体格检查',
        required: true,
        desc: '评估您的腰部活动度、腰部核心稳定力量水平',
        useNoIcon: true,
        skipable: false
      },
      {
        title: '资料上传',
        required: false,
        desc: '上传病例资料、影像学图片，带给您更优服务',
        useNoIcon: true,
        skipable: true,
        finished: false
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
    const temp = this.data.stepArray.slice()
    temp[2].finished = options.examDone
    temp[3].finished = options.reportDone
    this.setData({
      currentStep: +options.currentStep,
      stepArray: temp
    })
  }
})
