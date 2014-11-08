var MongoClient = require('mongodb').MongoClient;
var _ = require('underscore');
var options = {
  db : {
    native_parser : true
  },
  server : {
    poolSize : 1
  }
};
var adminDb = null;
var prevInfo = null;

exports.init = function(url){
  MongoClient.connect(url, options, function(err, db){
    if(err){
      console.error(err);
      throw(err);
    }
    adminDb = db.admin();
    adminDb.serverStatus(function(err, data){
      prevInfo = data;
    });
  });
}

exports.getStatus = function(collections, cbf){
  if(_.isFunction(collections)){
    cbf = collections;
    collections = null;
  }
  if(adminDb){
    if(prevInfo){
      adminDb.serverStatus(function(err, info){
        if(err){
          return cbf(err);
        }
        var result = {
          backgroundFlushing : info.backgroundFlushing,
          connections : info.connections,
          globalLock : getGlobalLock(info.globalLock, prevInfo.globalLock)
        }
        console.dir(info);
        prevInfo = info;
      });
    }else{
      adminDb.serverStatus(function(err, info){
        prevInfo = info;
      });
    }
  }else{
    GLOBAL.setImmediate(cbf);
  }
};


var getGlobalLock = function(cur, prev){
  var result = {
    lockTime : cur.lockTime - prev.lockTime
  };
  _.each(['currentQueue', 'activeClients'], function(attr){
    _.each(cur[attr], function(v, k){
      var name = attr + '.' + k;
      result[name] = v;
    });
  });
  return result;
};
