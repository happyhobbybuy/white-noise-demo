/**
 * 数据库初始化模块
 * 使用 sql.js（基于 WASM 的 SQLite）创建数据库连接并初始化所有表结构
 * sql.js 是纯 JavaScript 实现，无需编译原生模块
 */

const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');
const config = require('./config');

// 数据库文件路径（使用 __dirname 确保相对于 server 目录）
const dbPath = path.resolve(__dirname, config.DB_PATH);

// 确保数据库目录存在
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

let SQL;
let db;
let dbWrapper = null;

/**
 * 保存数据库到磁盘文件
 */
function saveDatabase() {
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  } catch (err) {
    console.error('[数据库] 保存文件失败:', err.message);
  }
}

/**
 * Statement 类 - 封装预编译 SQL 语句
 * 兼容 better-sqlite3 的 prepare().run/get/all 接口
 */
class Statement {
  constructor(sql) {
    this.sql = sql;
  }

  /**
   * 执行 INSERT/UPDATE/DELETE 等写操作
   */
  run(...params) {
    const flatParams = [];
    if (params.length === 1 && Array.isArray(params[0])) {
      for (let i = 0; i < params[0].length; i++) {
        flatParams.push(params[0][i]);
      }
    } else {
      for (let i = 0; i < params.length; i++) {
        flatParams.push(params[i]);
      }
    }

    if (flatParams.length > 0) {
      db.run(this.sql, flatParams);
    } else {
      db.run(this.sql);
    }

    saveDatabase();

    return {
      lastInsertRowid: getLastInsertId(),
      changes: getChanges()
    };
  }

  /**
   * 查询单行记录
   */
  get(...params) {
    const results = this.all(...params);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * 查询所有行记录
   */
  all(...params) {
    let flatParams = [];
    if (params.length === 1 && Array.isArray(params[0])) {
      flatParams = params[0];
    } else {
      flatParams = params;
    }

    let stmtResults;
    if (flatParams.length > 0) {
      stmtResults = db.exec(this.sql, flatParams);
    } else {
      stmtResults = db.exec(this.sql);
    }

    if (stmtResults.length === 0) {
      return [];
    }

    const columns = stmtResults[0].columns;
    const values = stmtResults[0].values;

    const results = [];
    for (let i = 0; i < values.length; i++) {
      const row = {};
      for (let j = 0; j < columns.length; j++) {
        row[columns[j]] = values[i][j];
      }
      results.push(row);
    }

    return results;
  }
}

/**
 * 获取最后插入的行ID
 */
function getLastInsertId() {
  const result = db.exec('SELECT last_insert_rowid() as id');
  if (result.length > 0 && result[0].values.length > 0) {
    return result[0].values[0][0];
  }
  return null;
}

/**
 * 获取受影响的行数
 */
function getChanges() {
  const result = db.exec('SELECT changes() as cnt');
  if (result.length > 0 && result[0].values.length > 0) {
    return result[0].values[0][0];
  }
  return 0;
}

/**
 * 初始化数据库表结构
 */
function initDatabase() {
  // 用户表
  db.run("CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, openid TEXT, username TEXT NOT NULL UNIQUE, nickname TEXT DEFAULT '', avatar TEXT DEFAULT '', password_hash TEXT NOT NULL, created_at TEXT DEFAULT (datetime('now', 'localtime')))");

  // 专注记录表
  db.run("CREATE TABLE IF NOT EXISTS focus_records (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, date TEXT NOT NULL, minutes INTEGER NOT NULL DEFAULT 0, rounds INTEGER NOT NULL DEFAULT 0, mode TEXT DEFAULT 'focus', created_at TEXT DEFAULT (datetime('now', 'localtime')), FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE)");

  // 为专注记录创建索引
  db.run("CREATE INDEX IF NOT EXISTS idx_focus_records_user_date ON focus_records(user_id, date)");

  // 保存的混音方案表
  db.run("CREATE TABLE IF NOT EXISTS saved_mixes (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, name TEXT NOT NULL, items TEXT NOT NULL DEFAULT '[]', created_at TEXT DEFAULT (datetime('now', 'localtime')), FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE)");

  // 收藏表
  db.run("CREATE TABLE IF NOT EXISTS favorites (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, sound_id TEXT NOT NULL, sound_name TEXT NOT NULL, sound_url TEXT NOT NULL, cover_url TEXT DEFAULT '', created_at TEXT DEFAULT (datetime('now', 'localtime')), FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE)");

  // 收藏唯一约束
  db.run("CREATE UNIQUE INDEX IF NOT EXISTS idx_favorites_user_sound ON favorites(user_id, sound_id)");

  // 用户设置表
  db.run("CREATE TABLE IF NOT EXISTS user_settings (id TEXT PRIMARY KEY, user_id TEXT NOT NULL UNIQUE, quality TEXT DEFAULT 'high', fade_in INTEGER DEFAULT 3, fade_out INTEGER DEFAULT 5, vibrate INTEGER DEFAULT 1, sound TEXT DEFAULT '', created_at TEXT DEFAULT (datetime('now', 'localtime')), FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE)");
}

/**
 * 异步初始化数据库
 */
async function init() {
  SQL = await initSqlJs();

  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // 启用外键约束
  db.run('PRAGMA foreign_keys = ON');

  // 初始化表结构
  initDatabase();

  // 保存到磁盘
  saveDatabase();

  // 创建兼容 better-sqlite3 的封装对象
  dbWrapper = {
    exec(sql) {
      db.run(sql);
      saveDatabase();
    },
    prepare(sql) {
      return new Statement(sql);
    },
    pragma(str) {
      db.run('PRAGMA ' + str);
    }
  };

  console.log('[数据库] 表结构初始化完成');
  return dbWrapper;
}

/**
 * 获取数据库实例
 */
function getDb() {
  if (!dbWrapper) {
    throw new Error('数据库尚未初始化完成，请稍后重试');
  }
  return dbWrapper;
}

// 导出
module.exports = { init, getDb };
