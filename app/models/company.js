let mongoose = require('mongoose');
let Schema = mongoose.Schema;


var collectionSchema = new Schema({
    name:  String,
    publish: Boolean,
    modify_date: { type: Date, default: Date.now },
    create_date: { type: Date }
  }, {timestamps: { modify_date: 'modify_date' }, collection: 'Company'});

const Model = mongoose.model('Company', collectionSchema);

module.exports = {
  addData: function(req, callback){
      let newData = new Model(req);
      newData.save(callback);
  },

  deleteData: function(param, callback){
      Model.findByIdAndDelete(param.id, callback);
  },

  updateData: function(param, callback){
      Model.findByIdAndUpdate(param.id, param, callback);
  },

  getAll: function(req, callback){
      Model.find({})
        .select()
        .skip(req.start)
        .limit(req.limit)
        .exec(callback);
  },

  getCountData: function(callback){
      Model.countDocuments({}, callback);
  },

  getById: function(req, callback){
    //console.log(req.body.name);
    Model.findById(req.body.id).select().exec(callback);
  }
}
