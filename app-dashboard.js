var express = require('express');
var config = require('./config.json');
var dashboards={};
try{
    dashboards=require('./dashboards.json');
} catch(err){
    return false;
}
var fs = require('fs');
// parse server dashbaord
var allowInsecureHTTP = true;
var ParseDashboard = require('parse-dashboard');

var dashboard = new ParseDashboard(dashboards,allowInsecureHTTP);

var appParseDashboard = express();

appParseDashboard.use('/', dashboard);

var httpServer = require('http').createServer(appParseDashboard);
httpServer.listen(config.parseDashboard.port);