// index.js
// 获取应用实例
const app = getApp()

Page({
  data: {
  },
  onLoad: function () {
    const self = this
    // let defaultHeadUri = Constants.DefaultData.header;
    // console.log(self.data.json);
    const { mainImg, headUri, canvasTitle, QrCode } = {
      mainImg: 'https://mmbiz.qpic.cn/mmbiz_jpg/svSQNnicGhHAOcLRQPL3IzajnUMyV0uBbS254ibpiaT78qdhDib7icrcrP6tN03w94jIMn7sxdP86VfQDZZzESYvoWg/0?wx_fmt=jpeg',
      canvasTitle: '《智酷方程式》和热爱全栈技术的小伙伴们一起打怪升级、翻山越岭~',
      headUri: 'https://mmbiz.qpic.cn/mmbiz_jpg/svSQNnicGhHAOcLRQPL3IzajnUMyV0uBb8KqrV0JhFsnics9Cej9CA2do30zIFNm1S0wFsuIASlYzOXPTogtasxg/0?wx_fmt=jpeg',
      QrCode: 'https://mmbiz.qpic.cn/mmbiz_jpg/svSQNnicGhHAOcLRQPL3IzajnUMyV0uBbThaia4ibgFian9KicJABPb2A65IhDLeym5AZLuehiaib473SmZ8jV7THemSw/0?wx_fmt=jpeg'
    }

    const num = 0 // 下载图片计数器
    // 选取画板
    const ctx = wx.createCanvasContext('posterCanvas')

    // 生成主图
    wx.getImageInfo({
      src: mainImg, // 服务器返回的图片地址
      success: function (res) {
        // console.log(res);
        const h = res.height
        const w = res.width
        let setHeight = 280 // 默认源图截取的区域
        let setWidth = 220 // 默认源图截取的区域
        if (w / h > 1.5) {
          setHeight = h
          setWidth = parseInt(280 / 220 * h)
        } else if (w / h < 1) {
          setWidth = w
          setHeight = parseInt(220 / 280 * w)
        } else {
          setHeight = h
          setWidth = w
        };
        console.log(setWidth, setHeight)
        ctx.drawImage(res.path, 0, 0, setWidth, setHeight, 20, 50, 280, 220)
        ctx.draw(true)
      },
      fail: function (res) {
        // 失败回调
        self.posterFail()
      }
    })
  }

})
