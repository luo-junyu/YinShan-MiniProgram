const app = getApp();
 Component({
    options: {
      multipleSlots: true // 在组件定义时的选项中启用多slot支持 
    },
    /** 
     * 私有数据,组件的初始数据 
     * 可用于模版渲染 
     */
    data: { // 弹窗显示控制 
        appName: app.globalData.appName
    },
    /**
     * 组件的方法列表 
     */
    methods: {
      

    }
  })