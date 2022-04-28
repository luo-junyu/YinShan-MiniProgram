///index.js
import {} from '../../utils/api/api.js'
//获取应用实例
const app = getApp()
Page({
  data: {
    bFontUping: false,
    bSideUping: false,
  },
  inputValue: '',
  oAuth: null,
  oToast: null,
  onShow(){
    let that=this;
  },
  bindKeyInput(e){
    this.inputValue = e.detail.value;
  },
  handleTap(e){
    let that = this;
    let type = e.currentTarget.dataset.type;
    wx.chooseMedia({
      count: 9,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      maxDuration: 30,
      camera: 'back',
      success(res) {
        if(type === 'font'){
          that.setData({bFontUping:true})
        }else if(type === 'side'){
          that.setData({bSideUping:true})
        }
        console.log(res)
      }
    })
  },
  onLoad(options) {
    let that = this;
    this.oToast = this.selectComponent("#toast"); 
    this.oAuth = this.selectComponent("#auth");
    app.initShare();
    // this.oAuth.loginASession(this.getCourseInfo)
  },


})
