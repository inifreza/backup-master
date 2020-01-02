var search = require('../models/search')
let response = require('../../helpers/response')
const utility = require('../../helpers/utility')
let moment = require('moment')
var user = require('../models/user')

exports.getAll = async (req, res) => {
    try{
        const {user_id, auth_code, page, item, keyword, type} = req.body
        const middleware = {
            user_id      : 'required|text|'+user_id,
            auth_code    : 'required|text|'+auth_code,
            page         : 'required|text|'+page,
            item         : 'no|text|'+item,
            keyword      : 'no|text|'+keyword,
            type         : 'no|text|'+type
        }
        // console.log(middleware);
        if(utility.validateRequest(middleware)){
            const result = await user.getAuth(req.body,function(errAuth,resAuth){
                console.log(errAuth);
            if(!errAuth){
                if(!utility.issetVal(resAuth)){
                    res.status(200).send(
                        new response(false, 403, 'Unauthorized')
                    )
                }else{
                    if(resAuth.auth_code == req.body.auth_code){
                        const prepared = {}
                        utility.issetVal(keyword) ? prepared.keyword  = keyword : null;
                        utility.issetVal(type) ? prepared.type  = type : null;

                        search.getCountData(prepared, function(errCount, resCount){
                            console.log({errCount});
                            console.log({resCount});
                            if(errCount){
                              res.status(200).send(
                                new response(false, 401, 'No data')
                              )
                            }else{
                                let itemPerRequest = utility.issetVal(req.body.item)?  parseInt(req.body.item) : 15;
                                let page = req.body.page;
                                let total_data =  resCount;
                                let total_page = Math.ceil(total_data / itemPerRequest);
            
                                let limitBefore = page <= 1 || page == null ? 0 : (page-1) * itemPerRequest;
            
                                var options = {
                                    start       : limitBefore,
                                    limit       : itemPerRequest,
                                }
                                utility.issetVal(keyword) ? options.keyword  = keyword : null;
                                utility.issetVal(type) ? options.type  = type : null;

                                search.getAll(options, (errRes, resData) =>{
                                    // console.log({errRes});
                                    // console.log({resData});
                                    if(!utility.issetVal(errRes)){
                                        if(utility.issetVal(resData)){
                                            const newData = resData.map(el =>{
                                                let data = {
                                                    id : el._id
                                                    , type_id : el.type_id
                                                    , type : el.type
                                                    , title : el.title
                                                    , description : el.description
                                                    , img : el.img
                                                    , score : el.score
                                                    , modify_date : el.modify_date
                                                }
                                                switch (data.type) {
                                                    case 'post':
                                                      data.type = "Post";
                                                      break;
                                                    case 'event':
                                                        data.type = "Event";
                                                        break;
                                                    case 'user':
                                                        data.type = "Alumni";
                                                        break;
                                                    case 'news':
                                                        data.type = "News";
                                                        break;
                                                    case 'job':
                                                        data.type = "Job";
                                                        break;
                                                    default:
                                                      data.type = "Tag";
                                                }
                                                if(el.type =="hashtag") {
                                                    data.count_post  =  10000;
                                                    data.count_event =  10000;
                                                }
                                                return data
                                            })
                                            console.log(newData)
                                            const totalInfo = {
                                                total_page : total_page,
                                                total_data_all : total_data,
                                                total_data : newData.length
                                            }
                                            
                                            var datas = {
                                                data: newData,
                                                total :totalInfo
                                            }
                                            
                                            res.status(200).send(
                                            new response(true, 200, 'Fetch Success', datas)
                                            )
                                        }else{
                                            res.status(200).send(
                                            new response(false, 401, 'Fetch Failed1')
                                            )
                                        }
                                    }else{
                                        res.status(200).send(
                                            new response(false, 401, 'Fetch Failed2')
                                        )
                                    }
                                })
                            }
                        })
                    }else{
                        res.status(200).send(
                        new response(false, 403, 'Unauthorized2')
                        )
                    }
                }
            }else{
                res.status(200).send(
                new response(false, 403, 'Unauthorized3')
                )
            }
            })
        }else{
            res.status(200).send(
            new response(false, 400, 'Invalid input format', middleware)
            )
        }
    } catch (e) {
      console.log(e);
      res.status(500).send(
        new response(false, 500, 'Something went wrong')
      )
    }
}


