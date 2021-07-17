import Core from "./core";
import http from './http';
import IO from './io'
import util from './util';

export default {
    ...Core,
    http,
    io: IO,
    util
}