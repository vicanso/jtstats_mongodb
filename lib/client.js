'use strict';

var MongoClient = require('mongodb').MongoClient;
var _ = require('underscore');

var Client = function(url, options){
  var self = this;
  options = _.extend({
    db : {
      native_parser : true
    },
    server : {
      poolSize : 1,
      auto_reconnect : true
    }
  }, options);
  MongoClient.connect(url, options, function(err, db){
    if(err){
      console.error(err);
      throw err;
    }else{
      self.db = db.admin();
    }
  });
};

var fn = Client.prototype;

fn.getStatus = function(collections, cbf){
  if(_.isFunction(collections)){
    cbf = collections;
    collections = null;
  }
  var self = this;
  var db = self.db;
  var prevInfo = self.prevInfo
  if(db){
    if(prevInfo){
      db.serverStatus(function(err, info){
        if(err){
          return cbf(err);
        }
        var result = {
          backgroundFlushing : getBackgroundFlushing(info.backgroundFlushing, prevInfo.backgroundFlushing),
          connections : info.connections,
          globalLock : getGlobalLock(info.globalLock, prevInfo.globalLock),
          indexCounters : getIndexCounters(info.indexCounters, prevInfo.indexCounters),
          network : getNetwork(info.network, prevInfo.network),
          opcounters : getOP(info.opcounters, prevInfo.opcounters),
          opcountersRepl : getOP(info.opcountersRepl, prevInfo.opcountersRepl),
          mem : _.pick(info.mem, ['resident', 'virtual'])
        }
        self.prevInfo = info;
        cbf(null, result);
      });
    }else{
      db.serverStatus(function(err, info){
        self.prevInfo = info;
        cbf(null);
      });
    }
  }else{
    GLOBAL.setImmediate(cbf);
  }
};

var getBackgroundFlushing = function(cur, prev){
  return {
    flushes : cur.flushes - prev.flushes,
    total_ms : cur.total_ms - prev.total_ms,
    average_ms : Math.round(cur.average_ms)
  }
};

var getIndexCounters = function(cur, prev){
  var accesses = cur.accesses - prev.accesses;
  var hits = cur.hits - prev.hits;
  var misses = cur.misses - prev.misses;
  return {
    accesses : accesses,
    hits : hits,
    misses : misses,
    resets : cur.resets - prev.resets,
    missRatio : Math.round(100 * misses / (accesses || 1))
  };
};

var getNetwork = function(cur, prev){
  var bytesIn = cur.bytesIn - prev.bytesIn;
  var bytesOut = cur.bytesOut - prev.bytesOut;
  var mb = 1024 * 1024;
  return {
    inMB : Math.round(bytesIn / mb),
    outMB : Math.round(bytesOut / mb),
    numRequests : cur.numRequests - prev.numRequests
  }
};

var getGlobalLock = function(cur, prev){
  var result = {
    lockTime : Math.ceil((cur.lockTime - prev.lockTime) / 1000000)
  };
  _.each(['currentQueue', 'activeClients'], function(attr){
    _.each(cur[attr], function(v, k){
      var name = attr + '.' + k;
      result[name] = v;
    });
  });
  return result;
};

var getOP = function(cur, prev){
  var result = {};
  _.each(cur, function(v, k){
    result[k] = v - prev[k];
  });
  return result;
};

module.exports = Client;