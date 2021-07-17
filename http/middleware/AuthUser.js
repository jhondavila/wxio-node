import Core from '../../core';

let refreshSession = function (req) {
    req.session.touch().save();
};
let checkSession = function (req) {
    if (req.session && req.session.hasLogin) {
        return true;
    } else {
        return false;
    }
};

export default function (req, res, next) {
    let method = this.method,
        path = this.path,
        handler = this.handler,
        ctrl = this.controller;
    let auth;

    if (Core.isObject(handler) && handler.hasOwnProperty("auth")) {
        auth = handler.auth;
    } else {
        auth = ctrl.auth;
    }

    if (auth) {
        if (checkSession(req)) {
            refreshSession(req);
            next();
        } else {
            res.status(498).send({
                success: false,
                message: 'Session Expired'
            });
        }
    } else {
        next();
    }
}