const {ipcRenderer} = require('electron');
const HBEvent = require('./hb-event.js');

var hueStatus = document.getElementById('hue-status');
var lightsContainer = document.getElementById('lights');

ipcRenderer.on('hue', (event, message, arg) => {
    switch (message) {
        case HBEvent.errorNotFound:
            hueStatus.textContent = 'Hue Bridge Not Found';
            hueStatus.classList.add('red');
            break;
        case HBEvent.errorApi:
            hueStatus.textContent = 'Unknown Error';
            hueStatus.classList.add('red');
            break;
        case HBEvent.pressLink:
            hueStatus.textContent = 'Press Link Button';
            hueStatus.classList.remove('red');
            break;
        case HBEvent.errorLinkNotPressed:
            hueStatus.textContent = 'Press Link Button';
            hueStatus.classList.add('red');
            break;

        case HBEvent.usernameAcquired:
            hueStatus.textContent = 'Connected';
            hueStatus.classList.remove('red');
            hueStatus.classList.add('green');
            break;

        case HBEvent.usernameAcquired:
            var lights = arg;
            var count = Object.keys(lights).length;

            lightsContainer.innerHTML = '';

            for (var i = 1; i <= count; i++) {
                var light = document.createElement('div');
                light.classList.add('light');
                var name = document.createElement('div');
                name.classList.add('name');
                name.textContent = 'Light ' + i;

                var print = document.createElement('input');
                print.type = 'button';
                print.classList.add('print');
                print.value = 'Print';

                light.appendChild(name);
                light.appendChild(print);
                lightsContainer.appendChild(light);
            }
            break;
    }
});
ipcRenderer.send('hue', 'bootstrap');

function listLights(hueData) {
    var ip = hueData.ip;
    var username = hueData.username;
    console.log(ip, username);
}

