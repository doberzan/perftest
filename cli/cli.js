const Command = require('switchit').Command;
const client = require('http');

function fetch(server, path, data){
    var post_data = JSON.stringify(data);
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
            var j = JSON.parse(responceBody)
            console.log(responceBody);
            if(j.status == 'ok'){
                console.log(j.formData);
            }else{
                fetch(server, '/~api/park/?id=cli', {
                    agent:'cli'
                });
                return;
            }
            console.log(responceBody);
            });
    });

  post_req.write(post_data);
  post_req.end();

}
class sendCMD extends Command {
    execute (params) {
        fetch(params.server, '/~api/cmd/?id=cli', {
            agent:params.agent,
            cmd:{
                id:params.cmd,
                data:params.args
            }
        });
    }
}

sendCMD.define({
    switches: ['server', 'agent', 'cmd', 'args'],
    parameters: ['server', 'agent', 'cmd', 'args']
});

new sendCMD().run();//.then(function (){
    //
//}, 
//function (e){
//  console.log(e.message)
//});