import SequelizeLib from 'sequelize';

import Core from '../../core';
import BelongsToMany from 'sequelize/lib/associations/belongs-to-many';
import Utils from 'sequelize/lib/utils';
import _ from 'lodash';


BelongsToMany.prototype.toInstanceArray = function (objs) {
    console.log("modificado");
    if (!Array.isArray(objs)) {
        objs = [objs];
    }
    return objs.map(function (obj) {
        if (!(obj instanceof this.target)) {
            const tmpInstance = {};
            if (Core.isObject(obj)) {
                Core.apply(tmpInstance, obj);
                if (obj["_primaryKey"]) {
                    tmpInstance[this.target.primaryKeyAttribute] = obj["_primaryKey"];
                }
                // tmpInstance[this.target.primaryKeyAttribute] = obj;
            } else {
                tmpInstance[this.target.primaryKeyAttribute] = obj;
            }
            return this.target.build(tmpInstance, {
                isNewRecord: false
            });
        }
        return obj;
    }, this);
}


BelongsToMany.prototype.add = function (sourceInstance, newInstances, options) {
    // If newInstances is null or undefined, no-op
    if (!newInstances) return Utils.Promise.resolve();

    options = _.clone(options) || {};

    const association = this;
    const sourceKey = association.source.primaryKeyAttribute;
    const targetKey = association.target.primaryKeyAttribute;
    const identifier = association.identifier;
    const foreignIdentifier = association.foreignIdentifier;
    const defaultAttributes = _.omit(options.through || {}, ['transaction', 'hooks', 'individualHooks', 'ignoreDuplicates', 'validate', 'fields', 'logging']);

    newInstances = association.toInstanceArray(newInstances);

    const where = {};
    where[identifier] = sourceInstance.get(sourceKey);
    where[foreignIdentifier] = newInstances.map(newInstance => newInstance.get(targetKey));

    _.assign(where, association.through.scope);

    return association.through.model.findAll(_.defaults({ where, raw: true }, options)).then(currentRows => {
        const promises = [];
        const unassociatedObjects = [];
        const changedAssociations = [];
        for (const obj of newInstances) {
            const existingAssociation = _.find(currentRows, current => current[foreignIdentifier] === obj.get(targetKey));

            if (!existingAssociation) {
                unassociatedObjects.push(obj);
            } else {
                const throughAttributes = obj[association.through.model.name];
                const attributes = _.defaults({}, throughAttributes, defaultAttributes);

                if (_.some(Object.keys(attributes), attribute => attributes[attribute] !== existingAssociation[attribute])) {
                    changedAssociations.push(obj);
                }
            }
        }

        if (unassociatedObjects.length > 0) {
            const bulk = unassociatedObjects.map(unassociatedObject => {
                const throughAttributes = unassociatedObject[association.through.model.name];
                const attributes = _.defaults({}, throughAttributes, defaultAttributes);

                attributes[identifier] = sourceInstance.get(sourceKey);
                attributes[foreignIdentifier] = unassociatedObject.get(targetKey);

                _.assign(attributes, association.through.scope);

                return attributes;
            });

            promises.push(association.through.model.bulkCreate(bulk, _.assign({ validate: true }, options)));
        }

        for (const assoc of changedAssociations) {
            let throughAttributes = assoc[association.through.model.name];
            const attributes = _.defaults({}, throughAttributes, defaultAttributes);
            const where = {};
            // Quick-fix for subtle bug when using existing objects that might have the through model attached (not as an attribute object)
            if (throughAttributes instanceof association.through.model) {
                throughAttributes = {};
            }

            where[identifier] = sourceInstance.get(sourceKey);
            where[foreignIdentifier] = assoc.get(targetKey);

            promises.push(association.through.model.update(attributes, _.extend(options, { where })));
        }

        return Utils.Promise.all(promises);
    });
};

BelongsToMany.prototype.set = function (sourceInstance, newAssociatedObjects, options) {

    console.log("modificado")
    options = options || {};

    const association = this;
    const sourceKey = association.source.primaryKeyAttribute;
    const targetKey = association.target.primaryKeyAttribute;
    const identifier = association.identifier;
    const foreignIdentifier = association.foreignIdentifier;
    let where = {};

    if (newAssociatedObjects === null) {
        newAssociatedObjects = [];
    } else {
        newAssociatedObjects = association.toInstanceArray(newAssociatedObjects);
    }

    where[identifier] = sourceInstance.get(sourceKey);
    where = Object.assign(where, association.through.scope);

    return association.through.model.findAll(_.defaults({ where, raw: true }, options)).then(currentRows => {
        const obsoleteAssociations = [];
        const promises = [];
        let defaultAttributes = options.through || {};

        // Don't try to insert the transaction as an attribute in the through table
        defaultAttributes = _.omit(defaultAttributes, ['transaction', 'hooks', 'individualHooks', 'ignoreDuplicates', 'validate', 'fields', 'logging']);

        const unassociatedObjects = newAssociatedObjects.filter(obj =>
            !_.find(currentRows, currentRow => currentRow[foreignIdentifier] === obj.get(targetKey))
        );

        for (const currentRow of currentRows) {
            const newObj = _.find(newAssociatedObjects, obj => currentRow[foreignIdentifier] === obj.get(targetKey));

            if (!newObj) {
                obsoleteAssociations.push(currentRow);
            } else {
                let throughAttributes = newObj[association.through.model.name];
                // Quick-fix for subtle bug when using existing objects that might have the through model attached (not as an attribute object)
                if (throughAttributes instanceof association.through.model) {
                    throughAttributes = {};
                }

                const where = {};
                const attributes = _.defaults({}, throughAttributes, defaultAttributes);

                where[identifier] = sourceInstance.get(sourceKey);
                where[foreignIdentifier] = newObj.get(targetKey);

                if (Object.keys(attributes).length) {
                    promises.push(association.through.model.update(attributes, _.extend(options, { where })));
                }
            }
        }

        if (obsoleteAssociations.length > 0) {
            let where = {};
            where[identifier] = sourceInstance.get(sourceKey);
            where[foreignIdentifier] = obsoleteAssociations.map(obsoleteAssociation => obsoleteAssociation[foreignIdentifier]);
            where = Object.assign(where, association.through.scope);
            promises.push(association.through.model.destroy(_.defaults({ where }, options)));
        }

        if (unassociatedObjects.length > 0) {
            const bulk = unassociatedObjects.map(unassociatedObject => {
                let attributes = {};

                attributes[identifier] = sourceInstance.get(sourceKey);
                attributes[foreignIdentifier] = unassociatedObject.get(targetKey);

                attributes = _.defaults(attributes, unassociatedObject[association.through.model.name], defaultAttributes);

                _.assign(attributes, association.through.scope);
                attributes = Object.assign(attributes, association.through.scope);

                return attributes;
            });

            promises.push(association.through.model.bulkCreate(bulk, _.assign({ validate: true }, options)));
        }

        return Utils.Promise.all(promises);
    });
};