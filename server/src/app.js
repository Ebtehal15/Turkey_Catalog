require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { initializeDatabase, db } = require('./db');
const classesRouter = require('./routes/classes');
const { router: settingsRouter } = require('./routes/settings');
const cartRouter = require('./routes/cart');
const ordersRouter = require('./routes/orders');

// 🔹 Veritabanını başlat
initializeDatabase();

const app = express();

// 🔹 Genel Middleware
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  // Render/Reverse-proxy arkasında secure cookie için gerekli
  app.set('trust proxy', 1);
}

// CORS yapılandırması
const corsOptions = {
  origin: function (origin, callback) {
    const allowAll = process.env.CORS_ALLOW_ALL === 'true';

    // Development'ta (veya allowAll açıkken) tüm origin'lere izin ver
    if (!isProduction || allowAll) {
      callback(null, true);
    } else {
      // Production'da sadece env ile verilen origin'lere izin ver
      const allowedOrigins = (process.env.CORS_ORIGINS || '')
        .split(',')
        .map((value) => value.trim().replace(/\/+$/, '')) // sonundaki / kaldır
        .filter(Boolean);

      if (allowedOrigins.length === 0) {
        console.warn('⚠️ CORS_ORIGINS boş; frontend origin’lerine izin vermek için CORS_ORIGINS env’ini ayarlayın.');
      }

      // Tarayıcı bazen origin’i sonunda / ile göndermez; karşılaştırmada normalize et
      const originNormalized = (origin || '').replace(/\/+$/, '');
      const allowed = !origin || allowedOrigins.some((o) => o === origin || o === originNormalized);

      if (allowed) {
        callback(null, true);
      } else {
        console.warn('⚠️ CORS blocked origin:', origin, '| İzin verilenler:', allowedOrigins);
        callback(new Error('CORS policy violation'));
      }
    }
  },
  credentials: true, // Session cookie'leri için kritik
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🔹 Session Middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'cillii-super-secret-key-2024',
  resave: false, // Session'ı sadece değiştiğinde kaydet
  saveUninitialized: true, // Boş session'ları da kaydet
  rolling: false, // Cookie süresini sabit tut
  name: 'connect.sid', // Standart session name
  proxy: isProduction,
  cookie: {
    secure: isProduction, // HTTPS üzerinde zorunlu (Render)
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 saat
    // Frontend (Static Site) ve Backend (Web Service) ayrı domain olduğunda cookie için gerekir
    sameSite: isProduction ? 'none' : 'lax',
    domain: undefined, // Auto-detect domain
    path: '/', // Tüm path'lerde geçerli
  },
}));

// 🔍 Session Debug Middleware
if (process.env.SESSION_DEBUG === 'true') {
  app.use((req, _res, next) => {
    console.log('🔍 Session Debug:', {
      sessionID: req.sessionID,
      hasSession: !!req.session,
      cartExists: !!req.session?.cart,
      cartLength: req.session?.cart?.length || 0,
      userAgent: req.get('User-Agent')?.substring(0, 50),
      origin: req.get('Origin'),
      cookie: req.get('Cookie')?.substring(0, 100),
    });
    next();
  });
}

// 📁 Uploads klasör yolu
const uploadsPath = process.env.UPLOADS_DIR
  ? path.resolve(process.env.UPLOADS_DIR)
  : path.resolve(__dirname, '..', 'uploads');

if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

// ✅ Upload dosyalarını doğru header’larla servis et
app.use(
  '/uploads',
  cors(), // Cross-origin izin
  express.static(uploadsPath, {
    setHeaders(res, filePath) {
      // Doğru MIME tipi ayarla
      if (filePath.endsWith('.mp4')) {
        res.type('video/mp4');
      }

      // Cross-origin ve streaming izinleri
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
      res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
      res.setHeader('Accept-Ranges', 'bytes'); // Video seek işlemi
    },
  })
);

// ✅ Health check endpoint (Render için önemli)
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// ✅ WhatsApp / sosyal medya botları için OG meta (zengin link önizleme)
const BOT_UA =
  /WhatsApp|facebookexternalhit|Facebot|TelegramBot|Twitterbot|Slackbot|Discordbot|LinkedInBot|Pinterest|Applebot|Googlebot|bingbot/i;
app.get('/items/:identifier', (req, res, next) => {
  const ua = req.get('User-Agent') || '';
  if (!BOT_UA.test(ua)) return next();

  const { identifier } = req.params;
  const isNumeric = /^\d+$/.test(identifier);
  const query = isNumeric
    ? 'SELECT * FROM classes WHERE id = ?'
    : 'SELECT * FROM classes WHERE LOWER(special_id) = ?';
  const param = isNumeric ? identifier : identifier.toLowerCase();

  db.get(query, [param], (err, row) => {
    if (err || !row) return next();
    const title = row.class_name_ar || row.class_name_en || row.class_name;
    const desc = row.class_features || title;
    const canonical =
      (process.env.PUBLIC_APP_URL || req.protocol + '://' + req.get('host')) +
      '/items/' + encodeURIComponent(row.special_id) +
      '?standalone=1';
    let ogImage = '';
    const vid = row.class_video || '';
    const yt = vid.match(/(?:youtube\.com\/.*[?&]v=|youtu\.be\/)([^"&?/\s]{11})/i);
    if (yt) ogImage = `https://img.youtube.com/vi/${yt[1]}/hqdefault.jpg`;
    else {
      const sm = vid.match(/streamable\.com\/([a-z0-9]+)/i);
      if (sm) ogImage = `https://cdn-cf-east.streamable.com/image/${sm[1]}.jpg`;
    }
    const html = `<!DOCTYPE html><html><head>
<meta charset="utf-8">
<meta property="og:type" content="website" />
<meta property="og:title" content="${escapeHtml(row.special_id + ' - ' + title)}" />
<meta property="og:description" content="${escapeHtml(desc)}" />
<meta property="og:url" content="${escapeHtml(canonical)}" />
${ogImage ? `<meta property="og:image" content="${escapeHtml(ogImage)}" />` : ''}
<meta name="twitter:card" content="summary_large_image" />
</head><body><p><a href="${escapeHtml(canonical)}">${escapeHtml(title)}</a></p></body></html>`;
    res.type('html').send(html);
  });
});

function escapeHtml(s) {
  if (typeof s !== 'string') return '';
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ✅ API rotaları
app.use('/api/classes', classesRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/cart', cartRouter);
app.use('/api/orders', ordersRouter);

// ✅ Sunucuyu başlat
const port = process.env.PORT || 4000;
const host = process.env.HOST || '0.0.0.0'; // Tüm ağ arayüzlerinde dinle
app.listen(port, host, () => {
  console.log(`🚀 Server running on http://${host}:${port}`);
  console.log(`🌐 Accessible from external IPs on port ${port}`);
});

module.exports = app;
