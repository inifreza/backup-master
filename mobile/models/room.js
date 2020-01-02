//Schema
const Model = require('../../data/schema_rooms')
const response = require('../../helpers/response')

module.exports = class Room {
  static add (req){
    return new Promise ((resolve, reject) =>{
      new Model(req).save()
      .then(data=>{
        resolve(data)
      })
      .catch(error=>{
        reject(error)
      })
    })
  }

  static findById (id){
    return new Promise((resolve, reject)=>{
      Model
      .findById(id)
      .then(data=>{
        resolve(data)
      })
      .catch((error)=>{
        reject(new response(false, 404,'Group Not Exist'))
      })
    })
  }

  static findOne (id){
    return new Promise((resolve, reject)=>{
      Model
      .findById(id)
      .then(data=>{
        resolve(data)
      })
      .catch((error)=>{
        reject(new response(false, 404,'Group Not Exist'))
      })
    })
  }

  static findOneAndDelete (id){
    return new Promise((resolve, reject)=>{
      Model
      .find(id)
      .remove()
      .then(data=>{
        resolve(data)
      })
      .catch(()=>{
        throw (new response(false, 400,'Delete Failed'))
      })
    })
  }

  static findAll (req, page, limit ){
    this.req = req || {}
    this.page = parseInt(page) || null
    this.limit = parseInt(limit) || null
    console.log(this.req, this.page,this.limit);
    return new Promise((resolve, reject)=>{
      Model
      .find(this.req)
      .skip(this.page)
      .limit(this.limit)
      .then(data=>{
        console.log({data : data});
        resolve(data)
      })
      .catch(error=>{
        console.log(error);
        reject(error)
      })
    })
  }

  static count (req){
    this.req = req || {}
    return new Promise((resolve, reject)=>{
      Model
      .countDocuments(req)
      .then(resCount=>{
        resolve(resCount)
      })
      .catch(error=>{
        reject(error)
      })
    })
  }
}
