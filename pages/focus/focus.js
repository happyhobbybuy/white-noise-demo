var util = require('../../utils/util.js');

Page({
  data: {
    mode: 'pomodoro',
    isRunning: false,
    showSettings: false,
    // 时间设置
    focusDuration: 25,
    shortBreak: 5,
    longBreak: 15,
    totalRounds: 4,
    currentRound: 1,
    // 计时状态
    phase: 'focus', // focus | shortBreak | longBreak
    remainSeconds: 1500,
    totalSeconds: 1500,
    elapsedSeconds: 0,
    timeDisplay: '25:00',
    phaseLabel: '专注中',
    // 今日统计
    todayMinutes: 0,
    todayRounds: 0,
    // 选项
    durationOptions: [15, 25, 30, 45, 60],
    breakOptions: [5, 10],
    longBreakOptions: [15, 20],
    roundOptions: [2, 4, 6, 8],
    // 背景图
    bgUrl: ''
  },

  // 计时器相关
  timerInterval: null,
  startTime: 0,
  canvas: null,
  canvasCtx: null,
  canvasSize: 210,

  onLoad: function () {
    var app = getApp();
    var menuButton = app.globalData.menuButton;
    this.setData({
      statusBarHeight: app.globalData.statusBarHeight || 20,
      menuButtonTop: menuButton ? menuButton.top : 20,
      menuButtonHeight: menuButton ? menuButton.height : 32
    });
    this.loadTodayStats();
    this.resetTimer();
  },

  onReady: function () {
    this.initCanvas();
  },

  onShow: function () {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 });
    }
    var app = getApp();
    this.setData({
      bgUrl: app.globalData.currentBgUrl || ''
    });
    // 修正后台时间
    if (this.data.isRunning && this.startTime > 0) {
      var now = Date.now();
      var elapsed = Math.floor((now - this.startTime) / 1000);
      if (this.data.mode !== 'stopwatch') {
        var newRemain = this.data.totalSeconds - elapsed;
        if (newRemain <= 0) {
          this.onPhaseComplete();
        } else {
          this.setData({
            remainSeconds: newRemain,
            elapsedSeconds: elapsed,
            timeDisplay: util.formatTime(newRemain)
          });
          this.drawProgress();
        }
      } else {
        this.setData({
          elapsedSeconds: elapsed,
          timeDisplay: util.formatTime(elapsed)
        });
        this.drawProgress();
      }
    }
    this.loadTodayStats();
  },

  onHide: function () {
    // 记录当前时间用于后台修正
  },

  // 初始化Canvas
  initCanvas: function () {
    var self = this;
    var query = wx.createSelectorQuery();
    query.select('#progressCanvas')
      .fields({ node: true, size: true })
      .exec(function (res) {
        if (res[0]) {
          self.canvas = res[0].node;
          self.canvasCtx = self.canvas.getContext('2d');
          var dpr = wx.getSystemInfoSync().pixelRatio;
          self.canvas.width = res[0].width * dpr;
          self.canvas.height = res[0].height * dpr;
          self.canvasCtx.scale(dpr, dpr);
          self.canvasSize = res[0].width;
          self.drawProgress();
        }
      });
  },

  // 绘制圆环进度
  drawProgress: function () {
    if (!this.canvasCtx) return;

    var ctx = this.canvasCtx;
    var size = this.canvasSize;
    var center = size / 2;
    var radius = size * 0.42;
    var lineWidth = size * 0.05;

    // 清空
    ctx.clearRect(0, 0, size, size);

    // 背景圆环
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, Math.PI * 2);
    ctx.strokeStyle = '#e8eff0';
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.stroke();

    // 进度圆环
    var progress = 0;
    if (this.data.mode === 'stopwatch') {
      // 正计时：以目标时长为基准
      progress = this.data.elapsedSeconds / (this.data.focusDuration * 60);
    } else {
      if (this.data.totalSeconds > 0) {
        progress = 1 - (this.data.remainSeconds / this.data.totalSeconds);
      }
    }
    progress = Math.min(Math.max(progress, 0), 1);

    if (progress > 0) {
      var startAngle = -Math.PI / 2;
      var endAngle = startAngle + Math.PI * 2 * progress;

      ctx.beginPath();
      ctx.arc(center, center, radius, startAngle, endAngle);
      ctx.strokeStyle = this.data.phase === 'focus' ? '#689e84' : '#94bfa8';
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.stroke();
    }
  },

  // 模式切换
  onModeSwitch: function (e) {
    if (this.data.isRunning) {
      wx.showToast({ title: '请先暂停计时', icon: 'none' });
      return;
    }
    var mode = e.currentTarget.dataset.mode;
    this.setData({ mode: mode });
    this.resetTimer();
  },

  // 设置选项
  onOptionTap: function (e) {
    if (this.data.isRunning) {
      wx.showToast({ title: '请先暂停计时', icon: 'none' });
      return;
    }
    var field = e.currentTarget.dataset.field;
    var value = parseInt(e.currentTarget.dataset.value);
    var data = {};
    data[field] = value;
    this.setData(data);
    this.resetTimer();
  },

  // 切换设置面板
  toggleSettings: function () {
    this.setData({ showSettings: !this.data.showSettings });
  },

  // 重置计时器
  resetTimer: function () {
    var totalSeconds = 0;
    var phaseLabel = '';

    if (this.data.mode === 'pomodoro') {
      if (this.data.phase === 'focus') {
        totalSeconds = this.data.focusDuration * 60;
        phaseLabel = '专注中';
      } else if (this.data.phase === 'shortBreak') {
        totalSeconds = this.data.shortBreak * 60;
        phaseLabel = '短休息';
      } else {
        totalSeconds = this.data.longBreak * 60;
        phaseLabel = '长休息';
      }
    } else if (this.data.mode === 'countdown') {
      totalSeconds = this.data.focusDuration * 60;
      phaseLabel = '倒计时';
    } else {
      totalSeconds = 0;
      phaseLabel = '正计时';
    }

    this.setData({
      remainSeconds: totalSeconds,
      totalSeconds: totalSeconds,
      elapsedSeconds: 0,
      timeDisplay: this.data.mode === 'stopwatch' ? '00:00' : util.formatTime(totalSeconds),
      phaseLabel: phaseLabel,
      isRunning: false
    });

    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    this.drawProgress();
  },

  // 开始/暂停
  onStartPause: function () {
    if (this.data.isRunning) {
      // 暂停
      this.pause();
    } else {
      // 开始
      this.start();
    }
  },

  start: function () {
    var self = this;
    this.startTime = Date.now() - this.data.elapsedSeconds * 1000;
    this.setData({ isRunning: true });

    this.timerInterval = setInterval(function () {
      self.tick();
    }, 1000);
  },

  pause: function () {
    this.setData({ isRunning: false });
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  },

  // 每秒回调
  tick: function () {
    var elapsed = Math.floor((Date.now() - this.startTime) / 1000);

    if (this.data.mode === 'stopwatch') {
      this.setData({
        elapsedSeconds: elapsed,
        timeDisplay: util.formatTime(elapsed)
      });
    } else {
      var remain = this.data.totalSeconds - elapsed;
      if (remain <= 0) {
        this.onPhaseComplete();
        return;
      }
      this.setData({
        elapsedSeconds: elapsed,
        remainSeconds: remain,
        timeDisplay: util.formatTime(remain)
      });
    }

    this.drawProgress();
  },

  // 阶段完成
  onPhaseComplete: function () {
    this.pause();
    
    // 震动提醒
    wx.vibrateShort({ type: 'heavy' });

    if (this.data.mode === 'pomodoro') {
      if (this.data.phase === 'focus') {
        // 完成一个专注阶段
        this.saveFocusRecord(this.data.focusDuration);
        
        if (this.data.currentRound >= this.data.totalRounds) {
          // 进入长休息
          this.setData({ phase: 'longBreak' });
        } else {
          // 进入短休息
          this.setData({ phase: 'shortBreak' });
        }
      } else {
        // 休息结束，进入下一轮
        if (this.data.phase === 'longBreak') {
          this.setData({ currentRound: 1 });
        } else {
          this.setData({ currentRound: this.data.currentRound + 1 });
        }
        this.setData({ phase: 'focus' });
      }
    }

    this.resetTimer();
    wx.showToast({ 
      title: this.data.mode === 'pomodoro' ? '阶段完成！' : '时间到！', 
      icon: 'success' 
    });
  },

  // 跳过当前阶段
  onSkip: function () {
    if (!this.data.isRunning && this.data.elapsedSeconds === 0) {
      wx.showToast({ title: '还未开始', icon: 'none' });
      return;
    }

    this.pause();

    if (this.data.mode === 'pomodoro') {
      if (this.data.phase === 'focus') {
        // 记录已专注的时间
        var focusedMin = Math.floor(this.data.elapsedSeconds / 60);
        if (focusedMin > 0) {
          this.saveFocusRecord(focusedMin);
        }
        
        if (this.data.currentRound >= this.data.totalRounds) {
          this.setData({ phase: 'longBreak' });
        } else {
          this.setData({ phase: 'shortBreak' });
        }
      } else {
        if (this.data.phase === 'longBreak') {
          this.setData({ currentRound: 1 });
        } else {
          this.setData({ currentRound: this.data.currentRound + 1 });
        }
        this.setData({ phase: 'focus' });
      }
    }

    this.resetTimer();
  },

  // 重置
  onReset: function () {
    this.pause();
    this.setData({
      phase: 'focus',
      currentRound: 1
    });
    this.resetTimer();
  },

  // 保存专注记录
  saveFocusRecord: function (minutes) {
    var today = util.getToday();
    var records = wx.getStorageSync('focusRecords') || {};
    
    if (!records[today]) {
      records[today] = { minutes: 0, rounds: 0 };
    }
    records[today].minutes += minutes;
    if (this.data.mode === 'pomodoro') {
      records[today].rounds += 1;
    }
    
    wx.setStorageSync('focusRecords', records);
    this.loadTodayStats();
  },

  // 加载今日统计
  loadTodayStats: function () {
    var today = util.getToday();
    var records = wx.getStorageSync('focusRecords') || {};
    var todayData = records[today] || { minutes: 0, rounds: 0 };
    
    this.setData({
      todayMinutes: todayData.minutes,
      todayRounds: todayData.rounds
    });
  },

  onUnload: function () {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }
});
