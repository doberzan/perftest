var intervalId;
var timebase;
var tickCount = 0; 
var FPS = [];

function doTests(){
    var cmp = Ext.getCmp('thegrid');
    if(!cmp){
        setTimeout(doTests, 50);
        return
    }
    requestAnimationFrame(tick);
    intervalId = setInterval(scrollDown,1);
}

function scrollDown(){
    var cmp = Ext.getCmp('thegrid');
    var num = 1;
    var scroller = cmp.getScrollable();
    if(scroller.getMaxPosition().y == scroller.getPosition().y){
        clearInterval(intervalId);
        intervalId = 0;
        console.log(FPS);
        sendData({
            data:FPS,
            id:location.search
        });
    }
    scroller.scrollBy(null, 7);
}

function scrollUp(){
    var cmp = Ext.getCmp('thegrid');
    var num = 1;
    var scroller = cmp.getScrollable();
    if(0 == scroller.getPosition().y){
        clearInterval(intervalId);
    }
    scroller.scrollBy(null, -7);
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
    if(intervalId){
        requestAnimationFrame(tick)
    };
}

function sendData(data){
    fetch('/~api', {
        method: 'post',
        body: JSON.stringify(data)
    }).then(function(response){
        response.json().then(function(j){
            console.log(j.redirect);
            location.href = j.redirect + location.search; 
        });
    }, function(err){   
        console.log(err)
    });
}

window.onload = function(){
    if(Ext.onReady){
        Ext.onReady(doTests);
    }else{
        Ext._beforereadyhandler = function(){
            Ext.onReady(doTests);
        }
    }
};
