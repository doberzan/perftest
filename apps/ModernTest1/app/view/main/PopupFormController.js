Ext.define('ModernTest1.view.main.PopupFormController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.popupform',

    cancelUpdate: function () {
        debugger
        var view = this.getView(),
            record = view.getRecord();

        view.destroy();
        record.reject();
    },

    submitUpdate: function(me) {
        var view = this.getView(),
            record = view.getRecord();

        view.destroy();
        record.commit();
    }
});
