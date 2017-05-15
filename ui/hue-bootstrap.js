const rp = require('request-promise-native');
const HBEvent = require('./hb-event');
const EventEmitter = require('events');
const path = require('path')

class HueBootstrapper extends EventEmitter {
    bootstrap() {
        rp({
            uri: 'https://www.meethue.com/api/nupnp',
            json: true
        }).then(hues => {
            if (hues.length === 0) {
                this.emit(HBEvent.errorNotFound);
                return;
            }
            let hue = hues[0]; // TODO support multiple hue bridges
            this.hueIp = hue.internalipaddress;
            this.emit(HBEvent.pressLink);
        }).catch(err => {
            this.emit(HBEvent.errorApi, err);
        });
    }

    afterLink() {
        rp({
            uri: 'http://' + this.hueIp + '/api',
            json: true,
            method: 'POST',
            body: JSON.stringify({devicetype: 'my_hue_app#reality editor'})
        }).then(responses => {
            if (responses.length === 0) {
                this.emit(HBEvent.errorApi);
            }
            let response = responses[0];
            if (response.success) {
                this.username = response.success.username;
                this.emit(HBEvent.usernameAcquired, this.username);
            } else if (response.error && response.error.type === 101) {
                this.emit(HBEvent.errorLinkNotPressed);
            } else {
                this.emit(HBEvent.errorApi, 'unknown response');
            }
            return this.getLights();
        }).catch(err => {
            this.emit(HBEvent.errorApi, err);
        });
    }

    getLights() {
        return rp({
            uri: 'http://' + this.hueIp + '/api/' + this.username + '/lights',
            json: true
        }).then(function(lights) {
            console.log(lights.length);
            let config = {};
            for (var i = 1; i <= lights.length; i++) {
                let id = 'Light' + i;
                config[id] = {
                    host: this.hueIp,
                    url: '/api/' + this.username + '/lights/' + i,
                    id: id,
                    port: '80'
                };
            }
            let configPath = path.join(__dirname, '../hardwareInterfaces/philipsHue/config.json');
            fs.writeFileSync(configPath, JSON.stringify(config));
            // TODO restart server
            this.emit(HBEvent.wroteConfig, lights);
        }).catch(err => {
            this.emit(HBEvent.errorApi, err);
        });
    }
}

module.exports = HueBootstrapper;
