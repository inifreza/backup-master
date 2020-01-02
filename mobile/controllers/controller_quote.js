//Utility
const utility = require('../../helpers/utility')
const response = require('../../helpers/response')
//Model
const user = require('../models/user')
const quote = require('../models/quote')

exports.getRandom = async (req, res)=>{
  console.log('Random Quotes');
  try{
    const middleware = {
        user_id         : 'required|text|'+req.body.user_id,
        auth_code       : 'required|text|'+req.body.auth_code,
    }
    if(utility.validateRequest(middleware)){
        const result = await user.getAuth(req.body,function(errAuth,resAuth){
            if(!errAuth){
                if(!utility.issetVal(resAuth)){
                    res.status(200).send(
                        new response(false, 403, 'Unauthorized')
                    )
                }else{
                    if(resAuth.auth_code == req.body.auth_code){
                      quote.getAll(null, function(errGet, resQuotes){
                        let random = Math.floor(Math.random() * resQuotes.length) 
                        if(utility.issetVal(resQuotes)){
                          res.status(200).send(
                            new response(true, 200, 'Fetch Succes', {data : resQuotes[random]})
                            )
                        } else {
                          res.status(200).send(
                            new response(false, 401, 'Fetch Failed')
                            )
                        }
                      })

                        
                    }else{
                        res.status(200).send(
                        new response(false, 403, 'Unauthorized1')
                        )
                    }
                }
            }else{
                res.status(200).send(
                    new response(false, 403, 'Unauthorized2')
                )
            }
        })
    }else{
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
