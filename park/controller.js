getCommands({
    echo:function(data){
        console.log(data);
    },
    redirect:function(test){
        console.log(test);
        location.href = test;
        return false;
    }
}    );