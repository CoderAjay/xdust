'use strict';
var path = require('path');
var Duster = require('./duster');
var DefaultReader = require('./defaultReader');
var CacheSys = require('./cachesys');
var SourceDelimiter = ':';


class Engine {
    constructor(express, readers, cacheClient, delimiter) {
        if (delimiter) {
            SourceDelimiter = delimiter;
        }
        this._cache = new CacheSys(cacheClient);
        this.__app = express;
        this.extendExpress(express);
        this._duster = new Duster(new DefaultReader(readers), this._cache, SourceDelimiter, this.__app.locals);
    }
    extendExpress(express) {
        express.set('view').prototype.lookup_internal = express.set('view').prototype.lookup;
        var self = this;
        express.set('view').prototype.lookup = function(name) {
            if (self.isOfOtherLocation(name)) return name; // returns path of the file
            return this.lookup_internal(name);
        };
    }
    __express() {
        return this._duster.render.bind(this._duster);
    }
    isOfOtherLocation(name) {
        if ([].indexOf.call(name, SourceDelimiter) === -1) return false;
        var src = name.split(SourceDelimiter)[0];
        return this._duster.reader.isInSource(src);
    }
}

module.exports = Engine;
