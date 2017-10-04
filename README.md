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
 * [Parse Server](https://github.com/parse-community/parse-server) 
 * [Parse Server Dashboard](https://github.com/parse-community/parse-dashboard) 
 * each parse app has different port and use [node-http-proxy](https://github.com/nodejitsu/node-http-proxy) to handle port route.


## Install
* add config.json (can copy from config_sample.json) 

```
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
```
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

## PM2 Script File
* initial.json - route-proxy and parse-dashboard
* appServers.json - all parse apps

There are two processes in inital.json, one is route-proxy, the other is parse-dashboard,
to start/stop/kill these two processes, 
```
pm2 start/stop/kill initial.json
```
appServers.json contains all parse apps processes, To start/stop/kill all parse apps, 
```
pm2 start/stop/kill appServers.json
```

## Performance 
### pm2 status at a glance
```
┌─────────────────┬────┬──────┬───────┬────────┬─────────┬────────┬─────┬───────────┬─────────┬──────────┐
│ App name        │ id │ mode │ pid   │ status │ restart │ uptime │ cpu │ mem       │ user    │ watching │
├─────────────────┼────┼──────┼───────┼────────┼─────────┼────────┼─────┼───────────┼─────────┼──────────┤
│ firstapp        │ 0  │ fork │ 65458 │ online │ 0       │ 52s    │ 0%  │ 73.9 MB   │ richard │ enabled  │
│ parse-dashboard │ 2  │ fork │ 65564 │ online │ 2       │ 37s    │ 0%  │ 53.4 MB   │ richard │ disabled │
│ parse-route     │ 1  │ fork │ 65561 │ online │ 2       │ 37s    │ 0%  │ 40.6 MB   │ richard │ disabled │
│ secondapp       │ 3  │ fork │ 65485 │ online │ 0       │ 44s    │ 0%  │ 74.9 MB   │ richard │ enabled  │
│ thirdapp        │ 4  │ fork │ 65533 │ online │ 0       │ 38s    │ 3%  │ 76.5 MB   │ richard │ enabled  │
└─────────────────┴────┴──────┴───────┴────────┴─────────┴────────┴─────┴───────────┴─────────┴──────────┘

```
each app occupies around 70MB memory size when no traffic. The 4-GB ram size server can handle at least 40 low-traffic 
parse apps.




## Clean environment
if you are in development stage, and need to have a clean environment. 
previous generated apps are not needed anymore. you can do 
```sh
 ./cleanenv.sh
```

all the process will be deleted and all the parse apps are also delete. (the data in mongodb still be remained)
