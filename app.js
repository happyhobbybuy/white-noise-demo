App({
  globalData: {
    isPlaying: false,
    currentScene: null,
    masterVolume: 60,
    mixConfig: [],
    systemInfo: null,
    currentBgUrl: ''
  },

  onLaunch: function () {
    var systemInfo = wx.getSystemInfoSync();
    this.globalData.systemInfo = systemInfo;
    this.globalData.statusBarHeight = systemInfo.statusBarHeight || 20;

    // 获取胶囊按钮布局信息，用于避免顶部内容被遮挡
    var menuButton = wx.getMenuButtonBoundingClientRect();
    this.globalData.menuButton = menuButton;
    // 右侧安全间距 = 胶囊按钮宽度 + 胶囊按钮距右边缘距离 + 额外缓冲
    var paddingRight = menuButton.width + menuButton.right + 8;
    // 顶部安全间距 = 胶囊按钮顶部位置 (与胶囊按钮顶部对齐)
    var paddingTop = menuButton.top;
    this.globalData.topBarStyle = 'padding-top:' + paddingTop + 'px; padding-right:' + paddingRight + 'px';

    // 恢复上次播放状态
    var lastScene = wx.getStorageSync('lastScene');
    if (lastScene) {
      this.globalData.currentScene = lastScene;
      this.globalData.currentBgUrl = lastScene.bgUrl || '';
    }
    var lastVolume = wx.getStorageSync('masterVolume');
    if (lastVolume !== undefined && lastVolume !== '') {
      this.globalData.masterVolume = lastVolume;
    }
  },

  onShareAppMessage: function () {
    return {
      title: '静息白噪音 - 轻音降噪，专注安睡',
      path: '/pages/index/index'
    };
  }
});
