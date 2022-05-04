Component({
  options: {
    multipleSlots: true // 在组件定义时的选项中启用多slot支持
  },
  behaviors: [require('miniprogram-computed').behavior],
  properties: {
    returnable: {
      type: Boolean,
      value: false
    },
    backgroundColor: {
      type: String,
      value: '#FFFFFF'
    },
    title: {
      type: String,
      value: '银杉健康'
    },
    titleColor: {
      type: String,
      value: '#000000'
    }
  },
  /**
   * 私有数据,组件的初始数据
   * 可用于模版渲染
   */
  data: { // 弹窗显示控制
    statusHeight: wx.getSystemInfoSync().statusBarHeight,
    navHeight: wx.getSystemInfoSync().statusBarHeight + 44,
    navSvg: '<svg height="39.598" viewBox="0 0 22.627 39.598" width="22.627" xmlns="http://www.w3.org/2000/svg"><g fill="#fff" transform="matrix(.70710678 -.70710678 .70710678 .70710678 2.82811382 19.79933548)"><path d="m24 2h-24a2 2 0 0 1 -2-2 2 2 0 0 1 2-2h24a2 2 0 0 1 2 2 2 2 0 0 1 -2 2z"/><path d="m0 26a2 2 0 0 1 -2-2v-24a2 2 0 0 1 2-2 2 2 0 0 1 2 2v24a2 2 0 0 1 -2 2z"/></g></svg>'
  },
  computed: {
    navIcon (data) {
      const temp = data.navSvg.replace(/fill="#[a-zA-Z0-9]{0,6}"/g, 'fill="' + data.titleColor + '"')
      const arraybuffer = unescape(encodeURIComponent(temp)).split('').map(val => val.charCodeAt())
      const base64 = wx.arrayBufferToBase64(arraybuffer)
      return 'data:image/svg+xml;base64,' + base64
    }
  },
  /**
   * 组件的方法列表
   */
  methods: {
    navBack () {
      wx.navigateBack()
    }
  }
})
