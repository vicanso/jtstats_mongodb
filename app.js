'use strict';
var config = require('./config');
var Client = require('./lib/client');
var _ = require('underscore');

var JTStatsClient = require('jtstats_client');
var jtStatsClient = new JTStatsClient({
  uri : config.statsUri,
  category : 'mongodb'
});

var client = new Client(config.mongodbUri, jtStatsClient);

var interval = 10 * 1000;
var doStats = function(){
  client.doStats(function(){
    _.delay(doStats, interval);
  });
};

doStats();