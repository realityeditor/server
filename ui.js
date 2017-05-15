const {app, ipcMain, BrowserWindow} = require('electron')
const path = require('path')
const url = require('url')
const HueBootstrapper = require('./ui/hue-bootstrap.js');
const HBEvent = require('./ui/hb-event.js');

let server = require('./server.js');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win = null;

function createWindow() {
    // Create the browser window.
    if (process.platform !== 'darwin') {
        win = new BrowserWindow({width: 800, height: 600, frame: false});
    } else {
        win = new BrowserWindow({width: 800, height: 600, titleBarStyle: 'hidden-inset'});
    }

    // and load the index.html of the app.
    // win.loadURL('http://localhost:8080');
    win.loadURL(url.format({
        pathname: path.join(__dirname, './ui/index.html'),
        protocol: 'file:',
        slashes: true
    }));


    // Open the DevTools.
    // win.webContents.openDevTools()

    // Emitted when the window is closed.
    win.on('closed', function() {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        win = null;
    });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function() {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', function() {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
        createWindow();
    }
});

var hueBootstrapper = new HueBootstrapper();
hueBootstrapper.bootstrap();

var activeSender = null;

ipcMain.on('hue', function(event, arg) {
    if (arg === 'bootstrap') {
        activeSender = event.sender;
        hueBootstrapper.bootstrap();
    }
    if (hueBootstrapper.username) {
        activeSender.send('hue', HBEvent.usernameAcquired, {
            username: hueBootstrapper.username,
            ip: hueBootstrapper.hueIp
        });
    }
});

forward(HBEvent.errorNotFound);
forward(HBEvent.errorApi);
forward(HBEvent.errorLinkNotPressed);
hueBootstrapper.on(HBEvent.usernameAcquired, function() {
    if (activeSender) {
        activeSender.send('hue', HBEvent.usernameAcquired, {
            username: hueBootstrapper.username,
            ip: hueBootstrapper.hueIp
        });
    }
});

var connectionInterval = setInterval(function() {
    console.log('Retrying connection');
    if (!hueBootstrapper.hueIp) {
        hueBootstrapper.afterLink();
    } else {
        hueBootstrapper.bootstrap();
    }
    if (hueBootstrapper.username) {
        clearInterval(connectionInterval);
    }
}, 1000);

hueBootstrapper.on(HBEvent.pressLink, function() {
    if (activeSender) {
        activeSender.send('hue', eventName);
    }
});

function forward(eventName) {
    hueBootstrapper.on(eventName, function() {
        if (activeSender) {
            activeSender.send('hue', eventName);
        }
    });
}

