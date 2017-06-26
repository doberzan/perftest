let timebase;
let tickCount = 0;
let FPS = [];

function runTest(test, resolve, reject){
    let cmp = Ext.getCmp('thegrid');
    if(!cmp){
        setTimeout(function(){
            runTest(test, resolve, reject);
        }, 50);
        return;
    }
    console.log('done1');
     let intervalId = setInterval(function(){
        let result = test();
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

function scrollDown(){
    let cmp = Ext.getCmp('thegrid');
    let scroller = cmp.getScrollable();
    if(scroller.getMaxPosition().y == scroller.getPosition().y){
        console.log(FPS);
        console.log('done');
        return {
            //min:TODO,
            //avg:TODO,
            fps:FPS
        };
    }
    scroller.scrollBy(null, 7);
}


function scrollUp(){
    let cmp = Ext.getCmp('thegrid');
    let scroller = cmp.getScrollable();
    if(0 == scroller.getPosition().y){
        console.log(FPS);
        console.log('done');
        return {
            fps:FPS
        };
    }
    scroller.scrollBy(null, -7);
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
        test1:function(){
            return new Promise(function(resolve, reject){
                runTest(scrollDown,resolve, reject);
            });
        },
        test2:function(){
            return new Promise(function(resolve, reject){
                runTest(scrollUp,resolve, reject);
            });
        },
        redirect:function(test){
            location.href = test;
        }
    });
}


window.onload = function(){
    if(Ext.onReady){
        Ext.onReady(start);
    }else{
        Ext._beforereadyhandler = function(){
            Ext.onReady(start);
        }
    }
};