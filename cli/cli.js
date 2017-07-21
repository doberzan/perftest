const Command = require('switchit').Command;
const client = require('http');
const uuidv4 = require('uuid/v4');
const fs = require('fs');
var exec = require('child_process').exec;


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
            },
            timeout: 500 * 100
        };
        let post_req = client.request(post_options, function(res) {
            res.setEncoding('utf8');
            let responseBody = '';
            res.on('data', function (chunk) {
                responseBody += chunk;
            });
            
            res.on('end', function () {
                try{
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


function serveBuild(server, buildPath, buildUuid){
    var path = __dirname +'/'+ buildPath;
    console.log(path);
    return fetch(server, '/~api/cmd/',{
        cmd:{
            type:'serve',
            data:path,
            buildUuid:buildUuid
        }
    });
}

function runTestSequence(agent, tests, server, app, buildUuid){
    let results = {};
    let agentUuid = uuidv4();
    let promise = fetch(server, '/~api/cmd/', {
        agent:agent,
        cmd:{
            type:'redirect',
            data:'/' + buildUuid + '/' + '?id=' + agentUuid
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
function runTests(agents, tests, server, app){
    agents = agents.split(',');
    tests = tests.split(',');
    let all = [];
    let results = {};
    let buildUuid = uuidv4();
    testPages[buildUuid] = app;
    return serveBuild(server, testPages[buildUuid], buildUuid).then(function(c){
        for(let agent of agents){
            all.push(runTestSequence(agent, tests, server, app, buildUuid).then(function(agentResults){
                results[agent] = agentResults;
            }));
        }
        return Promise.all(all).then(function(){
            return results;
        });
    });
}

class sendCMD extends Command {
    execute (params) {
        if(params.tests == 'listagents'){
            fetch(params.server, '/~api/cmd/',{
                cmd:{
                    type:'list',
                    data:params.test
                }
            }).then(function(data){
                console.log(data);
            });
        }else{
            let logfile = fs.createWriteStream('RESULTS.md')
            fs.access(params.app, function(e){
                if(e){
                    console.error('WebApp does not exist');
                    return false;
                }
            });
            return runTests(params.agents, params.tests, params.server, params.app).then(function(results){
                for(let agent in results) {
                    logfile.write('# ' + agent.toUpperCase() + '\n');
                    console.log('# ' + agent.toUpperCase());
                    //console.log('# ' + 'FrameWork Load Time: ' + results[agent].)
                    for(let test in results[agent]){
                        var a = results[agent];
                        if(a[test].comment){
                            console.log(' - ' + 'COMMENTS: ' + a[test].comment);
                            logfile.write(' - ' + 'COMMENTS: ' + a[test].comment + '\n');
                        }
                        var fps = a[test].avg;
                        console.log(`##teamcity[buildStatisticValue key='<${agent}.fps>' value='${fps}']`);

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
                
                logfile.end();
            });
        }
    }
}

sendCMD.define({
    switches: ['server', 'agents' , 'tests' , 'app'],
    parameters: ['server', 'agents', 'tests', 'app']
});

new sendCMD().run();