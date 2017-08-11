let timebase;
let tickCount = 0;
let FPS = [];
let num = 0;
let timerIds = {}
let lastId = 0;
let pageLoadTime = 0;
var x = 41;
var a = 1103515245;
var c = 12345;
var m = Math.pow(2,31);
var rand = 0;
var tps = []
function runTest(test, resolve, reject){
    let cmp = Ext.getCmp('thegrid');
    if(!cmp){
        setTimeout(function(){
            runTest(test, resolve, reject);
        }, 50);
        return;
    }
    var timerid = eventStopWatch('start');
    let intervalId = setInterval(function(){
        let result = test(timerid);
        if(result){
            clearInterval(intervalId);
            cancelAnimationFrame(animId);
            resolve(result);
        }
    }, 1)
    let animId = requestAnimationFrame(function tock(t){
        tick(t);
        animId = requestAnimationFrame(tock);
    });

}

function round(num, place) {
    let p = Math.pow(10, place || 0);
    return Math.round(num * p) / p;
}

function getRandomArbitrary(min, max) {
  return rand * (max - min) + min;
}

function teleportScrolling(timerid){
    let cmp = Ext.getCmp('thegrid');
    let scroller = cmp.getScrollable();
    if(eventStopWatch('getTime', timerid) > 4000){
        var sec = eventStopWatch('stop', timerid);
        return calculate(`TP's: ${tps}`);
    }
    x = (a*x +c) % m
    rand = x/m
    rand = round(getRandomArbitrary(0, scroller.getMaxPosition().y));
    tps.push(rand);
    scroller.scrollTo(0,rand);
}

function scrollDown(timerid){
    let cmp = Ext.getCmp('thegrid');
    let scroller = cmp.getScrollable();
    if(scroller.getMaxPosition().y <= scroller.getPosition().y){
        var sec = eventStopWatch('stop', timerid);
        return calculate(('Scrolled '+ scroller.getMaxPosition().y +' pixels down in '+ sec +' mili-seconds.'));
    }
    //let rand2 = Math.floor(Math.random() * 500);
    scroller.scrollBy(null, 100);
}

//Calculates data
function calculate(comments){
    let min = 9999999;
    let avg;
    let fps = FPS;
    let sum = 0;
    FPS = [];

    for (let j of fps) {
        if(min > j){
            min = j;
        }
        sum += j;
    }
    avg = sum / fps.length;

    return {
        min:min,
        avg:avg,
        fps:fps,
        comment:comments

    };
}

function eventStopWatch(cmd, timerid){
    if(cmd == 'start'){
        eventTimerId = lastId ++;
        timerIds[eventTimerId] = {};
        timerIds[eventTimerId].num = performance.now();
        return eventTimerId;
    }else if(cmd == 'stop'){
        var n = timerIds[timerid].num;
        delete timerIds[timerid];
        console.log(performance.now() - n);
        return performance.now() - n;
    }else if(cmd == 'getTime'){
        var n = timerIds[timerid].num;
        return performance.now() - n;
    }
}

function scrollUp(timerid){
    let cmp = Ext.getCmp('thegrid');
    let scroller = cmp.getScrollable();
    if(0 >= scroller.getPosition().y){
        var sec = eventStopWatch('stop', timerid);
        return calculate(('Scrolled '+ scroller.getMaxPosition().y +' pixels up in '+ sec +' mili-seconds.'));
    }
    scroller.scrollBy(null, -100);
}

function loadTest(timerid){
    if(Ext.isReady){
        pageLoadTime = eventStopWatch('stop', timerid);
    }else{
        setTimeout(function(){
            loadTest(timerid)
        }, 1);
    }
}


function tick(t){
    if(!timebase){
        timebase = t;
    }else{
        tickCount ++;
        let deltaT = (t-timebase) / 1000;
        if(deltaT > 1){
            let fps = Math.round(tickCount / deltaT);
            FPS.push(fps);
            tickCount = 0;
            timebase = t;
        }
    }
}

function start(){
    getCommands({
        echo:function(data){
            console.log(data);
        },
        scrollDown:function(){
            return new Promise(function(resolve, reject){
                runTest(scrollDown,resolve, reject);
            });
        },
        scrollUp:function(){
            return new Promise(function(resolve, reject){
                runTest(scrollUp,resolve, reject);
            });
        },
        teleportScrolling:function(){
            return new Promise(function(resolve, reject){
                runTest(teleportScrolling,resolve, reject);
            });
        },
        modernTest1:function(){
            return {
                loadTime: Ext._endTime - Ext._startTime,
                readyTime: Ext._beforeReadyTime - Ext._startTime,
                launchTime: Ext._afterReadyTime - Ext._beforeReadyTime
            }
        },
        redirect:function(test){
            return {
                $value:false,
                callback:function(){
                    location.href = test;
                },
                finish:true
            };
        },
        nop:function(){
            num ++;
            console.log('nop num: ' + num);
            if(num == 1){
                location.href = '/park/';
                num = 0;
            }
        }
    });
}

/*window.onload = function(){
    debugger;
    loadTest(eventStopWatch('start'));
    if(Ext.onReady){
        debugger;
        Ext.onReady(start);
        console.log('ready')
    }else{
        debugger;
        console.log('not ready')
        Ext._beforereadyhandler = function(){
            Ext.onReady(start);
        }
    }
};
*/
Ext.onReady(function(){
    console.log('defer')
    Ext.defer(function(){
        start();   
        console.log('starting')
    }, 1000);
});
