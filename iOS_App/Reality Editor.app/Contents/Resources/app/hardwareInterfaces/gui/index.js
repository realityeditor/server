exports.enabled = true;

if (exports.enabled) {

    var electron = require('electron');
    var server = require(__dirname + '/../../libraries/hardwareInterfaces');
    const PDFWindow = require('electron-pdf-window')
// Module to control application life.
    var app = electron.app;
// Module to create native browser window.
    var BrowserWindow = electron.BrowserWindow;

    var path = require('path');
    var url = require('url');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
    var mainWindow;
    var render;

    function createWindow() {
        // Create the browser window.
        mainWindow = new BrowserWindow({width: 520, height: 500, resizable: true});

        render = mainWindow.webContents;

        // and load the index.html of the app.
        mainWindow.loadURL(url.format({
            pathname: path.join(__dirname + "/html", 'index.html'),
            protocol: 'file:',
            slashes: true
        }));

        // Open the DevTools.
        // mainWindow.webContents.openDevTools()

        // Emitted when the window is closed.
        mainWindow.on('closed', function () {
            // Dereference the window object, usually you would store windows
            // in an array if your app supports multi windows, this is the time
            // when you should delete the corresponding element.

            server.shutdown();

            process.exit();

            mainWindow = null
        })

        /*
         const win = new BrowserWindow({ width: 800, height: 600 })

         PDFWindow.addSupport(win)

         win.loadURL(__dirname+'/html/resources/printoutHue1.pdf')
         */

    }

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
    app.on('ready', createWindow);

// Quit when all windows are closed.
    app.on('window-all-closed', function () {
        // On OS X it is common for applications and their menu bar
        // to stay active until the user quits explicitly with Cmd + Q
        if (process.platform !== 'darwin') {
            app.quit()
        }
    });

    app.on('activate', function () {
        // On OS X it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (mainWindow === null) {
            createWindow()
        }
    });

    var ipcMain = require('electron').ipcMain;

    ipcMain.on('msg', function (event, msg, arg) {
        server.sendToApp(msg, arg);
    });

    server.addUIReadListener(function (msg, arg) {
        render.send('msg', msg, arg)

    });

}
// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

var y = {
    5: {
        state: {
            on: true,
            bri: 254,
            hue: 14922,
            sat: 144,
            effect: 'none',
            xy: [Object],
            ct: 369,
            alert: 'select',
            colormode: 'ct',
            reachable: true
        },
        type: 'Extended color light',
        name: 'Hue color lamp 1',
        modelid: 'LCT001',
        manufacturername: 'Philips',
        uniqueid: '00:17:88:01:00:b4:ab:87-0b',
        swversion: '0.10.0.3148'
    },
    6: {
        state: {
            on: true,
            bri: 254,
            hue: 14922,
            sat: 144,
            effect: 'none',
            xy: [Object],
            ct: 369,
            alert: 'select',
            colormode: 'ct',
            reachable: true
        },
        type: 'Extended color light',
        name: 'Hue color lamp 2',
        modelid: 'LCT001',
        manufacturername: 'Philips',
        uniqueid: '00:17:88:01:00:b8:16:53-0b',
        swversion: '0.10.0.3148'
    },
    7: {
        state: {
            on: true, bri: 254, alert: 'select', reachable: true
        },
        type: 'Dimmable light',
        name: 'Hue white lamp 1',
        modelid: 'LWB014',
        manufacturername: 'Philips',
        uniqueid: '00:17:88:01:02:45:48:cd-0b',
        swversion: '1.15.2_r19181',
        swconfigid: 'D1D2055F',
        productid: 'Philips-LWB014-1-A19DLv3'
    },
    8: {
        state: {on: true, bri: 254, alert: 'select', reachable: true},
        type: 'Dimmable light',
        name: 'Hue white lamp 2',
        modelid: 'LWB014',
        manufacturername: 'Philips',
        uniqueid: '00:17:88:01:02:45:46:76-0b',
        swversion: '1.15.2_r19181',
        swconfigid: 'D1D2055F',
        productid: 'Philips-LWB014-1-A19DLv3'
    }
}
