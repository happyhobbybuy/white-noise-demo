/**
 * 收藏路由
 * 处理用户对音效的收藏、取消收藏和收藏列表查询
 * 所有接口均需 JWT 认证
 */

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// 所有收藏路由都需要认证
router.use(authMiddleware);

/**
 * 获取收藏列表
 * GET /api/favorites
 */
router.get('/', (req, res, next) => {
  try {
    const userId = req.user.id;

    const favorites = getDb().prepare(
      'SELECT * FROM favorites WHERE user_id = ? ORDER BY created_at DESC'
    ).all(userId);

    res.json({
      code: 0,
      message: 'success',
      data: favorites
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 添加收藏
 * POST /api/favorites
 * 请求体：{ sound_id, sound_name, sound_url, cover_url }
 */
router.post('/', (req, res, next) => {
  try {
    const { sound_id, sound_name, sound_url, cover_url } = req.body;
    const userId = req.user.id;

    // 参数校验
    if (!sound_id || !sound_name || !sound_url) {
      return res.status(400).json({
        code: 400,
        message: '缺少必要参数：sound_id, sound_name, sound_url'
      });
    }

    // 检查是否已收藏（利用数据库唯一索引）
    const existing = getDb().prepare(
      'SELECT id FROM favorites WHERE user_id = ? AND sound_id = ?'
    ).get(userId, sound_id);

    if (existing) {
      return res.status(400).json({
        code: 400,
        message: '该音效已被收藏'
      });
    }

    const id = uuidv4();

    getDb().prepare(
      'INSERT INTO favorites (id, user_id, sound_id, sound_name, sound_url, cover_url) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(id, userId, sound_id, sound_name, sound_url, cover_url || '');

    res.json({
      code: 0,
      message: '收藏成功',
      data: { id, sound_id, sound_name }
    });
  } catch (err) {
    // 捕获唯一约束违反错误
    if (err.message && err.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({
        code: 400,
        message: '该音效已被收藏'
      });
    }
    next(err);
  }
});

/**
 * 取消收藏
 * DELETE /api/favorites/:id
 */
router.delete('/:id', (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // 检查该收藏是否属于当前用户
    const favorite = getDb().prepare('SELECT * FROM favorites WHERE id = ? AND user_id = ?').get(id, userId);
    if (!favorite) {
      return res.status(404).json({
        code: 404,
        message: '收藏记录不存在或无权操作'
      });
    }

    getDb().prepare('DELETE FROM favorites WHERE id = ? AND user_id = ?').run(id, userId);

    res.json({
      code: 0,
      message: '取消收藏成功'
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 检查是否已收藏某个音效
 * GET /api/favorites/check/:soundId
 */
router.get('/check/:soundId', (req, res, next) => {
  try {
    const { soundId } = req.params;
    const userId = req.user.id;

    const favorite = getDb().prepare(
      'SELECT id FROM favorites WHERE user_id = ? AND sound_id = ?'
    ).get(userId, soundId);

    res.json({
      code: 0,
      message: 'success',
      data: {
        sound_id: soundId,
        is_favorited: !!favorite
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

