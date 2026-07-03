var audioData = require('../../data/audioData.js');
var audioManager = require('../../utils/audioManager.js');

Page({
  data: {
    scenes: [],
    currentSceneId: '',
    isPlaying: false,
    audioTitle: '未选择音效',
    masterVolume: 60,
    mixList: [],
    bgUrl: '',
    timerMinutes: 0,
    isRandom: false,
    isFavorited: false,
    isFading: false,
    fadePercent: 0
  },

  onLoad: function () {
    var app = getApp();
    this.setData({
      scenes: audioData.scenes,
      masterVolume: audioManager.masterVolume || 60,
      statusBarHeight: app.globalData.statusBarHeight || 20
    });

    // 恢复上次状态
    var lastScene = wx.getStorageSync('lastScene');
    if (lastScene) {
      this.setData({
        currentSceneId: lastScene.id,
        audioTitle: '当前音效：' + lastScene.name,
        bgUrl: lastScene.bgUrl || ''
      });
    }
  },

  onShow: function () {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 });
    }
    var app = getApp();
    if (app.globalData.pendingSound) {
      var sound = app.globalData.pendingSound;
      app.globalData.pendingSound = null;
      this.playSingleSound(sound);
      return;
    }
    this.setData({
      isPlaying: audioManager.isPlaying,
      masterVolume: audioManager.masterVolume,
      mixList: audioManager.getMixList(),
      bgUrl: app.globalData.currentBgUrl || '',
      timerMinutes: audioManager.timerMinutes || 0
    });

    // 检查当前声音是否已收藏
    this._checkFavoriteStatus();

    // 如果正在渐弱，恢复状态轮询
    if (audioManager.isFading) {
      this._startFadePolling();
    } else if (this.data.timerMinutes > 0) {
      // 如果有定时器，启动轮询等待渐弱开始
      this._startFadePolling();
    }
  },

  _checkFavoriteStatus: function () {
    var savedSounds = wx.getStorageSync('savedSounds') || [];
    var currentId = this.data.currentSceneId;
    var isFavorited = false;
    for (var i = 0; i < savedSounds.length; i++) {
      if (savedSounds[i].id === currentId) {
        isFavorited = true;
        break;
      }
    }
    this.setData({ isFavorited: isFavorited });
  },

  playSingleSound: function (sound) {
    audioManager.playSingle(sound);
    this.setData({
      currentSceneId: 'single_' + sound.id,
      audioTitle: '当前音效：' + sound.name,
      bgUrl: sound.coverUrl || '',
      isPlaying: true,
      masterVolume: audioManager.masterVolume,
      mixList: []
    });
    this._checkFavoriteStatus();
  },

  // 点击场景卡片
  onSceneTap: function (e) {
    var index = e.currentTarget.dataset.index;
    var scene = this.data.scenes[index];
    
    this.setData({
      currentSceneId: scene.id,
      audioTitle: '当前音效：' + scene.name,
      bgUrl: scene.bgUrl
    });

    // 播放场景主音效
    audioManager.playScene(scene);

    // 添加场景混音
    if (scene.mixes) {
      scene.mixes.forEach(function (mix) {
        audioManager.addMix(mix);
      });
    }

    this.setData({
      mixList: audioManager.getMixList(),
      isPlaying: true,
      masterVolume: audioManager.masterVolume
    });
    this._checkFavoriteStatus();
  },

  // 播放/暂停切换
  onTogglePlay: function () {
    if (!this.data.currentSceneId) {
      wx.showToast({
        title: '请先选择场景音效',
        icon: 'none'
      });
      return;
    }

    var playing = audioManager.togglePlay();
    this.setData({
      isPlaying: playing
    });
  },

  // 总音量变化
  onVolumeChange: function (e) {
    var vol = e.detail.value;
    audioManager.setMasterVolume(vol);
    this.setData({
      masterVolume: vol
    });
  },

  // 混音音量变化
  onMixVolumeChange: function (e) {
    var id = e.currentTarget.dataset.id;
    var vol = e.detail.value;
    audioManager.setMixVolume(id, vol);
    
    var mixList = audioManager.getMixList();
    this.setData({ mixList: mixList });
  },

  // 定时关闭
  onTimerTap: function () {
    var self = this;
    wx.showActionSheet({
      itemList: ['15分钟', '30分钟', '45分钟', '60分钟', '取消定时'],
      success: function (res) {
        var options = [15, 30, 45, 60, 0];
        var minutes = options[res.tapIndex];
        self.setData({ timerMinutes: minutes, isFading: false, fadePercent: 0 });
        if (minutes > 0) {
          // 计算渐弱时长用于提示
          var fadeSeconds = Math.max(10, Math.min(300, Math.round(minutes * 60 * 0.1)));
          var fadeMinutes = Math.floor(fadeSeconds / 60);
          var fadeSecs = fadeSeconds % 60;
          var fadeText = fadeMinutes > 0 ? fadeMinutes + '分' + (fadeSecs > 0 ? fadeSecs + '秒' : '') : fadeSecs + '秒';
          audioManager.setTimer(minutes);
          wx.showToast({ title: '已设定' + minutes + '分钟（最后' + fadeText + '渐弱）', icon: 'none' });
          // 启动渐弱状态轮询
          self._startFadePolling();
        } else {
          audioManager.clearTimer();
          wx.showToast({ title: '已取消定时', icon: 'none' });
          self._stopFadePolling();
        }
      }
    });
  },

  // 随机声音 - 从所有音效中随机选一个播放
  onRandomSoundTap: function () {
    var allSounds = audioData.allSounds;
    if (allSounds.length === 0) {
      wx.showToast({ title: '暂无可用音效', icon: 'none' });
      return;
    }

    var randomIndex = Math.floor(Math.random() * allSounds.length);
    var sound = allSounds[randomIndex];
    
    this.playSingleSound(sound);
    this.setData({ isRandom: true });
    wx.showToast({ title: '随机播放：' + sound.name, icon: 'none' });

    // 3秒后重置随机状态图标
    var self = this;
    setTimeout(function () {
      self.setData({ isRandom: false });
    }, 3000);
  },

  // 收藏声音 - 收藏/取消收藏当前播放的声音
  onFavoriteMixTap: function () {
    var self = this;
    
    if (!this.data.currentSceneId) {
      wx.showToast({ title: '请先选择声音', icon: 'none' });
      return;
    }

    var savedSounds = wx.getStorageSync('savedSounds') || [];
    
    // 查找当前声音是否已收藏
    var currentId = this.data.currentSceneId;
    var existingIndex = -1;
    for (var i = 0; i < savedSounds.length; i++) {
      if (savedSounds[i].id === currentId) {
        existingIndex = i;
        break;
      }
    }

    if (existingIndex >= 0) {
      // 已收藏，取消收藏
      savedSounds.splice(existingIndex, 1);
      wx.setStorageSync('savedSounds', savedSounds);
      this.setData({ isFavorited: false });
      wx.showToast({ title: '已取消收藏', icon: 'none' });
    } else {
      // 未收藏，添加收藏
      var currentSound = {
        id: currentId,
        name: this.data.audioTitle.replace('当前音效：', ''),
        bgUrl: this.data.bgUrl
      };
      savedSounds.push(currentSound);
      wx.setStorageSync('savedSounds', savedSounds);
      this.setData({ isFavorited: true });
      wx.showToast({ title: '已收藏', icon: 'success' });
    }
  },

  // 渐弱关闭 - 按总时间百分比进行渐弱
  onFadeOutTap: function () {
    if (!this.data.isPlaying) {
      wx.showToast({ title: '当前未在播放', icon: 'none' });
      return;
    }

    // 计算渐弱时长
    var fadeSeconds;
    if (this.data.timerMinutes > 0) {
      // 有定时器时，按剩余时间的10%渐弱，最少10秒
      var remaining = audioManager.getTimerRemaining();
      fadeSeconds = Math.max(10, Math.round(remaining * 0.1));
    } else {
      // 无定时器时，默认30秒
      fadeSeconds = 30;
    }

    var fadeText = fadeSeconds >= 60
      ? Math.floor(fadeSeconds / 60) + '分' + (fadeSeconds % 60 > 0 ? (fadeSeconds % 60) + '秒' : '')
      : fadeSeconds + '秒';

    // 设置渐弱开始回调
    audioManager._onFadeStart = function (fadeMs) {
      var self = this;
    }.bind(this);

    audioManager.fadeOut(30);
    wx.showToast({ title: '将在' + fadeText + '内渐弱关闭', icon: 'none' });

    // 启动渐弱状态轮询
    this._startFadePolling();
    
    this.setData({ isFading: true, fadePercent: 0 });
  },

  // 渐弱状态轮询
  _fadePollId: null,
  _startFadePolling: function () {
    var self = this;
    this._stopFadePolling();
    this._fadePollId = setInterval(function () {
      var progress = audioManager.getFadeProgress();
      if (progress >= 0) {
        var percent = Math.round(progress * 100);
        self.setData({ isFading: true, fadePercent: percent });
        if (progress >= 1) {
          self.setData({ isFading: false, fadePercent: 0, isPlaying: false });
          self._stopFadePolling();
        }
      }
    }, 500);
  },
  _stopFadePolling: function () {
    if (this._fadePollId) {
      clearInterval(this._fadePollId);
      this._fadePollId = null;
    }
  },

  onUnload: function () {
    // 页面卸载时不销毁音频（允许后台播放）
    // 但要清理渐弱轮询
    this._stopFadePolling();
  }
});
