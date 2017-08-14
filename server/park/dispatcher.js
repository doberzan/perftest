let timerid = 0;
let agentId = /[?&]id=([^&]+)/.exec(location.search);
agentId = agentId ? agentId[1] : getOS();

function getCommands(handlers, data){
    return fetch('/~api/park/?id=' + agentId, {
        method: 'post',
        body: JSON.stringify(data || {})
    }).then(function(response){
        function next(result, j){
            let resultData = result;
            let callback, finish;

            if (result && '$value' in result) {
                resultData = result.$value;
                callback = result.callback;
                finish = result.finish;
            }

            getCommands(handlers, {
                type:'result',
                data:resultData,
                id:j.id,
                finish:finish
            }).then(function(){
                if(callback){
                    callback();
                }
            });
        }

        response.json().then(function(j){
            if(j.type){
                console.log(j.type);
                let handler = handlers[j.type]
                if(handler){
                    let result = handler(j.data);
                    if(result && result.then){
                        result.then(function(resultData){
                            console.log(resultData);
                            next(resultData, j);
                        });
                        return;
                    }
                    next(result, j);
                    return;
                }
            }
            if(handlers.nop){
                handlers.nop();
            }
            getCommands(handlers); 
        });
    }, function(e){
        console.log(e);
        setTimeout(function(){
            getCommands(handlers);
        }, 30 * 1000);
    });
}

function getOS() {
    var ua = navigator.userAgent.toLowerCase();
    setTimeout(function(){
        document.body.innerHTML += "<br>" + navigator.userAgent;
    }, 2000);
    if (ua.indexOf("win") != -1) {
        return "win";
    } else if (ua.indexOf("iphone") != -1) {
        return "iphone";
    } else if (ua.indexOf("macintosh") != -1) {
        return 'mac';
    } else if (ua.indexOf("linux") != -1) {
        return "linux";
    } else if (ua.indexOf("x11") != -1) {
        return "unix";
    } else if (ua.indexOf("ipad") != -1) {
        return "ipad";
    } else {
        return "computer";
    }
}