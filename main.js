const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const WebSocket = require('ws');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 300,
    resizable: false,
    alwaysOnTop: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    }
  });
  mainWindow.setMenu(null);
  mainWindow.loadFile('index.html');
}

function createPopupWindow(gifName) {
  const display = screen.getPrimaryDisplay();
  const width = 300;
  const height = 300;

  const popupWindow = new BrowserWindow({
    width,
    height,
    x: Math.floor((display.bounds.width - width) / 2),
    y: Math.floor((display.bounds.height - height) / 2),
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    hasShadow: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    }
  });

  popupWindow.setMenu(null);
  popupWindow.loadFile('popup.html');

  popupWindow.once('ready-to-show', () => {
    popupWindow.webContents.send('show-gif', gifName);
    popupWindow.show();
  });

  setTimeout(() => {
    if (!popupWindow.isDestroyed()) popupWindow.close();
  }, 5000);
}

app.whenReady().then(() => {
  createWindow();

  const wss = new WebSocket.Server({ port: 3000 });
  console.log('WebSocket Server running at ws://localhost:3000');

  wss.on('connection', (ws) => {
    ws.on('message', (msg) => {
      const data = JSON.parse(msg.toString());
      if (data.type === 'show_gif') {
        console.log('📥 Received:', data.gif);
        createPopupWindow(data.gif);
      }
    });
  });

  const selfClient = new WebSocket('ws://localhost:3000');
  selfClient.on('message', (msg) => {
    const data = JSON.parse(msg.toString());
    if (data.type === 'show_gif') {
      console.log('📥 Received from self:', data.gif);
      createPopupWindow(data.gif);
    }
  });

  ipcMain.on('send-to-ip', (event, data) => {
    const { ip, gif } = data;
    const ws = new WebSocket(`ws://${ip}:3000`);
    ws.on('open', () => {
      ws.send(JSON.stringify({ type: 'show_gif', gif }));
      ws.close();
    });
    ws.on('error', (err) => {
      console.error('❌ ส่งไม่สำเร็จ:', err.message);
    });
  });
});

ipcMain.on('show-gif-local', (event, gif) => {
  createPopupWindow(gif);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
