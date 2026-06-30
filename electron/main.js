import { app, shell, BrowserWindow, Tray, Menu, globalShortcut, ipcMain } from 'electron';
import { join } from 'path';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import { registerDbHandlers } from './handlers/db';
import { registerAiHandlers } from './handlers/ai';
import { registerContentHandlers } from './handlers/content';
let tray = null;
function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 1024,
        minHeight: 600,
        show: false,
        autoHideMenuBar: true,
        title: 'WiseRain',
        webPreferences: {
            preload: join(__dirname, '../preload/index.js'),
            sandbox: false
        }
    });
    mainWindow.on('ready-to-show', () => {
        mainWindow.show();
    });
    mainWindow.webContents.setWindowOpenHandler((details) => {
        shell.openExternal(details.url);
        return { action: 'deny' };
    });
    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
        mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
    }
    else {
        mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
    }
}
function createTray(window) {
    tray = new Tray(join(__dirname, '../../renderer/assets/tray-icon.png'));
    const contextMenu = Menu.buildFromTemplate([
        { label: 'Open WiseRain', click: () => window.show() },
        { type: 'separator' },
        { label: 'Quit', click: () => app.quit() }
    ]);
    tray.setToolTip('WiseRain — English to C1/C2');
    tray.setContextMenu(contextMenu);
    tray.on('click', () => window.show());
}
function registerGlobalShortcuts() {
    // Ctrl+Shift+D — Clipboard capture for dictionary lookup
    globalShortcut.register('CommandOrControl+Shift+D', () => {
        const clipboard = require('electron').clipboard;
        const text = clipboard.readText('selection') || clipboard.readText('general');
        if (text && text.trim().length > 0) {
            ipcMain.emit('clipboard:capture', {}, text.trim());
        }
    });
}
// Clipboard IPC handler
ipcMain.handle('clipboard:capture', () => {
    const clipboard = require('electron').clipboard;
    return clipboard.readText('selection') || clipboard.readText('general') || '';
});
app.whenReady().then(() => {
    electronApp.setAppUserModelId('com.wiserain.app');
    app.on('browser-window-created', (_, window) => {
        optimizer.watchWindowShortcuts(window);
        createTray(window);
    });
    registerDbHandlers();
    registerAiHandlers();
    registerContentHandlers();
    createWindow();
    registerGlobalShortcuts();
    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0)
            createWindow();
    });
});
app.on('will-quit', () => {
    globalShortcut.unregisterAll();
});
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        tray?.destroy();
        app.quit();
    }
});
