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

function runTest(resualts, agent, test, server){
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
            resualts[agent] = data;
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
    let resualts = {};
    for(let agent of agents){
        all.push(runTest(resualts, agent, tests, server));
    }
    return Promise.all(all).then(function(){
        return resualts;
    });
}

class sendCMD extends Command {
    execute (params) {
        let logfile = fs.createWriteStream('results.log', {
            flags: 'a'
        })

        return runTests(params.agent, params.test, params.server).then(function(results){
            console.log('=======================RAW RESULTS=======================');
            console.log(JSON.stringify(results));
            console.log('======================================================');
            logfile.write('\n\n####################################################');
            logfile.write('\nTest: ' + params.test + '\n');
            logfile.write('Raw Results: ' + JSON.stringify(results));
            logfile.write('\n\n______Averaged Results______\n');
            console.log('\n______Averaged_____\n');
            for(let i in results) {
                logfile.write('- ' + i + ': ');
                console.log('- ' + i + ': ');
                let sum = 0;
                for (let j of results[i].fps) {
                    sum += j;
                }
                let average = sum / results[i].fps.length;
                logfile.write(average + ' fps\n');
                console.log(average + ' fps\n');
            }
            logfile.write('####################################################');

        });
    }
}

sendCMD.define({
    switches: ['server', 'agent' , 'test'],
    parameters: ['server', 'agent', 'test']
});

new sendCMD().run();