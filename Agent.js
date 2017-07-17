class Agent {

    constructor(id){
        this.id = id;
        this.queue = [];
        this.pending = {};
        this.seq = 0;
        //console.log('New Agent: ' + id);
    }

    static get(id){
        return Agent.all[id] || (Agent.all[id] = new Agent(id))
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
            console.log('=============================')
            if (clientMessage) {
                console.log('Shifted: ' + JSON.stringify(clientMessage.data));
                //
                this.clearTimer();
                this.pending[clientMessage.data.id] = clientMessage;
                this.response.writeHead(200, {'Content-Type': 'application/json'});
                this.response.end(JSON.stringify(clientMessage.data));
                this.request = this.response = null;
                return true;
            }
            console.log('no message for: ' + this.id);
            if(!this.timerId){
                this.timerId = setTimeout(() => {
                    this.timerId = null;
                    if(this.sendWait){
                        this.sendWait();
                    }else{
                        console.log('Could not send wait... ');
                    }
                }, 60000);
            }
            return true;
        }
        
        console.log('no response handler for ' + this.id)
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
