let mongoose = require('mongoose');
const { config } = require('../default')
const { mongo } = require('../configs/database')
let database= mongo[config.environment]; // development || production


//connect db
connect = function(callback){
  mongoose.connect(database.host,{useNewUrlParser: true, useFindAndModify: false })
   .then(()=> {
     let data = true;
     return callback(null,data);
   })
   .catch(err => {
     let data = false;
     return callback(err,null);
  })
}

module.exports = {
  connect
}
