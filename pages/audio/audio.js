var audioData = require('../../data/audioData.js');

Page({
  data: {
    categories: [],
    activeCategory: 'nature',
    searchKey: '',
    currentCategoryItems: [],
    bgUrl: ''
  },

  onLoad: function () {
    var app = getApp();
    var menuButton = app.globalData.menuButton;
    this.setData({
      categories: audioData.audioCategories,
      statusBarHeight: app.globalData.statusBarHeight || 20,
      menuButtonTop: menuButton ? menuButton.top : 20,
      menuButtonHeight: menuButton ? menuButton.height : 32
    });
    this.loadCategoryItems('nature');
  },

  onShow: function () {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 });
    }
    var app = getApp();
    this.setData({
      bgUrl: app.globalData.currentBgUrl || ''
    });
  },

  // 加载分类音效
  loadCategoryItems: function (categoryId) {
    var category = null;
    for (var i = 0; i < this.data.categories.length; i++) {
      if (this.data.categories[i].id === categoryId) {
        category = this.data.categories[i];
        break;
      }
    }

    if (!category) return;

    var items = category.items;
    if (this.data.searchKey) {
      var key = this.data.searchKey.toLowerCase();
      items = items.filter(function (item) {
        return item.name.toLowerCase().indexOf(key) !== -1;
      });
    }

    this.setData({
      currentCategoryItems: items
    });
  },

  // 切换分类
  onCategoryTap: function (e) {
    var id = e.currentTarget.dataset.id;
    this.setData({
      activeCategory: id,
      searchKey: ''
    });
    this.loadCategoryItems(id);
  },

  // 搜索输入
  onSearchInput: function (e) {
    var key = e.detail.value;
    this.setData({ searchKey: key });
    
    if (key) {
      // 搜索所有分类
      var allItems = [];
      this.data.categories.forEach(function (cat) {
        cat.items.forEach(function (item) {
          if (item.name.toLowerCase().indexOf(key.toLowerCase()) !== -1) {
            allItems.push(item);
          }
        });
      });
      this.setData({ currentCategoryItems: allItems });
    } else {
      this.loadCategoryItems(this.data.activeCategory);
    }
  },

  // 清除搜索
  onClearSearch: function () {
    this.setData({ searchKey: '' });
    this.loadCategoryItems(this.data.activeCategory);
  },

  onSoundTap: function (e) {
    var item = e.currentTarget.dataset.item;
    var app = getApp();
    // 传递完整音效信息，包含本地和网络URL
    app.globalData.pendingSound = {
      id: item.id,
      name: item.name,
      icon: item.icon,
      url: item.url,
      remoteUrl: item.remoteUrl || '',
      coverUrl: item.coverUrl || ''
    };
    wx.switchTab({
      url: '/pages/index/index',
      success: function () {
        wx.showToast({ title: '正在播放 ' + item.name, icon: 'none', duration: 2000 });
      }
    });
  }
});
