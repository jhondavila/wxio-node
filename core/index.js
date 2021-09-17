import Core from "../common/core";

import path from "path";
import GlobalUtil from "./GlobalUitl";
import url from "url";
// import SequelizeWx from "root/wx/db/sequelize";
// import { machineIdSync } from "node-machine-id";

import lString from './lang/String';

Core.apply(
  Core.String,
  lString
)

// Core.String = {
//   ...Core.String,
//   lString
// }

import Script from '../http/Script';
// import os from 'os';
import * as UtilCore from '../util';
import Error from "./Error";


export default {
  ...Core,
  ...GlobalUtil,
  ...UtilCore.lCore,
  error(error) {
    console.log("error register", error);
  },
  getEmptyObj() {
    return {};
  },
  pathResolve(string) {
    return path.resolve(string);
  },
  pathJoin(base, string) {
    return path.join(base, string);
  },
  urlFormat(path, resolve) {
    if (resolve) {
      path = this.pathResolve(path);
    }
    return url.format({
      pathname: path
    });
  },
  errorToJSON(error) {
    let keys = Object.keys(error);
    let object = {
      message: error.message,
      stack: error.stack
    };
    keys.forEach((k) => {
      object[k] = error[k];
    });
    return JSON.stringify(object, null, "\t");
  },
  buildTreeApp: function (applications, parentId, nodeKey, parentKey, fn) {
    var app_tree = [];
    // var ctrl = this;

    if (Array.isArray(applications)) {
      applications.forEach(app => {
        if (app[parentKey] === parentId) {
          var children = this.buildTreeApp(
            applications,
            app[nodeKey],
            nodeKey,
            parentKey,
            fn
          );
          if (children.length > 0) {
            app["children"] = children;
          }
          if (children.length === 0) {
            if (app["leaf"] === 0) {
              app["children"] = [];
              app["leaf"] = false;
            } else {
              app["leaf"] = true;
            }
          }
          if (fn) {
            fn(app, children, parentId);
          }
          app_tree.push(app);
        }
      });
    }
    return app_tree;
  },
  listFormat(list, options, add) {
    list.forEach(i => {
      if (options.remove) {
        options.remove.forEach(key => {
          delete i[key];
        });
      }

      if (options.rename) {
        for (let key in options.rename) {
          if (i.hasOwnProperty(key)) {
            i[options.rename[key]] = i[key];
            delete i[key];
          }
        }
      }

      if (options.add) {
        for (let key in options.add) {
          i[key] = options.add[key];
        }
      }
    });
  },

  Script: Script,

  findModelinList(list, property, value) {
    let element;
    for (let x = 0; x < list.length; x++) {
      if (list[x].get(property) === value) {
        element = list[x];
        break;
      }
    }
    return element;
  },
  findObjectinList(list, property, value) {
    let element;
    for (let x = 0; x < list.length; x++) {
      if (list[x][property] === value) {
        element = list[x];
        break;
      }
    }
    return element;
  },
  urlJoin(basePath) {
    let regExp = new RegExp("^(http|https):\/\/", "gmi");
    let regExpEnd = new RegExp("(\/)$", "gmi");
    if (regExpEnd.exec(basePath)) {
      basePath = basePath.substring(0, basePath.length - 1);
    }

    let appends = Array.prototype.slice.call(arguments, 1, arguments.length);
    let path = appends[0];


    if (path) {
      if (!regExp.exec(path)) {
        if (path.substring(0, 1) === "/") {
          path = basePath + path;
        } else {
          path = basePath + "/" + path;
        }
      }
    }
    if (appends.length > 1) {
      path = this.urlJoin.apply(this, [path].concat(appends.slice(1, appends.length)));
    }
    return path;
  },

  IOUtils: {
    socket: {
      setData(socket, data) {
        Object.assign(socket.data, data);
      },
      getData(socket) {
        return socket.data || {};
      },
      clearData(socket) {
        socket.data = {};
        return socket.data;
      }
    },
    space: {
      emit(space, list, event, data) {
        let target = space.to(list);
        target.emit(event, data);
      },
      async getAllSockets(space, roomId) {
        let list = await space.in(roomId).allSockets();

        return [...list.values()]
      },
      async fetchSockets(space, roomId) {
        return await space.in(roomId).fetchSockets();
      },
    }
  }
  // util: util
};


