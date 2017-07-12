const Command = require('switchit').Command;
const client = require('http');
const uuidv4 = require('uuid/v4');
const fs = require('fs');
function fetch(server, path, data){
    return new Promise(function(resolve, reject){
        let post_data = JSON.stringify(data);
        let post_options = {
            host: server,
            port: '8080',
            path: path,
            method: 'POST',
            headers: {  
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(post_data)
            }
        };
        let post_req = client.request(post_options, function(res) {
            res.setEncoding('utf8');
            let responseBody = '';
            res.on('data', function (chunk) {
                responseBody += chunk;
            });
            
            res.on('end', function () {
                try{
                    console.log(responseBody);
                    let j = JSON.parse(responseBody);
                    resolve(j);
                }catch(e){
                    resolve(undefined);
                    console.log(e);
                    console.log('Failed to parse:', responseBody);
                }
            });
        });

        post_req.write(post_data);
    });

}


let testPages = {
    test1: '/test1/',
    scrollDown: '/test1/'
}

function runTestSequence(agent, tests, server, testPage){
    let results = {};
    let agentUuid = uuidv4();
    let promise = fetch(server, '/~api/cmd/', {
        agent:agent,
        cmd:{
            type:'redirect',
            data:testPages[testPage] + '?id=' + agentUuid
        }
    })
    for(let test of tests){
        promise = promise.then(function(data){
            return fetch(server, '/~api/cmd/',{
                agent:agentUuid,
                cmd:{
                    type:test,
                    data:test
                }
            }).then(function(data){
                results[test] = data;
            });
        });
    }
    return promise.then(function(){
        return fetch(server, '/~api/cmd/',{
            agent:agentUuid,
            cmd:{
                type:'redirect',
                data:'/park/?id=' + agent
            }
        }).then(function(){
            return results;
        });
    })

}

function runTest(results, agent, test, server){
    //generate id for test agent uuid  (goto /test/?id='uuid')
    //tell parked agent to go to place to do a test
    let agentUuid = uuidv4();
    console.log('Sending agent \'' + agent + '\' with uuid: \'' +  agentUuid + '\' to run test: ' + '\'' + test + '\'');
    return fetch(server, '/~api/cmd/', {
        agent:agent,
        cmd:{
            type:'redirect',
            data:testPages[test] + '?id=' + agentUuid
        }
    }).then(function(data){
        //connect back to hack.js
        //tell test agent to run test
        return fetch(server, '/~api/cmd/',{
            agent:agentUuid,
            cmd:{
                type:test,
                data:test
            }
        }
        ).then(function(data){
            //tell agent to redirect to park
            results[test] = agent;
            return fetch(server, '/~api/cmd/',{
                agent:agentUuid,
                cmd:{
                    type:'redirect',
                    data:'/park/?id=' + agent
                }
            }).then(function(){
                console.log('done')
            });
        })
    })
    
}

function runTests(agents, tests, server, testPage){
    agents = agents.split(',');
    tests = tests.split(',');
    let all = [];
    let results = {};
    //for(let test of tests){
       // for(let agent of agents){
           // all.push(runTest(results, agent, test, server));
        //}
    //}
    for(let agent of agents){
        all.push(runTestSequence(agent, tests, server, testPage).then(function(agentResults){
            results[agent] = agentResults;
        }));
    }
    return Promise.all(all).then(function(){
        return results;
    });
}

class sendCMD extends Command {
    execute (params) {
        if(params.test == 'list'){
            fetch(params.server, '/~api/cmd/',{
                cmd:{
                    type:params.test,
                    data:params.test
                }
            }).then(function(data){ 
                console.log(data)
            });
        }else{
            let logfile = fs.createWriteStream('RESULTS.md', {
                flags: 'a'
            })
            return runTests(params.agent, params.test, params.server, params.testpage).then(function(results){
                //logfile.write('## \t' + h + ':' + minutes + ':' + sec + ' ' + m + '/' +  d + '/' + y + '\n');
                console.log(results);
                for(let agent in results) {
                    logfile.write('# ' + agent + '\n');
                    console.log('# ' + agent);
                    for(let test in results[agent]){
                        var a = results[agent];
                        console.log('## ' + test);
                        console.log(' - ' + 'MIN: ' + a[test].min);
                        console.log(' - ' + 'AVG: ' + a[test].avg);
                        console.log(' - ' + 'FPS: ' + JSON.stringify(a[test].fps) + '\n');
                        logfile.write('## ' + test + '\n');
                        logfile.write(' - ' + 'MIN: ' + a[test].min + '\n');
                        logfile.write(' - ' + 'AVG: ' + a[test].avg + '\n');
                        logfile.write(' - ' + 'FPS: ' + JSON.stringify(a[test].fps) + '\n\n');
                    }
                }
            });
        }
    }
}

sendCMD.define({
    switches: ['server', 'agent' , 'test', 'testpage'],
    parameters: ['server', 'agent', 'test', 'testpage']
});

new sendCMD().run();