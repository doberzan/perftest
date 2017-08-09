Ext.define('ModernTest1.store.Employees', {
    extend: 'Ext.data.Store',
    alias: 'store.employees',
    data: (function(){
        var data = [];
        for(var j = 0; j < 500; j ++ ){
            for(var i = 100; i < 1; i ++){
                data.push({
                    firstName: 'John' + i,
                    lastName: "Quill" + i,
                    phoneNumber: "(718) 480-856" + i,
                    officeLocation: "city" + j
                });
            }
        }
        return data;
    }()),

    listeners: {

        update: function(store, record , operation , modifiedFieldNames) {
            if (!modifiedFieldNames) {
                return;
            }

            // Ensure that select field is being set to a value, not the entire record
            var modField = modifiedFieldNames.toString(),
                mod = record.get(modField);

            if (mod && mod.isModel) {
                record.set(modField, mod.get('text'));
            }
        }
    }
});
