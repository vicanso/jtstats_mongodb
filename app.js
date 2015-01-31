'use strict';
var jtLogger = require('jtlogger');
jtLogger.appPath = __dirname + '/';
var config = require('./config');
var Client = require('./lib/client');
var _ = require('lodash');

var JTStatsClient = require('jtstats_client');
var jtStatsClient = new JTStatsClient({
  uri : config.statsUri,
  category : config.category
});

var client = new Client(config.mongodbUri, jtStatsClient);

var interval = 10 * 1000;
var doStats = function(){
  client.doStats(function(){
    _.delay(doStats, interval);
  });
};

doStats();