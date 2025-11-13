import { app, BrowserWindow } from 'electron';
import path from 'path';
import { spawn } from 'child_process';

const MAIN_WINDOW_VITE_DEV_SERVER_URL = process.env.NODE_ENV === 'development' ? 'http://localhost:5173' : undefined;
const MAIN_WINDOW_VITE_NAME = 'main_window';
const MAIN_WINDOW_PRELOAD_VITE_ENTRY = path.join(__dirname, 'preload.js');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      // The preload script is injected by the Vite plugin
      preload: MAIN_WINDOW_PRELOAD_VITE_ENTRY,
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  // Start the backend server
  let serverProcess;
  const env = { ...process.env, NODE_ENV: 'production' };
  if (app.isPackaged) {
    const serverPath = path.join(process.resourcesPath, 'server', 'server.js');
    console.log('Packaged app: Starting server from:', serverPath);
    console.log('process.resourcesPath:', process.resourcesPath);
    serverProcess = spawn('node', [serverPath], { stdio: 'inherit', env });
  } else {
    const serverPath = path.join(__dirname, '..', '..', 'dist', 'server', 'server.js');
    console.log('Dev app: Starting server from:', serverPath);
    serverProcess = spawn('node', [serverPath], { stdio: 'inherit', env });
  }

  serverProcess.on('error', (err) => {
    console.error('Failed to start server process:', err);
  });

  serverProcess.on('exit', (code, signal) => {
    console.log(`Server process exited with code ${code} and signal ${signal}`);
  });

  // Log server stdout and stderr
  serverProcess.stdout?.on('data', (data) => {
    console.log('Server stdout:', data.toString());
  });
  serverProcess.stderr?.on('data', (data) => {
    console.error('Server stderr:', data.toString());
  });

  app.on('before-quit', () => {
    if (serverProcess) {
      serverProcess.kill();
    }
  });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
