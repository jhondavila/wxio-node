

export default {
    setValue(obj, value, path) {
        var i;
        path = path.split('.');
        for (i = 0; i < path.length - 1; i++) {
            if (obj[path[i]] === undefined) {
                obj[path[i]] = {};
                obj = obj[path[i]];

            } else {
                obj = obj[path[i]];
            }
        }
        obj[path[i]] = value;
    },
    getValue(key, item, defaultValue) {
        const field = typeof key !== "object" ? key : key.field;
        let indexes = typeof field !== "string" ? [] : field.split(".");
        let value = defaultValue;

        if (!field) value = item;
        else if (indexes.length > 1)
            value = this.getValueFromNestedItem(item, indexes, defaultValue);
        else value = this.parseValue(item[field], defaultValue);

        if (key.hasOwnProperty("callback"))
            value = this.getValueFromCallback(value, key.callback, defaultValue);

        return value;
    },
    getValueFromNestedItem(item, indexes, defaultValue) {
        let nestedItem = item;
        for (let index of indexes) {
            if (nestedItem) nestedItem = nestedItem[index];
        }
        return this.parseValue(nestedItem, defaultValue);
    },
    getValueFromCallback(item, callback, defaultValue) {
        if (typeof callback !== "function") return defaultValue;
        const value = callback(item);
        return this.parseValue(value, defaultValue);
    },
    parseValue(value, defaultValue) {
        return value || value === 0 || value === false ? value : defaultValue;
    }
};