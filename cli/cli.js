const Command = require('switchit').Command;
const client = require('http');
const uuidv4 = require('uuid/v4');
const fs = require('fs');
function fetch(server, path, data){
    return new Promise(function(resolve, reject){
        let post_data = JSON.stringify(data);
        let post_options = {
            host: server,
            port: '80',
            path: path,
            method: 'POST',
            headers: {  
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(post_data)
            }
        };
        let post_req = client.request(post_options, function(res) {
            res.setEncoding('utf8');
            let responceBody = '';
            res.on('data', function (chunk) {
                responceBody += chunk;
            });
            
            res.on('end', function () {
                try{
                let j = JSON.parse(responceBody);
                resolve(j);
                }catch(e){
                    console.log('Failed to parse:',responceBody);
                }
            });
        });

        post_req.write(post_data);
    });

}


let testPages = {
    test1: '/test1/',
    test2: '/test2/'
}

function runTest(results, agent, test, server){
    //generate id for test agent uuid  (goto /test/?id='uuid')
    //tell parked agent to go to place to do a test
    let agentUuid = uuidv4();

    return fetch(server, '/~api/cmd/', {
        agent:agent,
        cmd:{
            type:'redirect',
            data:testPages[test] + '?id=' + agentUuid
        }
    }).then(function(){
        //connect back to hack.js
        //tell test agent to run test
        console.log(agentUuid);
        return fetch(server, '/~api/cmd/',{
            agent:agentUuid,
            cmd:{
                type:test,
                data:test
            }
        }
        ).then(function(data){
            //tell agent to redirect to park
            results[agent] = data;
            return fetch(server, '/~api/cmd/',{
                agent:agentUuid,
                cmd:{
                    type:'redirect',
                    data:'/park/?id=' + agent
                }
            });
        })
    })
}

function runTests(agents, tests, server){
    agents = agents.split(',');
    tests = tests.split(',');
    let all = [];
    let results = {};
    for(let agent of agents){
        all.push(runTest(results, agent, tests, server));
    }
    return Promise.all(all).then(function(){
        return results;
    });
}

class sendCMD extends Command {
    execute (params) {
        let logfile = fs.createWriteStream('RESULTS.md', {
            flags: 'a'
        })

        return runTests(params.agent, params.test, params.server).then(function(results){
            const date = new Date();
            let h = date.getHours();
            let m = date.getMonth();
            let minutes = date.getMinutes();
            let sec = date.getSeconds();
            let d = date.getDay();
            let y = date.getFullYear();
            console.log('=======================RAW RESULTS=======================');
            console.log(JSON.stringify(results));
            console.log('======================================================');
            logfile.write('# ' + params.test + '\n');
            //logfile.write('## \t' + h + ':' + minutes + ':' + sec + ' ' + m + '/' +  d + '/' + y + '\n');
            for(let i in results) {
                logfile.write('## ' + i + ': \n');
                logfile.write(' - ' + 'MIN: ' + results[i].min + '\n');
                logfile.write(' - ' + 'AVG: ' + results[i].avg + '\n');
                logfile.write(' - ' + 'FPS: ' + JSON.stringify(results[i].fps) + '\n\n');
            }
        });
    }
}

sendCMD.define({
    switches: ['server', 'agent' , 'test'],
    parameters: ['server', 'agent', 'test']
});

new sendCMD().run();