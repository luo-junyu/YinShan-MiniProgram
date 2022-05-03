const app = getApp()
Component({
  options: {
    multipleSlots: true // 在组件定义时的选项中启用多slot支持
  },
  /**
     * 私有数据,组件的初始数据
     * 可用于模版渲染
     */
  data: { // 弹窗显示控制
    bShowEndDialog: false
  },
  /**
     * 组件的方法列表
     */
  methods: {
    showPause (showNext) {
      this.setData({ bShowPause: true, showNext })
    },
    resumeAction () {
      this.setData({ bShowPause: false, bShowEndDialog: false }, () => {
        this.triggerEvent('resume')
      })
    },
    endClass () {
      this.setData({ bShowPause: false, bShowEndDialog: false }, () => {
        this.triggerEvent('end')
        app.globalData.hasSkip = true
      })
    },
    nextClass () {
      this.setData({ bShowPause: false, bShowEndDialog: false }, () => {
        this.triggerEvent('next', { skip: true })
        app.globalData.hasSkip = true
      })
    },
    gotoEnd () {
      this.setData({ bShowEndDialog: true })
    }

  }
})
