const { app, BrowserWindow, shell, Menu, dialog, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const net = require("net");
const { spawn, execFile } = require("child_process");
const { autoUpdater } = require("electron-updater");

const isDev = !app.isPackaged;
const DEV_URL = "http://localhost:3000";

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
  process.exit(0);
}

let mainWindow = null;
let setupWindow = null;
let nextServer = null;
let serverUrl = DEV_URL;

const userDataDir = app.getPath("userData");
const venvDir = path.join(userDataDir, "venv");
const venvPython = path.join(venvDir, "bin", "python3");

[
  path.join(userDataDir, "data"),
  path.join(userDataDir, "notes"),
  path.join(userDataDir, "uploads"),
].forEach((d) => fs.mkdirSync(d, { recursive: true }));

function which(cmd) {
  return new Promise((resolve) => {
    execFile("/usr/bin/which", [cmd], {
      env: { ...process.env, PATH: `/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:${process.env.PATH || ""}` },
    }, (err, stdout) => {
      resolve(err ? null : stdout.trim() || null);
    });
  });
}

function findFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.unref();
    srv.on("error", reject);
    srv.listen(0, "127.0.0.1", () => {
      const port = srv.address().port;
      srv.close(() => resolve(port));
    });
  });
}

function waitForServer(url, timeoutMs = 30000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tick = () => {
      const req = require("http").get(url, (res) => {
        res.resume();
        resolve();
      });
      req.on("error", () => {
        if (Date.now() - start > timeoutMs) {
          reject(new Error("Next.js server did not start in time"));
        } else {
          setTimeout(tick, 200);
        }
      });
    };
    tick();
  });
}

function showSetupWindow() {
  setupWindow = new BrowserWindow({
    width: 560,
    height: 460,
    resizable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    title: "Wander Video Noter — Setup",
    backgroundColor: "#0f0f10",
    titleBarStyle: "hiddenInset",
    icon: isDev ? undefined : path.join(process.resourcesPath, "icon.png"),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
  setupWindow.loadFile(path.join(__dirname, "setup.html"));
  return setupWindow;
}

function postProgress(percent, message) {
  if (setupWindow && !setupWindow.isDestroyed()) {
    setupWindow.webContents.send("setup:progress", { percent, message });
  }
}

function postError(kind, message) {
  if (setupWindow && !setupWindow.isDestroyed()) {
    setupWindow.webContents.send("setup:error", { kind, message });
  }
}

function runCmd(cmd, args, env = process.env) {
  return new Promise((resolve) => {
    const proc = spawn(cmd, args, { env });
    let out = "";
    proc.stdout.on("data", (b) => {
      const s = b.toString();
      out += s;
      const lastLine = s.split("\n").filter(Boolean).pop();
      if (lastLine) postProgress(undefined, lastLine.slice(0, 80));
    });
    proc.stderr.on("data", (b) => { out += b.toString(); });
    proc.on("exit", (code) => resolve({ code: code ?? 1, out }));
    proc.on("error", (err) => resolve({ code: 1, out: err.message }));
  });
}

async function ensurePythonEnvironment() {
  // Already set up?
  if (fs.existsSync(venvPython)) return { ok: true };

  showSetupWindow();
  await new Promise((r) => setupWindow.webContents.once("did-finish-load", r));

  postProgress(5, "Hľadám python3 a ffmpeg...");
  const sysPython = await which("python3");
  const sysFfmpeg = await which("ffmpeg");

  if (!sysPython || !sysFfmpeg) {
    const missing = [];
    if (!sysPython) missing.push("python3");
    if (!sysFfmpeg) missing.push("ffmpeg");
    postError("missing_deps", `Chýba: ${missing.join(", ")}. Nainštaluj ich cez Homebrew:`);
    return { ok: false };
  }

  postProgress(15, "Vytváram Python virtuálne prostredie...");
  const venv = await runCmd(sysPython, ["-m", "venv", venvDir]);
  if (venv.code !== 0) {
    postError("venv_failed", "python3 -m venv zlyhal:\n" + venv.out.slice(-400));
    return { ok: false };
  }

  postProgress(30, "Aktualizujem pip...");
  await runCmd(path.join(venvDir, "bin", "pip"), ["install", "--upgrade", "pip"]);

  postProgress(40, "Inštalujem pipeline závislosti (~1-2 min)...");
  const reqPath = isDev
    ? path.join(process.cwd(), "python", "requirements.txt")
    : path.join(process.resourcesPath, "app", "python", "requirements.txt");
  const pip = await runCmd(path.join(venvDir, "bin", "pip"), ["install", "-r", reqPath]);
  if (pip.code !== 0) {
    postError("pip_failed", "pip install zlyhal:\n" + pip.out.slice(-400));
    return { ok: false };
  }

  postProgress(100, "Hotovo!");
  await new Promise((r) => setTimeout(r, 600));
  if (setupWindow && !setupWindow.isDestroyed()) setupWindow.close();
  setupWindow = null;
  return { ok: true };
}

async function startProductionServer() {
  const resourcesPath = process.resourcesPath;
  const standalone = path.join(resourcesPath, "app", "standalone");
  const serverEntry = path.join(standalone, "server.js");
  if (!fs.existsSync(serverEntry)) {
    throw new Error(`Standalone server not found at ${serverEntry}`);
  }

  const port = await findFreePort();
  const env = {
    ...process.env,
    ELECTRON_RUN_AS_NODE: "1",
    PORT: String(port),
    HOSTNAME: "127.0.0.1",
    NODE_ENV: "production",
    WANDER_DATA_DIR: userDataDir,
    WANDER_PIPELINE_SCRIPT: path.join(resourcesPath, "app", "python", "video_notes.py"),
    PATH: `${path.join(venvDir, "bin")}:/opt/homebrew/bin:/usr/local/bin:${process.env.PATH || ""}`,
  };

  nextServer = spawn(process.execPath, [serverEntry], {
    cwd: standalone,
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });

  nextServer.stdout.on("data", (b) => process.stdout.write("[next] " + b.toString()));
  nextServer.stderr.on("data", (b) => process.stderr.write("[next] " + b.toString()));
  nextServer.on("exit", (code) => {
    if (code !== 0 && mainWindow) {
      dialog.showErrorBox("Next.js server crashed", `Exit code: ${code}`);
    }
  });

  serverUrl = `http://127.0.0.1:${port}`;
  await waitForServer(serverUrl);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: "Wander Video Noter",
    backgroundColor: "#0f0f10",
    icon: isDev ? undefined : path.join(process.resourcesPath, "icon.png"),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  mainWindow.loadURL(serverUrl);
  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: "detach" });
  }
}

ipcMain.on("setup:retry", async () => {
  if (setupWindow && !setupWindow.isDestroyed()) setupWindow.close();
  setupWindow = null;
  app.relaunch();
  app.exit(0);
});

// ─── Auto-updater ─────────────────────────────────────────────────────────
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = false;
autoUpdater.allowPrerelease = false;
autoUpdater.logger = { info: console.log, warn: console.warn, error: console.error, debug: () => {} };

function emitUpdaterEvent(payload) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("updater:event", payload);
  }
}

autoUpdater.on("checking-for-update", () => emitUpdaterEvent({ type: "checking" }));
autoUpdater.on("update-available", (info) => emitUpdaterEvent({ type: "available", version: info.version, releaseNotes: info.releaseNotes, releaseDate: info.releaseDate }));
autoUpdater.on("update-not-available", (info) => emitUpdaterEvent({ type: "not-available", version: info.version }));
autoUpdater.on("download-progress", (p) => emitUpdaterEvent({ type: "progress", percent: p.percent, bytesPerSecond: p.bytesPerSecond, transferred: p.transferred, total: p.total }));
autoUpdater.on("update-downloaded", (info) => emitUpdaterEvent({ type: "downloaded", version: info.version }));
autoUpdater.on("error", (err) => emitUpdaterEvent({ type: "error", message: err.message || String(err) }));

ipcMain.handle("app:version", () => app.getVersion());

ipcMain.handle("updater:check", async () => {
  if (isDev) return { ok: false, reason: "dev_mode", message: "Update check disabled in dev mode." };
  try {
    const result = await autoUpdater.checkForUpdates();
    return { ok: true, version: result?.updateInfo?.version, available: !!result?.updateInfo };
  } catch (err) {
    return { ok: false, message: err.message || String(err) };
  }
});

ipcMain.handle("updater:download", async () => {
  if (isDev) return { ok: false, reason: "dev_mode" };
  try {
    await autoUpdater.downloadUpdate();
    return { ok: true };
  } catch (err) {
    return { ok: false, message: err.message || String(err) };
  }
});

ipcMain.handle("updater:install", () => {
  setImmediate(() => {
    autoUpdater.quitAndInstall(true, true);
  });
  return { ok: true };
});

app.on("second-instance", () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.whenReady().then(async () => {
  if (process.platform === "darwin") {
    const template = [
      { role: "appMenu" },
      { role: "editMenu" },
      {
        label: "View",
        submenu: [
          { role: "reload" },
          { role: "forceReload" },
          { role: "toggleDevTools" },
          { type: "separator" },
          { role: "resetZoom" },
          { role: "zoomIn" },
          { role: "zoomOut" },
          { type: "separator" },
          { role: "togglefullscreen" },
        ],
      },
      { role: "windowMenu" },
    ];
    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
  }

  if (!isDev) {
    const setup = await ensurePythonEnvironment();
    if (!setup.ok) return; // setup window stays open with error
    try {
      await startProductionServer();
    } catch (err) {
      dialog.showErrorBox("Server failed to start", err.message || String(err));
      app.quit();
      return;
    }
  }

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (nextServer) {
    try { nextServer.kill(); } catch { /* ignore */ }
  }
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  if (nextServer) {
    try { nextServer.kill(); } catch { /* ignore */ }
  }
});
