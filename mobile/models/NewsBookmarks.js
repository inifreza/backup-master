const Model = require('../../data/schema_NewsBookmarks')

module.exports = {
  addData: function(req, callback){
    let newData = new Model(req);
    newData.save(callback);
  },

  deleteData: function(param, callback){
    Model.findByIdAndDelete(param.id, callback);
  },
  
  getData : function (req, callback){
    Model.find(req, callback)
  },
  getAll: function(req, callback){
    Model.find({req})
        .select()
        .exec(callback);
},
}