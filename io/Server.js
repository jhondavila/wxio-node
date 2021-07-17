// import http from 'http';
import Base from '../Base';

// import socketio from 'socket.io';
import baseServer from '../http/Base';
import io from "socket.io";
// import SController from './Controller';
import Core from '../core';
// const socketIO = socketio;


// console.log(io)
class SSIO extends Base {

    // port: number = 3001;
    // private server: baseServer;
    // io: any;
    // typeMode: string;
    // stringMessage: string;
    // wsEngine: string = "ws";
    constructor(config) {
        super(config)
        this.port = 3001;
        this.server, this.io, this.typeMode, this.stringMessage, this.wsEngine = "ws";
        Core.apply(this, config);
        if (config.server) {
            this.initServer(this.server);
        }

        this.globalMiddleware = [];
    }
    initServer(server) {
        if (server) {
            this.server = server;
        } else if (!this.server) {
            this.server = new baseServer({
                autoSS: true
            });
        }
        this.server.ssio = this;
        this.io = io(this.server.srv, {
            wsEngine: this.wsEngine
        });
    }
    setServer(server) {
        this.initServer(server);
    }
    listen() {
        let port = this.server.autoSS ? this.port : this.server.port;
        this.run(port);
    }
    run(port) {
        this.typeMode = "NormalMode";
        this.stringMessage = "Listen Port : " + port;
        this.server.port = port;
        this.server.run();
    }

    addController(ctrls) {

        if (!this.server) {
            console.log("Servidor aun no ha sido creado.asignando uno por defecto");
            this.initServer();
        }
        // let ctrl;

        if (Core.isObject(ctrls)) {
            for (var p in ctrls) {
                this.addController(ctrls[p]);
            }
        } else if (Core.isFunction(ctrls)) {
            this._addCtrl(ctrls);
        } else {
            console.log("No se pudo añadir el io controlador", ctrls)
        }


    }
    _addCtrl(ctrl) {
        let iCtrl = new ctrl();

        iCtrl.applyServer(this);
    }

    addMiddleware(middleware) {
        this.globalMiddleware.push(middleware);
    }
}

export default SSIO;