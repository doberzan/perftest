const Command = require('switchit').Command;
const client = require('http');
const uuidv4 = require('uuid/v4');
const fs = require('fs');
const math = require('mathjs');

function fetch(server, path, data){
    return new Promise(function(resolve, reject){
        try{
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
                        reject('failed');
                        console.log(e);
                        console.log('Failed to parse:', responseBody);
                    }
                });
            }).on('error', function(e) {
                reject('failed');
                console.log("Got error: " + e.message);
            });;

            post_req.write(post_data);
        }catch(e){
            console.log(e);
            reject('failed');
        }
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

function runTestSequence(agent, tests, server, app, buildUuid){
    let results = {};
    let agentUuid = uuidv4();
    try{
        let promise = fetch(server, '/~api/cmd/', {
            agent:agent,
            cmd:{
                type:'redirect',
                data:'/' + buildUuid + '/' + '?id=' + agentUuid
            }
        }).then(function(data){
           // console.log(data)
        }, function(err){
            console.log('nope');
            return 'failed';
        });
        if(promise == 'failed'){
                return results;
        }
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
                }, function(err){
                    throw err;
                    console.log('nope2');
                    results[test] = {
                        min:0,
                        avg:0,
                        fps:[0],
                        load:0,
                        comment:'Lost connection to agent'
                    };
                    return {
                        min:0,
                        avg:0,
                        fps:[0],
                        load:0,
                        comment:'Lost connection to agent'
                    };
                });
            }, function(err){
                results[test] = {
                        min:0,
                        avg:0,
                        fps:[0],
                        load:0,
                        comment:'Lost connection to agent'
                    };
                console.log('nope3');
                throw err;
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
            }, function(err){
                console.log('nope4');
                throw err;
                    return {
                        min:0,
                        avg:0,
                        fps:[0],
                        load:0,
                        comment:'Lost connection to agent'
                    };
            });
        })
    }catch(e){
        console.log('nope5');
        console.log("Lost connection to agent " + agent + "!");
        promise = results;
        return promise;
    }
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


function getHistory(){
    try{
        let rawdata = fs.readFileSync('results.json', 'utf8');
        let data = JSON.parse(rawdata);
        return data.history || {};
    }catch(e){
        console.log('Failed to read results.json: ', e);
        return {};
    }
}

function updateHistory(results, history){
    var raw = results;
    for(var agent in raw){
       var ha = history[agent] || (history[agent] = {}); 
       var ra = raw[agent];
       console.log("Agent:", ra)
        for(var test in ra){
            console.log(test);
            var ht = ha[test] || (ha[test] = {});
            var rtest = ra[test];
            for(var result in rtest){
                console.log(result);
                var hr = ht[result] || (ht[result] = [])
                var rr = rtest[result];
                if(hr.length >= 100){
                    hr.shift();
                }
                hr.push(rr);
                
            }
        }
    }
    return history;
}
function compareResultToHistory(results){
    let history = getHistory();
    let raw = results;
    let resultfile = fs.createWriteStream('results.md');
    for(var agent in raw){
       var ha = history[agent] || (history[agent] = {}); 
       var ra = raw[agent];
        for(var test in ra){
            var ht = ha[test] || (ha[test] = {});
            var rtest = ra[test];
            for(var result in rtest){
                if(ht[result]){
                    if(ht.fps && result !== ht.comments){
                        var hr = ht[result]
                        var rr = rtest[result];
                        let hrstd = math.std(hr);
                        console.log(hr, " ::: ", result);
                        console.log(hrstd);
                    }else{
                    }
                }
            }
        }
    }
    resultfile.end();

}
function round(num, place) {
    let p = Math.pow(10, place || 0);
    return Math.round(num * p) / p;
}


function saveResultsToHistory(results, reset){
    let history = updateHistory(results, reset ? {} : getHistory());
    let raw = results;
    let data = {
        raw:raw,
        history:history || {}
    }
    fs.writeFileSync('results.json', JSON.stringify(data, null, "    "), 'utf8');
}


class sendCMD extends Command {
    execute (params) {
        console.log(params)
        if(params.tests == 'listagents'){
            fetch(params.server, '/~api/cmd/',{
                cmd:{
                    type:'list',
                    data:params.test
                }
            }).then(function(data){
               // console.log(data);
            });
        }else{
            let logfile = fs.createWriteStream('RESULTS.md');
            fs.access(params.app, function(e){
                if(e){
                    console.error('Warning! WebApp does not exist');
                }
            });

            return runTests(params.agents, params.tests, params.server, params.app).then(function(results){
                if(params.prtest){
                    compareResultToHistory(results);
                }else{
                    saveResultsToHistory(results, params.reset);
                }
                for(let agent in results) {
                    let first = true;
                    logfile.write('# ' + agent.toUpperCase() + '\n');
                    console.log('# ' + agent.toUpperCase());
                    //console.log('# ' + 'FrameWork Load Time: ' + results[agent].)
                    for(let test in results[agent]){
                        var a = results[agent];
                        var fps = a[test].avg;
                        if(first){
                            console.log(`##teamcity[buildStatisticValue key='<${agent}.readyTime>' value='${a[test].appReadyTime}']`);
                            console.log(`##teamcity[buildStatisticValue key='<${agent}.loadTime>' value='${a[test].appLoadTime}']`);
                            console.log(`##teamcity[buildStatisticValue key='<${agent}.launchTime>' value='${a[test].appLaunchTime}']`);
                            first = false;
                        }
                        console.log(`##teamcity[buildStatisticValue key='<${agent}.${test}.fps>' value='${fps}']`);
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
    switches:'server agents tests app [reset:boolean=false] [prtest:boolean=false]',
    parameters: ['server', 'agents', 'tests', 'app']
});

new sendCMD().run();