
let checkSession = function (socket) {
    let handshake = socket.handshake;
    // console.log(handshake , "<=== from authuser");
    if (handshake.session && handshake.session.hasLogin) {
        return true;
    } else {
        return false;
    }
};

export default function (socket, next) {
    if (checkSession(socket)) {
        next();
    } else {
        next(new Error("iosession no found"));
    }
}