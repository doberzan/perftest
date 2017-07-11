class Agent {

    constructor(id){
        this.id = id;
        this.queue = [];
        this.pending = {};
        this.seq = 0;
        console.log('New Agent: ' + id);
    }

    static get(id){
        return this.all[id] || (this.all[id] = new Agent(id))
    }

    flush(){
        if(this.response){
            let clientMessage = this.queue.shift();
            if (clientMessage) {
                console.log('agent: ' + this.id + ' running command:');
                console.log(clientMessage.data);
                if(this.timerId){
                    clearTimeout(this.timerId);
                    this.timerId = null;
                }
                this.pending[clientMessage.data.id] = clientMessage;
                this.response.writeHead(200, {'Content-Type': 'application/json'});
                this.response.end(JSON.stringify(clientMessage.data));
                this.request = this.response = null;
                return true;
            }
            if(!this.timerId){
                this.timerId = setTimeout(function(){
                    this.response.writeHead(200, {'Content-Type': 'application/json'});
                    this.response.end(JSON.stringify({
                        status: 'wait',
                        redirect: '/park/'
                    }));
                    this.request = this.response = this.timerId = null;
                }, 60000);
            }
            return true;
        }
        console.log('failed')
        return false;
    }
}

Agent.all = {};
module.exports = Agent;
