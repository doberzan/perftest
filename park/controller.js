function getCommands(handlers){
    fetch('/~api/park/' + location.search, {
        method: 'post',
        body: '?'
    }).then(function(response){
        response.json().then(function(j){
            if(j){
                var handler = handlers[j.cmd.id]
                if(handler){
                    handler(j.cmd.data)
                    //window.location.href = j.redirect; 
                }
            }
            getCommands(handlers); 
        });
    }, function(err){   
        console.log(err)
    });
}

getCommands({
    echo:function(data){
        console.log(data);
    }
});