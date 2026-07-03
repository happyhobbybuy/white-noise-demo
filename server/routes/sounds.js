/**
 * 音效库路由（公开接口，无需认证）
 * 直接从 audioData.js 读取音效分类和列表数据
 */

const express = require('express');
const { audioCategories, allSounds, findSoundById, scenes } = require('../../data/audioData');
const router = express.Router();

/**
 * 获取所有音效分类和列表
 * GET /api/sounds
 * 返回分类数据及场景数据
 */
router.get('/', (req, res) => {
  res.json({
    code: 0,
    message: 'success',
    data: {
      categories: audioCategories,
      scenes: scenes,
      total: allSounds.length
    }
  });
});

/**
 * 获取单个音效详情
 * GET /api/sounds/:id
 */
router.get('/:id', (req, res) => {
  const { id } = req.params;

  // 根据 ID 查找音效
  const sound = findSoundById(id);

  if (!sound) {
    return res.status(404).json({
      code: 404,
      message: '音效不存在'
    });
  }

  res.json({
    code: 0,
    message: 'success',
    data: sound
  });
});

module.exports = router;
