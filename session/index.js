import eSession from 'express-session';
import eIOSession from 'express-socket.io-session';

import Core from '../core';
import Util from '../util'
import { EventEmitter } from 'events';
import connectSessionSequelize from './connect/connect-session-sequelize';
class ExpressSession extends EventEmitter {

    constructor(config) {
        super();
        // this.DB,
        //     this.modelName,
        this.store,
            this.secret = Util.OS.hostUUID();
        this.resave = false;
        this.rolling = true;
        this.saveUninitialized = false;
        this.cookie = {
            httpOnly: true,
            maxAge: {
                month: 0,
                day: 0,
                hour: 2,
                min: 0,
                sec: 0
            }
        };
        this.name = "connect.sid"
        this.middleware, this.ctStore = null;

        Core.apply(this, config);
        // if (this.DB) {
        this.initStore();
        // }

        let cookieCfg = this.normalizeCookieCfg(this.cookie);
        // cookieCfg.maxAge = null;
        // cookieCfg.expires =  false;

        this.middleware = eSession({
            store: this.store,
            secret: this.secret,
            resave: this.resave,
            rolling: this.rolling,
            saveUninitialized: this.saveUninitialized,
            cookie: cookieCfg,
            name: this.name
        });
    }
    normalizeCookieCfg(cookie) {
        let cookieCfg = Core.apply({}, cookie);
        if (cookieCfg.maxAge && Core.isObject(cookieCfg.maxAge)) {
            var maxAge = cookieCfg.maxAge;
            var month = (maxAge.month || 0) * 30 * 24 * 60 * 60;
            var day = (maxAge.day || 0) * 24 * 60 * 60;
            var hour = (maxAge.hour || 0) * 60 * 60;
            var min = (maxAge.min || 0) * 60;
            var sec = (maxAge.sec || 0);
            cookieCfg.maxAge = (month + day + hour + min + sec) * 1000;
        }
        return cookieCfg;
    }
    getMiddleware() {
        return this.middleware;
    }
    getIOMiddleware() {
        // debugger
        return eIOSession(this.middleware);
    }
    initStore() {

        if (this.store.type === "sequelize") {

            let SequelizeStore = connectSessionSequelize(eSession.Store);
            // this.ctStore = new StoreSequelize(this.store);
            this.store = new SequelizeStore({
                db: this.store.db,
                table: this.store.modelName
            });
        }


    }
}

export default ExpressSession;