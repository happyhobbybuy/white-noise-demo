/**
 * 白噪音应用后端服务 - 主入口文件
 * 初始化 Express 应用，注册中间件和路由
 * 数据库使用 sql.js（WASM），需要异步初始化
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const config = require('./config');

// 初始化 Express 应用
const app = express();

// ==================== 中间件配置 ====================

// 解析 JSON 请求体
app.use(express.json());
// 解析 URL 编码请求体
app.use(express.urlencoded({ extended: true }));

// 跨域支持 - 允许所有来源访问
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 静态文件服务 - 托管 public 目录
app.use(express.static(path.join(__dirname, 'public')));

// 托管上层目录的 audio 和 images 资源（音效和图片）
app.use('/audio', express.static(path.join(__dirname, '..', 'audio')));
app.use('/images', express.static(path.join(__dirname, '..', 'images')));

// 确保上传目录存在
const uploadDir = path.resolve(__dirname, config.UPLOAD_DIR);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ==================== 异步初始化并启动服务器 ====================

async function startServer() {
  try {
    // 初始化数据库（异步加载 WASM）
    const { init } = require('./db');
    await init();

    // ==================== 注册路由 ====================

    // API 健康检查
    app.get('/api', (req, res) => {
      res.json({
        code: 0,
        message: '白噪音应用后端服务运行中',
        data: {
          version: '1.0.0',
          timestamp: new Date().toISOString()
        }
      });
    });

    // 音效库路由（公开接口，无需认证）
    const soundsRouter = require('./routes/sounds');
    app.use('/api/sounds', soundsRouter);

    // 用户认证路由（包含注册、登录、个人信息）
    const authRouter = require('./routes/auth');
    app.use('/api/auth', authRouter);

    // 专注记录路由（需认证）
    const focusRouter = require('./routes/focus');
    app.use('/api/focus', focusRouter);

    // 混音方案路由（需认证）
    const mixesRouter = require('./routes/mixes');
    app.use('/api/mixes', mixesRouter);

    // 收藏路由（需认证）
    const favoritesRouter = require('./routes/favorites');
    app.use('/api/favorites', favoritesRouter);

    // 用户设置路由（需认证）
    const settingsRouter = require('./routes/settings');
    app.use('/api/settings', settingsRouter);

    // ==================== 全局错误处理中间件 ====================

    // 404 处理 - 未匹配的路由（必须在所有路由之后注册）
    app.use((req, res) => {
      res.status(404).json({
        code: 404,
        message: '接口不存在：' + req.method + ' ' + req.originalUrl
      });
    });

    // 全局错误捕获
    app.use((err, req, res, next) => {
      console.error('[服务器错误]', err);

      // Multer 文件大小超限错误
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          code: 400,
          message: '上传文件大小超出限制'
        });
      }

      // Multer 字段数量超限错误
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({
          code: 400,
          message: '上传字段不符合要求'
        });
      }

      // 默认服务器错误
      res.status(500).json({
        code: 500,
        message: '服务器内部错误，请稍后重试'
      });
    });

    // ==================== 启动监听 ====================

    const PORT = config.PORT;

    app.listen(PORT, () => {
      console.log('========================================');
      console.log('  白噪音后端服务已启动');
      console.log('  访问地址: http://localhost:' + PORT);
      console.log('  API 地址: http://localhost:' + PORT + '/api');
      console.log('========================================');
    });
  } catch (err) {
    console.error('[启动失败]', err);
    process.exit(1);
  }
}

// 监听进程退出事件
process.on('SIGINT', () => {
  console.log('\n[服务] 正在关闭服务器...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n[服务] 正在关闭服务器...');
  process.exit(0);
});

// 启动服务器
startServer();

module.exports = app;
