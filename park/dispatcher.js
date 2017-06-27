let timerid = 0;
function getCommands(handlers, data){
    timerid = setTimeout(lostConnection, 65000);
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
                    //location.href = j.redirect; 
                }
            }
            getCommands(handlers); 
        });
    }, function(e){
        console.log(e);
    });
}

function lostConnection(){
    location.href = '/park/' + location.search;
}