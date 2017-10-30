var config = require('./config.json');
var globalURL = config.globalURI;
var databaseURI = config.databaseURI;
var localIp = 'http://localhost';
var customer = process.env.customer||makeid(10);
var appName = process.env.app||'testApp';
var psPort = (Number(process.env.no)+1337) || '1337';
var fs = require('fs');
var appProfile;
var appFileFolder = "./configs/";
var appFilePath = appFileFolder + appName + ".json";
var cloudCodePath = config.cloudCodeFolder;
var instanceCount=0;

const util = require('util');
const exec = util.promisify(require('child_process').exec);
var dashboardPassword;
var dashboardAdminPassword;
var generateInstanceJson = function() {
    return json = {
        "customer":customer,
        "app":appName,
        "enable":true,
        "serverURL":"http://localhost",
        "publicServerURL":globalURL+"/"+appName,
        "parseServer": {
            "port":psPort,
            "databaseURI":databaseURI,
            "cloud":cloudCodePath+appName+"/main.js",
            "appId":makeid(20),
            "masterKey":makeid(20)
        }
    };

};

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
function pm2RestartRoute() {
    return new Promise(async function(res,rej) {
        const { stdout, stderr } = await exec('pm2 start initial.json');
        if(stderr) {
            console.log('stderr:', stderr);
            rej();
        } else {
            console.log('stdout:', stdout);
            res();
        }

    });
}
function makeid(num) {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

    for (var i = 0; i < num; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}
var getCount = function(cb) {
    //read instance count
    fs.readFile('./count.json',function(err,data) {
        if(err) {
            data ={count:1};
        } else {
            data = JSON.parse(data);
            ++data.count;
        }
        cb(data.count);
    });

};
var setCount = function(count) {
    var data={
        count:count
    };
    fs.writeFile('./count.json',JSON.stringify(data),function (err, data) {
        if(!err) {
        } else {
            console.log('count.json write error!');
        }
    });
};
function updatePm2AppServersJson() {
    return new Promise(function(res,rej) {
        fs.readFile('./appServers.json',function(err,data) {
            let app = {
              name:appName,
              script:"./app.js",
              watch:[
                  cloudCodePath+appName
              ],
                env:{
                    app:appName,
                    AWS_ACCESS_KEY_ID:config.S3FilesAdapter.accessKey,
                    AWS_SECRET_ACCESS_KEY:config.S3FilesAdapter.secretKey
                }
            };
            if(err) {
                data ={};
                data.apps=[];
            } else {
                data = JSON.parse(data);
            }
            data.apps.push(app);
            fs.writeFile('./appServers.json',JSON.stringify(data),function (err, data) {
                if(!err) {
                    res();
                } else {
                    console.log('appServers.json write error!');
                }
            });
        });

    });
}
function createCloudCodeFiles() {
    //create cloud code main.js
    if (!fs.existsSync(cloudCodePath)){
        fs.mkdirSync(cloudCodePath);
    }
    if (!fs.existsSync(cloudCodePath+appName)){
        fs.mkdirSync(cloudCodePath+appName);
    }
    fs.closeSync(fs.openSync(cloudCodePath+appName+"/main.js", 'w'));
}
function updateParseDashboardJson() {
    return new Promise(function(res,rej) {
        fs.readFile('./dashboards.json',function(err,data) {
            let dashboard = {
                apps:[],
                users:[]
            };

            if(!err) {
                dashboard = JSON.parse(data);
            }
            let app = {
                serverURL:appProfile.publicServerURL,
                appId:appProfile.parseServer.appId,
                masterKey:appProfile.parseServer.masterKey,
                appName:appProfile.app
            };
            dashboard.apps.push(app);

            var found=false;
            for(let i in dashboard.users) {
                if(dashboard.users[i].user===customer) {
                    dashboardPassword = dashboard.users[i].pass;
                    dashboard.users[i].apps.push({
                        appId:appProfile.parseServer.appId
                    });
                    found=true;
                }
            }
            if(!found) {
                dashboardPassword = makeid(10);
                let user = {
                    user:appProfile.customer,
                    pass:dashboardPassword,
                    apps:[{
                        appId:appProfile.parseServer.appId
                    }
                    ]
                };
                dashboard.users.push(user);
            }

            found=false;
            for(let i in dashboard.users) {
                if(dashboard.users[i].user==='admin') {
                    dashboard.users[i].apps.push({
                        appId:appProfile.parseServer.appId
                    });
                    found=true;
                }
            }
            if(!found) {
                dashboardAdminPassword = makeid(20);
                var u = {
                    user:"admin",
                    pass:dashboardAdminPassword,
                    apps:[
                        {appId:appProfile.parseServer.appId}
                    ]
                };
                dashboard.users.push(u);
            }

            fs.writeFile('./dashboards.json',JSON.stringify(dashboard),function (err, data) {
                if(!err) {
                    res();
                } else {
                    console.log('dashboards.json write error!');
                }
            });
        });

    });
}
new Promise(function (resolve, reject) {
    if (!fs.existsSync(appFileFolder)){
        fs.mkdirSync(appFileFolder);
    }
    fs.stat(appFilePath, function(err, stat) {
        if(err == null) {
            console.log('app already exists');
            reject();
        } else if(err.code == 'ENOENT') {
            resolve();

        } else {
            console.log('Some other error: ', err.code);
            reject();
        }
    });
}).then(function(){
    //get and increase port number
    return new Promise(function(res,rej) {
        getCount(function(count) {
            if(Number(count)>config.maxInstances) {
                console.log("exceeds maximum instances! please check config.json");
                rej();
            } else {
                instanceCount=count;
                if(!process.env.no) {
                    psPort = config.portFrom + Number(count);
                }
                setCount(count);
                appProfile = generateInstanceJson();
                fs.writeFile(appFilePath,
                    JSON.stringify(appProfile), function (err,data) {
                        if (err) {
                            throw new Error(err);
                        }
                        res();
                    });
            }
        });
    });
}).then(function(){
    //create cloud code main.js
    return new Promise(function(res,rej) {
        createCloudCodeFiles();
        res();
    });
}).then(function(){
    //add pm2 script in appServers.json
    return updatePm2AppServersJson();
}).then(function(){
    //start server
    return pm2StartParseServer(appName);
}).then(function(){
    //update parse dashboard server
    return updateParseDashboardJson();
}).then(function(){
    //add routing to route.json and restart routing
    return new Promise(function(res,rej) {
        fs.readFile('./route-proxy.json',function(err,data) {
            var route = {
            };
            if (!err) {
                route = JSON.parse(data);
            }
            route[".*/"+appName]=localIp+":"+psPort;
            fs.writeFile('./route-proxy.json',JSON.stringify(route),function (err, data) {
                if(!err) {
                    return pm2RestartRoute().then(function(){
                        res();
                    });
                } else {
                    console.log("route-proxy write file error!");
                    rej();
                }
            });
        });
    });
}).then(function(){
    //show admin information if needed
    if(dashboardAdminPassword) {
        console.log("This is firstly start parse dashboard, admin is created.");
        console.log("---------------------------------------------------------");
        console.log("dashboard URL: "+config.parseDashboardURI);
        console.log("username: admin");
        console.log("password: "+dashboardAdminPassword);
        console.log("---------------------------------------------------------");
    }
    console.log("No."+instanceCount+" parse server instance is created!");
    console.log("The app and customer information are shown as following, you can copy & paste to your customer");
    console.log("---------------------------------------------------------");
    console.log("app name: " + appProfile.app);
    console.log("api URL: " + appProfile.publicServerURL);
    console.log("application id: " + appProfile.parseServer.appId);
    console.log("master key: "+appProfile.parseServer.masterKey +'  //please keep master key in secret');
    console.log("dashboard URL: "+config.parseDashboardURI);
    console.log("dashboard username:" + appProfile.customer);
    console.log("dashboard password: "+dashboardPassword +'  //please keep this password in secret');
    console.log("---------------------------------------------------------");

    //show new customer information
}).catch(function (err) {
    return;
});
