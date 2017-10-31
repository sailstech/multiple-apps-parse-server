var appFileFolder = "./configs/";
var appFilePath = appFileFolder + process.env.app + ".json";
var fs = require('fs');

const util = require('util');
const exec = util.promisify(require('child_process').exec);

function pm2StartParseServer(appName) {
    return new Promise(async function(res,rej) {
        const { stdout, stderr } = await exec('pm2 start appServers.json --only '+appName);
        if(stderr) {
            console.log('stderr:', stderr);
            rej();
        } else {
            console.log('stdout:', stdout);
            res();
        }

    });
}
function writeJson(appProfile){
    //get and increase port number
    return new Promise(function(res,rej) {
        fs.writeFile(appFilePath,
            JSON.stringify(appProfile), function (err,data) {
                if (err) {
                    throw new Error(err);
                }
                res();
            });
    });
}

let config = {};
if(!process.env.app) {
    console.log('app is not defined!');
    return false;
} else {
    try{
        config = require('./configs/'+process.env.app);
    } catch(err) {
        console.log('app is not found!');
        return false;
    }
}
config.enable = !(process.env.enable === 'false');
writeJson(config).then(function () {
    return pm2StartParseServer(process.env.app);
}).then(function () {
    let str = config.enable ? 'enabled!':'disabled!';
    console.log(process.env.app+' is now '+ str);
});

