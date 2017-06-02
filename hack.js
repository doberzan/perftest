function doTests(){
    var cmp = Ext.getCmp('thegrid');
    if(!cmp){
        setTimeout(doTests, 50);
        return
    }
    setInterval(function(){
        cmp.getScrollable().scrollBy(null, 5);
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