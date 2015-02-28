'use strict';
var os = require('os');

exports.env = process.env.NODE_ENV || 'development';

exports.mongodbUri = process.env.MONGODB_URI || 'mongodb://localhost:10020';

exports.category = process.env.CATEGORY || (os.hostname() + '.mongodb');