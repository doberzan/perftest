# PerfTest

## Server Setup

You can download from Github by clicking the green "Clone or Download" button. Then
just click "Download Zip" and save the file to your machine.

Once downloaded, move the folder to wherever you'd like your agents to live.
Then install required modules with `npm install`.

To launch the server execute the following command:

    `node WebServer.js 8080`
    
This will start an agent server on the designated port 8080.

## CLI Setup

Once you have your agent server running make sure to `cd` to the cli directory within the perftest package.

The syntax of the cli is as follows:

    node cli.js -server <Agent Server Address> -agents <agent-id,agent-id,agent-id> -test <test1,test2,test3> -app <Web-Application-path>

**Note:** The 'test' arguments need to be added to hack.js file in the WebApplication.

## Build Your Application

Finally, run the following command to build the application:

    sencha app build

You can now visit your application at its local address on your web server.

Alternatively, you can run this command so that Sencha Cmd will provide a web
server for you:

    sencha app watch

You can now visit the resulting address displayed in your console.  It will
usually be found here:

    http://localhost:1841/
