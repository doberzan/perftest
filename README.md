# PerfTest

## Server Setup

You can download from Github by clicking the green "Clone or Download" button. Then
just click "Download Zip" and save the file to your machine.

Once downloaded, move the folder to wherever you'd like your agents to live.
Then install required modules with `npm install`.

To launch the server execute the following command:

    node WebServer.js 8080
    
This will start an agent server on the designated port 8080.

## CLI Setup

Once you have your agent server running make sure to `cd` to the cli directory within the perftest package.

The syntax of the cli is as follows:

    node cli.js -server <Agent Server Address> -agents <agent-id,agent-id,agent-id> -test <test1,test2,test3> -app <Web-Application-path>

**Note:** The 'test' argument ids need to exist in the hack.js file within the Web-App.

## Hack.js 

Finally, in order for tests to be run in browser the hack.js file is served up with the Web-App.
To create a test to be run by the agents use the following as examples:
### Example 1:
```javascript
        getCommands({                   //Getcommands is passed the tests to-be-run as an object to be called in dispatcher.js

            echo:function(data){        //for debugging cli -> webserver -> agent communications
                console.log(data);
            },
            scrollDown:function(){      //Example built-in test: <testid>:function(){...} 
                return new Promise(function(resolve, reject){
                    runTest(scrollDown,resolve, reject);
                });
            },

            scrollUp:function(){        //Example built-in test: <testid>:function(){...} 
                return new Promise(function(resolve, reject){
                    runTest(scrollUp,resolve, reject);
                });
            },

            redirect:function(test){       //used to redirect agent to parking lot or other test pages ##DO NOT REMOVE##
                return {
                    $value:false,
                    callback:function(){
                        location.href = test;       //redirect
                    },
                    finish:true            //Tell server that agent will not be responding
                };
            },

            nop:function(){     //called when no-operation is sent to dispatcher.js ##DO NOT REMOVE##
                num ++;
                if(num > 1){
                    location.href = '/park/'; //redirect after 2 nop's
                    num = 0;
                }
            }
        });
```
### Example 2: 
```javascript
        getCommands({
            [....], //It is important to return a promise which will later receive your tests results.
            <your-test-id>:function(){ 
                return new Promise(function(resolve, reject){
                    //Use the runTest function to measure your tests performance
                    runTest(<your-test-function>,resolve, reject); 
                });
            }
        });
        
        function your-test-function(id){
            //DOM minipulation, user emulation code, ect...
            var time = eventStopWatch('stop', id);
            comments = `Test took ${time} miliseconds to complete`
            
            //This function calculates the current running test's fps, loadtime, and any test comments, then the data is returned back to your function.
            
            return calculate(comments);
            
           OR
           
           //return custom results
           
           return {
               comments:comments,
               time:time 
           }
        }
```
        
**Note:** runTest will call your function and pass it a stopwatch `id` which can be stopped using `var time = eventStopWatch('stop', id-passed-to-your-function);`



![alt text][logo]

[logo]: http://www.gmkfreelogos.com/logos/S/img/Sencha.gif "Sencha"
