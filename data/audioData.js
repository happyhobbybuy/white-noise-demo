/**
 * 音效数据源
 * 音频文件位于 /audio/ 目录
 * 图片文件位于 /images/sounds/ 目录
 *
 * 所有音频文件（共43个）：
 * - 自然类：小雨、午间细雨、急雨、街道雨声、雷雨屋檐、中型雷雨、惊雷、暴雨前雷声、
 *           风吹树叶、大风、雨前风声、沙漠风声、森林、穿越森林、自然森林、
 *           海浪海鸥、海浪拍打、溪流、洞穴水滴、冒泡音、暴风雪、
 *           碎石行走、雪地脚步、雪地行走
 * - 动物类：春日鸟鸣、黄鹂鸟鸣、夜晚虫鸣、蟋蟀鸣、池塘蛙鸣、海鸥、狗吠、狼嚎、猫头鹰、鸡鸣
 * - 生活类：木柴燃烧、键盘打字、钟表、风铃、风与风铃
 * - 城市类：赛车飞驰、飞机飞过
 * - 学习类：数学课堂、生物课堂
 */

// 场景数据（首页展示）
var scenes = [
  {
    id: 'forest',
    name: '林间放松',
    desc: '溪流、微风鸟鸣',
    coverUrl: '/images/sounds/森林.jpg',
    bgUrl: '/images/sounds/森林.jpg',
    mainAudio: '/audio/森林.mp3',
    mixes: [
      { id: 'forest_wind', name: '风吹树叶', icon: '🍃', url: '/audio/风吹树叶.mp3', volume: 70 },
      { id: 'forest_bird', name: '黄鹂鸟鸣', icon: '🐦', url: '/audio/黄鹂鸟鸣.mp3', volume: 50 }
    ]
  },
  {
    id: 'cafe',
    name: '自习专注',
    desc: '细雨、翻书雨声',
    coverUrl: '/images/sounds/午间细雨.jpg',
    bgUrl: '/images/sounds/午间细雨.jpg',
    mainAudio: '/audio/午间细雨.mp3',
    mixes: [
      { id: 'cafe_rain', name: '午间细雨', icon: '🌧', url: '/audio/午间细雨.mp3', volume: 60 }
    ]
  },
  {
    id: 'night',
    name: '深夜助眠',
    desc: '雨夜、篝火、海浪',
    coverUrl: '/images/sounds/夜晚虫鸣.jpg',
    bgUrl: '/images/sounds/夜晚虫鸣.jpg',
    mainAudio: '/audio/夜晚虫鸣.mp3',
    mixes: [
      { id: 'night_fire', name: '木柴燃烧', icon: '🔥', url: '/audio/木柴燃烧.mp3', volume: 55 },
      { id: 'night_wave', name: '海浪海鸥', icon: '🌊', url: '/audio/海浪海鸥.mp3', volume: 65 }
    ]
  }
];

// 音效库完整分类数据
var audioCategories = [
  {
    id: 'nature',
    name: '自然',
    icon: '🌿',
    items: [
      { id: 'rain_light', name: '小雨', icon: '🌧', url: '/audio/小雨.mp3', coverUrl: '/images/sounds/小雨.jpg' },
      { id: 'rain_noon', name: '午间细雨', icon: '🌦', url: '/audio/午间细雨.mp3', coverUrl: '/images/sounds/午间细雨.jpg' },
      { id: 'rain_heavy', name: '急雨', icon: '⛈', url: '/audio/急雨.mp3', coverUrl: '/images/sounds/急雨.jpg' },
      { id: 'rain_street', name: '街道雨声', icon: '🏙', url: '/audio/街道雨声.mp3', coverUrl: '/images/sounds/街道雨声.jpg' },
      { id: 'rain_eaves', name: '雷雨屋檐', icon: '🏠', url: '/audio/雷雨屋檐.mp3', coverUrl: '/images/sounds/雷雨屋檐.jpg' },
      { id: 'thunder_medium', name: '中型雷雨', icon: '🌩', url: '/audio/中型雷雨.m4a', coverUrl: '/images/sounds/中型雷雨.jpg' },
      { id: 'thunder_crack', name: '惊雷', icon: '⚡', url: '/audio/惊雷.mp3', coverUrl: '/images/sounds/惊雷.jpg' },
      { id: 'thunder_before', name: '暴雨前雷声', icon: '🌩', url: '/audio/暴雨前雷声.mp3', coverUrl: '/images/sounds/暴雨前雷声.jpg' },
      { id: 'wind_leaves', name: '风吹树叶', icon: '💨', url: '/audio/风吹树叶.mp3', coverUrl: '/images/sounds/风吹树叶.jpg' },
      { id: 'wind_strong', name: '大风', icon: '🌬', url: '/audio/大风.mp3', coverUrl: '/images/sounds/大风.jpg' },
      { id: 'wind_before_rain', name: '雨前风声', icon: '🌬', url: '/audio/雨前风声.mp3', coverUrl: '/images/sounds/雨前风声.jpg' },
      { id: 'desert_wind', name: '沙漠风声', icon: '🏜', url: '/audio/沙漠风声.mp3', coverUrl: '/images/sounds/沙漠风声.jpg' },
      { id: 'forest', name: '森林', icon: '🌲', url: '/audio/森林.mp3', coverUrl: '/images/sounds/森林.jpg' },
      { id: 'forest_walk', name: '穿越森林', icon: '🌳', url: '/audio/穿越森林.mp3', coverUrl: '/images/sounds/穿越森林.jpg' },
      { id: 'forest_natural', name: '自然森林', icon: '🌲', url: '/audio/自然森林.mp3', coverUrl: '/images/sounds/自然森林.jpg' },
      { id: 'wave_seagull', name: '海浪海鸥', icon: '🌊', url: '/audio/海浪海鸥.mp3', coverUrl: '/images/sounds/海浪海鸥.jpg' },
      { id: 'wave_crash', name: '海浪拍打', icon: '🌊', url: '/audio/海浪拍打.mp3', coverUrl: '/images/sounds/海浪拍打.jpg' },
      { id: 'stream', name: '溪流', icon: '💧', url: '/audio/溪流.mp3', coverUrl: '/images/sounds/溪流.jpg' },
      { id: 'cave_drip', name: '洞穴水滴', icon: '💦', url: '/audio/洞穴水滴.mp3', coverUrl: '/images/sounds/洞穴水滴.jpg' },
      { id: 'bubble', name: '冒泡音', icon: '💧', url: '/audio/冒泡音.mp3', coverUrl: '/images/sounds/冒泡音.jpg' },
      { id: 'blizzard', name: '暴风雪', icon: '❄️', url: '/audio/暴风雪.mp3', coverUrl: '/images/sounds/暴风雪.jpg' },
      { id: 'gravel_walk', name: '碎石行走', icon: '🚶', url: '/audio/碎石行走.mp3', coverUrl: '/images/sounds/碎石行走.jpg' },
      { id: 'snow_footstep', name: '雪地脚步', icon: '👣', url: '/audio/雪地脚步.mp3', coverUrl: '/images/sounds/雪地脚步.jpg' },
      { id: 'snow_walk', name: '雪地行走', icon: '❄️', url: '/audio/雪地行走.mp3', coverUrl: '/images/sounds/雪地行走.jpg' }
    ]
  },
  {
    id: 'animal',
    name: '动物',
    icon: '🐾',
    items: [
      { id: 'bird_spring', name: '春日鸟鸣', icon: '🐦', url: '/audio/春日鸟鸣.mp3', coverUrl: '/images/sounds/春日鸟鸣.jpg' },
      { id: 'bird_oriole', name: '黄鹂鸟鸣', icon: '🐦', url: '/audio/黄鹂鸟鸣.mp3', coverUrl: '/images/sounds/黄鹂鸟鸣.jpg' },
      { id: 'cricket_night', name: '夜晚虫鸣', icon: '🦗', url: '/audio/夜晚虫鸣.mp3', coverUrl: '/images/sounds/夜晚虫鸣.jpg' },
      { id: 'cricket', name: '蟋蟀鸣', icon: '🦗', url: '/audio/蟋蟀鸣.mp3', coverUrl: '/images/sounds/蟋蟀鸣.jpg' },
      { id: 'frog', name: '池塘蛙鸣', icon: '🐸', url: '/audio/池塘蛙鸣.mp3', coverUrl: '/images/sounds/池塘蛙鸣.jpg' },
      { id: 'seagull', name: '海鸥', icon: '🕊', url: '/audio/海鸥.mp3', coverUrl: '/images/sounds/海鸥.jpg' },
      { id: 'dog_bark', name: '狗吠', icon: '🐕', url: '/audio/狗吠.mp3', coverUrl: '/images/sounds/狗吠.jpg' },
      { id: 'wolf_howl', name: '狼嚎', icon: '🐺', url: '/audio/狼嚎.mp3', coverUrl: '/images/sounds/狼嚎.jpg' },
      { id: 'owl', name: '猫头鹰', icon: '🦉', url: '/audio/猫头鹰.mp3', coverUrl: '/images/sounds/猫头鹰.jpg' },
      { id: 'rooster', name: '鸡鸣', icon: '🐓', url: '/audio/鸡鸣.mp3', coverUrl: '/images/sounds/鸡鸣.jpg' }
    ]
  },
  {
    id: 'life',
    name: '生活',
    icon: '🏠',
    items: [
      { id: 'fireplace', name: '木柴燃烧', icon: '🔥', url: '/audio/木柴燃烧.mp3', coverUrl: '/images/sounds/木柴燃烧.jpg' },
      { id: 'keyboard', name: '键盘打字', icon: '⌨️', url: '/audio/键盘打字.mp3', coverUrl: '/images/sounds/键盘打字.jpg' },
      { id: 'clock', name: '钟表', icon: '🕐', url: '/audio/钟表.mp3', coverUrl: '/images/sounds/钟表.jpg' },
      { id: 'wind_chime', name: '风铃', icon: '🔔', url: '/audio/风铃.mp3', coverUrl: '/images/sounds/风铃.jpg' },
      { id: 'wind_chime_wind', name: '风与风铃', icon: '🌬', url: '/audio/风与风铃.mp3', coverUrl: '/images/sounds/风与风铃.jpg' }
    ]
  },
  {
    id: 'city',
    name: '城市',
    icon: '🏙',
    items: [
      { id: 'racing_car', name: '赛车飞驰', icon: '🏎', url: '/audio/赛车飞驰.mp3', coverUrl: '/images/sounds/赛车飞驰.jpg' },
      { id: 'airplane', name: '飞机飞过', icon: '✈️', url: '/audio/飞机飞过.mp3', coverUrl: '/images/sounds/飞机飞过.jpg' }
    ]
  },
  {
    id: 'study',
    name: '学习',
    icon: '📚',
    items: [
      { id: 'math_class', name: '数学课堂', icon: '📐', url: '/audio/数学课堂.mp3', coverUrl: '/images/sounds/数学课堂.jpg' },
      { id: 'bio_class', name: '生物课堂', icon: '🔬', url: '/audio/生物课堂.mp3', coverUrl: '/images/sounds/生物课堂.jpg' }
    ]
  }
];

// 所有音效平铺列表（用于搜索和快速查找）
var allSounds = [];
audioCategories.forEach(function (cat) {
  cat.items.forEach(function (item) {
    allSounds.push({
      id: item.id,
      name: item.name,
      icon: item.icon,
      url: item.url,
      coverUrl: item.coverUrl,
      categoryId: cat.id,
      categoryName: cat.name
    });
  });
});

// 根据ID查找音效
function findSoundById(soundId) {
  for (var i = 0; i < allSounds.length; i++) {
    if (allSounds[i].id === soundId) {
      return allSounds[i];
    }
  }
  return null;
}

// 根据场景ID查找场景
function findSceneById(sceneId) {
  for (var i = 0; i < scenes.length; i++) {
    if (scenes[i].id === sceneId) {
      return scenes[i];
    }
  }
  return null;
}

module.exports = {
  scenes: scenes,
  audioCategories: audioCategories,
  allSounds: allSounds,
  findSoundById: findSoundById,
  findSceneById: findSceneById
};