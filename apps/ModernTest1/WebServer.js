const serveStatic = require('serve-static');
const fs = require("fs");
const http = require('http');
const finalhandler = require('finalhandler');
const payload = '<script id="script1" type="text/javascript" src="hack.js"></script></head>'
var port = 80;
var hostname = '127.0.0.1';

function setup(){
  var serve = serveStatic('/Users/declan/Sencha/QuickStart/', {
    'index': ['index.html', 'index.htm']
  })

  var server = http.createServer(function onRequest (req, res) {

    if(req.url == '/' || req.url == '/index.html'){
      var data = fs.readFileSync('/Users/declan/Sencha/QuickStart/index.html','utf-8');
      var data2 = data.split('</head>');
      var finaldata = data2[0] + payload + data2[1];
      fs.writeFileSync('/Users/declan/Sencha/QuickStart/foo.html', finaldata);
      req.url = '/foo.html';
    }

    serve(req,res, finalhandler(req, res));
  })

  server.listen(port, hostname, function(){return console.log('Started server on ', hostname, ' at port ', port)});
}

if(process.argv.length < 4) {
    console.log('[!] Not enough arguments! Syntax: node WebServer.js <hostname> <port>');
  }else {
    hostname = process.argv[2];
    port = process.argv[3];
    setup();
  }
