'use strict';

var MongoClient = require('mongodb').MongoClient;
var _ = require('underscore');

var Client = function(url, statsClient, options){
  var self = this;
  self.statsClient = statsClient;
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

fn.doStats = function(cbf){
  var self = this;
  var statsClient = self.statsClient;
  var db = self.db;
  var prevInfo = self.prevInfo
  if(db){
    if(prevInfo){
      db.serverStatus(function(err, info){
        if(err){
          return cbf(err);
        }
        console.log(JSON.stringify(info));
        sendBackgroundFlushing(statsClient, info.backgroundFlushing, prevInfo.backgroundFlushing);
        sendConnections(statsClient, info.connections);
        sendGlobalLock(statsClient, info.globalLock, prevInfo.globalLock);
        sendIndexCounters(statsClient, info.indexCounters, prevInfo.indexCounters);
        sendNetwork(statsClient, info.network, prevInfo.network);
        sendOpCounters(statsClient, info.opcounters, prevInfo.opcounters);
        sendRecordStats(statsClient, info.recordStats, prevInfo.recordStats);
        sendMemory(statsClient, info.mem);
        self.prevInfo = info;
        cbf(null);
      });
    }else{
      db.serverStatus(function(err, info){
        self.prevInfo = info;
        cbf(null);
      });
    }
  }else{
    cbf(null);
  }
};

var sendBackgroundFlushing = function(statsClient, cur, prev){
  statsClient.count('bgFlushing.flushes', cur.flushes - prev.flushes);
  statsClient.count('bgFlushing.total_ms', cur.total_ms - prev.total_ms); 
  statsClient.gauge('bgFlushing.average_ms', Math.round(cur.average_ms));
};

var sendConnections = function(statsClient, cur){
  statsClient.gauge('connections.current', cur.current);
  statsClient.gauge('connections.available', cur.available);
  statsClient.gauge('connections.totalCreated', cur.totalCreated);
};

var sendGlobalLock = function(statsClient, cur, prev){
  statsClient.count('globalLock.lockTime', Math.ceil((cur.lockTime - prev.lockTime) / 1000000));

  statsClient.gauge('globalLock.currentQueue.total', cur.currentQueue.total);
  statsClient.gauge('globalLock.currentQueue.readers', cur.currentQueue.readers);
  statsClient.gauge('globalLock.currentQueue.writers', cur.currentQueue.writers);

  statsClient.gauge('globalLock.activeClients.total', cur.activeClients.total);
  statsClient.gauge('globalLock.activeClients.readers', cur.activeClients.readers);
  statsClient.gauge('globalLock.activeClients.writers', cur.activeClients.writers);
};

var sendIndexCounters = function(statsClient, cur, prev){
  var accesses = cur.accesses - prev.accesses;
  var misses = cur.misses - prev.misses;
  statsClient.count('indexCounters.accesses', accesses);
  statsClient.count('indexCounters.hits', cur.hits - prev.hits);
  statsClient.count('indexCounters.misses', misses);
  statsClient.gauge('indexCounters.missRatio', Math.round(100 * misses / (accesses || 1)));
};

var sendNetwork = function(statsClient, cur, prev){
  var bytesIn = cur.bytesIn - prev.bytesIn;
  var bytesOut = cur.bytesOut - prev.bytesOut;
  var kb = 1024;
  statsClient.count('network.inkb', Math.round(bytesIn / kb));
  statsClient.count('network.outkb', Math.round(bytesOut / kb));
  statsClient.count('network.numRequests', cur.numRequests - prev.numRequests);
};


var sendOpCounters = function(statsClient, cur, prev){
  statsClient.count('opcounters.insert', cur.insert - prev.insert);
  statsClient.count('opcounters.query', cur.query - prev.query);
  statsClient.count('opcounters.update', cur.update - prev.update);
  statsClient.count('opcounters.delete', cur['delete'] - prev['delete']);
  statsClient.count('opcounters.getmore', cur.getmore - prev.getmore);
  statsClient.count('opcounters.command', cur.command - prev.command);
};


var sendRecordStats = function(statsClient, cur, prev){
  statsClient.count('recordStats.accessesNotInMemory', cur.accessesNotInMemory - prev.accessesNotInMemory);
  statsClient.count('recordStats.pageFaultExceptionsThrown', cur.pageFaultExceptionsThrown - prev.pageFaultExceptionsThrown);
};


var sendMemory = function(statsClient, cur){
  statsClient.gauge('mem.resident', cur.resident);
  statsClient.gauge('mem.virtual', cur.virtual);
};
module.exports = Client;