const Command = require('switchit').Command;
const client = require('http');

function fetch(server, path, data){
    return new Promise(function(resolve, reject){
        var post_data = JSON.stringify(data);
        var post_options = {    
            host: server,
            port: '80',
            path: path,
            method: 'POST',
            headers: {  
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(post_data)
            }
        };
        var post_req = client.request(post_options, function(res) {
            res.setEncoding('utf8');
            var responceBody = '';
            res.on('data', function (chunk) {
                responceBody += chunk;
            });
            
            res.on('end', function () {
                var j = JSON.parse(responceBody);
                resolve(j);
            });
        });

        post_req.write(post_data);
        post_req.end();
    });

}

function runTest(resualts, agent, test){
    //generate id for test agent uuid  (goto /test1/?id='uuid')
    //tell parked agent to go to place to do a test
    return fetch(params.server, '/~api/cmd/', {
        agent:params.agent,
        cmd:{
            type:params.cmd,
            data:params.args
        }
    }).then(function(){
        //tell test agent to run test
        return fetch(
            //agent:uuid
        ).then(function(data){
            console.log(data);
            resualts[agent] = data;
            return fetch("redirect test agent to parking lot");
        })
    })
}

function runTests(agents, test){
    agents = agents.split(',');
    var all = [];
    var resualts = {};
    for(var agent of agents){
        all.push(runTest(resualts, agent, test));
    }
    return Promise.all(all).then(function(){
        return resualts;
    });
}

class sendCMD extends Command {
    execute (params) {
        //runTests(stuff).then(function(resualts){});
        return fetch(params.server, '/~api/cmd/', {
            agent:params.agent,
            cmd:{
                type:params.cmd,
                data:params.args
            }
        }).then(function(response){
            if(response.status == 'ok'){
                    console.log(response.formData);
                }else if(response.status == 'failed'){
                    console.log('[Error] No client by that id!');
                }
        });
    }
}

sendCMD.define({
    switches: ['server', 'agent', 'cmd', 'args'],
    parameters: ['server', 'agent', 'cmd', 'args']
});

new sendCMD().run();//.then(function (){
    //
//}, 
//function (e){
//  console.log(e.message)
//});