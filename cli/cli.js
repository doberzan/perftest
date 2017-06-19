const Command = require('switchit').Command;
const client = require('http');

function fetch(server, path, data){
    var post_data = JSON.stringify(data);
    //TODO Find a url modual that returns the componant pieces of url
    var post_options = {
        host: server,
        port: '80',
        path: path,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(post_data)
        }
    };
    var post_req = client.request(post_options, function(res) {
        res.setEncoding('utf8');
        var responceBody = '';
        res.on('data', function (chunk) {
            responceBody += chunk;
        });
        
        res.on('end', function () {
            console.log(responceBody);
        });
    });

  // post the data
  post_req.write(post_data);
  post_req.end();

}
class SayHi extends Command {
    execute (params) {
        fetch(params.server, '/~api/cmd/', {
            agent:params.agent,
            cmd:{
                id:'echo',
                data:params.cmd
            }
        });
    }
}

SayHi.define({
    switches: ['server', 'agent', 'cmd'],
    parameters: ['server', 'agent', 'cmd']
});

new SayHi().run();//.then(function (){
    //
//}, 
//function (e){
//  console.log(e.message)
//});