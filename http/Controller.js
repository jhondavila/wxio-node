import express from 'express';
import Base from '../Base';
import Core from '../core';
// import Server from './Base';

import { deep } from 'q-set';

import EFnSession from './middleware/AuthUser';

import formidable from 'formidable';

class Controller extends Base {
    // private className = ;

    constructor(config) {
        super(config);
        this.className = "Controller";
        this.defaultAuth = true;
        this.middleware = [];
        this.auth,
            this.routes,
            this.router,
            this.headers,
            this.methods = ["post", "get", "put", "delete"],
            this.server;
        this.router = express.Router();
        Core.apply(this, config)
    }

    init() {

    }

    getIO() {
        if (this.server.ssio && this.server.ssio.io) {
            return this.server.ssio.io;
        }
        return;
    }

    applyServer(server, index) {
        this.server = server;
        if (!Core.isObject(this.routes)) {
            return false;
        }
        var x, method;
        if (!Array.isArray(this.methods)) {
            this.methods = [this.methods];
        }
        for (x = 0; x < this.methods.length; x++) {
            method = this.methods[x];
            if (Core.isObject(this.routes[method])) {
                this.createMethod(method, this.routes[method])
            }
        }
        this.init();

    }
    createMethod(method, routes) {
        var key, route;
        var fns = [], fn, regex, url;
        for (key in routes) {
            this.addPath(method, key, routes[key]);
        }
    }




    addPath(method, path, handler) {
        if (typeof path === "string") {
            if (path.indexOf("/") !== 0) {
                path = "/" + path;
            }
        }

        let handlers = [];

        if (this.defaultAuth) {
            let fnAuth = this.asyncMiddleware(EFnSession, {
                method: method,
                path: path,
                handler: handler,
                controller: this
            });
            handlers.push(fnAuth);
        }



        for (let x = 0; x < this.middleware.length; x++) {
            handlers.push(this.asyncMiddleware(this.middleware[x], this));
        }


        if (Core.isFunction(handler)) {
            let fnHandler = this.asyncMiddleware(handler, this);
            handlers.push(fnHandler)
        } else if (Core.isObject(handler)) {

            if (handler.form) {
                let fnFormSupported = this.asyncMiddleware(this.getFormSupported(handler), this)
                handlers.push(fnFormSupported);
            }

            if (Core.isString(handler.fn)) {
                let detectFn = this[handler.fn];
                if (detectFn) {
                    let fnHandler = this.asyncMiddleware(detectFn, this);
                    handlers.push(fnHandler)
                } else {
                    console.warn(`No se ha detectado la funcion con la clave : ${handler.fn}`);
                }
            } else if (Core.isFunction(handler.fn)) {
                let fnHandler = this.asyncMiddleware(handler.fn, this);
                handlers.push(fnHandler)
            } else {
                console.warn(`No se ha detectado la funcion "${method}" con la ruta : ${path}`);
            }


        } else if (Core.isArray(handler)) {
            let listHandlers = [];
            for (let i = 0; i < handler.length; i++) {
                listHandlers.push(this.asyncMiddleware(handler[i], this))
            }
            handlers = handlers.concat(listHandlers);
        }
        this.router[method](path, handlers);

    }



    asyncMiddleware(fn, scope) {
        return function (req, res, next) {
            return Promise
                .resolve(
                    fn.call(scope, req, res, next)
                ).catch(function (err) {
                    console.group()
                    console.log(req.tenantName)
                    console.log(err);
                    console.groupEnd()
                    res.status(500).send({
                        success: false,
                        error: {
                            name: err.name,
                            message: err.message,
                            stack: err.stack
                        }
                    });
                });
        }
    }

    getParams(req) {
        var obj = {};
        if (req.query) {
            Core.apply(obj, req.query);
        }
        if (req.body) {
            Core.apply(obj, req.body);
        }
        return obj;
    }
    parseMd5(string) {
        return Core.String.parseMd5(string);
    }
    parseSHA256(string, privateKey) {
        return Core.String.parseSHA256(string, privateKey);
    }
    getFormSupported(handler) {

        let fn = async function (req, res, next) {
            let opts = {
                maxFieldsSize: 1000 * 1024 * 1024,
                // maxFields : 10000000,
                maxFileSize: 1000 * 1024 * 1024,
                multiples: true,
                propertyForFiles: false,
                propertyForFields: false,
                propertyParse: false
                // uploadDir: null
            };

            if (Core.isObject(handler.form)) {
                Core.apply(opts, handler.form);
            }
            if (Core.isFunction(opts.uploadDir)) {
                opts.uploadDir = await opts.uploadDir(req, res, next);
            }

            if (opts.uploadDir) {
                await Core.checkDirectory(opts.uploadDir);
            }

            let form = formidable.IncomingForm(opts);
            Core.apply(form, opts)
            form.parse(req, (err, fields, files) => {
                if (err) {
                    console.log(err);
                    res.status(500).send({
                        success: false,
                        error: err,
                        message: "Error in form"
                    });
                } else {

                    let parsedParams = {};

                    for (var key in fields) {
                        if (fields[key] === "null") {
                            fields[key] = null;
                        }
                        if (fields[key] === "[]") {
                            fields[key] = [];
                        }
                        deep(parsedParams, key, fields[key]);
                    }

                    for (var key in files) {
                        deep(parsedParams, key, files[key]);
                    }

                    if (!opts.propertyParse) {
                        Core.apply(req.body, parsedParams);
                    } else {
                        req.body[opts.propertyParse] = parsedParams;
                    }

                    if (!opts.propertyForFiles) {
                        Core.apply(req.body, files);
                    } else {
                        req.body[opts.propertyForFiles] = files;
                    }

                    if (!opts.propertyForFields) {
                        Core.apply(req.body, fields);
                    } else {
                        req.body[opts.propertyForFields] = fields;
                    }
                    next();
                }
            });
        };
        return fn;
    }
}

export default Controller;

