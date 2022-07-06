Page({
  data: {
    report: 'fdfas'
  },
  onLoad: function (options) {
    let res = ``
    
    this.setData({report: JSON.parse(res)})
    console.log(this.data)
 
    // let str = ""
    // this.data.report = JSON.parse(str)
    // console.log(this.data.report)
  }
})
