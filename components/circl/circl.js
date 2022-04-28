/* components/circle/circle.js */
Component({
  options: {
    multipleSlots: true // 在组件定义时的选项中启用多slot支持
  },
  properties: {
    draw: {//画板元素名称id
      type: String,
      value: ''
    },
    type: {
      type: String,
      value: 'num'
    },
    r:{//半径
      type: Number,
      value: 0   
    },
    total: {
      type: Number,
      value: 0
    },
    current: {
      type: Number,
      value: 0
    },
    ratio: {
      type: Number,
      value: 0
    },
    cs:{
      type: String,
      value: ''
    },
    ce:{
      type: String,
      value: ''
    },

  },

  data: { /*  私有数据，可用于模版渲染 */
    step: 1, //用来算圆的弧度0-2
    size:0, //画板大小
    color: ''
  },
  el:'',
  screenHeight:'',
  w:'',
  methods: {

    /**
     * el:画圆的元素
     * r:圆的半径
     * w:圆的宽度
     * 功能:画背景
     */
    drawCircleBg: function (el, r, w) {
      const ctx = wx.createCanvasContext(el,this);
      ctx.setLineWidth(w);// 设置圆环的宽度
      ctx.setStrokeStyle('rgba(255,255,255,.3)'); // 设置圆环的颜色
      ctx.setLineCap('round') // 设置圆环端点的形状
      ctx.beginPath();//开始一个新的路径
      ctx.arc(r, r, r - w, 0, 2 * Math.PI, false);
      //设置一个原点(110,110)，半径为100的圆的路径到当前路径
      ctx.stroke();//对当前路径进行描边
      ctx.draw();

    },
        /**
     * el:画圆的元素
     * r:圆的半径
     * w:圆的宽度
     * step:圆的弧度 (0-2)
     * 功能:彩色圆环
     */
    drawCircle: function (el, r, w, step, cs, ce) {
      var context = wx.createCanvasContext(el,this);
      // 设置渐变
      var gradient = context.createLinearGradient(2 * r, r, 0);
      gradient.addColorStop("0", cs);
      gradient.addColorStop("1.0", ce);
      context.setLineWidth(w);
      context.setStrokeStyle(gradient);
      context.setLineCap('round')
      context.beginPath();//开始一个新的路径
      // step 从0到2为一周
      context.arc(r, r, r - w, -Math.PI / 2, step * Math.PI - Math.PI / 2, false);
      context.stroke();//对当前路径进行描边
      context.draw()
    },
    init: function(){
      let _this = this;
      //初始化
      this.rpx = (_this.screenHeight / 750) * this.data.r;
      this.w = (_this.screenHeight / 750) * 15;//圆形的宽度
      this.el = _this.data.draw; //画板元素
      //计算出画板大小
      this.setData({
        size: this.rpx * 2
      },()=>{
        this.drawCircleBg(this.el + 'bg', this.rpx, this.w);//绘制 背景圆环
      });
      //组件入口,调用下面即可绘制 背景圆环和彩色圆环。
    },
    drawCanvas: function () { 
      const _this = this;
      if(!this.screenHeight){
        wx.getSystemInfo({
          success: function(res) {
            _this.screenHeight = res.windowHeight;
            _this.init();
          },
        });
      }
      const el = _this.el; //画板元素
      const r = this.data.r; //圆形半径
      const ntotal = this.data.total; //圆形半径
      const nnum = this.data.current; //圆形半径
      const per = this.data.ratio / 100; //圆形进度
      const step = 2 * Number(per);
      const cs = this.data.cs;
      const ce = this.data.ce; 
      this.drawCircle(el, this.rpx, this.w, step, cs, ce);
    }

  },

  lifetimes: {
    // 生命周期函数，可以为函数，或一个在methods段中定义的方法名
    

  }


})