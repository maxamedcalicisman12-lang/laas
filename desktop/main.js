const { app, BrowserWindow, Menu, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const net = require('net');

// Must be first: prevent duplicate instances racing on ports/files
if (!app.requestSingleInstanceLock()) app.quit();

const isPackaged = app.isPackaged;

const paths = isPackaged
  ? {
      seedDb: path.join(process.resourcesPath, 'seed', 'database.sqlite'),
      seedStorage: path.join(process.resourcesPath, 'seed', 'storage'),
      frontendDist: path.join(process.resourcesPath, 'frontend-dist'),
      backendServer: path.join(process.resourcesPath, 'backend', 'src', 'server'),
    }
  : {
      seedDb: path.join(__dirname, 'seed', 'database.sqlite'),
      seedStorage: path.join(__dirname, 'seed', 'storage'),
      frontendDist: path.join(__dirname, '..', 'frontend', 'dist'),
      backendServer: path.join(__dirname, '..', 'backend', 'src', 'server'),
    };

function getFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.unref();
    srv.on('error', reject);
    srv.listen(0, '127.0.0.1', () => {
      const port = srv.address().port;
      srv.close(() => resolve(port));
    });
  });
}

// Prefer a fixed port so the app's origin (and thus localStorage settings like
// theme, language and accent color) stays stable between launches.
const PREFERRED_PORT = parseInt(process.env.LAAS_PORT || '51778', 10);

async function resolvePort() {
  for (let candidate = PREFERRED_PORT; candidate < PREFERRED_PORT + 25; candidate++) {
    const free = await new Promise((resolve) => {
      const probe = net.createServer();
      probe.once('error', () => resolve(false));
      probe.listen(candidate, '127.0.0.1', () =>
        probe.close(() => resolve(true))
      );
    });
    if (free) return candidate;
  }
  return getFreePort();
}

function copyMissing(src, dest) {
  if (!fs.existsSync(src)) return;
  const st = fs.statSync(src);
  if (st.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copyMissing(path.join(src, entry), path.join(dest, entry));
    }
  } else if (!fs.existsSync(dest)) {
    fs.copyFileSync(src, dest);
  }
}

async function createWindow() {
  const dataDir = path.join(app.getPath('userData'), 'data');
  fs.mkdirSync(dataDir, { recursive: true });

  const logFile = path.join(dataDir, 'app.log');
  const log = (...args) => {
    try {
      fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${args.join(' ')}\n`);
    } catch {}
  };
  process.on('uncaughtException', (err) => {
    log('UNCAUGHT:', err.stack || err.message);
    throw err;
  });

  log('Starting...', 'packaged:', isPackaged);

  // Guard against incomplete portable extraction (antivirus or interrupted
  // unpack can leave resources/frontend-dist behind in the temp folder)
  const indexHtml = path.join(paths.frontendDist, 'index.html');
  if (!fs.existsSync(indexHtml)) {
    log('MISSING FRONTEND:', indexHtml);
    dialog.showErrorBox(
      'LAAS Real Estate',
      'App-ka si buuxa looma ansixin karin (faylalka waa dhameeyaan).\n\nFadlan xir app-ka oo mar labaad fur. Haddii ay mar kale khaldato, isticmaal LAAS-Real-Estate-Setup.exe si loo rakibo si joogto ah.'
    );
    app.exit(1);
    return;
  }

  // Splash screen shown instantly so the user knows the app is loading
  const splash = new BrowserWindow({
    width: 380,
    height: 220,
    frame: false,
    resizable: false,
    transparent: false,
    backgroundColor: '#1c5197',
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: { contextIsolation: true, nodeIntegration: false },
  });
  splash.loadURL(
    'data:text/html;charset=utf-8,' +
      encodeURIComponent(`<!DOCTYPE html><html><body style="margin:0;height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#1c5197;color:#fff;font-family:system-ui,sans-serif"><div style="font-size:26px;font-weight:bold;letter-spacing:2px">LAAS <span style="color:#f59e0b">Real Estate</span></div><div style="margin-top:18px;font-size:14px;opacity:.85">App-ka wuu soo galayaa...</div><div style="margin-top:14px;width:180px;height:4px;background:#ffffff33;border-radius:2px;overflow:hidden"><div style="width:40%;height:100%;background:#f59e0b;border-radius:2px;animation:l 1.2s infinite"></div></div><style>@keyframes l{0%{transform:translateX(-100%)}100%{transform:translateX(350%)}}</style></body></html>`)
  );

  // First-run: seed the database and storage files (never overwrite user data)
  const dbFile = path.join(dataDir, 'database.sqlite');
  copyMissing(paths.seedDb, dbFile);
  copyMissing(paths.seedStorage, path.join(dataDir, 'storage'));

  process.env.DB_PATH = dbFile;
  process.env.STORAGE_PATH = path.join(dataDir, 'storage');
  process.env.JWT_SECRET = 'laas-real-estate-jwt-secret-change-in-production';
  process.env.FRONTEND_DIST = paths.frontendDist;

  const port = await resolvePort();
  process.env.PORT = String(port);

  let server;
  try {
    ({ app: server } = require(paths.backendServer));
  } catch (err) {
    log('BACKEND REQUIRE FAILED:', err.stack || err.message);
    throw err;
  }
  await new Promise((resolve) => server.listen(port, '127.0.0.1', resolve));
  log('Server listening on port', port);

  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'icon.png'),
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.once('ready-to-show', () => {
    splash.destroy();
    win.show();
    log('Window shown');
  });
  win.loadURL(`http://127.0.0.1:${port}/`);
}

Menu.setApplicationMenu(null);
app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
app.on('second-instance', () => {
  const [win] = BrowserWindow.getAllWindows();
  if (win) {
    if (win.isMinimized()) win.restore();
    win.focus();
  }
});
