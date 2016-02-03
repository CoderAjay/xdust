'use strict';

var path = require('path'),
DefaultReader = require('./defaultReader');

class Duster {
  static __init(reader) {
    Duster.Reader = reader || DefaultReader;
    Duster._setEngine();
  }
  static _setEngine() {
    try {
      Duster.dust = require('dust');
    } catch (err) {
      try {
        Duster.dust = require('dustjs-helpers');
      } catch (err) {
        Duster.dust = require('dustjs-linkedin');
      }
    }
  }
  static clearCache(flag) {
    if (flag === undefined || flag === false) {
      Duster.dust.cache = {};
    }
  }
  static readFromCache(path) {
    return Duster.dust.cache[path];
  }
  static putInCache(path, file) {
    Duster.dust.cache[path] = file;
  }
  static render(template, options, callback) {
    var templateName = path.relative(Duster.views, template).slice(0, -5);
    Duster.dust.onLoad = Duster.onLoadWrapper(Engine.getSrc(template), template);
    Duster.dust.render(templateName, options, function (err, htmlString) {
      if (err) {
        return callback(err);
      }
      Duster.clearCache(options.settings.cache || options.settings['view cache']);
      callback(err, htmlString);
    });
  }
  static onLoadWrapper(source, fileName) {
    if (source) fileName = fileName.split(':')[1];
    return (template, cb) => {
      if (path.extname(template) !== '.dust') {
        template = path.join(Duster.views, template) + '.dust';
      }
      var str = Duster.readFromCache(template);
      if (str) return cb(null, str);
      return Duster.Reader.read(template, fileName, source, (err, htmlString) => {
        if (!err && htmlString) {
          Duster.putInCache(template, htmlString);
        }
        return cb(err, htmlString);
      });
    }
  }
}