var runningTest = false;
var timebase;
var tickCount = 0; 
var FPS = [];

function doTest(tests){
    return new Promise(function(done, failed){
        //get commands from cli
        fetch('/~api/park/' + location.search, {
            method: 'post',
            body: 'how may I help you?'
        }).then(function(response){
            response.json().then(function(cliCMD){
                if(cliCMD.type){
                    if(cliCMD.type == 'redirect'){
                        done();
                    }
                    var handler = tests[cliCMD.data]
                    if(handler){
                        handler()
                        requestAnimationFrame(tick);
                        runningTest = true;
                        console.log(cliCMD.type);
                    }
                }
                doTest(tests); 
            });
        }, function(err){   
            console.log(err)
        });
    });
}


function tick(t){
    if(!timebase){
        timebase = t;
    }else{
        tickCount ++;
        var deltaT = (t-timebase) / 1000;
        if(deltaT > 1){
            var fps = Math.round(tickCount / deltaT);
            FPS.push(fps);
            tickCount = 0;
            timebase = t;
        }
    }
    if(runningTest){
        requestAnimationFrame(tick)
    };
}


function sendData(){
    runningTest = false;
    var data = {
        data:FPS,
        id:location.search
    }
    fetch('/~api', {
        method: 'post',
        body: JSON.stringify(data)
    }).then(function(response){
        response.json().then(function(j){
            console.log(j.redirect);
            location.href = j.redirect; 
        });
    }, function(err){   
        console.log(err)
    });
}

