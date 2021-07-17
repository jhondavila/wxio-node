
import Core from '../../../core';
export default {

    async updateTree(sequelize, modelNode, modelTree, id, parentId, options = {}) {

        let fieldsNode = { id_node: "id" };
        let fieldsTree = {
            id: 'id',
            child_node: 'child_node',
            parent_node: 'parent_node',
            path_length: 'path_length'
        };
        Core.apply(fieldsNode, options.fieldsNode);
        Core.apply(fieldsTree, options.fieldsTree);

        let queryDel = this.queryRemoveParentNode(sequelize, modelTree, fieldsTree);
        await sequelize.query(queryDel, { replacements: { id: id } });
        let querySet = this.querySetParentNode(sequelize, modelNode, modelTree, fieldsTree, fieldsNode);
        await sequelize.query(querySet, { replacements: { id: id, parentId: parentId === "root" || !parentId ? 0 : parentId } });

    },
    querySetParentNode(DBdefault, modelNode, modelTree, keysTree, keysNode) {

        let sql = `INSERT INTO {modelTree} ({parent_node},{child_node},{path_length}) ` +
            ` SELECT supertree.{parent_node}, subtree.{child_node}, supertree.{path_length} + subtree.{path_length} + 1` +
            ` FROM {modelTree} AS supertree` +
            ` CROSS JOIN {modelTree} AS subtree` +
            ` LEFT JOIN {modelNode} n ON n.{id_node} = supertree.{child_node}` +
            ` WHERE subtree.{parent_node} = :id and supertree.{child_node} = :parentId`;
        sql = this.replaceFieldNames(sql, keysTree, modelTree);
        sql = this.replaceFieldNames(sql, keysNode, modelNode);

        sql = this.replaceTableNames(sql, {
            modelTree: modelTree,
            modelNode: modelNode,
        }, DBdefault)
        return sql;

    },

    queryRemoveParentNode(DBdefault, modelTree, keys) {
        let dialect = DBdefault.getDialect();
        let sql =
            `DELETE FROM {modelTree} ` +
            ` WHERE {id} IN (` +
            ` ${dialect === "mysql" ? `SELECT {id} FROM (` : ``}` +
            `    SELECT ${dialect === "mysql" ? 'DISTINCT' : ''} a.{id} FROM {modelTree} as a` +
            `    JOIN {modelTree} AS d ON a.{child_node} = d.{child_node}` +
            `    LEFT JOIN {modelTree} as x ON x.{parent_node} = d.{parent_node} AND x.{child_node} = a.{parent_node}` +
            `    WHERE (` +
            `        d.{parent_node} = :id AND` +
            `        x.{parent_node} is NULL` +
            `    )` +
            ` ${dialect === "mysql" ? `) as list` : ``}` +
            ` )`;
        sql = this.replaceFieldNames(sql, keys, modelTree);
        sql = this.replaceTableNames(sql, {
            modelTree: modelTree
        }, DBdefault)
        return sql;
    },

    replaceFieldNames(sql, identifiers, model) {
        // debugger
        for (let key in identifiers) {
            let fieldName = model.rawAttributes[identifiers[key]].field;
            sql = sql.replace(new RegExp(`{${key}}`, 'g'), model.sequelize.queryInterface.quoteIdentifier(fieldName));
        }
        return sql.replace(/[ \t\r\n]+/g, ' ');
    },

    replaceTableNames(sql, identifiers, sequelize) {
        for (let key in identifiers) {
            let model = identifiers[key];
            let tableName = model.getTableName();

            sql = sql.replace(new RegExp(`{${key}}`, 'g'), (tableName.schema ? tableName.toString() : sequelize.queryInterface.quoteIdentifier(tableName)));
        }
        return sql;
    }
}