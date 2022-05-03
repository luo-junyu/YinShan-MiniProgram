const app = getApp()
Component({
  options: {
    multipleSlots: true // 在组件定义时的选项中启用多slot支持
  },
  properties: {
    callback: { // 画板元素名称id
      type: null
    }
  },
  /**
     * 私有数据,组件的初始数据
     * 可用于模版渲染
     */
  data: { // 弹窗显示控制

  },
  /**
     * 组件的方法列表
     */
  methods: {
    showFailToast () {
      this.selectComponent('#toastInAuth').showToast('操作失败，请关闭重试')
    },
    // 获取session
    // loginASession(callback){
    //   wx.login().then(res => {
    //     if (res.code) {
    //       app.api.post({url:uPostAuth,data:{code:res.code},callback:callback}).then(res => {
    //         if (res.resCode == 1) {
    //           // 登录成功
    //           wx.setStorageSync('token', res.result)
    //           // createSocket(res.result);
    //           typeof callback == "function" && callback()
    //         } else {
    //           this.showFailToast();
    //         }
    //       }).catch(res => {
    //         this.showFailToast();
    //       })
    //     }
    //   })
    // },
    // 检查授权情况
    checkAuth (aScope = []) {
      wx.getSetting().then(res => {
        let bPassAuth = true
        for (const sScope of aScope) {
          if (!res.authSetting['scope.' + sScope]) {
            app.globalData.scope[sScope] = false
            bPassAuth = false
            break
          } else {
            app.globalData.scope[sScope] = true
          }
        }
        if (bPassAuth) {
          this.data.callback && this.data.callback()
        } else {
          this.showAuthModel()
        }
      })
    },
    // 授权登陆
    cfmAuth (e) {
      debugger
      const that = this
      if (e && e.detail) {
        // 用户信息有权限
        // let userInfo = e.detail.userInfo;
        // console.log('用户信息2',userInfo)
        // wx.setStorageSync('user', userInfo)
        // if(!app.globalData.userInfo){
        //   app.globalData.userInfo = userInfo
        // }
        for (const key in app.globalData.scope) {
          if (!app.globalData.scope[key]) {
            wx.authorize({
              scope: 'scope.' + key
            }).then(res => {
              app.globalData.scope[key] = true
              if (app.globalData.scope.camera && app.globalData.scope.record) {
                // 权限都通过了
                that.hideAuthModel()
                this.data.callback && this.data.callback()
              }
            }).catch(res => {
              // 不同意授权
              // that.selectComponent("#toastInAuth").showToast('权限不足，无法开始锻炼，请重启小程序确认授权');
            })
          }
        }
      }
    },
    showAuthModel () {
      this.setData({ bShowLogin: true })
    },
    hideAuthModel () {
      this.setData({ bShowLogin: false })
    }

  }
})
