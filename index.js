const { Extension, type, api } = require('clipcc-extension');

class MyExtension extends Extension {
    onInit() {
        this.wsClient = null;
        this.lastMessage = null;
        this.isMessage = false;

        api.addCategory({
            categoryId: 'frank.websocket.category',
            messageId: 'frank.websocket.category',
            color: '#71AFD2'
        });
        api.addBlock({
            opcode: 'frank.websocket.onmessage',
            type: type.BlockType.HAT,
            param: {
                MESSAGE: {
                    type: type.ParameterType.STRING,
                    default: 'Hello'
                }
            },
            messageId: 'frank.websocket.onmessage',
            categoryId: 'frank.websocket.category',
            function: args => this.onMessage(args.MESSAGE)
        });
        api.addBlock({
            opcode: 'frank.websocket.onmessageany',
            type: type.BlockType.HAT,
            messageId: 'frank.websocket.onmessageany',
            categoryId: 'frank.websocket.category',
            function: () => !!this.onMessageAny()
        });
        api.addBlock({
            opcode: 'frank.websocket.isconnect',
            type: type.BlockType.BOOLEAN,
            messageId: 'frank.websocket.isconnect',
            categoryId: 'frank.websocket.category',
            function: () => !!this.wsClient
        });
        api.addBlock({
            opcode: 'frank.websocket.lastmessage',
            type: type.BlockType.REPORTER,
            messageId: 'frank.websocket.lastmessage',
            categoryId: 'frank.websocket.category',
            function: () => this.getLastMessage()
        });
        api.addBlock({
            opcode: 'frank.websocket.create',
            type: type.BlockType.COMMAND,
            param: {
                URL: {
                    type: type.ParameterType.STRING,
                    default: 'wss://www.example.com'
                }
            },
            messageId: 'frank.websocket.create',
            categoryId: 'frank.websocket.category',
            function: args => this.create(args.URL)
        });
        api.addBlock({
            opcode: 'frank.websocket.send',
            type: type.BlockType.COMMAND,
            param: {
                MESSAGE: {
                    type: type.ParameterType.STRING,
                    default: 'Hello'
                }
            },
            messageId: 'frank.websocket.send',
            categoryId: 'frank.websocket.category',
            function: args => this.send(args.MESSAGE)
        });
        api.addBlock({
            opcode: 'frank.websocket.close',
            type: type.BlockType.COMMAND,
            messageId: 'frank.websocket.close',
            categoryId: 'frank.websocket.category',
            function: () => this.close()
        });
    }
    onUninit() {
        if (this.wsClient) {
            this.wsClient.close();
            this.wsClient.removeEventListener('message', this._onmessage);
        }
        api.removeCategory('frank.websocket.category');
    }
    onMessage(message) {
        if (!this.wsClient) return false;
        if (this.wsClient.lastMessage === message && this.wsClient.isMessage) {
            return true;
        }
        return false;
    }
    onMessageAny() {
        if (!this.wsClient) return false;
        return this.wsClient.isMessage;
    }
    create(url) {
        if (this.wsClient) return;
        this.wsClient = new WebSocket(url);
        this.wsClient.addEventListener('message', this._onmessage);
        return new Promise((reslove) => {
            this.wsClient.onopen = () => reslove('');
            this.wsClient.onerror = () => {
                this.wsClient = null;
                reslove('');
            };
            this.wsClient.onclose = () => {
                this.wsClient = null;
            }
        })
    }
    send(message) {
        if (this.wsClient && this.wsClient.readyState === WebSocket.OPEN) {
            this.wsClient.send(message);
        }
    }
    getLastMessage() {
        if (this.wsClient && this.wsClient.lastMessage) {
            return this.wsClient.lastMessage;
        }
        return ''
        
    }
    close() {
        if (!this.wsClient) return;
        this.wsClient.close();
        return new Promise(reslove => {
            this.wsClient.onclose = () => {
                this.wsClient = null;
                reslove('');
            };
        })
    }
    _onmessage(event) {
        console.log('收到消息：'+ event.data);
        this.lastMessage = event.data;
        this.isMessage = true;
        setTimeout(() => {
            this.isMessage = false
        }, 100);

    }
}

module.exports = MyExtension;
