const serveStatic = require('serve-static');
const fs = require("fs");
const $path = require('path');
const qs = require('querystring');
const http = require('http');
const finalhandler = require('finalhandler');
const Agent = require('./Agent.js');

const payload = '<script id="script1" type="text/javascript" src="hack.js"></script></head>';
let port = 8080;
let hostname = '127.0.0.1';
let reset = "\x1b[0m", green = "\x1b[32m", red = "\x1b[31m", blue = "\x1b[34m", black = "\x1b[1m" + "\x1b[30m";
let plus = (black + "[" + green + "+" + black +"]");
let appPath = "/Users/declan/Sencha/QuickStart/";
let logfile = fs.createWriteStream('/Users/declan/Sencha/perftest/ServerLog.log', {
    flags: 'a'
})
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
    'messages': function(req, res){
          
    },
    '~api': function (req, res){
        if(req.method == 'POST'){
            let date = new Date();
            let time = ('\n' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds())
          
            if(getFilesizeInBytes('/Users/declan/Sencha/perftest/ServerLog.log') > 1049 * 1000 * 10000){ //10MB
                var readStream = fs.createReadStream('/Users/declan/Sencha/perftest/ServerLog.log', 'utf8');
                var data;
                readStream.on('data', function(chunk) {  
                    data += chunk;
                }).on('end', function() {
                    cutLog(data);
                });
            }

            logfile.write(time + " Agent Connected: " + req.headers["user-agent"]);

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

function cutLog(data){
    var text = data;
    var logtext = text.split('\n');
    var writeStream = fs.createWriteStream('/Users/declan/Sencha/perftest/ServerLog.log', {
        flags: 'w'
    })
    var num = 2000;
    for(var line of logtext){
        if(num != 0){
            num --;
        }else{
            writeStream.write(line + '\n');
        }
    }
}

function getFilesizeInBytes(filename) {
    const stats = fs.statSync(filename)
    const fileSizeInBytes = stats.size
    return fileSizeInBytes
}



function commander(req, res){
    try {
        let id = /[?&]id=([^&]+)/.exec(req.url);
        id = id[1];
        let agent = Agent.get(id);
        let requestBody = '';
        req.on('data', function (data) {
            requestBody += data;
        });

        req.on('end', function () {
            let reply = JSON.parse(requestBody);
            console.log('reply finish:', reply);
            //Tell CLI data
            if (reply && reply.id) {
                let client = agent.pending[reply.id];
                delete agent.pending[reply.id];
                client.clientResponse.writeHead(200, {'Content-Type': 'application/json'});
                client.clientResponse.end(JSON.stringify(reply.data));
            }

            agent.request = req;
            agent.response = res;

            if(reply.finish){
                agent.sendWait();
            }else {
                console.log('flushed by response not finished')
                agent.flush();
            }
        });
    }catch(e){
        console.log("Not a url...")
    }
}


function cliHandler(req, res){
    let msg = '';
    req.on('data', function(data) {
        msg += data;
    });
    req.on('end', function() {
        cliForwardMSG(msg, res, req);
    });
}

function cliForwardMSG(msg, res, req){
    let cmdObj = JSON.parse(msg);
    let agent = Agent.get(cmdObj.agent);
    if(cmdObj.cmd.type == 'list'){
        res.writeHead(200, {'Content-Type': 'application/json'});
        agentsByID = [];
        for(a in Agent.all){
            if(Agent.all[a].id){
                agentsByID.push(Agent.all[a].id);
            }
        }
        res.end(JSON.stringify(agentsByID));
    }else if(cmdObj.cmd.type == 'serve'){
        console.log(cmdObj.cmd.data);
        fs.access(cmdObj.cmd.data, function(e){
            if(e){
                console.error('Directory does not exist!');
            }else{
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end(JSON.stringify('Failed no such directory!'));
            }
        })
        roots[cmdObj.cmd.buildUuid] = serveStatic(cmdObj.cmd.data, {
            'index': ['index.html', 'index.htm']
        });
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify('Serving directory...'));
        
    }else{
        agent.queue.push({
            data: {
                id: ++agent.seq,
                type: cmdObj.cmd.type,  
                data: cmdObj.cmd.data
            },
            clientResponse: res,
            clientRequest: req
        });
        console.log('Added ' + JSON.stringify({
                id: ++agent.seq,
                type: cmdObj.cmd.type,  
                data: cmdObj.cmd.data
            }) + ' to queue ' + agent.id);
            function abc (){
                var list = [];
                for(var a in agent.queue){
                   list.push(a.data);
                }
                return list;
            }
            console.log('Queue: ' + JSON.stringify(abc()));
        //make sure agent is here before sending
        console.log('flushed by cli')
        agent.flush();
        let date = new Date();
        let time = ('\n' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds())
        logfile.write(time + ' Sent agent \'' + cmdObj.cmd.type + '\'');
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