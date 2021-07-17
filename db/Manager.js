
// import * as data from '../../../config/config.json';
// import path from 'path';




import SequelizeWx from './sequelize';
import Core from '../core';


// interface idb {
//     [propName: string]: SequelizeWx;
// }
class DBManager {
    // db: idb = {};
    constructor() {
        this.db = {};
        let pathConfig = Core.pathResolve("./src/config/database.json");

        let config = Core.readJSONFile(pathConfig);

        if (Core.isObject(config) && config.connections) {

            if (!Core.isArray(config.connections)) {
                config.connections = [config.connections];
            }

            this.loadConfig(config);
        }
    }
    loadConfig(config) {
        for (let x = 0; x < config.connections.length; x++) {
            let cnx = config.connections[x];
            var activeCnx = config.active || "default";
            if (cnx.cnxType === "sequelize") {
                this.addCnxSequelize(cnx, activeCnx);
            } else {
                this.addCnxSequelize(cnx, activeCnx);
            }
        }
    }

    addCnx(cnx, activeCnx = "default") {
        if (!Core.isArray(cnx)) {
            cnx = [cnx];
        }
        cnx.forEach((i) => {
            if (i.cnxType === "sequelize") {
                this.addCnxSequelize(i, activeCnx);
            } else {
                this.addCnxSequelize(i, activeCnx);
            }
        });

    }

    removeCnx(cnx) {
        for (let p in this.db) {
            if (this.db[p] === cnx) {
                delete this.db[p];
            }
        }
    }


    addCnxSequelize(cnx, activeCnx) {
        let connection = Core.getEmptyObj();
        if (cnx.db) {
            if (cnx.db[activeCnx]) {
                Core.apply(connection, cnx.db[activeCnx]);
            }
        } else {
            Core.apply(connection, cnx);
        }
        connection.minifyAliases = true;
        connection.pool = {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        };
        delete connection.name;
        let sequelize = new SequelizeWx(connection);
        this.registerCnx(cnx.name || connection.database, sequelize)
        return this.get(cnx.name || connection.database);
    }
    registerCnx(name, obj) {
        this.db[name] = obj;
    }
    get(key) {
        return this.db[key];
    }
}
export default new DBManager();
