/**
 * JWT 认证中间件
 * 从请求头 Authorization 中提取并验证 JWT token
 * 验证通过后将用户信息挂载到 req.user 上
 */

const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * 认证中间件
 * 必须在需要认证的路由之前使用
 * 支持 "Bearer <token>" 格式
 */
function authMiddleware(req, res, next) {
  // 从 Authorization 请求头获取 token
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      code: 401,
      message: '缺少认证令牌，请先登录'
    });
  }

  // 解析 Bearer token 格式
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({
      code: 401,
      message: '认证令牌格式错误，正确格式：Bearer <token>'
    });
  }

  const token = parts[1];

  try {
    // 验证并解码 JWT token
    const decoded = jwt.verify(token, config.JWT_SECRET);

    // 将用户信息挂载到请求对象上，供后续路由使用
    req.user = {
      id: decoded.id,
      username: decoded.username,
      nickname: decoded.nickname
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        code: 401,
        message: '认证令牌已过期，请重新登录'
      });
    }

    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        code: 401,
        message: '认证令牌无效，请重新登录'
      });
    }

    // 其他未知错误
    return res.status(401).json({
      code: 401,
      message: '认证失败：' + err.message
    });
  }
}

module.exports = authMiddleware;
