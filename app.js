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

setInterval(function(){
  client.doStats();
}, 3000);