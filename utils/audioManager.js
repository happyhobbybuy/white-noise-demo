/**
 * 音频管理器 - 封装 InnerAudioContext
 * 支持多音效混合播放、音量控制、定时关闭、渐弱关闭
 */

var audioManager = {
  // 主场景音频
  mainAudio: null,
  // 混音轨道 Map<id, {audio: InnerAudioContext, volume: number}>
  mixAudios: {},
  // 状态
  isPlaying: false,
  masterVolume: 60,
  currentScene: null,
  // 定时器
  timerId: null,
  fadeTimerId: null,
  // 定时关闭总时长（分钟），0表示未设定
  timerMinutes: 0,
  // 定时开始时间戳
  timerStartTime: 0,
  // 渐弱开始时间戳
  fadeStartTime: 0,
  // 渐弱持续时长（毫秒）
  fadeDuration: 0,
  // 渐弱开始时的音量
  fadeStartVolume: 0,
  // 是否正在渐弱
  isFading: false,

  /**
   * 播放单个音效（声音库跳转用）
   */
  playSingle: function (sound) {
    var self = this;
    this.stopAll();

    this.currentScene = {
      id: 'single_' + sound.id,
      name: sound.name,
      coverUrl: sound.coverUrl || '',
      bgUrl: sound.coverUrl || '',
      mainAudio: sound.url,
      isSingle: true
    };

    if (sound.url) {
      var audio = wx.createInnerAudioContext();
      audio.src = sound.url;
      audio.loop = true;
      audio.obeyMuteSwitch = false;
      audio.volume = this.masterVolume / 100;
      audio.autoplay = true;

      audio.onError(function (err) {
        console.error('单音效播放失败:', err);
      });

      this.mainAudio = audio;
    }

    this.isPlaying = true;

    var app = getApp();
    if (app) {
      app.globalData.isPlaying = true;
      app.globalData.currentScene = this.currentScene;
      app.globalData.masterVolume = this.masterVolume;
      app.globalData.currentBgUrl = this.currentScene.bgUrl || '';
    }

    wx.setStorageSync('lastScene', {
      id: this.currentScene.id,
      name: this.currentScene.name,
      coverUrl: this.currentScene.coverUrl,
      bgUrl: this.currentScene.bgUrl,
      mainAudio: this.currentScene.mainAudio
    });
    wx.setStorageSync('masterVolume', this.masterVolume);
  },

  /**
   * 播放场景主音效
   */
  playScene: function (scene) {
    var self = this;
    // 停止之前的播放
    this.stopAll();

    this.currentScene = scene;

    if (scene.mainAudio) {
      var audio = wx.createInnerAudioContext();
      audio.src = scene.mainAudio;
      audio.loop = true;
      audio.obeyMuteSwitch = false;
      audio.volume = this.masterVolume / 100;
      audio.autoplay = true;

      audio.onError(function (err) {
        console.error('主音频播放失败:', err);
      });

      this.mainAudio = audio;
    }

    this.isPlaying = true;

    // 保存状态到全局
    var app = getApp();
    if (app) {
      app.globalData.isPlaying = true;
      app.globalData.currentScene = scene;
      app.globalData.masterVolume = this.masterVolume;
      app.globalData.currentBgUrl = scene.bgUrl || '';
    }

    // 持久化
    wx.setStorageSync('lastScene', {
      id: scene.id,
      name: scene.name,
      coverUrl: scene.coverUrl,
      bgUrl: scene.bgUrl,
      mainAudio: scene.mainAudio
    });
    wx.setStorageSync('masterVolume', this.masterVolume);
  },

  /**
   * 暂停/恢复播放
   */
  togglePlay: function () {
    if (!this.currentScene && Object.keys(this.mixAudios).length === 0) {
      return false;
    }

    if (this.isPlaying) {
      this.pause();
    } else {
      this.resume();
    }
    return this.isPlaying;
  },

  /**
   * 暂停所有
   */
  pause: function () {
    if (this.mainAudio) {
      this.mainAudio.pause();
    }
    var keys = Object.keys(this.mixAudios);
    for (var i = 0; i < keys.length; i++) {
      this.mixAudios[keys[i]].audio.pause();
    }
    this.isPlaying = false;
    var app = getApp();
    if (app) app.globalData.isPlaying = false;
  },

  /**
   * 恢复播放
   */
  resume: function () {
    if (this.mainAudio) {
      this.mainAudio.play();
    }
    var keys = Object.keys(this.mixAudios);
    for (var i = 0; i < keys.length; i++) {
      this.mixAudios[keys[i]].audio.play();
    }
    this.isPlaying = true;
    var app = getApp();
    if (app) app.globalData.isPlaying = true;
  },

  /**
   * 停止并释放所有音频
   */
  stopAll: function () {
    if (this.mainAudio) {
      this.mainAudio.stop();
      this.mainAudio.destroy();
      this.mainAudio = null;
    }
    var keys = Object.keys(this.mixAudios);
    for (var i = 0; i < keys.length; i++) {
      this.mixAudios[keys[i]].audio.stop();
      this.mixAudios[keys[i]].audio.destroy();
    }
    this.mixAudios = {};
    this.isPlaying = false;
    this.clearTimer();
    var app = getApp();
    if (app) {
      app.globalData.isPlaying = false;
      app.globalData.currentBgUrl = '';
    }
  },

  /**
   * 设置总音量
   */
  setMasterVolume: function (vol) {
    this.masterVolume = vol;
    if (this.mainAudio) {
      this.mainAudio.volume = vol / 100;
    }
    var app = getApp();
    if (app) app.globalData.masterVolume = vol;
    wx.setStorageSync('masterVolume', vol);
  },

  /**
   * 添加混音轨道
   */
  addMix: function (mixItem) {
    var self = this;
    if (this.mixAudios[mixItem.id]) {
      return;
    }

    var audio = wx.createInnerAudioContext();
    audio.src = mixItem.url;
    audio.loop = true;
    audio.obeyMuteSwitch = false;
    audio.volume = (mixItem.volume || 60) / 100;

    if (this.isPlaying) {
      audio.autoplay = true;
    }

    audio.onError(function (err) {
      console.error('混音播放失败:', err);
    });

    this.mixAudios[mixItem.id] = {
      audio: audio,
      volume: mixItem.volume || 60,
      name: mixItem.name,
      icon: mixItem.icon || '🎵'
    };

    // 如果正在播放，保存混音状态
    this._saveMixState();
  },

  /**
   * 移除混音轨道
   */
  removeMix: function (mixId) {
    if (this.mixAudios[mixId]) {
      this.mixAudios[mixId].audio.stop();
      this.mixAudios[mixId].audio.destroy();
      delete this.mixAudios[mixId];
      this._saveMixState();
    }
  },

  /**
   * 设置混音轨道音量
   */
  setMixVolume: function (mixId, vol) {
    if (this.mixAudios[mixId]) {
      this.mixAudios[mixId].volume = vol;
      this.mixAudios[mixId].audio.volume = vol / 100;
    }
  },

  /**
   * 获取当前混音列表
   */
  getMixList: function () {
    var list = [];
    var keys = Object.keys(this.mixAudios);
    for (var i = 0; i < keys.length; i++) {
      var item = this.mixAudios[keys[i]];
      list.push({
        id: keys[i],
        name: item.name,
        icon: item.icon,
        volume: item.volume
      });
    }
    return list;
  },

  /**
   * 定时关闭 - 到达指定时间后，按总时间的10%进行渐弱（最少10秒，最多5分钟）
   */
  setTimer: function (minutes) {
    var self = this;
    this.clearTimer();
    if (minutes <= 0) return;

    this.timerMinutes = minutes;
    this.timerStartTime = Date.now();

    // 渐弱时长 = 总时间的10%，最少10秒，最多5分钟
    var fadeSeconds = Math.max(10, Math.min(300, Math.round(minutes * 60 * 0.1)));
    // 定时触发时间 = 总时间 - 渐弱时长
    var triggerMs = (minutes * 60 - fadeSeconds) * 1000;

    this.timerId = setTimeout(function () {
      self._startFadeOut(fadeSeconds * 1000);
    }, triggerMs);
  },

  /**
   * 清除定时器
   */
  clearTimer: function () {
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    this._stopFade();
    this.timerMinutes = 0;
    this.timerStartTime = 0;
    this.isFading = false;
  },

  /**
   * 获取当前定时器剩余时间（秒）
   */
  getTimerRemaining: function () {
    if (!this.timerMinutes || !this.timerStartTime) return 0;
    var elapsed = (Date.now() - this.timerStartTime) / 1000;
    var total = this.timerMinutes * 60;
    var remaining = Math.max(0, total - elapsed);
    return Math.round(remaining);
  },

  /**
   * 获取当前渐弱进度（0-1，0=刚开始渐弱，1=完全静音）
   */
  getFadeProgress: function () {
    if (!this.isFading || !this.fadeStartTime || !this.fadeDuration) return -1;
    var elapsed = Date.now() - this.fadeStartTime;
    return Math.min(1, elapsed / this.fadeDuration);
  },

  /**
   * 渐弱关闭 - 按总时间百分比计算渐弱时长
   * 如果有定时器，渐弱时长 = 总剩余时间的10%（最少10秒）
   * 如果没有定时器，默认30秒渐弱
   */
  fadeOut: function (defaultSeconds) {
    if (!this.isPlaying) return;

    var fadeMs;
    if (this.timerMinutes > 0 && this.timerStartTime) {
      // 有定时器时，按剩余时间的10%渐弱，最少10秒
      var remaining = this.getTimerRemaining() * 1000;
      fadeMs = Math.max(10000, Math.round(remaining * 0.1));
    } else {
      // 无定时器，使用默认值
      fadeMs = (defaultSeconds || 30) * 1000;
    }

    // 清除原有定时器（渐弱关闭会取代定时关闭）
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }

    this._startFadeOut(fadeMs);
  },

  /**
   * 内部方法：启动渐弱过程
   * 使用时间百分比而非固定步数，确保渐弱平滑且精确
   */
  _startFadeOut: function (fadeMs) {
    var self = this;
    if (!this.isPlaying) return;

    this.isFading = true;
    this.fadeStartTime = Date.now();
    this.fadeDuration = fadeMs;
    this.fadeStartVolume = this.masterVolume;

    // 每200ms更新一次音量（保证平滑度）
    this.fadeTimerId = setInterval(function () {
      var elapsed = Date.now() - self.fadeStartTime;
      var progress = Math.min(1, elapsed / self.fadeDuration);

      // 使用 ease-out 曲线，前期变化快、后期缓慢，更自然
      var eased = 1 - Math.pow(1 - progress, 2);
      var currentVol = self.fadeStartVolume * (1 - eased);

      if (progress >= 1) {
        currentVol = 0;
        self._stopFade();
        self.stopAll();
        return;
      }

      // 静音设置（不更新 masterVolume 显示值，保持 UI 干净）
      if (self.mainAudio) {
        self.mainAudio.volume = currentVol / 100;
      }
      var keys = Object.keys(self.mixAudios);
      for (var i = 0; i < keys.length; i++) {
        var mix = self.mixAudios[keys[i]];
        mix.audio.volume = (mix.volume / 100) * (currentVol / self.fadeStartVolume || 0);
      }
    }, 200);

    // 通知页面渐弱开始
    if (typeof self._onFadeStart === 'function') {
      self._onFadeStart(fadeMs);
    }
  },

  /**
   * 内部方法：停止渐弱过程
   */
  _stopFade: function () {
    if (this.fadeTimerId) {
      clearInterval(this.fadeTimerId);
      this.fadeTimerId = null;
    }
    this.isFading = false;
    this.fadeStartTime = 0;
    this.fadeDuration = 0;
  },

  /**
   * 渐弱开始回调（供页面设置）
   */
  _onFadeStart: null,

  /**
   * 保存混音状态
   */
  _saveMixState: function () {
    var mixList = this.getMixList();
    var app = getApp();
    if (app) {
      app.globalData.mixConfig = mixList;
    }
  },

  /**
   * 销毁所有实例
   */
  destroy: function () {
    this.stopAll();
  }
};

module.exports = audioManager;
