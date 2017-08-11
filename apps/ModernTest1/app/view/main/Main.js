var lotsofsorters = ['officeLocation']; 
var bigcolumns = [];
for(var i = 0; i < 100; i ++){
        lotsofsorters.push(i.toString());
}
for(var sorter in lotsofsorters){
        bigcolumns.push(
        {
            text: 'First Name',
            dataIndex: 'firstName',
            flex: 1
        }, {
            text: 'Last Name',
            dataIndex: 'lastName',
            flex: 1
        }, {
            text: 'Phone Number',
            dataIndex: 'phoneNumber',
            flex: 1
        });
}
Ext.define('ModernTest1.view.main.Main', {
    extend: 'Ext.tab.Panel',
    controller: 'listview',
    items: [{
        title: 'Tab',
        xtype: 'grid', 
        id: 'thegrid',
        iconCls: 'x-fa fa-users',
        grouped: true,
        listeners: {
            itemtap: 'onPopupForm'
        },
        store: {
            type: 'employees',
            autoLoad: true,
            sorters: ['firstName','lastName','phoneNumber'],//lotsofsorters,
            grouper: 'officeLocation'
        },
        columns: [{
            text: 'First Name',
            dataIndex: 'firstName',
            flex: 1
        }, {
            text: 'Last Name',
            dataIndex: 'lastName',
            flex: 1
        }, {
            text: 'Phone Number',
            dataIndex: 'phoneNumber',
            flex: 1
        }]//bigcolumns
    },{
        title: 'About Sencha',
        tab: {
            id: "tab2"
        },
        padding: 20,
        iconCls: 'x-fa fa-info-circle',
        html: '<h1>About Sencha</h1><br/>More than 10,000 customers and 60% of the Fortune 100 rely on Sencha solutions to deliver innovative applications that drive their businesses. With a longstanding commitment to web technologies, Sencha dramatically reduces the cost and complexity of developing and delivering enterprise applications across multiple device types.<br/><br/><h2>Create feature-rich HTML5 applications using JavaScript</h2><br/>Sencha Ext JS is the most comprehensive MVC/MVVM JavaScript framework for building feature-rich, cross-platform web applications targeting desktops, tablets, and smartphones. Ext JS leverages HTML5 features on modern browsers while maintaining compatibility and functionality for legacy browsers.<br/><br/>Ext JS features hundreds of high-performance UI widgets that are meticulously designed to fit the needs of the simplest as well as the most complex web applications. Ext JS templates and layout manager give you full control over your display irrespective of devices and screen sizes. An advanced charting package allows you to visualize large quantities of data. The framework includes a robust data package that can consume data from any backend data source. Ext JS also offers several out-of-the-box themes, and complete theming support that lets you build applications that reflect your brand. It also includes an accessibility package (ARIA) to help with Section 508 compliance.'
    }]
});

Ext.define('ModernTest1.view.main.Renderer', {
    extend: 'Ext.panel.Panel',
    xtype: 'line-renderer',
    controller: 'line-renderer',

    requires: [
        'Ext.chart.series.Line',
        'Ext.chart.axis.Numeric',
        'Ext.draw.modifier.Highlight',
        'Ext.chart.axis.Time',
        'Ext.chart.interactions.ItemHighlight'
    ],

    layout: 'fit',

    width: 650,

    tbar: [
        '->',
        {
            text: 'Refresh',
            handler: 'onRefresh'
        }
    ],

    items: [{
        xtype: 'cartesian',
        reference: 'chart',
        width: '100%',
        height: 500,
        store: {
            type: 'pie'
        },
        interactions: {
            type: 'panzoom',
            zoomOnPanGesture: true
        },
        series: [
            {
                type: 'line',
                xField: 'name',
                yField: 'g1',
                fill: true,
                smooth: true,
                style: {
                    lineWidth: 4
                },
                marker: {
                    type: 'circle',
                    radius: 10,
                    lineWidth: 2
                },
                renderer: 'onSeriesRender'
            }
        ],
        axes: [
            {
                type: 'numeric',
                position: 'left',
                fields: ['g1'],
                minimum: 0,
                listeners: {
                    rangechange: 'onAxisRangeChange'
                }
            },
            {
                type: 'category',
                position: 'bottom',
                fields: 'name'
            }
        ]
    }]

});