/**
 * 应用配置文件
 * 集中管理端口、JWT密钥、数据库路径等配置项
 */

const path = require('path');

module.exports = {
  // 服务端口
  PORT: process.env.WHITE_NOISE_PORT || 3000,

  // JWT 配置
  JWT_SECRET: process.env.WHITE_NOISE_JWT_SECRET || 'white_noise_jwt_secret_key_2024',
  JWT_EXPIRES_IN: '7d', // token 有效期7天

  // 数据库文件路径（使用 __dirname 确保路径正确，避免被环境变量覆盖）
  DB_PATH: process.env.WHITE_NOISE_DB_PATH || './data/white_noise.db',

  // 上传文件存储目录
  UPLOAD_DIR: './public/uploads',

  // 密码加密轮数（越高越安全，但越慢）
  BCRYPT_ROUNDS: 10
};
