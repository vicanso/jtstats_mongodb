'use strict';
var os = require('os');

exports.env = process.env.NODE_ENV || 'development';

exports.category = os.hostname() + '-mongodb';