/*
 * Wrapper for PM2.js that for each function:
 *  1. autoconnects/autodisconnects
 *  2. manages promises/callbacks
 *  3. supports chainable api
 */

var Util         = require('util');
var EE           = require('events').EventEmitter;
var PM2Interface = require('./PM2Interface');

// include global.Promise if exists and es6-promise otherwise
var Promise;
!function(){ Promise = this.Promise; }();
if (Promise == null) Promise = require('es6-promise').Promise;

module.exports = PM2;

function PM2(options) {
  var self = new EE();
  self.__proto__ = PM2.prototype;
  self._interface = PM2Interface(options);
  self._noautoconnect = options.noautoconnect;
  self.utils = self._interface.utils;

  // for autoconnect functions
  self._state = {
    connected: false,
    connecting: false,
    actions: 0,
  }

  return wrappromise(self, new Promise(function(resolve, reject) {
    resolve();
  }));
}

Util.inherits(PM2, EE);

Object.keys(PM2Interface.prototype).forEach(function(name) {
  if (PM2.prototype[name]) return;

  PM2.prototype[name] = function() {
    var args = [], cb, self = this;
    for (var i=0; i<arguments.length; i++) {
      args[i] = arguments[i];
    }
    if (typeof(args[i-1]) === 'function') {
      cb = args.pop();
    } else {
      cb = function(){};
    }

    return promisify(self, function(cb) {
      args.push(function() {
        cb.apply(self, arguments);
        disconnect(self);
      });

      connect(self, function(err) {
        if (err) return cb(err);
        self._interface[name].apply(self._interface, args);
      });
    }, cb);
  }
});

// This function auto-connects to pm2,
// if there is no existing connection.
function connect(self, cb) {
  self._state.actions++;
  if (!self._state.connected && !self._noautoconnect) {
    if (!self._state.connecting) {
      self._state.connecting = true;
      self._interface.connect(function() {
        self._state.connecting = false;
        self._state.connected = true;
        self.emit('connect');
      });
    }
    self.once('connect', cb);
  } else {
    process.nextTick(cb);
  }
}

// This function auto-disconnects from pm2,
// if there is nothing left to do in the queue
function disconnect(self) {
  self._state.actions--;
  process.nextTick(function() {
    if (self._state.actions <= 0 && self._state.connected && !self._state.connecting && !self._noautoconnect) {
      self._state.connected = false;
      self._interface.disconnect(function() {
        self.emit('disconnect');
      });
    }
  });
}

// This function creates a promise
// `callback` is node.js-style callback(err, result)
// `resolver` is an internal function that accepts it
function promisify(self, resolver, callback) {
  return wrappromise(self, new Promise(function(resolve, reject) {
    resolver(function(err, result) {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
      process.nextTick(function() {
        if (callback != null) {
          callback.call(self, err, result);
        } else if (err) {
          // no callback present, so emitting an error
          self.emit('error', err);
        }
      });
    });
  }));
}

// This function adds `promise` methods to a `self` object,
// essentially making `self` a promise;
//
// it's something similar to jQuery deferred.promise(target)
function wrappromise(self, promise) {
  while (self && !(self instanceof PM2)) self = self.__proto__;
  var result = Object.create(self);
  result.then = function(fn, fn2) {
    if (fn) fn = fn.bind(self);
    if (fn2) fn2 = fn2.bind(self);
    return wrappromise(this, this._promise.then(fn, fn2));
  }
  result.catch = function(fn) {
    return wrappromise(this, this._promise.catch(fn.bind(self)));
  }
  result._promise = promise;
  return result;
}

