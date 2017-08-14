const Command = require('switchit').Command;
const client = require('http');
const uuidv4 = require('uuid/v4');
const fs = require('fs');
const math = require('mathjs');

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
                    reject('failed');
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

function runTestSequence(agent, tests, server, app, buildUuid){
    let results = {};
    let agentUuid = uuidv4();
    let promise = fetch(server, '/~api/cmd/', {
        agent:agent,
        cmd:{
            type:'redirect',
            data:'/' + buildUuid + '/' + '?id=' + agentUuid
        }
    }).then(function(data){
        console.log(data)
    });
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
        }, function(err){
            console.log('caught err');
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
        for(var test in ra){
            var ht = ha[test] || (ha[test] = {});
            var rtest = ra[test];
            for(var result in rtest){
                if(rtest.log){
                    delete rtest.log;
                }
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
    let status = true;
    for(var agent in raw){
        resultfile.write(`## ${agent}\n`);
        if(history[agent]){
            var ha = history[agent] 
            var ra = raw[agent];
            for(var test in ra){
                var htest = ha[test] 
                var rtest = ra[test];
                if(rtest.fps){
                    let hrstd = math.std(htest.fps);
                    let hrmean = math.mean(htest.fps);
                    let fpsmean = math.mean(rtest.fps);
                    hrmean = round(hrmean,1);
                    fpsmean = round(fpsmean,1);
                    hrstd = round(hrstd, 1)
                    if(fpsmean > hrmean - hrstd){
                        resultfile.write(`- ${test} - OK (${fpsmean} vs ${hrmean} +/- ${hrstd})\n`);
                        console.log(`OK: (${fpsmean} vs ${hrmean} +/- ${hrstd})`);
                    }else{
                        status = false;
                        resultfile.write(`- ${test} - **FAILED** (${fpsmean} vs ${hrmean} +/- ${hrstd})\n`);
                        console.log(`FAILED: (${fpsmean} vs ${hrmean} +/- ${hrstd})`);
                    }
                }else if(rtest.loadTime){
                    for(var result in rtest){
                        let hrstd = math.std(htest[result]);
                        let hrmean = math.mean(htest[result]);
                        let num = rtest[result];
                        hrmean = round(hrmean,2);
                        num = round(num,2);
                        hrstd = round(hrstd, 4)
                        if(num < hrmean + hrstd){
                            resultfile.write(`- ${result} - OK (${num}ms vs ${hrmean}ms +/- ${hrstd}ms)\n`);
                            console.log(`OK: (${num}ms vs ${hrmean}ms +/- ${hrstd}ms)`);
                        }else{
                            status = false;
                            resultfile.write(`- ${result} - **FAILED** (${num}ms vs ${hrmean}ms +/- ${hrstd}ms)\n`);
                            console.log(`FAILED: (${num}ms vs ${hrmean}ms +/- ${hrstd}ms)`);
                        }
                    }
                }else{
                    console.log('else?')
                }
            }
        }
    }
    if(status){
            resultfile.write('_____________________________________________\n');
            resultfile.write('<img src="https://raw.githubusercontent.com/doberzan/perftest/master/cli/pass.png" alt="Passed" width="20" height="20">    ***PASSED***\n')   
    }else{
        resultfile.write('_____________________________________________\n');
        resultfile.write('<img src="https://raw.githubusercontent.com/doberzan/perftest/master/cli/fail.png" alt="Failed" width="20" height="20">    ***FAILED*** \n')
        resultfile.write(`**Retest required!**`);
    }
    resultfile.end();

}
function round(num, place) {
    let p = Math.pow(10, place || 0);
    return Math.round(num * p) / p;
}

function getRandomArbitrary(min, max) {
  return rand * (max - min) + min;
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
        console.log('Params:',params)
        if(params.tests == 'listagents'){
            return fetch(params.server, '/~api/cmd/',{
                cmd:{
                    type:'list',
                    data:params.test
                }
            }).then(function(data){
               // console.log(data);
            });

        }else{
            return runTests(params.agents, params.tests, params.server, params.app).then(function(results){
                for(let agent in results) {
                    var agentobj = results[agent];
                    for(let test in results[agent]){
                        var a = results[agent];
                        var fps = a[test].avg;
                        var testobj = agentobj[test]; 
                        if(testobj.loadTime){
                            console.log(`##teamcity[buildStatisticValue key='<${agent}.readyTime>' value='${a[test].readyTime}']`);
                            console.log(`##teamcity[buildStatisticValue key='<${agent}.loadTime>' value='${a[test].loadTime}']`);
                            console.log(`##teamcity[buildStatisticValue key='<${agent}.launchTime>' value='${a[test].launchTime}']`);
                        }else if(testobj.log){
                            console.log(agent + ' - ' + test+':');
                            for(let a of testobj.log){
                                console.log('[LOG]:', a);
                            }
                        }
                        if(testobj.fps){
                            console.log(`##teamcity[buildStatisticValue key='<${agent}.${test}.fps>' value='${fps}']`);
                        }
                    }
                }
                if(params.prtest){
                    compareResultToHistory(results);
                }else{
                    saveResultsToHistory(results, params.reset);
                }
            });
        }
    }
}

sendCMD.define({
    switches:'server agents tests app [reset:boolean=false] [prtest:boolean=false]',
    parameters: ['server', 'agents', 'tests', 'app']
});

new sendCMD().run();