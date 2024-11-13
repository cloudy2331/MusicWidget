const { app, BrowserWindow, screen, ipcMain, Notification, Tray, Menu, nativeImage, nativeTheme } = require('electron')
const path = require('path')
const fs = require('fs')
let mcu
import('@material/material-color-utilities').then(module => {
    mcu = module
}).catch(console.error)
// const { getContrastColorFromTheme } = require('@material/material-color-utilities')
//require('electron-reloader')(module)

let tray
let win
let setting
let contentsId = []

const createWindow = () => {
    win = new BrowserWindow({
        frame: false,
        width: 450,
        height: 150,
        x: screen.getPrimaryDisplay().workAreaSize.width * 0.5 - 225,
        y: 10,
        resizable: false,
        alwaysOnTop: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            enableRemoteModule: true,
            contextIsolation: false,
        }
    })

    //win.webContents.openDevTools()

    win.on('close', () => {
        win = null
    })

    ipcMain.on('getLanguage', (event) => {
        return app.getPreferredSystemLanguages()[0]
    })

    ipcMain.on('topChange', (event, data) => {
        console.log(data)
        if (data == "1") {
            win.setAlwaysOnTop(true, 'screen-saver')
        } else {
            win.setAlwaysOnTop(false)
        }
    })

    ipcMain.on('progressChange', (event, data) => {
        win.setProgressBar(data)
    })

    ipcMain.on('getContentId', (event, key) => {
        event.reply('requestContentId', contentsId[0])
    })

    contentsId[0] = win.webContents.id
    win.loadFile('index.html')
}

ipcMain.handle('getTextColor', (event, data, ct) => {
    console.log(ct)
    let theme = mcu.themeFromSourceColor(mcu.argbFromRgb(data)).schemes.dark.tertiary
    if (ct == "light") {
        theme = mcu.themeFromSourceColor(mcu.argbFromRgb(data)).schemes.light.tertiary
    } else {
        theme = mcu.themeFromSourceColor(mcu.argbFromRgb(data)).schemes.dark.tertiary
    }

    console.log(mcu.hexFromArgb(theme))
    return mcu.hexFromArgb(theme)
})

ipcMain.handle('getExePath', (event) => {
    return app.getAppPath('exe')
})

const createSetting = () => {
    setting = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true,
            contextIsolation: false,
        }
    })

    setting.loadFile('./setting.html')
}

const createPlaylist = () => {
    setting = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true,
            contextIsolation: false,
        }
    })

    setting.loadFile('./playlist.html')
}

//带参启动
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
    app.quit()
} else {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        console.log('用户正在尝试启动第二个实例')
        // if (win) {
        if (commandLine.includes('--settings')) {
            createSetting()
        }
        // win.focus()
        // }
    })
}


app.whenReady().then(() => {
    nativeTheme.themeSource = 'system'
    // const icon = nativeImage.createFromPath('./icon.jpg')
    const icon = nativeImage.createFromPath(path.join(__dirname, 'icon.jpg'))
    tray = new Tray(icon)
    const contextMenu = Menu.buildFromTemplate([
        {
            label: '播放列表',
            type: 'normal',
            click: () => {
                createPlaylist()
            }
        },
        {
            label: '设置',
            type: 'normal',
            click: () => {
                createSetting()
            }
        },
        {
            type: 'separator'
        },
        {
            label: '退出',
            type: 'normal',
            click: () => {
                app.quit()
            }
        }
    ])
    tray.setContextMenu(contextMenu)
    tray.setTitle('music widget')
    tray.setToolTip('music widget')

    tray.on('click', () => {
        if (win == null) {
            createWindow()
        }
        else {
            win.show()
        }
    })

    //任务栏
    app.setUserTasks([
        {
            program: process.execPath,
            arguments: '--settings',
            iconPath: process.execPath,
            iconIndex: 0,
            title: '设置',
            window: 'setting'
        }
    ])

    createWindow()
})

app.on('window-all-closed', () => {
    //if (process.platform !== 'darwin') app.quit()
    //win = null
})