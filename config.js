'use strict';
var program = require('commander');

program.version('0.0.1')
  .option('--stats <n>', 'stats uri')
  .option('--mongodb <n>', 'mongodb uri')
  .parse(process.argv);

exports.statsUri = program.stats;

exports.mongodbUri = program.mongodb;