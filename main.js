const { app, BrowserWindow, screen, ipcMain, Notification, Tray, Menu, nativeImage, nativeTheme } = require('electron')
const path = require('path')
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
        resizable: true,
        alwaysOnTop: true,
        webPreferences: {
            //preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            enableRemoteModule: true, 
            contextIsolation: false,
        }
    })
    
    //win.webContents.openDevTools()

    win.on('close', () => {
        win = null
    })

    ipcMain.on('topChange', (event, data) => {
        //window.setAlwaysOnTop(!win.isAlwaysOnTop, 'screen-saver')
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

app.whenReady().then(() => {
    nativeTheme.themeSource = 'system'
    const icon = nativeImage.createFromPath('./icon.jpg')
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
        if(win == null)
        {
            createWindow()
        }
        else
        {
            win.show()
        }
    })

    createWindow()
})

app.on('window-all-closed', () => {
    //if (process.platform !== 'darwin') app.quit()
    //win = null
})