/**
 * 工具函数
 */

/**
 * 格式化时间为 mm:ss
 */
function formatTime(seconds) {
  var min = Math.floor(seconds / 60);
  var sec = seconds % 60;
  return (min < 10 ? '0' + min : min) + ':' + (sec < 10 ? '0' + sec : sec);
}

/**
 * 格式化日期 YYYY-MM-DD
 */
function formatDate(date) {
  var y = date.getFullYear();
  var m = date.getMonth() + 1;
  var d = date.getDate();
  return y + '-' + (m < 10 ? '0' + m : m) + '-' + (d < 10 ? '0' + d : d);
}

/**
 * 获取今日日期字符串
 */
function getToday() {
  return formatDate(new Date());
}

/**
 * 获取最近N天的日期列表
 */
function getRecentDays(n) {
  var days = [];
  var now = new Date();
  for (var i = n - 1; i >= 0; i--) {
    var d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    days.push(formatDate(d));
  }
  return days;
}

module.exports = {
  formatTime: formatTime,
  formatDate: formatDate,
  getToday: getToday,
  getRecentDays: getRecentDays
};
