const Model = require('../../data/schema_NewsBookmarks')

module.exports = {
  addData: function(req, callback){
    let newData = new Model(req);
    newData.save(callback);
  },
}