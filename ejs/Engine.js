var fs = require('fs');
var path = require('path');
var Promise = require('bluebird');

var join = path.join;
var resolve = path.resolve;
var extname = path.extname;
var dirname = path.dirname;
var isAbsolute = path.isAbsolute;


var requires = {};

var readCache = {};

/**
 * Require cache.
 */

var cacheStore = {};

/**
 * Require cache.
 */

var requires = {};

/**
 * Clear the cache.
 *
 * @api public
 */

exports.clearCache = function() {
  readCache = {};
  cacheStore = {};
};

function cache(options, compiled) {
  // cachable
  if (compiled && options.filename && options.cache) {
    delete readCache[options.filename];
    cacheStore[options.filename] = compiled;
    return compiled;
  }

  // check cache
  if (options.filename && options.cache) {
    return cacheStore[options.filename];
  }

  return compiled;
}


function readPartials(path, options, cb) {
  if (!options.partials) return cb();
  var keys = Object.keys(options.partials);
  var partials = {};

  function next(index) {
    if (index === keys.length) return cb(null, partials);
    var key = keys[index];
    var partialPath = options.partials[key];

    if (partialPath === undefined || partialPath === null || partialPath === false) {
      return next(++index);
    }

    var file;
    if (isAbsolute(partialPath)) {
      if (extname(partialPath) !== '') {
        file = partialPath;
      } else {
        file = join(partialPath + extname(path));
      }
    } else {
      file = join(dirname(path), partialPath + extname(path));
    }

    read(file, options, function(err, str) {
      if (err) return cb(err);
      partials[key] = str;
      next(++index);
    });
  }

  next(0);
}
/**
 * promisify
 */
function promisify(cb, fn) {
  return new Promise(function(resolve, reject) {
    cb = cb || function(err, html) {
      if (err) {
        return reject(err);
      }
      resolve(html);
    };
    fn(cb);
  });
}

function fromStringRenderer(name) {
  return function(path, options, cb) {
    options.filename = path;

    return promisify(cb, function(cb) {
      readPartials(path, options, function(err, partials) {
        var extend = (requires.extend || (requires.extend = require('util')._extend));
        var opts = extend({}, options);
        opts.partials = partials;
        if (err) return cb(err);
        if (cache(opts)) {
          exports[name].render('', opts, cb);
        } else {
          read(path, opts, function(err, str) {
            if (err) return cb(err);
            exports[name].render(str, opts, cb);
          });
        }
      });
    });
  };
}

function read(path, options, cb) {
  var str = readCache[path];
  var cached = options.cache && str && typeof str === 'string';

  // cached (only if cached is a string and not a compiled template function)
  if (cached) return cb(null, str);

  // read
  fs.readFile(path, 'utf8', function(err, str) {
    if (err) return cb(err);
    // remove extraneous utf8 BOM marker
    str = str.replace(/^\uFEFF/, '');
    if (options.cache) readCache[path] = str;
    cb(null, str);
  });
}



exports.ejs = fromStringRenderer('ejs');

/**
 * EJS string support.
 */

exports.ejs.render = function(str, options, cb) {
  // debugger
  return promisify(cb, function(cb) {
    var engine = requires.ejs || (requires.ejs = require('ejs'));
    try {
      var tmpl = cache(options) || cache(options, engine.compile(str, options));
      cb(null, tmpl(options));
    } catch (err) {
      cb(err);
    }
  });
};

exports.requires = requires;