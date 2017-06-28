let timerid = 0;
function getCommands(handlers, data){
    timerid = setTimeout(lostConnection, 10000);
    fetch('/~api/park/' + location.search, {
        method: 'post',
        body: JSON.stringify(data || {})
    }).then(function(response){
        clearTimeout(timerid);
        response.json().then(function(j){
            if(j.type){
                let handler = handlers[j.type]
                if(handler){
                    let result = handler(j.data);
                    if(result && result.then){
                        result.then(function(resultData){
                            console.log(resultData);
                            getCommands(handlers, {
                                type:'result',
                                data:resultData || {},
                                id:j.id
                            });
                        });
                        return;
                    }
                    getCommands(handlers, {
                        type:'result',
                        data:result || {},
                        id:j.id
                    });
                    return;
                }
            }
            getCommands(handlers); 
        });
    }, function(e){
        console.log(e);
    });
}

function lostConnection(){
    location.href = '/park/?id=' + getOS();

}

function getOS() {
    var ua = navigator.userAgent.toLowerCase();
    if (ua.indexOf("win") != -1) {
        return "win";
    } else if (ua.indexOf("macintosh") != -1) {
        return "mac";
    } else if (ua.indexOf("linux") != -1) {
        return "linux";
    } else if (ua.indexOf("x11") != -1) {
        return "unix";
    } else if (ua.indexOf("ipad") != -1) {
        return "ipad";
    }else if (ua.indexOf("iphone") != -1) {
        return "iphone";
    }else {
        return "computer";
    }
}