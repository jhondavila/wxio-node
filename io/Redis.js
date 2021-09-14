

import socketIORedis from 'socket.io-redis';
import { RedisClient } from 'redis';


// console.log(redisAdapters)
let redisAdapter;
let pubClient;
let subClient;

const getRedisAdapter = () => {
    if (!redisAdapter) {

        pubClient = new RedisClient({ host: 'localhost', port: 6379 })
        subClient = pubClient.duplicate();


        // console.log(redisAdapter)
        pubClient.on("error", function (err) {
            console.log("failConnectRedis pubClient")
        });
        subClient.on("error", function (err) {
            console.log("failConnectRedis subclient")
        });
        pubClient.on("connect", function () {
            console.log("successRedis pubclient")
        });
        subClient.on("connect", function () {
            console.log("successRedis subclient")
        });


        redisAdapter = socketIORedis({ pubClient, subClient })
    }


    return redisAdapter;
}
export {
    getRedisAdapter
}