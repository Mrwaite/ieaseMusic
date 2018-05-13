// app 控制应用程序的事件生命周期
// BrowserWindow 创建和控制浏览器窗口
// Menu 创建原生应用菜单和上下文菜单
// Tray 系统通知区域菜单
// 当应用程序没有键盘焦点时监听全局键盘事件
// ipcMain 从主进程到渲染进程的异步通信。
// shell 使用他们默认的应用管理文件和url, 主要用于浏览器打开新url窗口
// powerMonitor 监视电源状态变化
// dialog 显示用于打开和保存文件,警报的本机系统对话框
import { app, BrowserWindow, Menu, Tray, globalShortcut, ipcMain, shell, powerMonitor, dialog } from 'electron';
import windowStateKeeper from 'electron-window-state';
import storage from 'electron-json-storage';

// 使应用自动更新
import { autoUpdater } from 'electron-updater';
import axios from 'axios';
import _debug from 'debug';

import pkg from './package.json';
import config from './config';
import api from './server/api';

let debug = _debug('dev:main');
let forceQuit = false;
let downloading = false;
let autoUpdaterInit = false;
let menu;
let tray;
let mainWindow;
let isOsx = process.platform === 'darwin';

// 主菜单, 程窗体顶层
let mainMenu = [
    {
        label: 'ieaseMusic',
        submenu: [
            {
                label: `About ieaseMusic`,
                selector: 'orderFrontStandardAboutPanel:',
            },
            {
                label: 'Preferences...',
                accelerator: 'Cmd+,',
                click() {
                    mainWindow.webContents.send('show-preferences');
                }
            },
            {
                type: 'separator'
            },
            {
                role: 'hide'
            },
            {
                role: 'hideothers'
            },
            {
                role: 'unhide'
            },
            {
                type: 'separator'
            },
            {
                label: 'Check for updates',
                accelerator: 'Cmd+U',
                click() {
                    checkForUpdates();
                }
            },
            {
                label: '退出',
                accelerator: 'Command+Q',
                selector: 'terminate:',
                click() {
                    forceQuit = true;
                    mainWindow = null;
                    app.quit();
                }
            }
        ]
    },
    {
        label: 'Controls',
        submenu: [
            {
                label: '暂停',
                accelerator: 'Space',
                click() {
                    mainWindow.show();
                    mainWindow.webContents.send('player-toggle');
                }
            },
            {
                label: '下一首',
                accelerator: 'Right',
                click() {
                    mainWindow.show();
                    mainWindow.webContents.send('player-next');
                }
            },
            {
                label: '上一首',
                accelerator: 'Left',
                click() {
                    mainWindow.show();
                    mainWindow.webContents.send('player-previous');
                }
            },
            {
                label: '音量+',
                accelerator: 'Up',
                click() {
                    mainWindow.show();
                    mainWindow.webContents.send('player-volume-up');
                }
            },
            {
                label: '音量-',
                accelerator: 'Down',
                click() {
                    mainWindow.show();
                    mainWindow.webContents.send('player-volume-down');
                }
            },
            {
                label: '喜欢',
                accelerator: 'Cmd+L',
                click() {
                    mainWindow.show();
                    mainWindow.webContents.send('player-like');
                }
            },
        ],
    },
    {
        label: '最近播放',
        submenu: [
            {
                label: 'Nothing...',
            }
        ],
    },
    {
        label: 'Next Up',
        submenu: [
            {
                label: 'Nothing...',
            }
        ],
    },
    {
        label: 'Edit',
        submenu: [
            {
                role: 'undo'
            },
            {
                role: 'redo'
            },
            {
                type: 'separator'
            },
            {
                role: 'cut'
            },
            {
                role: 'copy'
            },
            {
                role: 'paste'
            },
            {
                role: 'pasteandmatchstyle'
            },
            {
                role: 'delete'
            },
            {
                role: 'selectall'
            }
        ]
    },
    {
        label: 'View',
        submenu: [
            {
                label: 'Home',
                accelerator: 'Cmd+Shift+H',
                click() {
                    mainWindow.webContents.send('show-home');
                }
            },
            {
                label: 'Search',
                accelerator: 'Cmd+F',
                click() {
                    mainWindow.webContents.send('show-search');
                }
            },
            {
                label: 'TOP',
                accelerator: 'Cmd+Shift+T',
                click() {
                    mainWindow.webContents.send('show-top');
                }
            },
            {
                label: 'Playlist',
                accelerator: 'Cmd+Shift+P',
                click() {
                    mainWindow.webContents.send('show-playlist');
                }
            },
            {
                label: 'FM',
                accelerator: 'Cmd+Shift+F',
                click() {
                    mainWindow.webContents.send('show-fm');
                }
            },
            {
                type: 'separator',
            },
            {
                label: 'Menu',
                accelerator: 'Cmd+Shift+M',
                click() {
                    mainWindow.webContents.send('show-menu');
                }
            },
            {
                label: 'Next Up',
                accelerator: 'Cmd+P',
                click() {
                    mainWindow.webContents.send('show-playing');
                }
            },
            {
                type: 'separator'
            },
            {
                role: 'toggledevtools'
            },
        ]
    },
    {
        role: 'window',
        submenu: [
            {
                role: 'minimize'
            },
            {
                role: 'close'
            }
        ]
    }
];

// 托盘菜单, 像是window右下角
let trayMenu = [
    {
        label: 'Pause',
        click() {
            mainWindow.webContents.send('player-toggle');
        }
    },
    {
        label: 'Next',
        click() {
            mainWindow.webContents.send('player-next');
        }
    },
    {
        label: 'Previous',
        click() {
            mainWindow.webContents.send('player-previous');
        }
    },
    {
        type: 'separator'
    },
    {
        label: 'Preferences...',
        accelerator: 'Cmd+,',
        click() {
            mainWindow.webContents.send('show-preferences');
        }
    },
    {
        type: 'separator'
    },
    {
        label: 'Toggle main window',
        click() {
            let isVisible = mainWindow.isVisible();
            isVisible ? mainWindow.hide() : mainWindow.show();
        }
    },
    {
        type: 'separator'
    },
    {
        label: 'Check for updates',
        accelerator: 'Cmd+U',
        click() {
            checkForUpdates();
        }
    },
    {
        type: 'separator'
    },
    {
        label: 'Toggle DevTools',
        accelerator: 'Alt+Command+I',
        click() {
            mainWindow.show();
            mainWindow.toggleDevTools();
        }
    },
    {
        type: 'separator'
    },
    {
        label: '退出',
        accelerator: 'Command+Q',
        selector: 'terminate:',
        click() {
            forceQuit = true;
            mainWindow = null;
            app.quit();
        }
    }
];

// dock 菜单
let dockMenu = [
    {
        label: 'Toggle Player',
        accelerator: 'Space',
        click() {
            mainWindow.show();
            mainWindow.webContents.send('player-toggle');
        }
    },
    {
        label: 'Next',
        accelerator: 'Right',
        click() {
            mainWindow.show();
            mainWindow.webContents.send('player-next');
        }
    },
    {
        label: 'Previous',
        accelerator: 'Left',
        click() {
            mainWindow.show();
            mainWindow.webContents.send('player-previous');
        }
    },
    {
        label: 'Like',
        accelerator: 'Cmd+L',
        click() {
            mainWindow.show();
            mainWindow.webContents.send('player-like');
        }
    },
];

function checkForUpdates() {
    if (downloading) {
        dialog.showMessageBox({
            type: 'info',
            buttons: ['OK'],
            title: pkg.name,
            message: `Downloading...`,
            detail: `Please leave the app open, the new version is downloading. You'll receive a new dialog when downloading is finished.`
        });

        return;
    }

    autoUpdater.checkForUpdates();
}

// 顶层菜单
function updateMenu(playing) {
    if (!isOsx) {
        return;
    }

    mainMenu[1]['submenu'][0]['label'] = playing ? 'Pause' : 'Play';
    menu = Menu.buildFromTemplate(mainMenu);

    Menu.setApplicationMenu(menu);
}

// 通知区域菜单
function updateTray(playing) {
    // Update unread mesage count
    trayMenu[0].label = playing ? 'Pause' : 'Play';

    let contextmenu = Menu.buildFromTemplate(trayMenu);
    let icon = playing
        ? `${__dirname}/src/assets/playing.png`
        : `${__dirname}/src/assets/notplaying.png`
        ;

    if (!tray) {
        // Init tray icon
        tray = new Tray(icon);

        tray.on('right-click', () => {
            tray.popUpContextMenu();
        });
    }

    tray.setImage(icon);
    tray.setContextMenu(contextmenu);
}

function registerGlobalShortcut() {
    // Play the next song
    globalShortcut.register('MediaNextTrack', e => {
        mainWindow.webContents.send('player-next');
    });

    // Play the previous song
    globalShortcut.register('MediaPreviousTrack', e => {
        mainWindow.webContents.send('player-previous');
    });

    // Toggle the player
    globalShortcut.register('MediaPlayPause', e => {
        mainWindow.webContents.send('player-toggle');
    });
}

// 创建浏览器窗口
const createMainWindow = () => {
    var mainWindowState = windowStateKeeper({
        defaultWidth: 900,
        defaultHeight: 600,
    });

    // 创建
    mainWindow = new BrowserWindow({
        x: mainWindowState.x,
        y: mainWindowState.y,
        width: mainWindowState.width,
        height: mainWindowState.height,
        resizable: false,
        vibrancy: 'medium-light',
        backgroundColor: 'none',
        // Headless
        frame: !isOsx,
    });

    mainWindow.loadURL(`file://${__dirname}/src/index.html`);

    // wenContents 渲染并控制BrowserWindow实例的内容。
    // 当导航完成时触发,onload事件触发的时候
    mainWindow.webContents.on('did-finish-load', () => {
        try {
            mainWindow.show();
            mainWindow.focus();
        } catch (ex) { }
    });

    // 当页面被要求打开一个新url窗口的时候触发,像是 window.open, a.href.
    mainWindow.webContents.on('new-window', (event, url) => {
        event.preventDefault();
        shell.openExternal(url);
    });

    //
    mainWindow.on('close', e => {
        if (forceQuit) {
            mainWindow = null;
            app.quit();
        } else {
            e.preventDefault();
            mainWindow.hide();
        }
    });

    // Update the history menu
    ipcMain.on('update-history', (event, args) => {
        var historyMenu = mainMenu.find(e => e.label === 'Recently Played');
        var submenu = args.songs.map((e, index) => {
            return {
                label: e.name,
                accelerator: `Cmd+${index}`,
                click() {
                    mainWindow.show();

                    // 主进程发送一个异步的消息给渲染进程通过 channel
                    // 渲染进程可以通过监听 ipcRenderer 上的管道 channel 获取消息
                    // 消息名 player-play
                    // 消息会转化为 JSON, 所以函数和原型链就会被销毁
                    mainWindow.webContents.send('player-play', {
                        id: e.id,
                    });
                }
            };
        });

        historyMenu.submenu = submenu;
        updateMenu();
    });

    // Update next up menu
    ipcMain.on('update-playing', async(event, args) => {
        var playingMenu = mainMenu.find(e => e.label === 'Next Up');
        var submenu = args.songs.map((e, index) => {
            return {
                label: e.name,
                click() {
                    mainWindow.show();
                    mainWindow.webContents.send('player-play', {
                        id: e.id,
                    });
                }
            };
        });

        playingMenu.submenu = submenu;
        updateMenu();
    });

    // Update menu icon image and controls menu
    ipcMain.on('update-status', (event, args) => {
        var { playing, song } = args;

        if (tray) {
            updateTray(playing, song);
        }
        updateMenu(playing);
    });

    // Show/Hide menu icon
    ipcMain.on('update-preferences', (event, args) => {
        mainWindow.setAlwaysOnTop(!!args.alwaysOnTop);

        if (!args.showTray) {
            if (tray) {
                tray.destroy();
                tray = null;
            }

            return;
        }

        updateTray(args.playing);
    });

    // Show the main window
    ipcMain.on('show', event => {
        mainWindow.show();
        mainWindow.focus();
    });

    // Minimize the window
    ipcMain.on('minimize', event => {
        mainWindow.minimize();
    });

    // Quit app
    ipcMain.on('goodbye', (event) => {
        forceQuit = true;
        mainWindow = null;
        app.quit();
    });

    // App has suspend
    powerMonitor.on('suspend', () => {

        // 发送 player-pause 消息
        mainWindow.webContents.send('player-pause');
    });

    if (isOsx) {
        // App about
        // 设置 "关于" 面板选项
        app.setAboutPanelOptions({
            applicationName: 'ieaseMusic',
            applicationVersion: pkg.version,
            copyright: 'Made with 💖 by trazyn. \n https://github.com/trazyn/ieaseMusic',
            credits: `With the invaluable help of: \n github.com/Binaryify/NeteaseCloudMusicApi`,
            version: pkg.version
        });
        // 设置 mac 下方 dock的图标和菜单
        app.dock.setIcon(`${__dirname}/src/assets/dock.png`);
        app.dock.setMenu(Menu.buildFromTemplate(dockMenu));
    }

    updateMenu();
    registerGlobalShortcut();
    mainWindow.webContents.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/603.3.8 (KHTML, like Gecko) Version/10.1.2 Safari/603.3.8');
    debug('Create main process success 🍻');
};

// 设置当前应用程序的名字
app.setName('ieaseMusic');

// 当 electron 初始化的时候触发
app.on('ready', createMainWindow);

// 在应用程序开始关闭窗口之前触发
app.on('before-quit', () => {
    // Fix issues #14
    forceQuit = true;
});

// 当应用程序被激活的时候发出
app.on('activate', e => {
    if (!mainWindow.isVisible()) {
        mainWindow.show();
    }
});

storage.get('preferences', (err, data) => {
    var port = config.api.port;

    if (!err) {
        port = data.port || port;

        if (data.autoupdate) {
            autoUpdater.checkForUpdates();
        } else {
            autoUpdaterInit = true;
        }
    }

    axios.defaults.baseURL = `http://localhost:${port}`;
    api.listen(port, (err) => {
        if (err) throw err;

        debug(`API server is running with port ${port} 👊`);
    });
});

autoUpdater.on('update-not-available', e => {
    if (!autoUpdaterInit) {
        autoUpdaterInit = true;
        return;
    }

    dialog.showMessageBox({
        type: 'info',
        buttons: ['OK'],
        title: pkg.name,
        message: `${pkg.name} is up to date :)`,
        detail: `${pkg.name} ${pkg.version} is currently the newest version available, It looks like you're already rocking the latest version!`
    });
});

autoUpdater.on('update-available', e => {
    downloading = true;
    checkForUpdates();
});

autoUpdater.on('error', err => {
    dialog.showMessageBox({
        type: 'error',
        buttons: ['Cancel update'],
        title: pkg.name,
        message: `Failed to update ${pkg.name} :(`,
        detail: `An error occurred in retrieving update information, Please try again later.`,
    });

    downloading = false;
    console.error(err);
});

autoUpdater.on('update-downloaded', info => {
    var { releaseNotes, releaseName } = info;
    var index = dialog.showMessageBox({
        type: 'info',
        buttons: ['Restart', 'Later'],
        title: pkg.name,
        message: `The new version has been downloaded. Please restart the application to apply the updates.`,
        detail: `${releaseName}\n\n${releaseNotes}`
    });
    downloading = false;

    if (index === 1) {
        return;
    }

    autoUpdater.quitAndInstall();
    setTimeout(() => {
        mainWindow = null;
        app.quit();
    });
});
