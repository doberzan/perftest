const serveStatic = require('serve-static');
const fs = require("fs");
const $path = require('path');
var qs = require('querystring');
const http = require('http');
const finalhandler = require('finalhandler');
const payload = '<script id="script1" type="text/javascript" src="hack.js"></script></head>';
var port = 80;
var hostname = '127.0.0.1';
var reset = "\x1b[0m", green = "\x1b[32m", red = "\x1b[31m", blue = "\x1b[34m", black = "\x1b[1m" + "\x1b[30m";
var plus = (black + "[" + green + "+" + black +"]");
var appPath = "/Users/declan/Sencha/QuickStart/";
var agents = {}
var roots = {
    park: serveStatic( $path.resolve(__dirname, 'park'),{
        'index': ['index.html', 'index.htm']
    }),
    server: serveStatic(__dirname, {
        'index': ['index.html', 'index.htm']
    }),
    test1: serveStatic(appPath, {
        'index': ['index.html', 'index.htm']
    }),
    'messages': function(req, res){
          
    },
    '~api': function (req, res){
        if(req.method == 'POST'){
            if(req.url.startsWith('/cmd/')){
                cliHandler(req, res);
            }else if (req.url.startsWith('/park/')){
                commander(req, res, 60000);
            }
            else {
                console.log("Got response");
                agentResponseHandler(res, req);
            }
        }else{
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({ status: 'failed', formData: '~api/ only accepts post requests' }));
            return;
        }
    }
}


function getAgent (id) {
    return agents[id] || (agents[id] = {
        id: id,
        queue: [],
        pending: {},
        seq: 0
    });
}


function flushAgentMessage (agent) {
    if (agent.response) {
        var clientMessage = agent.queue.shift();
        if (clientMessage) {
            console.log(clientMessage.data.id);
            agent.pending[clientMessage.data.id] = clientMessage;
            agent.response.writeHead(200, {'Content-Type': 'application/json'});
            agent.response.end(JSON.stringify(clientMessage.data));
            agent.request = agent.response = null;
            return true;
        }
    }
    return false;
}


function agentResponseHandler(res, req){
    console.log(black + "\n============================================");
    console.log(blue +  "Received post at url: ", green + req.url);
    console.log(blue +  "Agent Info: ", green, req.headers["user-agent"]);
    console.log(reset);
    
    var requestBody = '';
    req.on('data', function(data) {
        requestBody += data;
    });

    req.on('end', function() {
        var reply = JSON.parse(requestBody);

        console.log(blue +  'Results after' + green, reply.length + blue + ' seconds.');
        console.log(green + "FPS Range: " + blue, reply);
        console.log(black + "============================================\n");
        console.log(reset);

        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({
            success: true,
            redirect: '/park/'
        }));
        //Tell CLI data
        console.log(agents);
        var agent = getAgent(reply.id);
        if (reply && reply.id) {
            console.log('========================');
            console.log(agents);
            var client = agent.pending[1];
            delete agent.pending[1];
            console.log(reply.data);
            client.response.end(reply.data);
        }
        agent.request = req;
        agent.response = res;
        flushAgentMessage(agent);

    });
}


function cliHandler(req, res){
    var msg = '';
    req.on('data', function(data) {
        msg += data;
    });
    req.on('end', function() {
        var cmdObj = JSON.parse(msg);
        var agent = getAgent(cmdObj.agent);
        console.log(black + "\n============================================");
        console.log(blue + "Received command to forward to client/s:", green + cmdObj.agent);
        console.log(blue + 'Queueing message:', green + msg);
        console.log(black + "============================================\n");
        console.log(reset);
        agent.queue.push({
            data: {
                id: ++agent.seq,
                type: cmdObj.cmd.type,  
                data: cmdObj.cmd.data
            },
            response: res,
            request: req
        });
        //console.log(agent.queue);
        flushAgentMessage(agent);
        //var agentRes = getAgent(agent.id).response;
        //agentRes.writeHead(200, {'Content-Type': 'application/json'});
        //agentRes.end(JSON.stringify({
        //  success: true,
        //  cmd:cmdObj.cmd
        //}));
    });
}


function commander(req, res, timeout){
    try{
        var id = /[?&]id=([^&]+)/.exec(req.url);
        id = id[1];
        agents[id] = {
            id:id,
            seq: 0,
            request:req,
            response:res,
            queue: [],
            pending: {}
        };
        setTimeout(function(){
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({
                            status: 'wait',
                            redirect: '/park/'
                        }));
            return console.log('reconnect');
        }, timeout);
    }catch(e){
        console.log('Bad client id!');
    }
}


function setup(){
    var serverServe = serveStatic(__dirname, {
        'index': ['index.html', 'index.htm']
    });
    var appServe = serveStatic(appPath, {
        'index': ['index.html', 'index.htm']
    });

    var server = http.createServer(function onRequest (req, res) {
        var match = /^\/([^\/]+)(\/.*)?/.exec(req.url);
        var root = match && roots[match[1]];
        if(!root){
            res.writeHead(302, {
                'Location': '/park/'
            });
            res.end();
        }else{
            req.url = match[2] || '/';
            root(req,res, finalhandler(req, res));
        }
    });
    
    server.listen(port, hostname, function(){
        return console.log(plus + blue + ' Started test server on' + green, hostname, blue+ 'at port' + green, port + reset);
        });
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




/*if (req.url == '/' || req.url == '/index.html') {
            var data = fs.readFileSync(__dirname + 'index.html','utf-8');
            var data2 = data.split('</head>');
            var finaldata = data2[0] + payload + data2[1];
            fs.writeFileSync('/Users/declan/Sencha/perftest/foo.html', finaldata);
            req.url = '/foo.html';
            serverServe(req,res, finalhandler(req, res));
        } else {
            appServe(req,res, finalhandler(req, res));
        }*/