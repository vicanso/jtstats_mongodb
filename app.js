'use strict';

var Client = require('./lib/client');


var client = new Client('mongodb://localhost:5000');

setInterval(function(){
  client.getStatus(function(err, info){
  	console.dir(info);
  });
}, 10000);