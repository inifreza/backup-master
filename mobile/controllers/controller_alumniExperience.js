var user = require('../models/user')
const alumniExperience = require('../models/AlumniExperience')
let response = require('../../helpers/response')
const utility = require('../../helpers/utility')
const globals = require('../../configs/global')
const {
  config
} = require('../../default')
let url = globals[config.environment]; // development || production
let moment = require('moment')

exports.getAll = async (req, res) => {
    try {
        const middleware = {
        user_id     : 'required|text|' + req.body.user_id,
        auth_code   : 'required|text|' + req.body.auth_code,
        page        : 'required|number|'+req.body.page,
        title      : 'no|text|' + req.body.title,
        }

        if (utility.validateRequest(middleware)) {

            await user.getAuth(req.body, function (errAuth, resAuth) {

                if (!errAuth) {
                    if (!utility.issetVal(resAuth)) {
                        res.status(200).send(
                        new response(false, 403, 'Unauthorized')

                        )
                    } else {
                        let bodyParam = {
                            column : 'user_id'
                            , bySearch : req.body.user_id
                        }
                        
                        utility.issetVal(req.body.title) ? bodyParam.title = req.body.title : bodyParam.title = null;
                            
                        alumniExperience.getCountData(bodyParam, function(errCount, resCount){
                            console.log(errCount)
                            if(errCount){
                                res.status(200).send(
                                    new response(false, 401, 'Fetch Failed')
                                )
                            }else{
                                let itemPerRequest = utility.issetVal(req.body.item)?  parseInt(req.body.item) : 15;
                                let page = req.body.page;
                                let total_data =  resCount;
                                let total_page = Math.ceil(total_data / itemPerRequest);
            
                                let limitBefore = page <= 1 || page == null ? 0 : (page-1) * itemPerRequest;
            
                                const options = {
                                    start : limitBefore,
                                    limit : itemPerRequest,
                                }
                                utility.issetVal(req.body.title) ? options.title = req.body.title : options.title = null;
                                alumniExperience.getAll(options, function(errRes, resData){
                                    if(!utility.issetVal(errRes)){
                                        if(utility.issetVal(resData)){
                                            const totalInfo = {
                                                total_page : total_page,
                                                total_data_all : total_data,
                                                total_data : resData.length
                                            }
                                            res.status(200).send(new response(true, 200, 'Fetch Success', {
                                                data :resData,
                                                total: totalInfo
                                            } ))
                                        }else{
                                            res.status(200).send(
                                            new response(false, 401, 'Fetch Failed')
                                            )
                                        }
                                    }else{
                                        res.status(200).send(
                                            new response(false, 401, 'Err::Fetch Failed')
                                        )
                                    }
                                })
                            }
                        })  
                    }
                } else {
                    res.status(200).send(
                        new response(false, 403, 'Unauthorized1')
                    )
                }
            })
            } else {
            res.status(200).send(
                new response(false, 400, 'Invalid input format')
            )
        }
    } catch (e) {
        res.status(500).send(
        new response(false, 500, 'Something went wrong')
        )
    }
}

exports.insert = async (req, res) => {
    let start_date = moment(moment(req.body.start_date,'YYYY-MM')).format("YYYY-MM")
    let end_date = "";
    if(req.body.present == 0){
        end_date = moment(moment(req.body.end_date,'YYYY-MM')).format("YYYY-MM")
    }
    try {
        const middleware = {
        user_id: 'required|text|' + req.body.user_id,
        auth_code: 'required|text|' + req.body.auth_code,
        title: 'required|text|' + req.body.title,
        company: 'required|text|' + req.body.company,
        start_date: 'required|text|' + start_date,
        present: 'required|text|' + req.body.present,
        end_date: 'no|text|' + end_date,
        lineservice_id: 'required|text|' + req.body.lineservice_id

        }

        if (utility.validateRequest(middleware)) {
            await user.getAuth(req.body, function (errAuth, resAuth) {
                console.log(errAuth);
                if (!errAuth) {
                    if (!utility.issetVal(resAuth)) {
                        res.status(200).send(
                        new response(false, 403, 'Unauthorized')
                        )
                    } else {
                        // proses di mulai dari sini
                        if (resAuth.auth_code == req.body.auth_code) {
                        console.log('sekarang Insert')

                            let body = {
                                id: utility.generateHash(32),
                                user_id: req.body.user_id,
                                position: req.body.title,
                                company: req.body.company,
                                lineservice_id: req.body.lineservice_id,
                                start_date: start_date,
                                present: req.body.present,
                                end_date: end_date,
                                department: '',
                                create_date : moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
                            }
                            console.log(body);
                            alumniExperience.addData(body, function (err, resData) {
                                if (!err) {
                                    res.status(200).send(
                                    new response(true, 200, 'Insert Data success', resData))
                                } else {
                                    res.status(200).send(
                                        new response(false, 401, 'Insert Data failed', err)
                                    )
                                }
                            })

                        } else {
                            res.status(200).send(
                                new response(false, 403, 'Unauthorized2')
                            )
                        }
                    }
                } else {
                    res.status(200).send(
                        new response(false, 403, 'Unauthorized1')
                    )
                }
            })
        } else {
            res.status(200).send(
                new response(false, 400, 'Invalid input format', middleware)
            )
        }
    } catch (e) {
        console.log(e)
        res.status(500).send(
        new response(false, 500, 'Something went wrong')
        )
    }
}

exports.delete = async (req, res) => {
    try {
        const middleware = {
        user_id: 'required|text|' + req.query.user_id,
        auth_code: 'required|text|' + req.query.auth_code,
        id: 'required|text|' + req.query.id,
        }

        if (utility.validateRequest(middleware)) {

        await user.getAuth(req.query, function (errAuth, resAuth) {

            if (!errAuth) {

            if (!utility.issetVal(resAuth)) {
                res.status(200).send(
                new response(false, 403, 'Unauthorized')

                )
            } else {
                // proses di mulai dari sini
                if (resAuth.auth_code == req.query.auth_code) {
                console.log('Waktunya Delete')
                let body = {
                    id: req.query.id
                }
                alumniExperience.deleteData(body, function (errData, resData) {
                    if (!errData) {
                    res.status(200).send(new response(true, 200, 'Delete success'))
                    } else {
                    res.status(200).send(
                        new response(false, 401, 'Delete failed')
                    )
                    }
                })
                } else {
                res.status(200).send(
                    new response(false, 403, 'Unauthorized2')
                )
                }
            }
            } else {
            res.status(200).send(
                new response(false, 403, 'Unauthorized1')
            )
            }
        })
        } else {
        res.status(200).send(
            new response(false, 400, 'Invalid input format')
        )
        }
    } catch (e) {
        res.status(500).send(
        new response(false, 500, 'Something went wrong')
        )
    }
}

exports.update = async (req, res)=>{
    let start_date = moment(moment(req.body.start_date,'YYYY-MM')).format("YYYY-MM")
    let end_date = "";
    if(req.body.present == 0){
        end_date = moment(moment(req.body.end_date,'YYYY-MM')).format("YYYY-MM")
    }
    try {
        const middleware = {
            user_id: 'required|text|' + req.body.user_id,
            auth_code: 'required|text|' + req.body.auth_code,
            title: 'required|text|' + req.body.title,
            company: 'required|text|' + req.body.company,
            start_date: 'required|text|' + start_date,
            present: 'required|text|' + req.body.present,
            end_date: 'no|text|' + end_date,
            lineservice_id: 'required|text|' + req.body.lineservice_id,
            id: 'required|text|' + req.body.id
            
        }
        console.log(middleware)

        if (utility.validateRequest(middleware)) {

        await user.getAuth(req.body, function (errAuth, resAuth) {

            if (!errAuth) {

                if (!utility.issetVal(resAuth)) {
                    res.status(200).send(
                    new response(false, 403, 'Unauthorized')

                    )
                } else {
                    // proses di mulai dari sini
                    if (resAuth.auth_code == req.body.auth_code) {
                    console.log('sekarang Update')

                    let body = {
                        id: req.body.id,
                        user_id: req.body.user_id,
                        position: req.body.title,
                        company: req.body.company,
                        lineservice_id: req.body.lineservice_id,
                        start_date: start_date,
                        present: req.body.present,
                        end_date: end_date,
                        department: '',
                    }

                    alumniExperience.updateData(body, function(errRes, resGet){
                        console.log(errRes)
                        if (!errRes) {
                        res.status(200).send(new response(true, 200, 'Update success'))
                        } else {
                        res.status(200).send(new response(false, 401, 'Update Failed'))
                        }
                    })
                    
                    } else {
                    res.status(200).send(
                        new response(false, 403, 'Unauthorized2')
                    )
                    }
                }
            } else {
            res.status(200).send(
                new response(false, 403, 'Unauthorized1')
            )
            }
        })
        } else {
        res.status(200).send(
            new response(false, 400, 'Invalid input format')
        )
        }
    } catch (e) {
        res.status(500).send(
        new response(false, 500, 'Something went wrong')
        )
    }
}

exports.detail = async (req, res) => {
    try {
      const middleware = {
        user_id: 'required|text|' + req.body.user_id,
        auth_code: 'required|text|' + req.body.auth_code,
        id: 'required|text|' + req.body.id,
      }
      console.log(middleware);
      if (utility.validateRequest(middleware)) {
        const result = await user.getAuth(req.body, function (errAuth, resAuth) {
          console.log(errAuth);
          if (!errAuth) {
            if (!utility.issetVal(resAuth)) {
              res.status(200).send(
                new response(false, 403, 'Unauthorized')
              )
            } else {
              console.log(resAuth.auth_code);
              if (resAuth.auth_code == req.body.auth_code) {
                //here goes the function
                const body = {
                  id: req.body.id,
                }
  
                alumniExperience.getById(body, function (errRes, resData) {
                  // console.log(resData);
                  // console.log(errRes);
                  if (!errRes) {
                    if (utility.issetVal(resData)) {
                      res.status(200).send(new response(true, 200, 'Fetch success', resData))
                    } else {
                      res.status(200).send(
                        new response(false, 401, 'Fetch Failed4')
                      )
                    }
                  } else {
                    res.status(200).send(
                      new response(false, 401, 'Fetch Failed3')
                    )
                  }
                })
              } else {
                res.status(200).send(
                  new response(false, 403, 'Unauthorized1')
                )
              }
            }
          } else {
            res.status(200).send(
              new response(false, 403, 'Unauthorized2')
            )
          }
        })
      } else {
        res.status(200).send(
          new response(false, 400, 'Invalid input format')
        )
      }
    } catch (e) {
      console.log(e);
      res.status(500).send(
        new response(false, 500, 'Something went wrong')
      )
    }
  }
  exports.getByAlumni = async (req,res)=> {
    try {
        const middleware = {
            user_id     : 'required|text|' + req.body.user_id,
            auth_code   : 'required|text|' + req.body.auth_code,
            page        : 'required|number|'+req.body.page,
            alumni_id   : 'required|text|'+req.body.alumni_id,
        }


        if (utility.validateRequest(middleware)) {

            await user.getAuth(req.body, function (errAuth, resAuth) {

                if (!errAuth) {
                    if (!utility.issetVal(resAuth)) {
                        res.status(200).send(
                        new response(false, 403, 'Unauthorized')

                        )
                    } else {
                        let bodyParam = {
                            column : 'user_id'
                        }
                        utility.issetVal(req.body.alumni_id) ? bodyParam.bySearch = req.body.alumni_id : bodyParam.bySearch = null;
                            
                        alumniExperience.getCountData(bodyParam, function(errCount, resCount){
                            console.log(errCount)
                            if(errCount){
                                res.status(200).send(
                                    new response(false, 401, 'Fetch Failed')
                                )
                            }else{
                                let itemPerRequest = utility.issetVal(req.body.item)?  parseInt(req.body.item) : 15;
                                let page = req.body.page;
                                let total_data =  resCount;
                                let total_page = Math.ceil(total_data / itemPerRequest);
            
                                let limitBefore = page <= 1 || page == null ? 0 : (page-1) * itemPerRequest;
            
                                const options = {
                                    start : limitBefore,
                                    limit : itemPerRequest,
                                }
                                utility.issetVal(req.body.alumni_id) ? options.alumni_id = req.body.alumni_id : options.alumni_id = null;
                                alumniExperience.getByAlumni(options, function(errRes, resData){
                                    if(!utility.issetVal(errRes)){
                                        if(utility.issetVal(resData)){
                                            const totalInfo = {
                                                total_page : total_page,
                                                total_data_all : total_data,
                                                total_data : resData.length
                                            }
                                            res.status(200).send(new response(true, 200, 'Fetch Success', {
                                                data :resData,
                                                total: totalInfo
                                            } ))
                                        }else{
                                            res.status(200).send(
                                            new response(false, 401, 'Fetch Failed')
                                            )
                                        }
                                    }else{
                                        res.status(200).send(
                                            new response(false, 401, 'Err::Fetch Failed')
                                        )
                                    }
                                })
                            }
                        })  
                    }
                } else {
                    res.status(200).send(
                        new response(false, 403, 'Unauthorized1')
                    )
                }
            })
            } else {
            res.status(200).send(
                new response(false, 400, 'Invalid input format')
            )
        }
    } catch (e) {
        res.status(500).send(
        new response(false, 500, 'Something went wrong')
        )
    }
  }