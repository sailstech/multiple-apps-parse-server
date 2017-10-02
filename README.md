# Multiple Apps Parse Server

## Objective
 * run and manage multiple parse apps (instances) in **a server** and using **a single port**.
 * one code, one database, create a parse app in one second.
 * parse dashboard integrated, each app's manager can log into parse dashboard to manage their app. 
 * one admin account in parse dashboard to manage all apps


## Prerequisites
 * Node.JS 4.8.0 or above
 * MongoDB (if run in local)
 * pm2 

## Architecture
 * use Node.JS + Express
 * [Parse Server](https://github.com/parse-community/parse-server) 
 * [Parse Server Dashboard](https://github.com/parse-community/parse-dashboard) 
 * each parse app has different port and use [node-http-proxy](https://github.com/nodejitsu/node-http-proxy) to handle port route.


## Install
* add config.json (can copy from config_sample.json) 

```json
{
  "portFrom":1337, //the port of the first app will be started from 1337 
  "maxInstances":100, //maxiumum number of parse apps (<100 is suggested)  

  "parseDashboardURI":"https://app.xxx.com:4040", //parse server dashboard public uri
  "globalURI":"https://app.xxx.com",   //parse server public uri
  "databaseURI":"mongodb://localhost:27017/",  //parse server mongodb uri
  "cloudCodeFolder":"./cloudcode/", //parse server cloud code folder, the main.js will be auto created in the sub-folder(named by customer)
  "internalProxyPort":3000, 
  "S3FilesAdapter":{ //parse server s3 file adapter
    "bucket":"xxxx",
    "accessKey":"xxx",
    "secretKey":"xxxx"
  },
  "parseDashboard":{  //parse server dashboard settings
    "port":4040
  }
}
```

* install node modules and pm2

```sh
 npm install
```

```sh
 sudo npm install pm2 -g  
```

* create the first parse app
```sh
 customer=firstapp node newInstance.js

```
newInstance will auto start several processes by using pm2.
 If successfully, you will see
```sh
This is firstly start parse dashboard, admin is created.
---------------------------------------------------------
dashboard URL: https://app.xxx.com:4040
username: admin
password: *******************
---------------------------------------------------------
No.1 parse server instance is created!
The customer information is shown as following, you can copy & paste to your customer
---------------------------------------------------------
api URL: https://app.xxx.com/firstapp
application id: ***rEIIPpggXbKJCy***
master key: ***ZepMVqJMRGuuXd***  //please keep master key in secret
dashboard URL: https://app.xxx.com:4040
dashboard username:firstapp
dashboard password: **********  //please keep this password in secret
---------------------------------------------------------
```
 if you want to test locally, try `http://localhost:3000/firstapp` for the first app parse server and
 `http://localhost:4040` for parse dashboard.
 
 you can create the second app by `customer=secondapp node newInstance.js`, and so on.
  
* cloud code monitoring
   
we use pm2 watch method to monitor the change of cloud code folder, therefore,
 once the main.js or other files in the folder are modified, the corresponding parse app will be restart.
Each app developer can deploy their cloud code by using git server(not include here).
* set load balance or dns server to your own domain, then enjoy!

## Clean environment
if you are in development stage, and need to have a clean environment. 
previous generated apps are not needed anymore. you can do 
```sh
 ./cleanenv.sh
```

all the process will be deleted and all the parse apps are also delete. (the data in mongodb still be remained)