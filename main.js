const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

// More stable WebGL settings for Electron
app.commandLine.appendSwitch('ignore-gpu-blacklist');
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('enable-unsafe-webgl');
app.commandLine.appendSwitch('enable-webgl-software-rendering');
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('enable-features=VaapiVideoDecoder');
app.commandLine.appendSwitch('disable-features=VizDisplayCompositor');

function createWindow() {
    // Create the browser window
    const mainWindow = new BrowserWindow({
        width: 1920,
        height: 1080,
        minWidth: 1024,
        minHeight: 768,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            webSecurity: false, // Allow loading local textures
            allowRunningInsecureContent: false,
            experimentalFeatures: false
        },
        icon: path.join(__dirname, 'res/icon/icon.png'),
        title: 'VantraOrbit - 3D Solar System',
        show: false, // Don't show until ready
        frame: true,
        titleBarStyle: 'default'
    });

    // Load the app
    mainWindow.loadFile('index.html');

    // Add error handling for web contents
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        console.log('Failed to load:', errorCode, errorDescription);
    });

    mainWindow.webContents.on('crashed', (event, killed) => {
        console.log('WebContents crashed:', killed);
    });

    // Show window when ready to prevent visual flash
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        
        // Open DevTools to see any errors
        mainWindow.webContents.openDevTools();
        
        // Optional: Start in fullscreen for immersive experience
        // mainWindow.setFullScreen(true);
    });

    // Open DevTools in development
    if (process.env.NODE_ENV === 'development') {
        mainWindow.webContents.openDevTools();
    }

    // Handle window closed
    mainWindow.on('closed', () => {
        app.quit();
    });

    return mainWindow;
}

// Create menu
function createMenu() {
    const template = [
        {
            label: 'File',
            submenu: [
                {
                    label: 'Toggle Fullscreen',
                    accelerator: 'F11',
                    click: (item, focusedWindow) => {
                        if (focusedWindow) {
                            focusedWindow.setFullScreen(!focusedWindow.isFullScreen());
                        }
                    }
                },
                {
                    label: 'Minimize',
                    accelerator: 'CmdOrCtrl+M',
                    role: 'minimize'
                },
                {
                    label: 'Close',
                    accelerator: 'CmdOrCtrl+W',
                    role: 'close'
                },
                {
                    type: 'separator'
                },
                {
                    label: 'Quit',
                    accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
                    click: () => {
                        app.quit();
                    }
                }
            ]
        },
        {
            label: 'View',
            submenu: [
                {
                    label: 'Reload',
                    accelerator: 'CmdOrCtrl+R',
                    click: (item, focusedWindow) => {
                        if (focusedWindow) {
                            focusedWindow.reload();
                        }
                    }
                },
                {
                    label: 'Force Reload',
                    accelerator: 'CmdOrCtrl+Shift+R',
                    click: (item, focusedWindow) => {
                        if (focusedWindow) {
                            focusedWindow.webContents.reloadIgnoringCache();
                        }
                    }
                },
                {
                    label: 'Toggle Developer Tools',
                    accelerator: process.platform === 'darwin' ? 'Alt+Cmd+I' : 'Ctrl+Shift+I',
                    click: (item, focusedWindow) => {
                        if (focusedWindow) {
                            focusedWindow.webContents.toggleDevTools();
                        }
                    }
                },
                {
                    type: 'separator'
                },
                {
                    label: 'Actual Size',
                    accelerator: 'CmdOrCtrl+0',
                    role: 'resetzoom'
                },
                {
                    label: 'Zoom In',
                    accelerator: 'CmdOrCtrl+Plus',
                    role: 'zoomin'
                },
                {
                    label: 'Zoom Out',
                    accelerator: 'CmdOrCtrl+-',
                    role: 'zoomout'
                }
            ]
        },
        {
            label: 'Help',
            submenu: [
                {
                    label: 'About Solar System Complex',
                    click: () => {
                        const { dialog } = require('electron');
                        dialog.showMessageBox({
                            type: 'info',
                            title: 'About VantraOrbit',
                            message: 'Solar System Complex v1.0.0',
                            detail: 'Interactive 3D Solar System with realistic planets, textures, and orbital mechanics.\n\nBuilt with Three.js and Electron.\n\n© 2025 Your Name'
                        });
                    }
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

// App event handlers
app.whenReady().then(() => {
    createWindow();
    createMenu();

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

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
    contents.on('new-window', (navigationEvent, navigationURL, frameName, disposition, options, additionalFeatures) => {
        navigationEvent.preventDefault();
    });
});

module.exports = { createWindow };
