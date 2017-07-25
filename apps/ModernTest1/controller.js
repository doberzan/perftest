getCommands({
    echo:function(data){
        console.log(data);
        return true;
    },
    redirect:function(test){
        console.log(test);
        location.href = test;
        return true;
    }
}    );