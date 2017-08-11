Ext.application({
    name: 'ModernTest1',

    extend: 'ModernTest1.Application',

    requires: [
        'ModernTest1.*'
    ],

    // The name of the initial view to create. With the classic toolkit this class
    // will gain a "viewport" plugin if it does not extend Ext.Viewport. With the
    // modern toolkit, the main view will be added to the Viewport.
    //
    mainView: 'ModernTest1.view.main.Main'
});
