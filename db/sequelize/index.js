import SequelizeLib from 'sequelize';


import DataTypes from 'sequelize/lib/data-types';
import Core from '../../core';




class SequelizeWx extends SequelizeLib {
    // map: any;
    // DataTypes = DataTypes;
    // config: any;

    constructor(parm) {
        super(parm);
        this.DataTypes = DataTypes,
            this.map,
            this.config;
        this.map = {
        };
    }
    addModels(models) {
        this.registerModelMap(models, this.map);
    }

    registerModelMap(obj, root) {
        if (Core.isObject(obj)) {
            for (let p in obj) {
                if (Core.isObject(obj[p])) {
                    if (!root[p]) {
                        root[p] = {};
                    }
                    this.registerModelMap(obj[p], root[p])
                } else if (Core.isFunction(obj[p])) {
                    root[p] = obj[p](this, this.DataTypes);
                }
            }
        }
    }

    addAssociations(associations) {
        // try {
        if (Core.isArray(associations)) {
            for (let x = 0; x < associations.length; x++) {
                this.addAssociations(associations[x]);
            }
        } else if (Core.isObject(associations)) {
            for (let key in associations) {
                this.addAssociations(associations[key]);
            }
        } else if (Core.isFunction(associations)) {
            associations(this, this.map, DataTypes);
        }
    }

    async addHooks(hooks) {
        // try {
        if (Core.isArray(hooks)) {
            for (let x = 0; x < hooks.length; x++) {
                await this.addHooks(hooks[x]);
            }
        } else if (Core.isObject(hooks)) {
            for (let key in hooks) {
                await this.addHooks(hooks[key]);
            }
        } else if (Core.isFunction(hooks)) {
            await hooks(this, this.map, DataTypes);
        }
    }

    getModel(key) {
        return this.models[key];
    }

}

export default SequelizeWx;



// export { DataTypes };
// export {
//     Sequelize

// }
