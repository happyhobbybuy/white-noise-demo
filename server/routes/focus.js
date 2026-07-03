/**
 * 专注记录路由
 * 处理专注记录的保存、查询和统计
 * 所有接口均需 JWT 认证
 */

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// 所有专注路由都需要认证
router.use(authMiddleware);

/**
 * 保存一条专注记录
 * POST /api/focus/records
 * 请求体：{ date, minutes, rounds, mode }
 */
router.post('/records', (req, res, next) => {
  try {
    const { date, minutes, rounds, mode } = req.body;
    const userId = req.user.id;

    // 参数校验
    if (!date || minutes === undefined || rounds === undefined) {
      return res.status(400).json({
        code: 400,
        message: '缺少必要参数：date, minutes, rounds'
      });
    }

    if (minutes < 0) {
      return res.status(400).json({
        code: 400,
        message: '专注时长不能为负数'
      });
    }

    // 插入专注记录
    const id = uuidv4();
    getDb().prepare(
      'INSERT INTO focus_records (id, user_id, date, minutes, rounds, mode) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(id, userId, date, minutes, rounds, mode || 'focus');

    res.json({
      code: 0,
      message: '保存成功',
      data: { id, date, minutes, rounds, mode: mode || 'focus' }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 获取专注记录列表
 * GET /api/focus/records?start=2026-06-01&end=2026-07-03
 * 支持日期范围查询，不传参数则返回所有记录
 */
router.get('/records', (req, res, next) => {
  try {
    const userId = req.user.id;
    const { start, end } = req.query;

    let records;

    if (start && end) {
      // 按日期范围查询
      records = getDb().prepare(
        'SELECT * FROM focus_records WHERE user_id = ? AND date >= ? AND date <= ? ORDER BY date DESC, created_at DESC'
      ).all(userId, start, end);
    } else if (start) {
      // 只传起始日期
      records = getDb().prepare(
        'SELECT * FROM focus_records WHERE user_id = ? AND date >= ? ORDER BY date DESC, created_at DESC'
      ).all(userId, start);
    } else if (end) {
      // 只传结束日期
      records = getDb().prepare(
        'SELECT * FROM focus_records WHERE user_id = ? AND date <= ? ORDER BY date DESC, created_at DESC'
      ).all(userId, end);
    } else {
      // 返回所有记录
      records = getDb().prepare(
        'SELECT * FROM focus_records WHERE user_id = ? ORDER BY date DESC, created_at DESC'
      ).all(userId);
    }

    res.json({
      code: 0,
      message: 'success',
      data: records
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 获取统计数据
 * GET /api/focus/summary?period=week|month|all
 * 返回指定周期内的总专注时长、总轮次、总天数
 */
router.get('/summary', (req, res, next) => {
  try {
    const userId = req.user.id;
    const { period } = req.query;

    // 根据周期计算起始日期
    const today = new Date();
    let startDate = null;

    if (period === 'week') {
      // 本周（周一为起始）
      const dayOfWeek = today.getDay();
      const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const monday = new Date(today);
      monday.setDate(today.getDate() - mondayOffset);
      startDate = monday.toISOString().split('T')[0];
    } else if (period === 'month') {
      // 本月
      startDate = today.toISOString().slice(0, 8) + '01';
    }
    // period === 'all' 时 startDate 为 null，查询全部记录

    let stats;
    if (startDate) {
      stats = getDb().prepare(
        `SELECT
          COALESCE(SUM(minutes), 0) as total_minutes,
          COALESCE(SUM(rounds), 0) as total_rounds,
          COUNT(DISTINCT date) as total_days
        FROM focus_records
        WHERE user_id = ? AND date >= ?`
      ).get(userId, startDate);
    } else {
      stats = getDb().prepare(
        `SELECT
          COALESCE(SUM(minutes), 0) as total_minutes,
          COALESCE(SUM(rounds), 0) as total_rounds,
          COUNT(DISTINCT date) as total_days
        FROM focus_records
        WHERE user_id = ?`
      ).get(userId);
    }

    // 将分钟转换为小时和分钟
    const hours = Math.floor(stats.total_minutes / 60);
    const remainMinutes = stats.total_minutes % 60;

    res.json({
      code: 0,
      message: 'success',
      data: {
        period: period || 'all',
        total_minutes: stats.total_minutes,
        total_hours: parseFloat((stats.total_minutes / 60).toFixed(1)),
        total_rounds: stats.total_rounds,
        total_days: stats.total_days,
        formatted_time: hours > 0 ? `${hours}小时${remainMinutes}分钟` : `${remainMinutes}分钟`
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 获取今日统计
 * GET /api/focus/today
 * 返回今天累计的专注时长、轮次等数据
 */
router.get('/today', (req, res, next) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    // 查询今日的所有记录
    const records = getDb().prepare(
      'SELECT * FROM focus_records WHERE user_id = ? AND date = ? ORDER BY created_at DESC'
    ).all(userId, today);

    // 汇总今日数据
    const summary = getDb().prepare(
      `SELECT
        COALESCE(SUM(minutes), 0) as total_minutes,
        COALESCE(SUM(rounds), 0) as total_rounds,
        COUNT(*) as record_count
      FROM focus_records
      WHERE user_id = ? AND date = ?`
    ).get(userId, today);

    res.json({
      code: 0,
      message: 'success',
      data: {
        date: today,
        total_minutes: summary.total_minutes,
        total_rounds: summary.total_rounds,
        record_count: summary.record_count,
        records: records
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

