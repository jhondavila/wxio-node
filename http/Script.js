import Core from '../core'
export default {
    whType: {
        ///
        where: 0,
        or_where: 0,
        where_in: 1,
        or_where_in: 1,
        where_not_in: 1,
        or_where_not_in: 1,
        ///
        like: 2,
        not_like: 2,
        or_like: 2,
        or_not_like: 2,
        ///
        or_group_start: 3,
        not_group_start: 3,
        or_not_group_start: 3,
        group_start: 3,
        ///
        between: 4
    },
    queryUtil(req, options) {
        let params = this.getParams(req);
        if (params.data) {
            try {
                if (Core.isString(params.data)) {
                    params.data = Core.JSON.decode(params.data);
                    if (!Core.isArray(params.data)) {
                        params.data = [params.data];
                    }
                } else if (Core.isArray(params.data)) {
                    params.data = params.data;
                }
            } catch (error) {
                params.data = [];
            }
        }

        if (params.filter) {
            params.where = this.whereFormat(params.filter, options && options.filters ? options.filters : {}, false);
        } else {
            params.where = [];
        }
        if (params.extraFilter) {
            params.where = params.where || [];
            params.where = Core.Array.merge(params.where, this.whereFormat(params.extraFilter, options && options.filters ? options.filters : {}, true));
        }

        return params;
    },
    whereFormat(filters, options = {}, extraFilter) {
        if (typeof filters === "string") {
            // try {
            filters = JSON.parse(filters);
            // if (extraFilter === false) {
            //     inst.cacheFilter = filters;
            // } else if (extraFilter === true) {
            //     inst.cacheExtraFilter = filters;
            // }
            // } catch (e) {
            // return []
            // inst.sendError({
            //     message: "Error al decodificar la entrada de datos"
            // });
            // return false;
            // }
        }
        if (!Array.isArray(filters)) {
            filters = [filters];
        } else {
            filters = filters.map(i => {
                try {
                    if (typeof i === "string") {
                        return JSON.parse(i);
                    } else {
                        return i;
                    }
                } catch (error) {
                    return i;
                }

            })

        }
        let where = [];
        this.loopWh(filters, options, where);
        return where;
    },

    findFilter(req, filterName) {
        let params = this.getParams(req);
        let findFilter;
        params.filter = params.filter || [];

        if (Core.isString(params.filter)) {
            try {
                params.filter = JSON.parse(params.filter);
            } catch (error) {

            }
        }

        if (!Core.isArray(params.filter)) {
            params.filter = [params.filter]
        }
        let filter;
        for (let x = 0; x < params.filter.length; x++) {
            filter = params.filter[x];

            if (Core.isString(filter)) {
                try {
                    filter = JSON.parse(filter);
                } catch (error) {

                }
            }
            if (filter.property == filterName) {
                findFilter = filter;
            } else if (!filter.property && !filter.value) {
                let allKeys = Core.Object.getAllKeys(filter);
                if (allKeys[0]) {
                    let property = allKeys[0];
                    let value = filter[allKeys[0]];
                    if (property == filterName) {
                        findFilter = {
                            property: property,
                            value: value
                        };
                    }
                }
            }

        }
        return findFilter;
    },
    getParams(req) {
        var obj = {};
        if (req.query) {
            Core.apply(obj, req.query);
        }
        if (req.body) {
            Core.apply(obj, req.body);
        }
        if (req.handshake && req.handshake.query) {
            Core.apply(obj, req.handshake.query);
        }
        return obj;
    },
    loopWh: function (filters, options, where) {
        let replaceFields = options.replaceFields || {},
            extraReplace = options.extraReplace || {},
            ignoreFilter, field, value, type, operator, fn, filter, nf, x;
        for (x = 0; x < filters.length; x++) {
            filter = filters[x];
            if (Core.isObject(filter)) {
                ignoreFilter = false;
                if (options.validate) {
                    // debugger
                    fn = options.validate[filter.property];
                    if (Core.isFunction(fn)) {
                        if (fn(filter, filters) === false) {
                            ignoreFilter = true;
                        }
                    }
                } else if (options.extraValidate) {
                    fn = options.extraValidate[filter.property];
                    if (Core.isFunction(fn)) {
                        if (fn(filter, filters) === false) {
                            ignoreFilter = true;
                        }
                    }
                }
                field = filter.property;
                value = filter.hasOwnProperty("value") ? filter.value : null;
                // debugger
                if (filter.exactMatch === true && value !== null) {
                    filter.exactMatch = "=";
                } else {
                    filter.exactMatch = null;
                }

                operator = filter.operator || filter.exactMatch || null;
                type = filter.type || 'where';


                if (replaceFields || extraReplace) {
                    if (replaceFields[field] || extraReplace[field]) {
                        field = replaceFields[field] || extraReplace[field];
                    }
                }
                if (!ignoreFilter) {
                    if (this.whType[type] === 0) {
                        //                        if (operator === "=") {
                        //                            where.push({
                        //                                type: type,
                        //                                field: field + " =",
                        //                                value: value
                        //                            });
                        //                        } else if (operator === " <>") {
                        //                            where.push({
                        //                                type: type,
                        //                                field: field + " <>",
                        //                                value: value
                        //                            });
                        //                        } else {
                        where.push({
                            type: type,
                            operator: operator,
                            field: field,
                            value: value
                        });
                        //                        }
                    } else if (this.whType[type] === 1) {
                        if (Array.isArray(value)) {
                            value = value.slice(0, value.length);
                        } else {
                            value = [value];
                        }
                        where.push({
                            type: type,
                            field: field,
                            value: value
                        });
                    } else if (this.whType[type] === 2) {
                        nf = {
                            type: type,
                            field: field,
                            value: value,
                            cast: filter.cast
                        };
                        if (filter.hasOwnProperty("ignoreCase")) {
                            nf.ilike = filter.ignoreCase;
                        }
                        where.push(nf);
                    } else if (this.whType[type] === 3) {
                        where.push({
                            type: type,
                            where: this.queryWhereFilters(filter.where || [], options)
                        });
                    } else if (this.whType[type] === 4) {
                        where.push({
                            type: type,
                            field: field,
                            value: value
                        });
                    } else {
                        where.push({
                            field: field,
                            value: value
                        });
                    }
                }
            }
        }
        ignoreFilter = field = value = type = operator = fn = filter = x = nf = null;
    }
};