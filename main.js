const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const si = require('systeminformation');
const os = require('os');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 600,
    height: 700,
    minWidth: 500,
    minHeight: 600,
    frame: false,
    center: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  mainWindow.loadFile('index.html');
  mainWindow.setMenu(null);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

let systemInfoCache = null;
let systemInfoCacheTime = 0;

async function getSystemInfo() {
  const now = Date.now();
  if (systemInfoCache && (now - systemInfoCacheTime) < 5000) {
    return systemInfoCache;
  }
  
  const osInfo = await si.osInfo();
  systemInfoCache = {
    hostname: os.hostname(),
    platform: osInfo.distro,
    osVersion: osInfo.release,
    arch: os.arch(),
    uptime: os.uptime()
  };
  systemInfoCacheTime = now;
  return systemInfoCache;
}

let processCache = { list: [], time: 0 };

async function getTopProcesses(memTotal) {
  const now = Date.now();
  if (processCache.list.length > 0 && (now - processCache.time) < 2000) {
    return processCache.list;
  }
  
  const processes = await si.processes();
  processCache.list = processes.list
    .sort((a, b) => b.cpu - a.cpu)
    .slice(0, 5)
    .map(p => ({
      name: p.name.substring(0, 30),
      cpu: p.cpu.toFixed(1),
      mem: (p.mem * memTotal / 100 / (1024 * 1024 * 1024)).toFixed(1)
    }));
  processCache.time = now;
  return processCache.list;
}

let lastNetworkStats = { rx: 0, tx: 0, time: 0 };
let networkHistory = [];

async function collectStats() {
  if (!mainWindow || mainWindow.isDestroyed()) return;

  try {
    const [cpuLoad, cpuFreq, mem, disk, network, temps] = await Promise.all([
      si.currentLoad(),
      si.cpuCurrentSpeed(),
      si.mem(),
      si.fsSize(),
      si.networkStats(),
      si.cpuTemperature().catch(() => ({ main: null }))
    ]);

    const primaryNetwork = network.find(n => n.operstate === 'up') || network[0];
    const primaryDisk = disk.find(d => d.mount === 'C:') || disk[0];
    
    let rxSpeed = 0, txSpeed = 0;
    if (primaryNetwork) {
      const now = Date.now();
      const timeDiff = (now - lastNetworkStats.time) / 1000 || 1;
      rxSpeed = primaryNetwork.rx_sec > 0 ? (primaryNetwork.rx_sec / 1024).toFixed(1) : '0';
      txSpeed = primaryNetwork.tx_sec > 0 ? (primaryNetwork.tx_sec / 1024).toFixed(1) : '0';
      lastNetworkStats = { rx: primaryNetwork.rx, tx: primaryNetwork.tx, time: now };
    }

    const topProcesses = await getTopProcesses(mem.total);
    const systemInfo = await getSystemInfo();

    const stats = {
      cpu: {
        load: Math.round(cpuLoad.currentLoad),
        cores: cpuLoad.cpus.map(c => Math.round(c.load)),
        freq: cpuFreq.avg || 0,
        maxFreq: cpuFreq.max || 0,
        temp: temps.main
      },
      memory: {
        used: (mem.used / (1024 ** 3)).toFixed(1),
        total: (mem.total / (1024 ** 3)).toFixed(1),
        available: (mem.available / (1024 ** 3)).toFixed(1),
        cached: (mem.cached / (1024 ** 3)).toFixed(1)
      },
      disk: disk.map(d => ({
        mount: d.mount,
        used: (d.used / (1024 ** 3)).toFixed(1),
        total: (d.size / (1024 ** 3)).toFixed(1),
        usePercent: Math.round(d.use)
      })),
      network: {
        rx: rxSpeed,
        tx: txSpeed,
        totalRx: primaryNetwork ? (primaryNetwork.rx / (1024 ** 3)).toFixed(2) : '0',
        totalTx: primaryNetwork ? (primaryNetwork.tx / (1024 ** 3)).toFixed(2) : '0'
      },
      system: systemInfo,
      topProcesses
    };

    mainWindow.webContents.send('stats', stats);
  } catch (err) {
    console.error('Error fetching stats:', err);
  }
}

setInterval(collectStats, 1000);

ipcMain.on('minimize-window', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('maximize-window', () => {
  if (mainWindow) {
    mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize();
  }
});

ipcMain.on('close-window', () => {
  if (mainWindow) mainWindow.close();
});

ipcMain.handle('is-maximized', () => {
  return mainWindow ? mainWindow.isMaximized() : false;
});
