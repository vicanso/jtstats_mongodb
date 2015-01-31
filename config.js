'use strict';
var os = require('os');
exports.statsUri = process.env.STATS_URI || 'stats://localhost:6000';

exports.mongodbUri = process.env.MONGODB_URI || 'mongodb://localhost:10020';

exports.category = process.env.CATEGORY || (os.hostname() + '.mongodb');