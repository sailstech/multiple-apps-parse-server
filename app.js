var express = require('express');

// config
var config = {};
if(process.env.app) {
    config = require('./configs/'+process.env.app);
}
if(!config.enable) {
    console.log(config.app+" is disabled!");
    return false;
}
var globalConfig = require('./config.json');

// parse server s3 adapter
var S3Adapter = require('parse-server-s3-adapter');

// parse server
var ParseServer = require('parse-server').ParseServer;
var appParseServer = express();

var api = new ParseServer({
    appName:config.app,
    databaseURI: config.parseServer.databaseURI, // Connection string for your MongoDB database
    collectionPrefix:config.parseServer.appId,
    cloud: config.parseServer.cloud, // Absolute path to your Cloud Code
    appId: config.parseServer.appId,
    masterKey: config.parseServer.masterKey, // Keep this key secret!
    serverURL: config.serverURL+":"+config.parseServer.port+"/", // Don't forget to change to https if needed
    publicServerURL: config.publicServerURL+"/",
    logsFolder:'./logs/'+config.app+"/",
    filesAdapter: (process.env.AWS_ACCESS_KEY_ID ? new S3Adapter(globalConfig.S3FilesAdapter.bucket) : null)
});


appParseServer.use('/', api);

appParseServer.listen(config.parseServer.port, function() {
    console.log('parse-server running on port '+config.parseServer.port);
});

module.exports = appParseServer;
