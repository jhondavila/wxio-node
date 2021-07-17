import Core from '../core';
// import lArray from "../core/lang/Array";


// namespace LayerManager {
//     // accessible as Widget.KwArgs
//     export interface config {
//         namespace?: any;
//         app: any;
//     }
// }

// console.log(Core.remove)


class LayerManager {


    // namespace = 

    // app: any;
    constructor(config) {
        this.namespace = config.namespace || {
            output: -8,
            afterrequest: -7,
            router: -6,
            beforerequest: -5,
            auth: -4,
            validation: -3,
            input: -2,
            boot: -1
        };
        this.app = config.app;

        this.forceLazyRouter();
        this.regBootLayer();

        Core.setGlobal("layermgr", this);
    }
    regBootLayer() {
        let layers = this.getLayers();
        let layer;
        let namespace = "boot";
        for (let x = 0; x < layers.length; x++) {
            layer = layers[x];
            let uuidLayer = Core.id(null, "layer-");

            this.applyProp(layer.handle, {
                UUID: uuidLayer,
                nspriority: this.namespace[namespace],
                ns: namespace,
                order: x
            });
        }
        // console.log(this.getLayers());

        this.sortLayers();
    }
    forceLazyRouter() {
        var id = Core.id(null, "lazyrouterinit-");
        this.addLayer(() => { }, {
            name: "server.lazyrouterinit",
            type: "lazyrouterinit",
            id: id,
        });
        let layer = this.getLayerById(id);
        this.removeMiddleware(layer);
    }
    removeMiddleware(middleware) {
        var _router = this.app._router,
            stack = _router.stack;
        Core.Array.remove(stack, middleware);
    }
    applyProp(obj, cfg) {
        for (let p in cfg) {
            Object.defineProperty(obj, "_" + p, { value: cfg[p] });
        }


    }
    getProp(layer, prop) {

        let handle = layer.handle;

        if (handle.hasOwnProperty("_" + prop)) {
            return handle["_" + prop];
        } else {
            return undefined;
        }
    }
    addMiddleware(middleware, cfg, namespace = "router", order = null) {
        let layer = this.addLayer(middleware, cfg, namespace, order);
        this.sortLayers();
        return layer;
    }
    sortLayers() {
        var layers = this.getLayers();
        let aF1, bF1, aF2, bF2;
        layers = layers.sort(this.fnSortLayer.bind(this));
    }
    fnSortLayer(a, b) {
        let aF1, bF1, aF2, bF2;
        aF1 = this.getProp(a, "nspriority");
        bF1 = this.getProp(b, "nspriority");
        aF2 = this.getProp(a, "order");
        bF2 = this.getProp(b, "order");
        return bF1 - aF1 || aF2 - bF2;
    }
    addLayer(middleware, cfg, namespace = "router", order = null) {
        let uuidLayer = Core.id(null, "layer-");
        this.applyProp(middleware, cfg);
        this.applyProp(middleware, {
            UUID: uuidLayer,
            nspriority: this.namespace[namespace],
            ns: namespace,
            order: order
        });
        this.app.use(middleware)
        let layer = this.getLayerByUUID(uuidLayer);
        return layer;
    }
    getLayerIndex(layer) {
        var layers = this.getLayers();

        var index = Core.indexOf(layers, layer);
        if (index > -1) {
            return index;
        } else {
            return null;
        }
    }
    getLayers() {
        var _router = this.app._router,
            stack = _router.stack;
        return stack;
    }
    getLayerByProp(value, prop) {
        var layers = this.getLayers(), layer, x, handle, findLayer;
        for (x = 0; x < layers.length; x++) {
            layer = layers[x];
            // handle = layer.handle;
            if (this.getProp(layer, prop) === value) {
                findLayer = layer;
                break;
            }
        }
        return findLayer;
    }
    getLayerByUUID(value) {
        return this.getLayerByProp(value, "UUID");
    }
    getLayerById(value) {
        return this.getLayerByProp(value, "id");
    }

}


export default LayerManager;