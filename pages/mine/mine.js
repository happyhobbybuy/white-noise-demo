var util = require('../../utils/util.js');
var audioManager = require('../../utils/audioManager.js');

Page({
  data: {
    totalFocusMinutes: 0,
    todayMinutes: 0,
    todayRounds: 0,
    savedMixCount: 0,
    savedMixes: [],

    // 弹窗
    showMixModal: false,
    showStatsModal: false,
    // 统计数据
    weekTotalMinutes: 0,
    monthTotalMinutes: 0,
    weekData: [],
    // 背景图
    bgUrl: ''
  },

  onLoad: function () {
    var app = getApp();
    var menuButton = app.globalData.menuButton;
    this.setData({
      statusBarHeight: app.globalData.statusBarHeight || 20,
      menuButtonTop: menuButton ? menuButton.top : 20,
      menuButtonHeight: menuButton ? menuButton.height : 32
    });
    this.loadAllData();
  },

  onShow: function () {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 });
    }
    var app = getApp();
    this.setData({
      bgUrl: app.globalData.currentBgUrl || ''
    });
    this.loadAllData();
  },

  // 加载所有数据
  loadAllData: function () {
    var records = wx.getStorageSync('focusRecords') || {};
    var savedMixes = wx.getStorageSync('savedMixes') || [];
    var today = util.getToday();
    var todayData = records[today] || { minutes: 0, rounds: 0 };

    // 计算总专注时间
    var totalMinutes = 0;
    var weekTotal = 0;
    var monthTotal = 0;
    var now = new Date();
    var currentMonth = now.getMonth();
    var currentYear = now.getFullYear();

    // 近7天数据
    var recentDays = util.getRecentDays(7);
    var weekData = [];
    var maxMinutes = 1;

    recentDays.forEach(function (day) {
      var dayData = records[day] || { minutes: 0, rounds: 0 };
      totalMinutes += dayData.minutes;
      if (dayData.minutes > maxMinutes) maxMinutes = dayData.minutes;

      var parts = day.split('-');
      var label = parseInt(parts[2]) + '';
      weekData.push({
        date: day,
        minutes: dayData.minutes,
        label: label,
        percent: 0
      });
    });

    // 计算本月
    Object.keys(records).forEach(function (date) {
      var parts = date.split('-');
      var year = parseInt(parts[0]);
      var month = parseInt(parts[1]) - 1;
      if (year === currentYear && month === currentMonth) {
        monthTotal += records[date].minutes;
      }
      // 总计也包含所有记录
      if (recentDays.indexOf(date) === -1) {
        totalMinutes += records[date].minutes;
      }
    });

    weekTotal = weekData.reduce(function (sum, item) { return sum + item.minutes; }, 0);

    // 计算百分比
    weekData.forEach(function (item) {
      item.percent = Math.round((item.minutes / maxMinutes) * 100);
      if (item.percent === 0 && item.minutes > 0) item.percent = 5;
    });

    this.setData({
      totalFocusMinutes: totalMinutes,
      todayMinutes: todayData.minutes,
      todayRounds: todayData.rounds,
      savedMixCount: savedMixes.length,
      savedMixes: savedMixes,
      weekTotalMinutes: weekTotal,
      monthTotalMinutes: monthTotal,
      weekData: weekData
    });
  },

  // 我的混音方案
  onMyMixesTap: function () {
    var savedMixes = wx.getStorageSync('savedMixes') || [];
    this.setData({
      savedMixes: savedMixes,
      showMixModal: true
    });
  },

  closeMixModal: function () {
    this.setData({ showMixModal: false });
  },

  // 加载混音方案
  onLoadMix: function (e) {
    var index = e.currentTarget.dataset.index;
    var mix = this.data.savedMixes[index];
    if (!mix || !mix.items) return;

    // 添加混音到播放器
    mix.items.forEach(function (item) {
      audioManager.addMix(item);
    });

    this.closeMixModal();
    wx.switchTab({
      url: '/pages/index/index'
    });
    wx.showToast({ title: '已加载 ' + mix.name, icon: 'none' });
  },

  // 删除混音方案
  onDeleteMix: function (e) {
    var self = this;
    var index = e.currentTarget.dataset.index;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个混音方案吗？',
      success: function (res) {
        if (res.confirm) {
          var savedMixes = wx.getStorageSync('savedMixes') || [];
          savedMixes.splice(index, 1);
          wx.setStorageSync('savedMixes', savedMixes);
          self.setData({
            savedMixes: savedMixes,
            savedMixCount: savedMixes.length
          });
          wx.showToast({ title: '已删除', icon: 'success' });
        }
      }
    });
  },

  // 收藏
  onFavoritesTap: function () {
    wx.showToast({ title: '收藏功能开发中', icon: 'none' });
  },

  // 专注统计
  onStatsTap: function () {
    this.loadAllData();
    this.setData({ showStatsModal: true });
  },

  closeStatsModal: function () {
    this.setData({ showStatsModal: false });
  },

  // 播放设置
  onPlaySettingTap: function () {
    wx.showActionSheet({
      itemList: ['音质: 标准', '淡入: 2秒', '淡出: 15秒'],
      success: function (res) {
        wx.showToast({ title: '设置已保存', icon: 'success' });
      }
    });
  },

  // 提醒设置
  onReminderTap: function () {
    wx.showActionSheet({
      itemList: ['震动提醒: 开启', '提示音: 默认'],
      success: function (res) {
        wx.showToast({ title: '设置已保存', icon: 'success' });
      }
    });
  },

  // 关于
  onAboutTap: function () {
    wx.showModal({
      title: '静息白噪音',
      content: '版本 1.0.0\n\n轻音降噪，专注安睡。\n\n一款帮助你放松、专注、入睡的白噪音小程序。',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  // 分享
  onShareAppMessage: function () {
    return {
      title: '静息白噪音 - 轻音降噪，专注安睡',
      path: '/pages/index/index'
    };
  }
});
