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
    
    sendWait(){
        this.clearTimer();
        this.response.writeHead(200, {'Content-Type': 'application/json'});
        this.response.end(JSON.stringify({
            status: 'wait',
            redirect: '/park/'
        }));
        this.request = this.response = this.timerId = null;
    }

    flush(){
        if(this.response){
            let clientMessage = this.queue.shift();
            if (clientMessage) {
                console.log('agent: ' + this.id + ' running command:');
                console.log(clientMessage.data);
                this.clearTimer();
                this.pending[clientMessage.data.id] = clientMessage;
                this.response.writeHead(200, {'Content-Type': 'application/json'});
                this.response.end(JSON.stringify(clientMessage.data));
                this.request = this.response = null;
                return true;
            }
            if(!this.timerId){
                this.timerId = setTimeout(function(){
                    this.timerId = null;
                    this.sendWait();
                }, 60000);
            }
            return true;
        }
        console.log('failed')
        return false;
    }
    
    clearTimer(){
        if(this.timerId){
            clearTimeout(this.timerId);
            this.timerId = null;
        }
    }
}

Agent.all = {};
module.exports = Agent;
