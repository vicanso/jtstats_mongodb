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
    var client = new Client(config.mongodbUri, jtStatsClient);
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
};

/**
 * [memoryLog 内存监控]
 * @return {[type]} [description]
 */
function memoryLog(){
  var memoryUsage = process.memoryUsage();
  var rss = bytes(memoryUsage.rss);
  var heapTotal = bytes(memoryUsage.heapTotal);
  var heapUsed = bytes(memoryUsage.heapUsed);
  
  console.info('memory rss:%s', rss);
  console.info('memory heapTotal:%s', heapTotal);
  console.info('memory heapUsed:%s', heapUsed);
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
  if(config.env === 'development'){
    setImmediate(function(){
      cbf(null, {
        log : {
          host : 'localhost',
          port : 2900
        },
        stats : {
          host : 'localhost',
          port : 6000
        }
      });
    });
  }else{
    request.get('http://jt-service.oss-cn-shenzhen.aliyuncs.com/server.json', function(err, res, body){
      if(err){
        cbf(err);
        return;
      }
      try{
        var data = JSON.parse(body);
      }catch(err){
        cbf(err);
        return;
      }
      cbf(null, data);
    });
  }
}