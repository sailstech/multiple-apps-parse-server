var http = require('http'),
    httpProxy = require('http-proxy'),
    HttpProxyRules = require('http-proxy-rules');
var config = require("./config.json");
var rules={};
try{
    rules=require('./route-proxy.json');
} catch(err){
}

var proxyRules = new HttpProxyRules({
    rules:rules
});
console.log(proxyRules);
// Create reverse proxy instance
var proxy = httpProxy.createProxy();

// Create http server that leverages reverse proxy instance
// and proxy rules to proxy requests to different targets
http.createServer(function(req, res) {

    // a match method is exposed on the proxy rules instance
    // to test a request to see if it matches against one of the specified rules
    var target = proxyRules.match(req);
    if (target) {
        return proxy.web(req, res, {
            target: target
        });
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 not found');
}).listen(config.internalProxyPort);