Component({
  data: {
    selected: 0,
    color: '#999999',
    selectedColor: '#689e84',
    list: [
      {
        pagePath: '/pages/index/index',
        text: '首页'
      },
      {
        pagePath: '/pages/audio/audio',
        text: '声音库'
      },
      {
        pagePath: '/pages/focus/focus',
        text: '专注钟'
      },
      {
        pagePath: '/pages/mine/mine',
        text: '我的'
      }
    ]
  },
  attached() {
    this.updateSelected();
  },
  pageLifetimes: {
    show() {
      this.updateSelected();
    }
  },
  methods: {
    updateSelected() {
      var pages = getCurrentPages();
      if (pages.length === 0) return;
      var current = pages[pages.length - 1];
      var route = current.route ? '/' + current.route : '';
      for (var i = 0; i < this.data.list.length; i++) {
        if (this.data.list[i].pagePath === route) {
          if (this.data.selected !== i) {
            this.setData({ selected: i });
          }
          return;
        }
      }
    },
    onSwitch(e) {
      var index = e.currentTarget.dataset.index;
      var item = this.data.list[index];
      if (index === this.data.selected) return;
      this.setData({ selected: index });
      wx.switchTab({ url: item.pagePath });
    }
  }
})
