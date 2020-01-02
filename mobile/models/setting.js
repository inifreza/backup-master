const table = 'T_Setting'
const exec = require('../../helpers/mssql_adapter') 
const utility = require('../../helpers/utility')

module.exports = {
  getOne : function (req, callback) {
    return exec
    .knex(table)
    .select('*')
    .limit(1)
    .then(([datas])=>{
      callback(null,datas)
    })
    .catch(error=>{
      callback(error, null)
    })
  }
}