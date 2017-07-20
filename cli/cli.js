const Command = require('switchit').Command;
const client = require('http');
const uuidv4 = require('uuid/v4');
const fs = require('fs');
<<<<<<< HEAD
const util = require('util');
const { exec } = require('child_process');
=======
var exec = require('child_process').exec;

function buildApp(apppath, frameworkpath){
    return execCommand(`cd ${apppath} && sencha app install --framework=${frameworkpath}`).then(function(){
        return execCommand(`cd ${apppath} && sencha app build`);
    });
}

function execCommand(cmd){
    return new Promise(function(resolve, reject){
        var child = exec(cmd);
        child.stdout.setEncoding('utf8');
        var data = [];
        child.stdout.on('data', (chunk) => {
            chunk = chunk.replace('\n', '');
            data.push(chunk);
            console.log(chunk);
        });
        child.stdout.on('error', function(err){
            console.log(err);
            reject(err);
        });
        child.on('close', (code) => {
            console.log(`child process exited with code ${code}`);
            //console.log(data);
        });
        resolve(data);
    });
};
>>>>>>> e21368cdf899d7875e06faf0b995e2e25381e3e9

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
    return fetch(server, '/~api/cmd/',{
        cmd:{
            type:'serve',
            data:buildPath,
            buildUuid:buildUuid
        }
    });
}

<<<<<<< HEAD
//build framework
exec(`cd ${path} & sencha app install --framework=${frameworkpath} & sencha app build`, (err, stdout, stderr) => {
  if (err) {
    // node couldn't execute the command
    return;
  }
  console.log(`stdout: ${stdout}`);
});

function runTestSequence(agent, tests, server, build, buildUuid){
=======
function runTestSequence(agent, tests, server, framework, buildUuid){
>>>>>>> e21368cdf899d7875e06faf0b995e2e25381e3e9
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
function runTests(agents, tests, server, framework, app){
    agents = agents.split(',');
    tests = tests.split(',');
    let all = [];
    let results = {};
    let buildUuid = uuidv4();
    testPages[buildUuid] = framework;
    buildApp(app, framework);
    return serveBuild(server, testPages[buildUuid], buildUuid).then(function(c){
        for(let agent of agents){
            all.push(runTestSequence(agent, tests, server, framework, buildUuid).then(function(agentResults){
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
            let logfile = fs.createWriteStream('/Users/declan/Sencha/perftest/cli/RESULTS.md')
            fs.access(params.framework, function(e){
                if(e){
                    console.error('Framework does not exist');
                    return false;
                }
            });
            return runTests(params.agents, params.tests, params.server, params.framework).then(function(results){
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
    switches: ['server', 'agents' , 'tests', 'framework', 'app'],
    parameters: ['server', 'agents', 'tests', 'framework', 'app']
});

new sendCMD().run();