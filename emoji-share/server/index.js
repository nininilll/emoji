const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const archiver = require('archiver');
const { v4: uuidv4 } = require('uuid');
const mysql = require('mysql2/promise');
const Minio = require('minio');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const stream = require('stream');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'emoji-share-secret-key-2024';

// ============ 配置 ============

const DB_CONFIG = {
  host: process.env.DB_HOST || '81.70.134.183',
  port: parseInt(process.env.DB_PORT || '13306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '8brE4t8XMySWcfeJ',
  database: process.env.DB_NAME || 'emoji_share',
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4'
};

const MINIO_CONFIG = {
  endPoint: process.env.MINIO_ENDPOINT || '81.70.134.183',
  port: parseInt(process.env.MINIO_PORT || '19000'),
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY || 'minio',
  secretKey: process.env.MINIO_SECRET_KEY || 'BwPR4DaKTiWfsFEE'
};

const MINIO_BUCKET = process.env.MINIO_BUCKET_NAME || 'lxh';
const MINIO_PUBLIC_URL = process.env.MINIO_PUBLIC_URL || 'http://81.70.134.183:19000';

// ============ 中间件 ============

app.use(cors());
app.use(express.json());

// Multer 内存存储（上传后直接传到 MinIO）
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/gif', 'image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件格式，仅支持 GIF/PNG/JPG/WEBP'));
    }
  }
});

// ============ MySQL 连接池 ============

let pool;

async function initDB() {
  // 先创建数据库（如果不存在）
  const tempConn = await mysql.createConnection({
    host: DB_CONFIG.host,
    port: DB_CONFIG.port,
    user: DB_CONFIG.user,
    password: DB_CONFIG.password
  });
  await tempConn.execute(`CREATE DATABASE IF NOT EXISTS \`${DB_CONFIG.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await tempConn.end();

  // 创建连接池
  pool = mysql.createPool(DB_CONFIG);

  // 创建表
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(50) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      nickname VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS collections (
      id VARCHAR(8) PRIMARY KEY,
      user_id INT NOT NULL,
      name VARCHAR(200) NOT NULL DEFAULT '未命名合集',
      description TEXT,
      download_count INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_user_id (user_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS emojis (
      id VARCHAR(8) PRIMARY KEY,
      collection_id VARCHAR(8) NOT NULL,
      filename VARCHAR(255) NOT NULL,
      original_name VARCHAR(500),
      size INT,
      mimetype VARCHAR(100),
      minio_key VARCHAR(500) NOT NULL,
      url VARCHAR(1000) NOT NULL,
      uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_collection_id (collection_id),
      FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  console.log('✅ MySQL 数据库初始化完成');
}

// ============ MinIO 客户端 ============

const minioClient = new Minio.Client(MINIO_CONFIG);

async function initMinio() {
  const exists = await minioClient.bucketExists(MINIO_BUCKET);
  if (!exists) {
    await minioClient.makeBucket(MINIO_BUCKET, 'us-east-1');
    // 设置 bucket 公开读
    const policy = {
      Version: '2012-10-17',
      Statement: [{
        Effect: 'Allow',
        Principal: { AWS: ['*'] },
        Action: ['s3:GetObject'],
        Resource: [`arn:aws:s3:::${MINIO_BUCKET}/*`]
      }]
    };
    await minioClient.setBucketPolicy(MINIO_BUCKET, JSON.stringify(policy));
  }
  console.log('✅ MinIO 初始化完成');
}

// 上传文件到 MinIO
async function uploadToMinio(buffer, key, mimetype) {
  await minioClient.putObject(MINIO_BUCKET, key, buffer, buffer.length, {
    'Content-Type': mimetype
  });
  return `${MINIO_PUBLIC_URL}/${MINIO_BUCKET}/${key}`;
}

// 从 MinIO 删除文件
async function deleteFromMinio(key) {
  try {
    await minioClient.removeObject(MINIO_BUCKET, key);
  } catch (err) {
    console.error('MinIO 删除失败:', err.message);
  }
}

// 从 MinIO 获取文件流
async function getMinioStream(key) {
  return await minioClient.getObject(MINIO_BUCKET, key);
}

// ============ JWT 认证中间件 ============

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: '请先登录' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: '登录已过期，请重新登录' });
  }
}

// 可选认证（分享页面用）
function optionalAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token) {
    try {
      req.user = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      // 忽略无效 token
    }
  }
  next();
}

// ============ 用户认证 API ============

// 注册
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, nickname } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }
    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({ error: '用户名长度 3-20 个字符' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: '密码至少 6 个字符' });
    }

    // 检查用户名是否已存在
    const [existing] = await pool.execute('SELECT id FROM users WHERE username = ?', [username]);
    if (existing.length > 0) {
      return res.status(400).json({ error: '用户名已被注册' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
      'INSERT INTO users (username, password, nickname) VALUES (?, ?, ?)',
      [username, hashedPassword, nickname || username]
    );

    const token = jwt.sign({ id: result.insertId, username, nickname: nickname || username }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      token,
      user: { id: result.insertId, username, nickname: nickname || username }
    });
  } catch (err) {
    console.error('注册失败:', err);
    res.status(500).json({ error: '注册失败，请重试' });
  }
});

// 登录
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }

    const [users] = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);
    if (users.length === 0) {
      return res.status(400).json({ error: '用户名或密码错误' });
    }

    const user = users[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(400).json({ error: '用户名或密码错误' });
    }

    const token = jwt.sign({ id: user.id, username: user.username, nickname: user.nickname }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      token,
      user: { id: user.id, username: user.username, nickname: user.nickname }
    });
  } catch (err) {
    console.error('登录失败:', err);
    res.status(500).json({ error: '登录失败，请重试' });
  }
});

// 获取当前用户信息
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const [users] = await pool.execute('SELECT id, username, nickname, created_at FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }
    res.json({ success: true, user: users[0] });
  } catch (err) {
    res.status(500).json({ error: '获取用户信息失败' });
  }
});

// ============ 合集 API（需要登录） ============

// 创建合集
app.post('/api/collections', authMiddleware, async (req, res) => {
  try {
    const { name, description } = req.body;
    const id = uuidv4().slice(0, 8);

    await pool.execute(
      'INSERT INTO collections (id, user_id, name, description) VALUES (?, ?, ?, ?)',
      [id, req.user.id, name || '未命名合集', description || '']
    );

    const [rows] = await pool.execute('SELECT * FROM collections WHERE id = ?', [id]);
    res.json({ success: true, collection: { ...rows[0], emojis: [] } });
  } catch (err) {
    console.error('创建合集失败:', err);
    res.status(500).json({ error: '创建失败' });
  }
});

// 获取当前用户的所有合集
app.get('/api/collections', authMiddleware, async (req, res) => {
  try {
    const [collections] = await pool.execute(
      'SELECT * FROM collections WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );

    // 为每个合集加载表情包
    for (const col of collections) {
      const [emojis] = await pool.execute(
        'SELECT * FROM emojis WHERE collection_id = ? ORDER BY uploaded_at ASC',
        [col.id]
      );
      col.emojis = emojis;
    }

    res.json({ success: true, collections });
  } catch (err) {
    console.error('获取合集失败:', err);
    res.status(500).json({ error: '获取失败' });
  }
});

// 获取合集详情（分享页面也可访问，无需登录）
app.get('/api/collections/:id', optionalAuth, async (req, res) => {
  try {
    const [collections] = await pool.execute('SELECT * FROM collections WHERE id = ?', [req.params.id]);
    if (collections.length === 0) {
      return res.status(404).json({ error: '合集不存在' });
    }

    const collection = collections[0];
    const [emojis] = await pool.execute(
      'SELECT * FROM emojis WHERE collection_id = ? ORDER BY uploaded_at ASC',
      [collection.id]
    );
    collection.emojis = emojis;

    res.json({ success: true, collection });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '获取失败' });
  }
});

// 删除合集（仅所有者）
app.delete('/api/collections/:id', authMiddleware, async (req, res) => {
  try {
    const [collections] = await pool.execute('SELECT * FROM collections WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (collections.length === 0) {
      return res.status(404).json({ error: '合集不存在' });
    }

    // 先删除 MinIO 上的文件
    const [emojis] = await pool.execute('SELECT minio_key FROM emojis WHERE collection_id = ?', [req.params.id]);
    for (const emoji of emojis) {
      await deleteFromMinio(emoji.minio_key);
    }

    // 级联删除会自动清理 emojis 表
    await pool.execute('DELETE FROM collections WHERE id = ?', [req.params.id]);

    res.json({ success: true });
  } catch (err) {
    console.error('删除合集失败:', err);
    res.status(500).json({ error: '删除失败' });
  }
});

// ============ 表情包 API ============

// 批量上传表情包到合集
app.post('/api/collections/:collectionId/emojis', authMiddleware, upload.array('emojis', 100), async (req, res) => {
  try {
    const { collectionId } = req.params;

    // 验证合集属于当前用户
    const [collections] = await pool.execute('SELECT * FROM collections WHERE id = ? AND user_id = ?', [collectionId, req.user.id]);
    if (collections.length === 0) {
      return res.status(404).json({ error: '合集不存在' });
    }

    const newEmojis = [];
    // 生成时间戳前缀 如 20260327
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;

    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const emojiId = uuidv4().slice(0, 8);
      const ext = path.extname(file.originalname) || '.png';
      const minioKey = `emoji/${req.user.id}/${collectionId}/${emojiId}${ext}`;
      // 显示名：时间戳_序号.扩展名，如 20260327_001.jpg
      const displayName = `${dateStr}_${String(i + 1).padStart(3, '0')}${ext}`;

      // 上传到 MinIO
      const url = await uploadToMinio(file.buffer, minioKey, file.mimetype);

      // 写入数据库
      await pool.execute(
        'INSERT INTO emojis (id, collection_id, filename, original_name, size, mimetype, minio_key, url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [emojiId, collectionId, `${emojiId}${ext}`, displayName, file.size, file.mimetype, minioKey, url]
      );

      newEmojis.push({
        id: emojiId,
        filename: `${emojiId}${ext}`,
        original_name: displayName,
        size: file.size,
        mimetype: file.mimetype,
        minio_key: minioKey,
        url
      });
    }

    const [countResult] = await pool.execute('SELECT COUNT(*) as total FROM emojis WHERE collection_id = ?', [collectionId]);

    res.json({ success: true, emojis: newEmojis, total: countResult[0].total });
  } catch (err) {
    console.error('上传失败:', err);
    res.status(500).json({ error: '上传失败' });
  }
});

// 删除表情包
app.delete('/api/collections/:collectionId/emojis/:emojiId', authMiddleware, async (req, res) => {
  try {
    const { collectionId, emojiId } = req.params;

    // 验证合集属于当前用户
    const [collections] = await pool.execute('SELECT * FROM collections WHERE id = ? AND user_id = ?', [collectionId, req.user.id]);
    if (collections.length === 0) {
      return res.status(404).json({ error: '合集不存在' });
    }

    const [emojis] = await pool.execute('SELECT * FROM emojis WHERE id = ? AND collection_id = ?', [emojiId, collectionId]);
    if (emojis.length === 0) {
      return res.status(404).json({ error: '表情包不存在' });
    }

    // 删除 MinIO 文件
    await deleteFromMinio(emojis[0].minio_key);

    // 删除数据库记录
    await pool.execute('DELETE FROM emojis WHERE id = ?', [emojiId]);

    res.json({ success: true });
  } catch (err) {
    console.error('删除失败:', err);
    res.status(500).json({ error: '删除失败' });
  }
});

// 批量打包下载（无需登录，分享页面可用）
app.get('/api/collections/:id/download', async (req, res) => {
  try {
    const [collections] = await pool.execute('SELECT * FROM collections WHERE id = ?', [req.params.id]);
    if (collections.length === 0) {
      return res.status(404).json({ error: '合集不存在' });
    }

    const collection = collections[0];
    const [emojis] = await pool.execute('SELECT * FROM emojis WHERE collection_id = ?', [collection.id]);

    if (emojis.length === 0) {
      return res.status(404).json({ error: '合集中没有表情包' });
    }

    // 更新下载次数
    await pool.execute('UPDATE collections SET download_count = download_count + 1 WHERE id = ?', [collection.id]);

    // 创建 ZIP
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(collection.name)}.zip"`);

    const archive = archiver('zip', { zlib: { level: 5 } });
    archive.pipe(res);

    for (const emoji of emojis) {
      try {
        const fileStream = await getMinioStream(emoji.minio_key);
        archive.append(fileStream, { name: emoji.original_name || emoji.filename });
      } catch (err) {
        console.error(`获取文件失败: ${emoji.minio_key}`, err.message);
      }
    }

    await archive.finalize();
  } catch (err) {
    console.error('下载失败:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: '下载失败' });
    }
  }
});

// 单个表情包下载
app.get('/api/collections/:collectionId/emojis/:emojiId/download', async (req, res) => {
  try {
    const { collectionId, emojiId } = req.params;

    const [emojis] = await pool.execute('SELECT * FROM emojis WHERE id = ? AND collection_id = ?', [emojiId, collectionId]);
    if (emojis.length === 0) {
      return res.status(404).json({ error: '表情包不存在' });
    }

    const emoji = emojis[0];
    const fileStream = await getMinioStream(emoji.minio_key);

    res.setHeader('Content-Type', emoji.mimetype);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(emoji.original_name || emoji.filename)}"`);
    fileStream.pipe(res);
  } catch (err) {
    console.error('下载失败:', err);
    res.status(500).json({ error: '下载失败' });
  }
});

// 生成分享链接
app.get('/api/collections/:id/share', authMiddleware, async (req, res) => {
  try {
    const [collections] = await pool.execute('SELECT * FROM collections WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (collections.length === 0) {
      return res.status(404).json({ error: '合集不存在' });
    }

    const collection = collections[0];
    const [countResult] = await pool.execute('SELECT COUNT(*) as count FROM emojis WHERE collection_id = ?', [collection.id]);

    // 使用前端地址生成分享链接
    const frontendUrl = process.env.FRONTEND_URL || req.get('origin') || req.get('referer')?.replace(/\/+$/, '') || `${req.protocol}://${req.get('host')}`;
    const shareUrl = `${frontendUrl}/share/${req.params.id}`;

    res.json({
      success: true,
      shareUrl,
      collection: {
        name: collection.name,
        count: countResult[0].count,
        description: collection.description
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '获取分享信息失败' });
  }
});

// ============ 错误处理 ============

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: '文件大小超过 10MB 限制' });
    }
    return res.status(400).json({ error: err.message });
  }
  console.error(err);
  res.status(500).json({ error: err.message || '服务器内部错误' });
});

// ============ 启动服务 ============

async function start() {
  try {
    await initDB();
    await initMinio();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 表情包搬家助手后端服务运行在 http://0.0.0.0:${PORT}`);
    });
  } catch (err) {
    console.error('❌ 启动失败:', err);
    process.exit(1);
  }
}

start();

