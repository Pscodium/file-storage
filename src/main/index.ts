/* eslint-disable no-empty-pattern */
import { electronApp, is, optimizer } from '@electron-toolkit/utils';
import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron';
import { autoUpdater } from 'electron-updater';
import * as fs from 'fs';
import * as https from 'https';
import { join } from 'path';
import icon from '../../resources/favicon.png?asset';

// Configurar auto updater
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

function createWindow(): void {
    const mainWindow = new BrowserWindow({
        width: 900,
        height: 670,
        show: false,
        frame: false,
        autoHideMenuBar: true,
        icon,
        webPreferences: {
            contextIsolation: true,
            navigateOnDragDrop: true,
            preload: join(__dirname, '../preload/index.js'),
            sandbox: false,
        },
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
    } else {
        mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
    }

    ipcMain.on('window-control', ({ }, action) => {
        switch (action) {
            case 'minimize':
                mainWindow.minimize();
                break;
            case 'maximize':
                if (mainWindow.isMaximized()) {
                    mainWindow.unmaximize();
                } else {
                    mainWindow.maximize();
                }
                break;
            case 'close':
                mainWindow.close();
                break;
            default:
                break;
        }
    });

    ipcMain.handle('select-save-path', async (_event, { suggestedName }: { suggestedName?: string }) => {
        const result = await dialog.showSaveDialog(mainWindow, {
            defaultPath: suggestedName,
        });
        if (result.canceled) return null;
        return result.filePath;
    });

    ipcMain.handle('start-download', async (event, { id, url, filePath }: { id: string; url: string; filePath: string }) => {
        return new Promise((resolve, reject) => {
            const fileStream = fs.createWriteStream(filePath);
            const request = https.get(url, (res) => {
                if (res.statusCode && res.statusCode >= 400) {
                    fileStream.close();
                    fs.unlink(filePath, () => { });
                    const msg = `HTTP ${res.statusCode}`;
                    event.sender.send('download-error', { id, error: msg });
                    reject(new Error(msg));
                    return;
                }

                const total = Number(res.headers['content-length'] || 0);
                let received = 0;

                res.on('data', (chunk: Buffer) => {
                    received += chunk.length;
                    const progress = total > 0 ? Math.min(100, Math.round((received / total) * 100)) : Math.min(95, Math.round((received / (1024 * 1024)) % 100));
                    event.sender.send('download-progress', { id, progress });
                });

                res.on('end', () => {
                    fileStream.close();
                    event.sender.send('download-complete', { id, filePath });
                    resolve(true);
                });

                res.on('error', (err) => {
                    fileStream.close();
                    fs.unlink(filePath, () => { });
                    event.sender.send('download-error', { id, error: err.message });
                    reject(err);
                });

                res.pipe(fileStream);
            });

            request.on('error', (err) => {
                fileStream.close();
                fs.unlink(filePath, () => { });
                event.sender.send('download-error', { id, error: err.message });
                reject(err);
            });
        });
    });

    ipcMain.handle('show-in-folder', async (_event, { filePath }: { filePath: string }) => {
        if (filePath) {
            shell.showItemInFolder(filePath);
            return true;
        }
        return false;
    });
}

app.whenReady().then(() => {
    electronApp.setAppUserModelId('com.electron');

    app.on('browser-window-created', (_, window) => {
        optimizer.watchWindowShortcuts(window);
    });

    createWindow();

    // Verificar atualizações após 3 segundos
    setTimeout(() => {
        autoUpdater.checkForUpdates();
    }, 3000);

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

// Eventos do Auto Updater
autoUpdater.on('checking-for-update', () => {
    console.log('Verificando atualizações...');
});

autoUpdater.on('update-available', (info) => {
    console.log('Atualização disponível:', info.version);
    const windows = BrowserWindow.getAllWindows();
    if (windows.length > 0) {
        windows[0].webContents.send('update-available', info);
    }
});

autoUpdater.on('update-not-available', (info) => {
    console.log('Nenhuma atualização disponível:', info.version);
});

autoUpdater.on('error', (err) => {
    console.error('Erro na atualização:', err);
    const windows = BrowserWindow.getAllWindows();
    if (windows.length > 0) {
        windows[0].webContents.send('update-error', err.message);
    }
});

autoUpdater.on('download-progress', (progressObj) => {
    const windows = BrowserWindow.getAllWindows();
    if (windows.length > 0) {
        windows[0].webContents.send('update-download-progress', progressObj);
    }
});

autoUpdater.on('update-downloaded', (info) => {
    console.log('Atualização baixada:', info.version);
    const windows = BrowserWindow.getAllWindows();
    if (windows.length > 0) {
        windows[0].webContents.send('update-downloaded', info);
    }
});

// IPC handlers para controle de atualização
ipcMain.handle('download-update', async () => {
    try {
        await autoUpdater.downloadUpdate();
        return { success: true };
    } catch (error) {
        console.error('Erro ao baixar atualização:', error);
        return { success: false, error: (error as Error).message };
    }
});

ipcMain.handle('install-update', () => {
    autoUpdater.quitAndInstall(false, true);
});

ipcMain.handle('check-for-updates', async () => {
    try {
        const result = await autoUpdater.checkForUpdates();
        return { success: true, updateInfo: result?.updateInfo };
    } catch (error) {
        console.error('Erro ao verificar atualizações:', error);
        return { success: false, error: (error as Error).message };
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
