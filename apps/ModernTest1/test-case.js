let PerfTest = {
    _log:[],
    log:function(){
        var msg = Array.prototype.join.call(arguments, " "); 
        PerfTest._log.push(msg);
        console.log(msg);
    },
    getLog:function(){
        let log = PerfTest._log;
        PerfTest._log = [];
        return log;
    }
}
let timebase;
let tickCount = 0;
let FPS = [];
let num = 0;
let timerIds = {}
let lastId = 0;
let pageLoadTime = 0;

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

function makeRandom(){
    var x = 41;
    var a = 1103515245;
    var c = 12345;
    var m = Math.pow(2,31);
    return function(){
        x = (a*x +c) % m;
        return x/m;
    }
}
let getRandom = makeRandom();

function getRandomArbitrary(min, max) {
    let rand = getRandom();
    return rand * (max - min) + min;
}

function teleportScrolling(timerid){
    let cmp = Ext.getCmp('thegrid');
    let scroller = cmp.getScrollable();
    if(eventStopWatch('getTime', timerid) > 4000){
        var sec = eventStopWatch('stop', timerid);
        PerfTest.log(`Row Height: ${cmp.rowHeight} Num of Rows: ${cmp.store.getCount()}`)
        return calculate();
    }
    let rand = round(getRandomArbitrary(0, 150000));
    scroller.scrollTo(0,rand);
}

function clickItems(){
    var grid = Ext.ComponentMgr.all.filterBy(function(c){
	    return c.isXType('grid');
    });
    var columns = grid.down('headercontainer').getGridColumns();
    for(let col in columns){
        columns
    }
}


function scrollDown(timerid){
    let cmp = Ext.getCmp('thegrid');
    let scroller = cmp.getScrollable();
    if(scroller.getMaxPosition().y <= scroller.getPosition().y){
        var sec = eventStopWatch('stop', timerid);
        PerfTest.log('Scrolled '+ scroller.getMaxPosition().y +' pixels down in '+ sec +' mili-seconds.');
        return calculate();
    }
    //let rand2 = Math.floor(Math.random() * 500);
    scroller.scrollBy(null, 100);
}
//log out maxy pos beginning of each test
//Calculates data
function calculate(){
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
    let log = PerfTest.getLog();
    return {
        min:min,
        avg:avg,
        fps:fps,
        log:log

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
        PerfTest.log(('Scrolled '+ scroller.getMaxPosition().y +' pixels up in '+ sec +' mili-seconds.'));
        return calculate();
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
    PerfTest.log('LocalStorage len: ' + localStorage.length, 'keys:');
    for(let i = 0; i < localStorage.length; ++i){
        PerfTest.log(localStorage.key(i));
    }
    localStorage.clear();
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
