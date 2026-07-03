/**
 * 用户认证路由
 * 处理用户注册、登录、个人信息获取和更新
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db');
const config = require('../config');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

/**
 * 用户注册
 * POST /api/auth/register
 * 请求体：{ username, password, nickname?(可选) }
 */
router.post('/register', async (req, res, next) => {
  try {
    const { username, password, nickname } = req.body;

    // 参数校验
    if (!username || !password) {
      return res.status(400).json({
        code: 400,
        message: '用户名和密码不能为空'
      });
    }

    if (username.length < 2 || username.length > 20) {
      return res.status(400).json({
        code: 400,
        message: '用户名长度应在2-20个字符之间'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        code: 400,
        message: '密码长度不能少于6个字符'
      });
    }

    // 检查用户名是否已存在
    const existingUser = getDb().prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existingUser) {
      return res.status(400).json({
        code: 400,
        message: '用户名已被注册'
      });
    }

    // 生成密码哈希
    const salt = await bcrypt.genSalt(config.BCRYPT_ROUNDS);
    const passwordHash = await bcrypt.hash(password, salt);

    // 生成用户ID
    const userId = uuidv4();

    // 插入新用户
    getDb().prepare(
      'INSERT INTO users (id, username, nickname, password_hash) VALUES (?, ?, ?, ?)'
    ).run(userId, username, nickname || username, passwordHash);

    // 为新用户创建默认设置
    getDb().prepare(
      'INSERT INTO user_settings (id, user_id) VALUES (?, ?)'
    ).run(uuidv4(), userId);

    // 生成 JWT token
    const token = jwt.sign(
      { id: userId, username, nickname: nickname || username },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN }
    );

    res.json({
      code: 0,
      message: '注册成功',
      data: {
        token,
        user: {
          id: userId,
          username,
          nickname: nickname || username,
          avatar: ''
        }
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 用户登录
 * POST /api/auth/login
 * 请求体：{ username, password }
 */
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // 参数校验
    if (!username || !password) {
      return res.status(400).json({
        code: 400,
        message: '用户名和密码不能为空'
      });
    }

    // 查询用户
    const user = getDb().prepare('SELECT id, username, nickname, avatar, password_hash FROM users WHERE username = ?').get(username);
    if (!user) {
      return res.status(400).json({
        code: 400,
        message: '用户名或密码错误'
      });
    }

    // 验证密码
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({
        code: 400,
        message: '用户名或密码错误'
      });
    }

    // 生成 JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username, nickname: user.nickname },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN }
    );

    res.json({
      code: 0,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          nickname: user.nickname,
          avatar: user.avatar
        }
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 获取当前用户信息（需认证）
 * GET /api/auth/profile
 */
router.get('/profile', authMiddleware, (req, res, next) => {
  try {
    const user = getDb().prepare(
      'SELECT id, username, nickname, avatar, created_at FROM users WHERE id = ?'
    ).get(req.user.id);

    if (!user) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在'
      });
    }

    res.json({
      code: 0,
      message: 'success',
      data: user
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 更新用户昵称和头像（需认证）
 * PUT /api/auth/profile
 * 请求体：{ nickname?, avatar? }
 */
router.put('/profile', authMiddleware, (req, res, next) => {
  try {
    const { nickname, avatar } = req.body;
    const userId = req.user.id;

    // 查询当前用户信息
    const currentUser = getDb().prepare('SELECT nickname, avatar FROM users WHERE id = ?').get(userId);
    if (!currentUser) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在'
      });
    }

    // 只更新提供的字段
    const newNickname = nickname !== undefined ? nickname : currentUser.nickname;
    const newAvatar = avatar !== undefined ? avatar : currentUser.avatar;

    getDb().prepare('UPDATE users SET nickname = ?, avatar = ? WHERE id = ?')
      .run(newNickname, newAvatar, userId);

    res.json({
      code: 0,
      message: '更新成功',
      data: {
        id: userId,
        nickname: newNickname,
        avatar: newAvatar
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

