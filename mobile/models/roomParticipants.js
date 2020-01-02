//Schema
const Model = require('../../data/schema_roomParticipants')
const User = require('../models/user')
const LineService = require('../models/lineService')

//Utility
const Utility = require('../../helpers/utility')
const response = require('../../helpers/response')

module.exports = class RoomParticipants {
  static add (req){
    return new Promise ((resolve, reject) =>{
      Model
      .insertMany(req)
      .then(data=>{
        resolve(data)
      })
    })
  }

  static findAll (room_id){
    return new Promise ((resolve, reject)=>{
      Model
      .find({room_id : room_id})
      .then(datas=>{
        Promise.all(datas.map(data=>{
          // console.log({data : data});
          return new Promise((resolve, reject)=>{
            let result = {
              id : null,
              name  : null,
              img   : null,
              type  : data.type,
              batch : null,
              lineService_name : null
            }
            User.getById({id : data.user_id}, function(errGet, resGet){
              // console.log({user : resGet});
              if(Utility.issetVal(resGet)){
                result.id = resGet.id
                result.name = resGet.name
                result.img = resGet.img
                result.batch = resGet.batch
                LineService.getById({id : resGet.lineservice_id}, function(errLine, resLine){
                  result.lineService_name = resLine.title
                  resolve(result)
                })
              } else {
                result.id = null
                result.name = null
                result.img = null
                result.batch = null
                result.lineService_name = null
                resolve(result)
              }
            })
          })

          .then(result=>{
            return result
          })

        }))
        .then(datas=>{
          // console.log({datas : datas});
          resolve(datas)
        })
      })
      .catch(error=>{
        console.log({error : error});
        reject(error)
      })
    })
  }

  static getUserinformation (req){
   return Promise.all(req.datas.map(data=>{
      // console.log({data : data});
      return new Promise((resolve, reject)=>{
        let result = {
          id : null,
          name  : null,
          img   : null,
          type  : data.type,
          batch : null,
          lineService_name : null
        }
        User.getById({id : data.user_id}, function(errGet, resGet){
          // console.log({user : resGet});
          if(Utility.issetVal(resGet)){
            result.id = resGet.id
            result.name = resGet.name
            result.img = resGet.img
            result.batch = resGet.batch
            LineService.getById({id : resGet.lineservice_id}, function(errLine, resLine){
              result.lineService_name = resLine.title
              resolve(result)
            })
          } else {
            result.id = null
            result.name = null
            result.img = null
            result.batch = null
            result.lineService_name = null
            resolve(result)
          }
        })
      })

      .then(result=>{
        return result
      })
      .catch(error=>{
        return error
      })
    }))
    .then(datas=>{
      // console.log({datas : datas});
      return datas
    })
    .catch(error=>{
      return error
    })
  }
  static findOneAndDelete (req){
    return new Promise((resolve, reject)=>{
      Model
      .find(req)
      .remove()
      .then(data=>{
        resolve(data)
      })
      .catch(error=>{
        throw (new response(false, 401,'Delete Failed'))
      })
    })
  }

  static findOne (user_id){
    console.log({user_id : user_id});
    return new Promise((resolve, reject)=>{
      Model
      .findOne(user_id)
      .then(data=>{
        if(Utility.issetVal(data)){
          resolve(data)
        } else {
          reject(new response(false, 404,'Participant Not Exist'))
        }
      })
      .catch((error)=>{
        reject(new response(false, 404,'Participant Not Exist'))
      })
    })
  }

  static getCount (req){
    this.req = req || {}
    return new Promise((resolve, reject)=>{
      Model
      .countDocuments(req)
      .then(resCount=>{
        resolve(resCount)
      })
      .catch(error=>{
        reject(new response(false, 400, 'Fetch Failed'))
      })
    })
  }
}