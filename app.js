'use strict';
var jtLogger = require('jtlogger');
jtLogger.appPath = __dirname + '/';
var config = require('./config');
var Client = require('./lib/client');
var _ = require('lodash');
var bytes = require('bytes');

var JTStatsClient = require('jtstats_client');
var jtStatsClient = new JTStatsClient({
  uri : config.statsUri,
  category : config.category
});


var memoryLog = function(){
  var memoryUsage = process.memoryUsage();
  var rss = bytes(memoryUsage.rss);
  var heapTotal = bytes(memoryUsage.heapTotal);
  var heapUsed = bytes(memoryUsage.heapUsed);
  
  console.info('memory.rss.%s', rss);
  console.info('memory.heapTotal.%s', heapTotal);
  console.info('memory.heapUsed.%s', heapUsed);
};


var client = new Client(config.mongodbUri, jtStatsClient);

var interval = 10 * 1000;
var doStats = function(){
  client.doStats(function(){
    _.delay(doStats, interval);
  });
  memoryLog();
};

doStats();