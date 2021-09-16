// const { createAdapter } = require("@socket.io/redis-adapter");

import { createAdapter } from '@socket.io/redis-adapter';
import { RedisClient } from 'redis';


// console.log(redisAdapters)
let redisAdapter;
let pubClient;
let subClient;


// console.log(RedisAdapter)

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



        redisAdapter = createAdapter(pubClient, subClient);
    }


    return redisAdapter;
}
export {
    getRedisAdapter
}