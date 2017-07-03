var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var index = require('./routes/index');
var users = require('./routes/users');

var app = express();
// config
var config = require('./config');

// parse server
var ParseServer = require('parse-server').ParseServer;
var appParseServer = express();

var api = new ParseServer({
    appName:config.param.parseServer.appName,
    databaseURI: config.param.parseServer.databaseURI, // Connection string for your MongoDB database
    cloud: config.param.parseServer.cloud, // Absolute path to your Cloud Code
    appId: config.param.parseServer.appId,
    masterKey: config.param.parseServer.masterKey, // Keep this key secret!
    serverURL: config.param.parseServer.serverURL // Don't forget to change to https if needed
});

appParseServer.use('/parse', api);

appParseServer.listen(config.param.parseServer.port, function() {
    console.log('parse-server running on port '+config.param.parseServer.port);
});

// parse server dashbaord
var allowInsecureHTTP = true;
var ParseDashboard = require('parse-dashboard');
var dashboard = new ParseDashboard({
    "apps": [
        {
            "serverURL": config.param.parseServer.serverURL,
            "appId": config.param.parseServer.appId,
            "masterKey": config.param.parseServer.masterKey,
            "appName": config.param.parseServer.appName
        }
    ],
    "users": [
        {
            "user":config.param.parseServerDashboard.user,
            "pass":config.param.parseServerDashboard.password
        }
    ],
    "useEncryptedPasswords": false
},allowInsecureHTTP);
var appParseDashboard = express();

appParseDashboard.use('/', dashboard);

var httpServer = require('http').createServer(appParseDashboard);
httpServer.listen(config.param.parseServerDashboard.port);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
