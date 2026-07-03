/**
 * 混音方案路由
 * 处理用户自定义混音方案的增删改查
 * 所有接口均需 JWT 认证
 */

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// 所有混音方案路由都需要认证
router.use(authMiddleware);

/**
 * 获取用户的所有混音方案
 * GET /api/mixes
 */
router.get('/', (req, res, next) => {
  try {
    const userId = req.user.id;

    const mixes = getDb().prepare(
      'SELECT * FROM saved_mixes WHERE user_id = ? ORDER BY created_at DESC'
    ).all(userId);

    // 将 items 从 JSON 字符串解析为数组
    const result = mixes.map(mix => ({
      ...mix,
      items: JSON.parse(mix.items)
    }));

    res.json({
      code: 0,
      message: 'success',
      data: result
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 创建混音方案
 * POST /api/mixes
 * 请求体：{ name, items: [{id, name, icon, url, volume}] }
 */
router.post('/', (req, res, next) => {
  try {
    const { name, items } = req.body;
    const userId = req.user.id;

    // 参数校验
    if (!name) {
      return res.status(400).json({
        code: 400,
        message: '混音方案名称不能为空'
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        code: 400,
        message: '混音方案至少需要一个音效'
      });
    }

    const id = uuidv4();
    const itemsJson = JSON.stringify(items);

    getDb().prepare(
      'INSERT INTO saved_mixes (id, user_id, name, items) VALUES (?, ?, ?, ?)'
    ).run(id, userId, name, itemsJson);

    res.json({
      code: 0,
      message: '创建成功',
      data: {
        id,
        name,
        items
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 更新混音方案
 * PUT /api/mixes/:id
 * 请求体：{ name?, items? }
 */
router.put('/:id', (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, items } = req.body;
    const userId = req.user.id;

    // 查询该混音方案是否属于当前用户
    const mix = getDb().prepare('SELECT * FROM saved_mixes WHERE id = ? AND user_id = ?').get(id, userId);
    if (!mix) {
      return res.status(404).json({
        code: 404,
        message: '混音方案不存在或无权操作'
      });
    }

    // 更新字段
    const newName = name !== undefined ? name : mix.name;
    const newItems = items !== undefined ? JSON.stringify(items) : mix.items;

    getDb().prepare('UPDATE saved_mixes SET name = ?, items = ? WHERE id = ? AND user_id = ?')
      .run(newName, newItems, id, userId);

    res.json({
      code: 0,
      message: '更新成功',
      data: {
        id,
        name: newName,
        items: JSON.parse(newItems)
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 删除混音方案
 * DELETE /api/mixes/:id
 */
router.delete('/:id', (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // 检查该混音方案是否属于当前用户
    const mix = getDb().prepare('SELECT * FROM saved_mixes WHERE id = ? AND user_id = ?').get(id, userId);
    if (!mix) {
      return res.status(404).json({
        code: 404,
        message: '混音方案不存在或无权操作'
      });
    }

    getDb().prepare('DELETE FROM saved_mixes WHERE id = ? AND user_id = ?').run(id, userId);

    res.json({
      code: 0,
      message: '删除成功'
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

