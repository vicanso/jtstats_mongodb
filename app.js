'use strict';
var config = require('./config');
var request = require('request');
var interval = 10 * 1000;
var Client = require('./lib/client');
var _ = require('lodash');
var bytes = require('bytes');
var JTStatsClient = require('jtstats_client');
var debug = require('debug')('jt.stats_mongodb');

getServers(function(err, serverList){
  if(err){
    console.error(err);
  }else{
    initLog(serverList.log);
    debug('servers:%j', serverList);
    var options = serverList.stats;
    options.category = config.category;
    var jtStatsClient = new JTStatsClient(options);
    var mongodbAuth = process.env.MONGODB_AUTH;
    var mongodbServer = serverList.mongodb;
    var mongodbUri = mongodbServer.host + ':' + mongodbServer.port;
    console.info('connect to mongodb:%s', mongodbUri);
    if(mongodbAuth){
      mongodbUri = mongodbAuth + '@' + mongodbUri;
    }
    var client = new Client('mongodb://' + mongodbUri, jtStatsClient);
    doStats(client);
  }
});


/**
 * [doStats 定时获取性能统计数据]
 * @param  {[type]} client [description]
 * @return {[type]}        [description]
 */
function doStats(client){
  client.doStats(function(){
    _.delay(function(){
      doStats(client);
    }, interval);
  });
  memoryLog();
}

/**
 * [memoryLog 内存监控]
 * @return {[type]} [description]
 */
function memoryLog(){
  var memoryUsage = process.memoryUsage();
  var rss = bytes(memoryUsage.rss);
  var heapTotal = bytes(memoryUsage.heapTotal);
  var heapUsed = bytes(memoryUsage.heapUsed);
  
  console.info('memory rss:%s, heapTotal:%s, heapUsed:%s', rss, heapTotal, heapUsed);
}


/**
 * [initLog 初始化log配置]
 * @param  {[type]} server [description]
 * @return {[type]}        [description]
 */
function initLog(server){
  var url = require('url');
  var jtLogger = require('jtlogger');
  jtLogger.appPath = __dirname + '/';
  if(config.env !== 'development'){
    jtLogger.add(jtLogger.transports.UDP, server);
  }
  jtLogger.add(jtLogger.transports.Console);
  jtLogger.logPrefix = '[' + config.category + ']';
}

/**
 * [getServers 获取服务器信息]
 * @param  {[type]} cbf [description]
 * @return {[type]}     [description]
 */
function getServers(cbf){
  var serverUrl = 'http://jt-service.oss-cn-shenzhen.aliyuncs.com/server.json';
  request.get(serverUrl, function(err, res, data){
    if(err){
      cbf(err);
      return;
    }
    try{
      data = JSON.parse(data);
    }catch(err){
      cbf(err);
      return;
    }
    var serverList = data[config.env] || data.development;
    cbf(null, serverList);
  });
}