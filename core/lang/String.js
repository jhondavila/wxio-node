import crypto from 'crypto';



export default {
    parseMd5(string) {
        return crypto.createHash("md5").update(string).digest("hex");
    },
    parseSHA256(string, privateKey) {
        if (!privateKey) {
            return crypto.createHash("sha256").update(string).digest("hex");
        } else {
            return crypto.createHmac("sha256", privateKey).update(string).digest("hex");
        }
    }
}