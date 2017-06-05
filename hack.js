function doTests(){
    var cmp = Ext.getCmp('thegrid');
    if(!cmp){
        setTimeout(doTests, 50);
        return
    }
    var num = 1;
    console.log('hello')
    setInterval(function(){
        console.log(cmp.getScrollable().getMinPosition());
        console.log(cmp.getScrollable().getPosition());
        if((cmp.getScrollable().getMaxPosition()-1) == cmp.getScrollable().getPosition()){
            num = -1;
            console.log(num);
        }else if((cmp.getScrollable().getMinPosition()+1) == cmp.getScrollable().getPosition()){
            num = 1;
            console.log(num);
        }
            cmp.getScrollable().scrollBy(null, num * 7);
    }, 1);
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


//var cmp = Ext.getCmp('thegrid');
//cmp.getScrollable().scrollBy(null, 5);
//console.log(setInterval(function(){cmp.getScrollable().scrollBy(null, 5)}, 1));