import jsonwebtoken from 'jsonwebtoken';

// let defaultPrivateKey = "";
export default {
    defaultPrivateKey : null,
    setDefaultPrivateKey(key) {
        // console.log(key);
        this.defaultPrivateKey = key;
    },
    getDefaultPrivateKey() {
        return this.defaultPrivateKey;
    },
    async sign(data, privateKey, options) {
        return new Promise((resolve, reject) => {
            jsonwebtoken.sign(data, privateKey, options, (err, token) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(token);
            });
        });
    },
    async verify(token, privateKey, options) {
        return new Promise((resolve, reject) => {
            jsonwebtoken.verify(token, privateKey, options, (err, token) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(token);
            });
        });
    }
};