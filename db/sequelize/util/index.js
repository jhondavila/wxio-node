import Core from "../../../core";
import { Op, col } from 'sequelize';

export default {

    findRecord(list, key, value) {
        let item;
        for (let x = 0; x < list.length; x++) {
            if (list[x].get && list[x].get(key) == value) {
                item = list[x];
            }
        }
        return item;
    },

    async processDependeces(item, dependences, dataResDep) {

        for (let key in dependences) {
            let dependence = dependences[key];

            let DBModel = dependence.model;
            let foreignKey = dependence.foreignKey;
            let field = dependence.field;
            let includes = dependence.include;


            if (item[foreignKey]) {

                let data = item[field];

                let record;

                if (Core.isNumeric(data.id)) {
                    record = await DBModel.findOne({
                        where: {
                            id: data.id
                        }
                    });
                    if (record) {
                        await record.update(data);
                    }
                } else {
                    delete data.id;
                    record = await DBModel.create(data);
                }

                if (record) {
                    item[dependence.foreignKey] = record.get("id");
                    let dataRes = record.get({
                        plain: true
                    });
                    if (includes) {
                        await this.processIncludes(record, data, includes, dataRes);
                    }
                    dataResDep[dependence.field] = dataRes;
                }
            }
        }

    },

    async processIncludes(record, item, includes, dataRes) {
        // debugger

        for (let inc = 0; inc < includes.length; inc++) {
            let include = includes[inc];
            // debugger
            if (item.hasOwnProperty(include.field)) {



                let includeData = item[include.field];


                if (include.handler) {

                    dataRes[include.field] = await include.handler(record, includeData, include);
                } else {


                    if (Array.isArray(includeData)) {

                        dataRes[include.field] = await this.nestedArray(
                            record,
                            {
                                ...include,
                                data: includeData
                            }
                        );
                    } else {

                        dataRes[include.field] = await this.nestedObject(includeData,
                            {
                                ...include,
                                data: includeData
                            },
                            record
                        );
                    }

                }
            }
        }


    },
    preventFields(item, fields) {
        if (fields) {
            fields.forEach((field) => {
                delete item[field];
            });
        }
    },
    async nestedObject(dataItem, options, recordParent) {
        // debugger
        // let response = [];
        let DBModel = options.model;
        let includes = options.include;
        let dependences = options.dependences;
        let foreignKey = options.foreignKey;
        let item = Object.assign({}, dataItem);
        let record;
        // let item = options.data;
        let dataRes = {};

        if (recordParent) {
            item[foreignKey] = recordParent.get("id");
        }

        if (Core.isNumeric(item.id)) {
            record = await DBModel.findOne({
                where: {
                    id: item.id
                }
            });
            if (record) {
                if (dependences) {
                    //         await this.processDependeces(item, dependences, dataResDep);
                }
                this.preventFields(item, options.preventFields);
                await this.addFields(item, options.addFields);
                await record.update(item);
            }
        } else {
            let clientId = item.id;
            delete item.id;
            if (dependences) {
                //     await this.processDependeces(item, dependences, dataResDep);
            }
            // debugger
            this.preventFields(item, options.preventFields);
            await this.addFields(item, options.addFields);

            record = await DBModel.create(item);
            Object.assign(dataRes, {
                clientId: clientId,
                id: record.get("id")
            });
        }

        if (record) {
            Object.assign(dataRes, record.get({
                plain: true
            }))
            if (includes) {
                await this.processIncludes(record, dataItem, includes, dataRes);
            }
            return dataRes;
        } else {
            return null;
        }
    },


    async addFields(item, fields = []) {
        for (let x = 0; x < fields.length; x++) {
            let field = fields[x];
            if (typeof field.value === "function") {
                await field.value(field.property, item);
            } else {
                item[field.property] = field.value;
            }
        }
    },
    async bacthModel(options) {
        let response = [];
        let data = options.data;
        for (let i = 0; i < data.length; i++) {

            let dataRes = await this.nestedObject(data[i], {
                model: options.model,
                include: options.include,
                dependences: options.dependences,
                preventFields: options.preventFields,
                addFields: options.addFields
            });
            if (dataRes) {
                response.push(dataRes);
            }
        }
        return response;
    },

    async nestedArray(model, options) {

        let response = [];
        let DBModel = options.model;
        let data = options.data;
        let foreignKey = options.foreignKey;
        let includes = options.include;
        let dependences = options.dependences;

        let list = await DBModel.findAll({
            where: {
                [foreignKey]: model.get("id")
            }
        });

        let item;
        let record;

        for (let i = 0; i < data.length; i++) {
            item = data[i];
            item[foreignKey] = model.get("id");
            let dataResDep = {};
            let dataRes = {};





            if (Core.isNumeric(item.id)) {
                record = this.findRecord(list, "id", item.id)
                if (record) {
                    if (dependences) {
                        await this.processDependeces(item, dependences, dataResDep);
                    }
                    await record.update(item);
                    Core.Array.remove(list, record);
                }
            } else {
                let clientId = item.id;
                delete item.id;
                if (dependences) {
                    await this.processDependeces(item, dependences, dataResDep);
                }
                record = await DBModel.create(item);
                Object.assign(dataRes, {
                    clientId: clientId,
                    id: record.get("id")
                });
            }
            if (record) {
                Object.assign(dataRes, record.get({
                    plain: true
                }))

                Core.apply(dataRes, dataResDep);

                if (includes) {
                    await this.processIncludes(record, item, includes, dataRes);
                }
                response.push(dataRes);
            }






        }

        let deleteList = list.map((item) => {
            return item.get("id")
        });

        await DBModel.destroy({
            where: {
                id: {
                    [Op.in]: deleteList
                }
            }
        });
        return response;
    },


    //where Utils

    parseWhere(where = [], options) {
        let whereParse = {

        };
        options = options || {};
        where.forEach(item => {
            this._applyWh(whereParse, item, options);
        });
        return whereParse;
    },
    _applyWh(whereObj, item, options) {


        let replaceFields = options.replaceFields || {};
        let key = `$${item.field}$`;

        if (replaceFields.hasOwnProperty(item.field)) {
            // debugger
            key = `$${replaceFields[item.field]}$`;
        }

        if (item.type === "where_in") {

            let value = item.value;
            whereObj[key] = {
                [Op.in]: value
            };
        } else if (item.type === "between") {
            let value = item.value;
            whereObj[key] = {
                [Op.between]: value
                // [Op.in]: value
            };
        } else if (item.type === "like" && item.ilike == true) {
            let value = item.value;
            whereObj[key] = {
                [Op.iLike]: value
                // [Op.in]: value
            };
        } else if (item.type === "like") {
            let value = item.value;
            whereObj[key] = {
                [Op.like]: value
                // [Op.in]: value
            };
        } else if (item.type == "or_where"){
            if(!whereObj[Op.or]) {
                whereObj[Op.or] = [];
            }
            let value = item.value;
            whereObj[Op.or].push({
                [key] : {
                    [Op.eq] : value
                }
            });
        } else if (item.type == "or_where_in"){
             if(!whereObj[Op.or]) {
                whereObj[Op.or] = [];
            }
            let value = item.value;
            whereObj[Op.or].push({
                [key] : {
                    [Op.in] : value
                }
            });
        } else {

            let value = item.value;
            whereObj[key] = {
                [Op.eq]: value
            };
        }

    }

};