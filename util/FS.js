import fs from 'fs';
import path from 'path';

let utils = {
    async checkDirectory(pathFolder) {
        if (!await utils.exists(pathFolder)) {
            // console.log("directory no existe")
            await utils.mkdir(pathFolder);
        }
    },
    mkdir(root, mode) {
        var chunks = root.split(path.sep); // split in chunks
        var chunk;
        if (path.isAbsolute(root) === true) { // build from absolute path
            chunk = chunks.shift(); // remove "/" or C:/
            if (!chunk) { // add "/"
                chunk = path.sep;
            }
        } else {
            chunk = path.resolve(); // build with relative path
        }
        return new Promise((resolve, reject) => {
            this.mkdirRecursive(chunk, chunks, mode, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    },
    mkdirRecursive(root, chunks, mode, callback) {
        var chunk = chunks.shift();
        if (!chunk) {
            return callback(null);
        }
        var root = path.join(root, chunk);

        return fs.exists(root, (exists) => {

            if (exists === true) { // already done
                return this.mkdirRecursive(root, chunks, mode, callback);
            }
            return fs.mkdir(root, mode, (err) => {
                if (err && err.code !== 'EEXIST')
                    return callback(err);

                return this.mkdirRecursive(root, chunks, mode, callback); // let's magic
            });
        });
    },
    // mkdir(pathSource) {
    //     return new Promise((resolve, reject) => {
    //         fs.mkdir(pathSource, (err) => {
    //             if (err) {
    //                 reject(err);
    //             } else {
    //                 resolve();
    //             }
    //         });
    //     });
    // },
    exists(pathSource) {
        return new Promise((resolve, reject) => {
            fs.exists(pathSource, (exits) => {
                resolve(exits);
            });
        });
    },
    renameFile(pathFile, newName) {
        return new Promise((resolve, reject) => {
            fs.rename(pathFile, newName, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    },
    readFile(path) {
        try {
            let text = fs.readFileSync(path, "utf8");
            return text;
        } catch (error) {
            return null;
        }
    },

    writeFile(path, string) {
        return new Promise((resolve, reject) => {
            fs.writeFile(path, string, err => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    },

    readJSONFile(path, safe) {
        try {
            let text = fs.readFileSync(path, "utf8");
            return JSON.parse(text);
        } catch (error) {
            if (safe) {
                return {};
            } else {
                return null;
            }
        }
    },
}
export default utils;


let lCore = {
    checkDirectory: utils.checkDirectory,
    renameFile: utils.renameFile,
    readFile: utils.readFile,
    writeFile: utils.writeFile,
    readJSONFile: utils.readJSONFile
};
export { lCore };
