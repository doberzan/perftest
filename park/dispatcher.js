function getCommands(handlers){
    fetch('/~api/park/' + location.search, {
        method: 'post',
        body: '?'
    }).then(function(response){
        response.json().then(function(j){
            if(j.type){
                var handler = handlers[j.type]
                if(handler){
                    handler(j.data)
                    //location.href = j.redirect; 
                }
            }
            getCommands(handlers); 
        });
    }, function(err){   
        console.log(err)
    });
}