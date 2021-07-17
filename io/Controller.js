import Base from "../Base";
import SServer from '../io/Server';
import Core from '../core';

import EFnSession from './middleware/AuthUser';
import { type } from "os";


// namespace SController {
//     export interface config extends Base.config {

//     }
// }

class SController extends Base {
    // namespace: string;
    // io: any;
    // events: Object;
    // middleware: Array<Function> = [];
    // private space: any;
    auth = false;
    constructor(config) {
        super();
        // this.auth;
        this.namespace, this.io, this.events, this.middleware = [], this.space;
    }
    applyServer(server) {
        this.server = server;
        this.io = server.io;
        this.initializeSpace(this.namespace, this.events);
    }

    initGlobalMiddleware() {
        for (let x = 0; x < this.server.globalMiddleware.length; x++) {
            let fn = this.server.globalMiddleware[x];
            this.space.use(fn);
        }
    }
    initializeSpace(namespace, events) {
        this.space = this.io.of(namespace);
        this.initGlobalMiddleware();

        if (this.auth) {
            this.space.use(EFnSession);
        }
        let twoWayEvents = {

        };
        if (this.twoWayEvents) {

            this.twoWayEvents.forEach(i => {
                twoWayEvents[i] = true;
            })
            // debugger
        }
        this.twoWayEventsMap = twoWayEvents


        this.space.on("connection", Core.bind(this.newConnection, this));
        for (let x = 0; x < this.middleware.length; x++) {
            this.space.use(this._asyncMiddleware(this.middleware[x], this));
        }
        this.initSpace();
    }

    initSpace() {

    }

    getSpace() {
        return this.space;
    }

    newConnection(socket) {
        if (!socket._preventAuto) {
            this.addAutoEvents(socket);
        }
        socket.on("disconnect", Core.bind(this.onDisconnect, this, [socket], 0));
        this.onConnect.call(this, socket);
    }

    isPreventAutoEvents(socket) {
        return socket._preventAuto ? true : false;
    }
    preventAutoEvents(socket) {
        socket._preventAuto = true;
    }
    addTwoWayEvents(socket, fn, e) {
        socket.on(e, (signal, params, callback) => {
            return new Promise((resolve, reject) => {
                // fn.apply()
                fn.call(this, socket, signal, params, resolve, reject);
            }).then((response) => {
                callback({
                    success: true,
                    result: response
                })
            }).catch((response) => {
                callback({
                    success: false,
                    result: response instanceof Error ? response.message : response
                })
            })
        });
    }

    addAutoEvents(socket) {
        let events = this.events;
        // let twoWayEvents = this.twoWayEvents.map(i => { return { [i]: true } });
        // debugger

        if (Core.isObject(events)) {
            for (let e in events) {

                if (this.twoWayEventsMap[e]) {
                    this.addTwoWayEvents(socket, events[e], e);
                } else {

                    socket.on(e, Core.bind(events[e], this, [socket], 0));
                }
            }
        }
    }

    addEvents(socket, events) {
        if (Core.isObject(events)) {
            for (let e in events) {
                socket.on(e, Core.bind(events[e], this, [socket], 0));
            }
        }
    }

    hasDisconnect(socket) {
        this.onDisconnect.call(this, socket);
    }

    onConnect(socket) {
        console.log("onConnection")
    }
    onDisconnect(socket) {
        console.log("onDisconnect")
    }

    _asyncMiddleware(fn, scope) {
        return function (socket, next) {
            return Promise
                .resolve(
                    fn.call(scope, socket, next)
                ).catch(function (err) {
                    console.log(err);
                    next(new Error("error in code"))
                });
        }
    }
}


export default SController;