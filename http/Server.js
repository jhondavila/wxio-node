
import Core from '../core';
import httpBase from './Base';
import bodyParser from 'body-parser';
import methodOver from 'method-override';
import history from './util/history-api-fallback';

// import Controller from './Controller';

// namespace httpServer {
//     export interface config extends httpBase.config {

//     }

//     export interface ctrls {
//         [propName: string]: Controller;
//     }
// }

class httpServer extends httpBase {
    autoRun = false;
    public = {};
    checkRunServer = [];
    beforeConfigServer = Core.emptyFn;
    corsByOrigin = true;
    jsonConfig = {
        limit: '100mb'
    };
    urlencodedConfig = {
        limit: '100mb',
        extended: true
    };
    methodOverride = true;

    constructor(config) {
        super(config);
        this.beforeConfigServer();
        this.configServer();
        // this.init();
        // console.log(this);
    }
    init() {
        if (this.autoRun) {
            this.run();
        }
    }
    defaultInitMiddleware() {

        if (this.historyApiFallback && this.historyApiFallback) {
            this.app.use(history({
                ...this.historyApiFallback
            }));
        }

        this.addMiddleware(bodyParser.json(this.jsonConfig), {
            name: "server.jsonParser",
            type: "jsonparser",
            id: Core.id(null, "JsonParser-")
        }, "input");
        this.addMiddleware(bodyParser.urlencoded(this.urlencodedConfig), {
            name: "server.urlEncodedParser",
            type: "urlencodedparser",
            id: Core.id(null, "UrlEncodedParser-")
        }, "input");
        if (this.methodOverride) {
            this.addMiddleware(methodOver(), {
                name: "server.methodOverride",
                type: "methodoverride",
                id: Core.id(null, "MethodOverride-")
            }, "input");
        }

        // Wx.Function.interceptBefore(this, "middlewareHeader", function () {
        //     console.log("function interceptor")
        // });
        this.middlewareHeader();
        this.middlewareError404();
    }
    configServer() {
        this.defaultInitMiddleware();
    }
    run() {
        var checkInvalid = false;
        for (var x = 0; x < this.checkRunServer.length; x++) {
            if (this.checkRunServer[x] !== true) {
                checkInvalid = true;
                break;
            }
        }
        if (checkInvalid) {
            console.log(this.checkRunServer);
            return false;
        }
        super.run();
    }

    addController(ctrls, name) {
        let ctrl;

        if (Core.isObject(ctrls)) {
            for (let p in ctrls) {
                this.addController(ctrls[p], p);
            }
        } else if (Core.isFunction(ctrls)) {
            // console.log(ctrls);
            ctrl = new ctrls();
            ctrl.applyServer(this);
            this.addMiddleware(ctrl.router, {
                name: Core.id(null, name + "-"),
                type: "controller",
                id: Core.id(null, "Controller-")
            }, "router");
        }

        // let ctrl;
        // for (var p in ctrls) {
        //     ctrl = ctrls[p];
        //     ctrl = new ctrls[p];
        //     ctrl.applyServer(this);
        //     this.addMiddleware(ctrl.router, {
        //         name: Wx.id(null, p + "-"),
        //         type: "controller",
        //         id: Wx.id(null, "Controller-")
        //     }, "router");
        // }
    }
}

export default httpServer;