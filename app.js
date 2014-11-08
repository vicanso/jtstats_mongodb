var mongodb = require('./lib/mongodb');


mongodb.init('mongodb://localhost:10020');

setTimeout(function(){
  mongodb.getStatus(function(){

  });
}, 1000);