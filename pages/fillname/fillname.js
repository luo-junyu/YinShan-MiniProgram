/// index.js
import { uSignUp } from '../../utils/api/api.js'
// 获取应用实例
const app = getApp()
Page({
  data: {
    inputValue: '',
    avatarImg: '',
    inviteCode: '',
  },
  phone: '',
  oAuth: null,
  oToast: null,
  avatarbase64: '',
  scaledBase64: '',
  onShow () {
  },
  bindKeyInput (e) {
    this.setData({ inputValue: e.detail.value })
  },
  bindCodeInput (e) {
    this.setData({ inviteCode: e.detail.value })
  },
  handleAvatar (e) {
    const originPath = e.detail.avatarUrl
    if (!/jpg|png|jpeg/g.test(originPath)) {
      this.oToast.showToast('仅支持jpg、png、jpeg格式图片，建议选择微信头像')
      return
    }
    // const ctx = wx.createCanvasContext('qcanvas')
    this.setData({ avatarImg: originPath })

    // //生成主图
    // wx.getImageInfo({
    //   src: originPath,
    //   success: function (res) {
    //     //console.log(res);
    //     let h = res.height;
    //     let w = res.width;
    //     let setHeight = 280, //默认源图截取的区域
    //       setWidth = 220; //默认源图截取的区域
    //     if (w / h > 1.5) {
    //       setHeight = h;
    //       setWidth = parseInt(280 / 220 * h);
    //     } else if (w / h < 1) {
    //       setWidth = w;
    //       setHeight = parseInt(220 / 280 * w);
    //     } else {
    //       setHeight = h;
    //       setWidth = w;
    //     };
    //     console.log(setWidth, setHeight)
    //     ctx.drawImage(res.path, 0, 0, setWidth, setHeight, 20, 50, 280, 220);
    //     ctx.draw(true);

    //   }
    // });
    // this.getImageBase64_readFile(originPath,'avatarbase64',true);
    this.getImageBase64_readFile(originPath)
  },
  async getImageBase64_readFile (tempFilePath) {
    const base64 = await new Promise(resolve => {
      // 获取全局唯一的文件管理器
      wx.getFileSystemManager().readFile({ // 读取本地文件内容
        filePath: tempFilePath, // 文件路径
        encoding: 'base64', // 返回格式
        success: ({
          data
        }) => {
          if (data.length > 1048576) {
            this.oToast.showToast('图片过大，建议选择微信头像')
            return
          }
          this.avatarbase64 = 'data:image/png;base64,' + data
        }
      })
    })
  },
  // async getImageBase64_readFile(tempFilePath,sImg,goon) {
  //   const base64 = await new Promise(resolve => {
  //     //获取全局唯一的文件管理器
  //     wx.getFileSystemManager().readFile({ //读取本地文件内容
  //       filePath: tempFilePath, // 文件路径
  //       encoding: 'base64', // 返回格式
  //       success: ({
  //         data
  //       }) => {
  //         data = 'data:image/png;base64,' + data;
  //         this.data[sImg] = data;
  //         console.log('压缩过的base64:',this.data[sImg])
  //         if(!goon){
  //           // console.log('压缩过的base64:',this.data[sImg])
  //           return;
  //         }
  //         const query = wx.createSelectorQuery();
  //         query.select('#scale-canvas')
  //               .fields({ node: true, size: true,boundingClientRect:true })
  //               .exec((res) => {
  //                 let oCanvas = res[0].node;
  //                 let nWidth = res[0].width;
  //                 let nHeight =  res[0].height;
  //                 let oCtx = wx.createCanvasContext('canvas');
  //                 oCtx.drawImage(this.data.avatarbase64,0,0,nWidth,nHeight)
  //                 oCtx.draw(false,
  //                 //   setTimeout(()=>{
  //                 //   wx.canvasToTempFilePath({
  //                 //       canvas:oCanvas,
  //                 //       destWidth: nWidth,
  //                 //       destHeight: nHeight,
  //                 //       success: (res) => {
  //                 //         debugger;
  //                 //         this.setData({qxq:res.tempFilePath})
  //                 //           this.getImageBase64_readFile(res.tempFilePath,'scaledBase64',false);
  //                 //       },
  //                 //       fail: function (res) {
  //                 //           console.log(res.errMsg)
  //                 //     }
  //                 // })
  //                 // },100)
  //                 )
  //               })
  //       }
  //     });
  //   });
  // },
  handleTap () {
    if (!/^[\u4e00-\u9fa5]{2,6}$/.test(this.data.inputValue)) {
      console.log('name: ', this.data.inputValue)
      this.oToast.showToast('请输入真实姓名')
    } else if (!this.data.avatarImg) {
      this.oToast.showToast('请设置头像')
    } else if (this.data.inviteCode == '') {
      this.oToast.showToast('请输入邀请码')
    } else {
      app.api.post({
        url: uSignUp,
        data: {
          clientName: this.data.inputValue,
          phoneNumber: this.phone,
          avatarBase64: this.avatarbase64,
          inviteCode: this.data.inviteCode
        }
      }).then(res => {
        this.oToast.showToast('保存成功')
        wx.setStorageSync('user', res.clientInfo)

        wx.switchTab({
          url: '/pages/course/course'
        })
      }).catch(res => {

      })
    }
  },
  onLoad (options) {
    app.initShare()
    const user = wx.getStorageSync('user') || {}
    if (user.clientName) {
      this.setData({ inputValue: user.clientName })
    }
    if (user.phoneNumber) {
      this.phone = user.phoneNumber
    }
    if (user.clientAvatarUrl) {
      this.setData({ avatarImg: user.clientAvatarUrl })
    }
    this.oToast = this.selectComponent('#toast')
    this.oAuth = this.selectComponent('#auth')
    // this.oAuth.loginASession(this.getCourseInfo)
  }

})
