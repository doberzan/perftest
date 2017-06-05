const serveStatic = require('serve-static');
const fs = require("fs");
var qs = require('querystring');
const http = require('http');
const finalhandler = require('finalhandler');
const payload = '<script id="script1" type="text/javascript" src="hack.js"></script></head>'
var port = 80;
var hostname = '127.0.0.1';
var reset = "\x1b[0m", green = "\x1b[32m", red = "\x1b[31m", blue = "\x1b[34m", black = "\x1b[1m" + "\x1b[30m";
var plus = (black + "[" + green + "+" + black +"]");

function getData(req, res){
    console.log(black + "\n============================================");
    console.log(blue + "Received post at url: ", green + req.url);
    console.log(blue + "Agent Info: ", green, req.headers["user-agent"]);
    console.log(reset);
    if (req.url === "/index.html" || req.url === "/") {
        var requestBody = '';
        req.on('data', function(data) {
            requestBody += data;
        });

        req.on('end', function() {
            var formData = JSON.parse(requestBody);
            console.log(blue + 'Results after' + green, formData.length + blue + ' seconds.')
            console.log(green + "FPS: " + blue, requestBody);
            console.log(black + "============================================\n");
            console.log(reset);
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({
                success: true
            }));
        });
    } else {
        console.log(red+"Sending 404");
        console.log(reset);
        res.writeHead(404, 'Resource Not Found', {'Content-Type': 'text/html'});
        res.end('Error');
    }
}



function setup(){
    var serve = serveStatic(__dirname, {
        'index': ['index.html', 'index.htm']
    })

    var server = http.createServer(function onRequest (req, res) {

        if(req.method === "POST") {
            getData(req, res);
            return;
        } 
        if (req.url == '/' || req.url == '/index.html') {
            var data = fs.readFileSync(__dirname + 'index.html','utf-8');
            var data2 = data.split('</head>');
            var finaldata = data2[0] + payload + data2[1];
            fs.writeFileSync('/Users/declan/Sencha/perftest/foo.html', finaldata);
            req.url = '/foo.html';
        }
        serve(req,res, finalhandler(req, res));
    });
    
    server.listen(port, hostname, function(){return console.log(plus + blue + ' Started test server on' + green, hostname, blue+ 'at port' + green, port + reset)});
  }

if (process.argv.length < 4) {
    console.log(red + '[!] Not enough arguments! Syntax: node WebServer.js <hostname> <port>');
    console.log(reset);
} else {
    hostname = process.argv[2];
    port = process.argv[3];
    setup();
    console.log(reset);
}