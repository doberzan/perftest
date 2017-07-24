getCommands({
    echo:function(data){
        console.log(data);
    },
    redirect:function(test){
        console.log(test);
        return {
            $value:false,
            callback:function(){
                location.href = test;
            },
            finish:true
        };
    }
});