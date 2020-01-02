let mongoose = require('mongoose');
let Schema = mongoose.Schema;
var Model = require('../../data/schema_search');
const utility = require('../../helpers/utility')

module.exports = {
    addData: function(req, callback){
        let newData = new Model(req);
        newData.save(callback);
    },

    updateData: function (req, callback) {
        Model.findOneAndUpdate({type_id : req.type_id}, req, {upsert: true}, callback);
    },

    deleteData: function(param, callback){
        Model.findByIdAndDelete(param.id, callback);
    },

    getAll: function(req, callback){
        var reqSearch = `${req.keyword}`;
        if(!utility.issetVal(req.type)){
            Model.find(
                { "$text": { "$search": "\""+reqSearch+"\"" } },
                { "score": { "$meta": "textScore" } }
            )
            .select()
            .skip(req.start)
            .limit(req.limit)
            .sort({ "score": { "$meta": "textScore" } })
            .exec(callback);
        } else {
            if(req.type == "postEvent"){
                const reqType = "post";
                const reqType1 = "event";
                Model.find({ "$and": [
                    { "$text": { "$search": "\""+reqSearch+"\"" } },
                    { "$or" : [
                            {
                                "type": `${reqType}`
                            },
                            {
                                "type": `${reqType1}`
                            }
                        ]
                    }
                    ]},{ "score": { "$meta": "textScore" } }
                )
                .select()
                .skip(req.start)
                .limit(req.limit)
                .sort({ "score": { "$meta": "textScore" } })
                .exec(callback);
            } else {
                Model.find({ "$and": [
                    { "$text": { "$search": "\""+reqSearch+"\"" } },
                    {
                        "type": `${req.type}`
                    }
                    ]},{ "score": { "$meta": "textScore" } }
                )
                .select()
                .skip(req.start)
                .limit(req.limit)
                .sort({ "score": { "$meta": "textScore" } })
                .exec(callback);
            }
        }
    },

    getCountData: function(req, callback){
        var reqSearch = `${req.keyword}`;
        if(!utility.issetVal(req.type)){
            Model.find(
                { "$text": { "$search": "\""+reqSearch+"\"" } },
                { "score": { "$meta": "textScore" } }
            )
            .select()
            .sort({ "score": { "$meta": "textScore" } })
            .exec((err, data) =>{
                !utility.issetVal(err) ? 
                callback(null, data.length) : callback(err, null)
            });
        } else {
            if(req.type == "postEvent"){
                const reqType = "post";
                const reqType1 = "event";
                Model.find({ "$and": [
                    { "$text": { "$search": "\""+reqSearch+"\"" } },
                    { "$or" : [
                            {
                                "type": `${reqType}`
                            },
                            {
                                "type": `${reqType1}`
                            }
                        ]
                    }
                    ]},{ "score": { "$meta": "textScore" } }
                )
                .select()
                .sort({ "score": { "$meta": "textScore" } })
                .exec((err, data) =>{
                    !utility.issetVal(err) ? 
                    callback(null, data.length) : callback(err, null)
                });
            }  else {
                Model.find({ "$and": [
                    { "$text": { "$search": "\""+reqSearch+"\"" } },
                    {
                        "type": `${req.type}`
                    }
                ]},{ "score": { "$meta": "textScore" } }
                )
                .select()
                .sort({ "score": { "$meta": "textScore" } })
                .exec((err, data) =>{
                    !utility.issetVal(err) ? 
                    callback(null, data.length) : callback(err, null)
                });
            }
        }
        
    },
}
