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
    var id = eventStopWatch('start');
     let intervalId = setInterval(function(){
        let result = test(id);
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

//clear

function scrollDown(id){
    let cmp = Ext.getCmp('thegrid');
    let scroller = cmp.getScrollable();
    if(scroller.getMaxPosition().y <= scroller.getPosition().y){
        console.log(FPS);
        var sec = eventStopWatch('stop', id);
        console.log(sec);
        return calculate(('Scrolled '+ scroller.getMaxPosition().y +' pixels down in '+ sec +' mili-seconds.'));
    }
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


function eventStopWatch(cmd, id){
    if(cmd == 'start'){
        eventTimerId = lastId ++;
        timerIds[eventTimerId] = {};
        timerIds[eventTimerId].num = performance.now();
        return eventTimerId;
    }else if(cmd == 'stop'){
        var n = timerIds[id].num;
        delete timerIds[id];
        console.log(performance.now() - n);
        return performance.now() - n;
    }
}

function scrollUp(id){
    let cmp = Ext.getCmp('thegrid');
    let scroller = cmp.getScrollable();
    if(0 >= scroller.getPosition().y){
        console.log(FPS);
        var sec = eventStopWatch('stop', id);
        console.log(sec);
        return calculate(('Scrolled '+ scroller.getMaxPosition().y +' pixels up in '+ sec +' mili-seconds.'));
    }
    scroller.scrollBy(null, -100);
}

function loadTest(id){
    if(Ext.isReady){
        pageLoadTime = eventStopWatch('stop', id);
    }else{
        setTimeout(function(){
            loadTest(id)
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
            if(num > 1){
                location.href = '/park/';
                num = 0;
            }
        }
    });
}

window.onload = function(){
    loadTest(eventStopWatch('start'));
    if(Ext.onReady){
        Ext.onReady(start);
    }else{
        Ext._beforereadyhandler = function(){
            Ext.onReady(start);
        }
    }
};