/**
 * Created by Carsten on 12/06/15.
 * Modified by Peter Som de Cerff (PCS) on 12/21/15
 * Modified by Valentin Heun on May/21/2017
 *
 * Copyright (c) 2015 Carsten Strunk
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

exports.enabled = true;

if (exports.enabled) {

    var lights = {};

    var server = require(__dirname + '/../../libraries/hardwareInterfaces');

    const discover = require('hue-connect');
    const HueUtil = require('hue-util');

    var fs = require('fs');
    var http = require('http');
    var _ = require('lodash');

    function interfaceWithHue(ip, token) {

        server.sendToUI("hueStatus","on");

        var app = 'realityEditorStarter';
        var ipAddress = ip; // Use the ipAddress of the bridge or null
        var username = token;
        var hue = new HueUtil(app, ipAddress, username, onUsernameChange);



        checkLightStatus (hue, ip, token);

        setInterval(checkLightStatus, 1000, hue, ip,token);

    }

var statusChange = false;

    var lookupLights = { };
    var lookupKeys = { };

    var lookupCounter = 1;

    function checkLightStatus (hue,ip,token){
        hue.getLights(function(arg1,arg2){

            if(typeof arg2 === "object"){
                for(var key in arg2) {

                    if(!(key in lookupLights)){
                        lookupLights[key] = lookupCounter;
                        lookupKeys[lookupCounter] = key;
                        lookupCounter++;
                    }

                    // make sure that not to many objects are created;
                    if(lookupLights[key] > 4) return;
                   // console.log(arg2[key].state.reachable);
                    if(arg2[key].state.reachable) {
                        server.sendToUI("hueOn", "light" + lookupLights[key]);

                       if(!(typeof lights["light"+lookupLights[key]] === "object")) {
                           lights["light" + lookupLights[key]] = {active: false};
                       }




                        if(lights["light"+lookupLights[key]].active === false) {
                           lights["light"+lookupLights[key]] = {
                               host: ip,
                               url: "/api/"+token+"/lights/"+key,
                               id:"light"+key,
                               port:"80",
                               active:true,
                               key : key,
                               colormode: arg2[key].state.colormode
                           };
                            statusChange = true;
                       }

                    } else {
                        server.sendToUI("hueOff","light" + lookupLights[key]);
                        if(typeof lights["light" + lookupLights[key]] === "object") {
                            if (lights["light" + lookupLights[key]].active === true) {
                                lights["light" + lookupLights[key]] = {active: false};
                                statusChange = true;
                            }
                        }
                    }
                }
            }

            if(statusChange){
                statusChange = false;

                console.log("you should do some changes");
                // do some changes

                philipsHueServer()

            }


        });

    }


    function philipsHueServer() {
        console.log("philipsHue starting philipsHue");
        setup();


        if (server.getDebug()) console.log("philipsHue setup read by poll");
        //TODO poll more often in productive environment
        for (var key in lights) {
            setInterval(function (light) {
                getLightState(light, server.write);
            }, 700 + _.random(-100, 100), lights[key]);
        }



        for (var lightId in lights) {

            console.log(lightId);

            server.addNode(lightId, "brightness", "node");
            if (lights[lightId].colormode) {
                server.addNode(lightId, "hue", "node");
                server.addNode(lightId, "saturation", "node");
            }
            server.activate(lightId);

            server.removeReadListeners(lightId);
            server.addReadListener(lightId, 'brightness', onRead(lightId, writeBrightness));


            console.log(lights[lightId]);

            if (lights[lightId].colormode) {
                server.addReadListener(lightId, 'hue', onRead(lightId, writeHue));
                server.addReadListener(lightId, 'saturation', onRead(lightId, writeSaturation));
            }
        }
    }

    /**
     * @desc getLightState() communicates with the philipsHue bridge and checks the state of the light
     * @param {Object} light the light to check
     * @param {function} callback function to run when the response has arrived
     **/
    function getLightState(light, callback) {
        var state;

        var options = {
            host: light.host,
            path: light.url,
            port: light.port,
            method: 'GET',
        };

        var callbackHttp = function (response) {
            var str = '';

            response.on('data', function (chunk) {
                str += chunk;
            });

            response.on('end', function () {
                //TODO add some error handling
                state = JSON.parse(str).state;
                if (!state) {
                    console.error('Philips Hue Error', str);
                    return;
                }
                if (state.on != light.switch) {
                    light.switch = state.on;
                    if (state.on) {
                        callback(light.id, "switch", 1, "d");
                    } else {
                        callback(light.id, "switch", 0, "d");
                    }

                }

                if (state.bri != light.bri) {
                    light.bri = state.bri; // brightness is a value between 1 and 254
                    callback(light.id, "brightness", (state.bri - 1) / 253, "f");
                }

                if (light.colormode) {
                    if (state.hue != light.hue) {
                        light.hue = state.hue; // hue is a value between 0 and 65535
                        callback(light.id, "hue", state.hue / 65535, "f"); // map hue to [0,1]
                    }

                    if (state.sat != light.sat) {
                        light.sat = state.sat;
                        callback(light.id, "saturation", state.sat / 254, "f");
                    }
                }

            });
        }



        var req = http.request(options, callbackHttp);
        req.on('error', function (e) {
            console.log('GetLightState HTTP error: ' + e.message);
        });
        req.end();

    }

    function onRead(lightId, writeFn) {

        return function(data) {
               writeFn(lights[lightId], data.value);
        };
    }


    /**
     * @desc writeSwitchState() turns the specified light on or off
     * @param {float} state turns the light on if > 0.5, turns it off otherwise
     **/
    function writeSwitchState(light, state) {
        var options = {
            host: light.host,
            path: light.url + "/state",
            port: light.port,
            method: 'PUT',
        };




        var req = http.request(options, function () { });
        req.on('error', function (e) {
            console.log('writeSwitchState HTTP error: ' + e.message);
        });

        if (state < 0.5) {
            req.write('{"on":false}');
        } else {
            req.write('{"on":true}');
        }



        req.end();

        //TODO check for success message from the bridge
    }


    /**
     * @desc writeBrightness() Sets the brightness of the specified light
     * @param {float} bri is the brightness in the range [0,1]
     **/


    var  overhead = {
    };
    function writeBrightness(light, bri) {

      if(!overhead[light.id]){
          overhead[light.id] = false;
      }


        if (overhead[light.id] === true) {
          return;
        }

        var options = {
            hostname: light.host,
            path: light.url + "/state",
            port: light.port,
            method: 'PUT',
        };


        overhead[light.id] = true;
        var req = http.request(options, function() {
            setTimeout(function() {
                overhead[light.id] = false;
            }, 100);
        });
        req.on('error', function (e) {
            console.log('writeBrightness HTTP error: ' + e.message);
            setTimeout(function() {
                overhead[light.id] = false;
            }, 100);
        });

        console.log(_.floor(bri * 254));


        if(bri === 0){
            req.write('{"bri":' + _.floor(bri * 254) + ', "on":false}');
        } else {

            req.write('{"bri":' + _.floor(bri * 254) + ', "on":true}');
        }



        req.end();
    }


    /**
     * @desc writeSaturation() sets the saturation for the specified light
     * @param {float} sat is the saturatin in the range [0,1]
     **/
    function writeSaturation(light, sat) {

        if(!overhead[light.id]){
            overhead[light.id] = false;
        }


        if (overhead[light.id] === true) {
            return;
        }

        var options = {
            hostname: light.host,
            path: light.url + "/state",
            port: light.port,
            method: 'PUT',
        };

        overhead[light.id] = true;
        var req = http.request(options, function () {
            setTimeout(function() {
                overhead[light.id] = false;
            }, 100);
        });
        req.on('error', function (e) {
            console.log('writeSaturation HTTP error: ' + e.message);
            setTimeout(function() {
                overhead[light.id] = false;
            }, 100);
        });
        req.write('{"sat":' + _.floor(sat * 254) + '}');
        req.end();
    }


    /**
     * @desc writeHue() sets the hue for the specified light
     * @param {integer} hue is the hue in the range [0,1]
     **/
    function writeHue(light, hue) {

        if(!overhead[light.id]){
            overhead[light.id] = false;
        }


        if (overhead[light.id] === true) {
            return;
        }

        var options = {
            hostname: light.host,
            path: light.url + "/state",
            port: light.port,
            method: 'PUT',
        };

        overhead[light.id] = true;

        var req = http.request(options, function () {
            setTimeout(function() {
                overhead[light.id] = false;
            }, 100);
        });
        req.on('error', function (e) {
            console.log('writeHue HTTP error: ' + e.message);
            setTimeout(function() {
                overhead[light.id] = false;
            }, 100);
        });
        req.write('{"hue":' + _.floor(hue * 65535) + '}');
        req.end();
    }

    /**
     * @desc setup() runs once, adds and clears the IO points
     **/
    function setup() {
        //load the config file
        //lights = JSON.parse(fs.readFileSync(__dirname + "/config.json", "utf8"));

        if (server.getDebug()) console.log("setup philipsHue");
        for (var key in lights) {
            lights[key].switch = undefined;
            lights[key].bri = undefined;
            if (lights[key].colormode) {
                lights[key].hue = undefined;
                lights[key].sat = undefined;
            }
        }
    }



    /// SEARCH

    const search = discover(getToken)

    async function getToken (bridge) {
        try {
            const token = await bridge.connect({
                appName: 'realityEditorStarter',
                deviceName: 'thisComputer'
            })

            console.log({
                bridge: bridge.ip,
                token: token,
            })

            interfaceWithHue(bridge.ip,token);

            // Stop searching for new bridges.
            search.cancel()
        } catch (error) {

            // It's some weird error.
            if (error.code !== 101) {
                throw error
            }

            //console.log("push the button");
            // User hasn't pressed the bridge button.
            // Try again in a second.
            setTimeout(getToken, 1000, bridge)
        }
    }

    function onUsernameChange(newUsername){
        username = newUsername;
        // Store the username for future use
        // otherwise you'll be required to press the hue bridge link button again
    }



}