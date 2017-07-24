const webdriverio = require('webdriverio');
const chromedriver = require('chromedriver');
const options = {desiredCapabilities: {browserName: 'chrome', chromeOptions: {mobileEmulation: {deviceName: 'Apple iPad'}}, nativeWebTap: true}};
const client = webdriverio.remote(options);
const browser = client.init();

const page = browser.url('http://localhost:1841/').then(beforeScrollDown,
    function (err) {
        console.log(err);
        browser.end();
    });//.then(function(){return browser.end()});

function beforeScrollDown(){
    return touchIt2();
}

function scrollDown(){
    return browser.moveTo(browser.element('body'), 100, 400).then(function(){
        return browser.touchDown(0).then(function(){
            return browser.moveTo(browser.element('body'), 100, 200).then(function(){
                return browser.touchUp(0);
            });
        })
    });
}

function touchSwipeDown(sel, sel2){
    return browser.moveToObject(sel).then(function(){
        return browser.touchDown(0).then(function(){
            return browser.moveToObject(sel2).then(function(){
                return browser.touchUp(0)});
        })
    });
}

function touchIt2(){
    return browser.touchMove(100, 100);
}
function touchIt(){
    return browser.touchPerform([{
        action: 'press',
        options: {
            //element: browser.element('#tab2'),
            x: 10,
            y: 10
        }
    }]);
}


function beforeclickit(){
    return clickIt('#tab2');
}
function clickIt (sel) {
    return browser.moveToObject(sel).then(function(){
        return browser.buttonDown(0).then(function(){
            return browser.buttonUp(0);
        })
    });
}