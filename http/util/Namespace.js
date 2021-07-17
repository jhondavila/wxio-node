import Core from '../../core';

class Namespace {


    // regEx =

    constructor() {
        this.list = {};
        this.listId = {};
        this.regEx = /(\/\w+\/|\/)(?=.*)/i;
    }

    getMiddleware() {
        var me = this;
        var fn = function (req, res, next) {

            var m = me.regEx.exec(req.url);
            var nsp = m ? m[0] : "";
            req.idNsp = me.getId(nsp);

            if (req.idNsp !== false) {
                req.url = req.url.substring(nsp.length - 1, req.url.length);
            } else {
                req.idNsp = me.getId("/");
            }


            if (req.idNsp !== false) {
                req.namespace = {
                    name: me.getNamespaceById(req.idNsp),
                    id: req.idNsp
                };
                // debugger
                next();
            } else {
                res.status(404).send({
                    success: false,
                    message: "No exits Namespace",
                    page: req.url
                });
            }
        };

        return fn;
    }

    addDomain(data) {
        var d;
        for (var x = 0; x < data.length; x++) {
            if (data[x]) {
                var obj = {};
                Core.apply(obj, data[x]);
                if (data[x].namespace !== "/") {
                    d = '/' + data[x].namespace.toUpperCase() + '/';
                } else {
                    d = data[x].namespace;
                }
                this.list[d] = obj;
                this.listId[obj.id] = obj;
            }
        }
    }
    getId(name, slash) {
        name = name.toUpperCase();
        if (this.list[name]) {
            return this.list[name].id;
        } else {
            return false;
        }
    }

    getNamespaceById(id) {
        if (this.listId[id]) {
            return this.listId[id].namespace;
        } else {
            return false;
        }
    }

    findNamespace(name) {
        if (name !== "/") {
            name = '/' + name.toUpperCase() + '/';
        }
        name = name.toUpperCase();
        if (this.list[name]) {
            return this.list[name].namespace;
        } else {
            return false;
        }
    }

}
export default Namespace;