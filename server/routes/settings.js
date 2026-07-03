/**
 * 用户设置路由
 * 处理用户个人偏好设置的获取和更新
 * 所有接口均需 JWT 认证
 */

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// 所有设置路由都需要认证
router.use(authMiddleware);

/**
 * 获取用户设置
 * GET /api/settings
 */
router.get('/', (req, res, next) => {
  try {
    const userId = req.user.id;

    let settings = getDb().prepare(
      'SELECT * FROM user_settings WHERE user_id = ?'
    ).get(userId);

    // 如果用户还没有设置记录（异常情况），创建一条默认设置
    if (!settings) {
      const id = uuidv4();
      getDb().prepare(
        'INSERT INTO user_settings (id, user_id) VALUES (?, ?)'
      ).run(id, userId);

      settings = getDb().prepare(
        'SELECT * FROM user_settings WHERE user_id = ?'
      ).get(userId);
    }

    res.json({
      code: 0,
      message: 'success',
      data: settings
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 更新用户设置
 * PUT /api/settings
 * 请求体：{ quality?, fade_in?, fade_out?, vibrate?, sound? }
 * 只更新传入的字段，未传入的字段保持不变
 */
router.put('/', (req, res, next) => {
  try {
    const userId = req.user.id;
    const { quality, fade_in, fade_out, vibrate, sound } = req.body;

    // 查询当前设置
    let settings = getDb().prepare(
      'SELECT * FROM user_settings WHERE user_id = ?'
    ).get(userId);

    if (!settings) {
      // 如果不存在则创建
      const id = uuidv4();
      getDb().prepare(
        'INSERT INTO user_settings (id, user_id, quality, fade_in, fade_out, vibrate, sound) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).run(
        id, userId,
        quality || 'high',
        fade_in !== undefined ? fade_in : 3,
        fade_out !== undefined ? fade_out : 5,
        vibrate !== undefined ? vibrate : 1,
        sound || ''
      );
    } else {
      // 逐个更新字段（只更新传入的字段）
      const newQuality = quality !== undefined ? quality : settings.quality;
      const newFadeIn = fade_in !== undefined ? fade_in : settings.fade_in;
      const newFadeOut = fade_out !== undefined ? fade_out : settings.fade_out;
      const newVibrate = vibrate !== undefined ? vibrate : settings.vibrate;
      const newSound = sound !== undefined ? sound : settings.sound;

      getDb().prepare(
        'UPDATE user_settings SET quality = ?, fade_in = ?, fade_out = ?, vibrate = ?, sound = ? WHERE user_id = ?'
      ).run(newQuality, newFadeIn, newFadeOut, newVibrate, newSound, userId);
    }

    // 返回更新后的设置
    const updatedSettings = getDb().prepare(
      'SELECT * FROM user_settings WHERE user_id = ?'
    ).get(userId);

    res.json({
      code: 0,
      message: '更新成功',
      data: updatedSettings
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

