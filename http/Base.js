import http from 'http';
import express from "express";
import Core from '../core';
import LayerManager from './LayerManager';
import Base from '../Base';
import https from "https";
import history from './util/history-api-fallback';
// import Core from '../core';

class httpBase extends Base {
    constructor(config) {
        super(config)

        this.port = 3000;
        this.reflectHttpPort = 2999;

        this.defaultHeaders = {};
        this.historyApiFallback;
        this.corsByOrigin = false;
        this.autoSS = false;
        this.SS;

        this.reflectHttp = false;
        Core.apply(this, config);

        this.app = express();
        // this.app.use(history({
        //     excludes: this.excludes
        // }));
        this.layerMgr = new LayerManager({
            app: this.app
        });
        global.server = this;
    }

    get srv() {
        if (this._srv) {
            return this._srv;
        } else {
            if (this.tls) {
                this._srv = https.createServer(this.tls, this.app);
                if (this.reflectHttp) {
                    this._reflectSrv = new http.Server(this.app);
                }
            } else {
                this._srv = new http.Server(this.app);
            }
            return this._srv;
        }
    }

    addPublicPath(pathName, path) {
        let router = express.Router();
        router.use(pathName, express.static(path));
        return this.addMiddleware(router, {
            name: Core.id(null, pathName + "-"),
            type: "controller",
            id: Core.id(null, "Controller-")
        }, "router");
    }
    addMiddleware(middleware, cfg, namespace = "router", order = null) {
        if (!cfg) {
            let id = Core.id(null, "Middleware-");
            cfg = {
                name: id,
                type: "middleware",
                id: id
            }
        }
        return this.layerMgr.addMiddleware(middleware, cfg, namespace, order);
    }
    middlewareHeader(namespace = "input", order = null) {
        let me = this;
        let fn = function (req, res, next) {
            me.setHeader(req, res);


            let method = req.method && req.method.toUpperCase && req.method.toUpperCase();
            // debugger
            if (method === 'OPTIONS') {
                res.statusCode = 204;
                res.setHeader('Content-Length', '0');
                res.end();
            } else {
                next();
            }
        };
        this.addMiddleware(fn, {
            name: "server.headers",
            type: "headers",
            id: Core.id(null, "ServerHeaders-")
        }, namespace, order);
    }
    setHeader(req, res) {
        if (this.corsByOrigin && req.headers.origin) {
            res.header('Access-Control-Allow-Origin', req.headers.origin);
        }

        Core.Object.each(this.defaultHeaders, function (key, value) {
            res.setHeader(key, value);
        });
        if (this.logWorkers) {
            let me = this;
            res.sendSafe = res.send;
            res.send = function (params) {
                Object.assign(params, {
                    worker: me.port
                })
                res.sendSafe(params)
            };
        }


        res.setHeader('X-Powered-By', 'Wx');
    }
    run(hostname) {
        // this.fireEvent("beforelisten", this, this.srv, this.port);
        this.srv.on("error", this.errorSrv.bind(this));
        if (hostname) {
            this.srv.listen(this.port, hostname, this.listenServer.bind(this));
            this._reflectSrv.listen(this.reflectHttpPort,hostname,this.listenServer.bind(this));
        } else {
            this.srv.listen(this.port, this.listenServer.bind(this));
            this._reflectSrv.listen(this.reflectHttpPort,this.listenServer.bind(this));
        }
    }
    errorSrv(e) {
        console.error(e)
        if (e.code === 'EADDRINUSE') {

        }
    }
    listenServer() {
        console.log("Node server running on http://localhost:" + this.port);
        // this.appNode.httpListen(this);
        // Nodext.logClassReady("Node server running on http://localhost:" + this.port);
        /**
         * @event
         * Se dispara cuando el servidor empieza a escuchar peticiones a travez del puerto configurado.
         * @param {Nodext.http.Base} this
         * @param {Nodext.app.Node} appNode
         */
        // this.fireEvent("listen", this, this.appNode);
    }
    middlewareError404(namespace = "output", order = null) {
        // console.log("middlewareError404")
        var fn = function (req, res, next) {
            res.status(404);
            if (req.accepts('html')) {
                res.send({ success: false, message: 'Pagina no encontrada', page: req.url });
                return;
            }
            if (req.accepts('json')) {
                res.send({ success: false, message: 'Pagina no encontrada', page: req.url });
                return;
            }
            res.type('txt').send('Not found');
        };
        this.addMiddleware(fn, {
            name: "server.error404",
            type: "error404",
            id: Core.id(null, "ServerError-")
        }, namespace, order);
    }
}

export default httpBase;