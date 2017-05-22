


const discover = require('hue-connect');
const HueUtil = require('hue-util');

function interfaceWithHue(ip, token) {
    var app = 'realityEditorStarter';
    var ipAddress = ip; // Use the ipAddress of the bridge or null
    var username = token;
    var hue = new HueUtil(app, ipAddress, username, onUsernameChange);

    hue.getLights(function(arg1,arg2,arg3){
        console.log("test", arg1,arg2,arg3);
    });
}


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
