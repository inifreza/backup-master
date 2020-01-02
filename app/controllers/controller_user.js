var user = require("../models/user");
var AlumniRecommend = require("../models/AT_AlumniRecommend");
var alumniHighlight = require("../models/alumniHighlight");
const alumniInterest = require("../models/AT_AlumniInterest");
var admin = require("../models/admin");
let response = require("../../helpers/response");
const utility = require("../../helpers/utility");
let moment = require("moment");
const formidable = require("formidable");
const path = require("path");
const fs = require("fs");
let appDir = path.dirname(require.main.filename);
let pathDir = appDir + "/uploads/user/";
let fileDir = appDir + "/uploads/excel/user/";
let Excel = require("exceljs");

// setting json
const dataPathUser = "./data/rejectionUser.json";
const dataPathExternal = "./data/rejectionExternal.json";

//setting email
const nodemailer = require("../../helpers/mail_adapter");

exports.insert = async (req, res) => {
  try {
    let formData = new Array();
    new formidable.IncomingForm()
      .parse(req)
      .on("field", (name, field) => {
        formData.push(
          '"' + name + '"' + ":" + '"' + utility.escapeHtml(field) + '"'
        );
      })
      .on("file", (name, file) => {
        formData.push('"' + name + '"' + ":" + '"' + file.name + '"');
      })
      .on("fileBegin", function(name, file) {
        if (utility.checkImageExtension(file.name)) {
          let fileType = file.type.split("/").pop();
          file.name = utility.generateHash(16) + "." + fileType;
          file.path = appDir + "/uploads/user/" + file.name;
        }
      })
      .on("aborted", () => {
        console.error("Request aborted by the user");
      })
      .on("error", err => {
        console.error("Error", err);
        throw err;
      })
      .on("end", () => {
        let temp = "{" + formData.toString() + "}";
        let formJSON = JSON.parse(temp);

        const middleware = {
          user_id: "required|text|" + formJSON.user_id,
          auth_code: "required|text|" + formJSON.auth_code,
          type: "required|text|" + formJSON.type,
          name: "required|text|" + formJSON.name,
          email: "required|text|" + formJSON.email,
          gender: "required|text|" + formJSON.gender,
          company: "no|text|" + formJSON.company,
          position: "no|text|" + formJSON.position,
          phone: "no|text|" + formJSON.phone,
          dob: "no|text|" + formJSON.dob,
          lineservice_id: "no|text|" + formJSON.lineservice_id,
          img: "no|images|" + formJSON.img,
          publish: "required|number|" + formJSON.publish,
          batch: "required|number|" + formJSON.batch
        };
        if (utility.validateRequest(middleware)) {
          const result = admin.getAuth(formJSON, function(errAuth, resAuth) {
            if (!errAuth) {
              if (!utility.issetVal(resAuth)) {
                res.status(200).send(new response(false, 403, "Unauthorized"));
              } else {
                if (resAuth.auth_code == formJSON.auth_code) {
                  //here goes the function
                  let salt = utility.generateHash(5);
                  let id = utility.generateHash(32);
                  let auth_code = utility.generateHash(32);

                  let alumni;
                  let type;
                  if (formJSON.type == "external") {
                    type = "public";
                    alumni = "no";
                  } else if (formJSON.type == "internal") {
                    type = "pwc";
                    alumni = "no";
                  } else {
                    type = "pwc";
                    alumni = "yes";
                  }

                  let body = {
                    id: id,
                    type: type,
                    alumni: alumni,
                    name: formJSON.name,
                    email: formJSON.email,
                    gender: formJSON.gender,
                    company: formJSON.company || "",
                    position: formJSON.position || "",
                    phone: formJSON.phone || "",
                    dob: formJSON.dob || "",
                    bio: "",
                    lineservice_id: formJSON.lineservice_id || "",
                    achievement: "",
                    join_date: "",
                    resign_date: "",
                    password: "",
                    salt_hash: salt,
                    reset_code: "",
                    auth_code: auth_code,
                    img: formJSON.img,
                    source: "Excel",
                    eula: 1,
                    verified: 0,
                    publish: formJSON.publish,
                    batch: formJSON.batch,
                    create_date: moment(Date.now()).format(
                      "YYYY-MM-DD HH:mm:ss"
                    )
                  };
                  if (body.img == undefined) {
                    body.img = "";
                  }
                  console.log({ BODY: body });
                  user.checkEmail(formJSON, function(error, resData1) {
                    console.log(error);
                    if (!error) {
                      if (!utility.issetVal(resData1)) {
                        user.addData(body, function(err, resData) {
                          console.log(err);
                          if (!err) {
                            res
                              .status(200)
                              .send(
                                new response(
                                  true,
                                  200,
                                  "Register success1",
                                  resData
                                )
                              );
                          } else {
                            res
                              .status(200)
                              .send(
                                new response(
                                  false,
                                  401,
                                  "Register failed1",
                                  err
                                )
                              );
                          }
                        });
                      } else {
                        res
                          .status(200)
                          .send(
                            new response(false, 402, "Email already registered")
                          );
                      }
                    } else {
                      res
                        .status(200)
                        .send(new response(false, 401, "Register failed"));
                    }
                  });
                } else {
                  res
                    .status(200)
                    .send(new response(false, 403, "Unauthorized"));
                }
              }
            } else {
              res.status(200).send(new response(false, 403, "Unauthorized"));
            }
          });
        } else {
          res
            .status(200)
            .send(new response(false, 400, "Invalid input format", middleware));
        }
      });
  } catch (e) {
    console.log(e);
    res.status(500).send(new response(false, 500, "Something went wrong"));
  }
};

// exports.getAllVerified = async (req, res) => {
//   try{
//     const middleware = {
//       user_id      : 'required|text|'+req.body.user_id,
//       auth_code    : 'required|text|'+req.body.auth_code,
//       page         : 'required|text|'+req.body.page,
//       item         : 'no|text|'+req.body.item,
//       keyword      : 'no|text|'+req.body.keyword,
//       batch        : 'no|text|'+req.body.batch,
//       create_date  : 'no|text|'+req.body.create_date,
//       interest     : 'no|text|'+req.body.interest
//     }
//     let IdInterests = null
//     if(utility.issetVal(req.body.interest_list)){
//        IdInterests = JSON.parse(req.body.interest_list).map(({interest_id}) => interest_id);
//     }
//       const bodyCount = {
//         verified : 2,
//         list_interest: IdInterests,
//         keyword      : req.body.keyword || null,
//         batch        : req.body.batch || null,
//         create_date  : req.body.create_date || null,
//         interest     : req.body.interest || null,
//       }

//     if(utility.validateRequest(middleware)){
//       const result = await admin.getAuth(req.body,function(errAuth,resAuth){

//         if(!errAuth){
//           if(!utility.issetVal(resAuth)){
//             res.status(200).send(
//             new response(false, 403, 'Unauthorized')
//           )}else{
//             if(resAuth.auth_code == req.body.auth_code){
//               //here goes the function
//               user.getCountData(bodyCount,function(errResCount,rowsResCount) {
//                 console.log({errResCount});
//                 if (!errResCount) {
//                  if (utility.issetVal(rowsResCount)) {
//                       let itemPerRequest = utility.issetVal(req.body.item)?  parseInt(req.body.item) : 15;
//                       let page = req.body.page;
//                       let total_data =  rowsResCount;
//                       let total_page = Math.ceil(total_data / itemPerRequest);
//                       let limitBefore = page <= 1 || page == null ? 0 : (page-1) * itemPerRequest;

//                       const PreparedData = {
//                         start : limitBefore,
//                         limit : itemPerRequest,
//                         verified : 2,
//                         list_interest: IdInterests,
//                         keyword      : req.body.keyword || null,
//                         batch        : req.body.batch || null,
//                         create_date  : req.body.create_date || null,
//                         interest     : req.body.interest || null,
//                       }

//                       user.getAll(PreparedData,function(errRes,rowsRes) {
//                         if (!errRes) {
//                           const totalInfo = {
//                             total_page : total_page,
//                             total_data_all : total_data,
//                             total_data : rowsRes.length
//                           }
//                           if (rowsRes !='') {
//                               res.status(200).send(new response(true, 200, 'Fetch Success', {
//                                   data :rowsRes,
//                                   total: totalInfo
//                               } ))
//                           } else {
//                               res.status(200).send(
//                                   new response(false, 401, 'Fetch Failed4')
//                               )
//                           }
//                         }else {
//                           res.status(200).send(
//                             new response(false, 401, 'Fetch Failed3')
//                           )
//                         }
//                       })
//                   } else {
//                       res.status(200).send(
//                           new response(false, 401, 'Fetch Failed2')
//                       )
//                   }
//                 } else {
//                     res.status(200).send(
//                         new response(false, 401, 'Fetch Failed1')
//                     )
//                 }
//               })
//             }else{
//               res.status(200).send(
//               new response(false, 403, 'Unauthorized')
//               )
//             }
//           }
//         }else{
//           res.status(200).send(
//             new response(false, 403, 'Unauthorized')
//           )
//         }
//       })
//     }else{
//       res.status(200).send(
//         new response(false, 400, 'Invalid input format')
//       )
//     }
//   } catch (e) {
//     console.log(e);
//     res.status(500).send(
//       new response(false, 500, 'Something went wrong')
//     )
//   }
// }

exports.getAll = async (req, res) => {
  try {
    const middleware = {
      user_id: "required|text|" + req.body.user_id,
      auth_code: "required|text|" + req.body.auth_code,
      page: "required|text|" + req.body.page,
      item: "no|text|" + req.body.item
    };
    // console.log(middleware);
    if (utility.validateRequest(middleware)) {
      const result = await admin.getAuth(req.body, function(errAuth, resAuth) {
        console.log(errAuth);
        if (!errAuth) {
          if (!utility.issetVal(resAuth)) {
            res.status(200).send(new response(false, 403, "Unauthorized1"));
          } else {
            console.log(resAuth.auth_code);
            if (resAuth.auth_code == req.body.auth_code) {
              //here goes the function
              let bodyCount = {
                keyword: req.body.keyword
              };
              user.getCountData(bodyCount, function(errResCount, rowsResCount) {
                console.log(errResCount);
                if (!errResCount) {
                  if (utility.issetVal(rowsResCount)) {
                    let itemPerRequest = utility.issetVal(req.body.item)
                      ? parseInt(req.body.item)
                      : 15;
                    let page = req.body.page;
                    let total_data = rowsResCount;
                    let total_page = Math.ceil(total_data / itemPerRequest);
                    let limitBefore =
                      page <= 1 || page == null
                        ? 0
                        : (page - 1) * itemPerRequest;

                    const PreparedData = {
                      start: limitBefore,
                      limit: itemPerRequest,
                      keyword: req.body.keyword
                    };

                    user.getAll(PreparedData, function(errRes, rowsRes) {
                      console.log(PreparedData);
                      if (!errRes) {
                        const totalInfo = {
                          total_page: total_page,
                          total_data_all: total_data,
                          total_data: rowsRes.length
                        };
                        if (rowsRes != "") {
                          res.status(200).send(
                            new response(true, 200, "Fetch Success", {
                              data: rowsRes,
                              total: totalInfo
                            })
                          );
                        } else {
                          res
                            .status(200)
                            .send(new response(false, 401, "Fetch Failed4"));
                        }
                      } else {
                        res
                          .status(200)
                          .send(new response(false, 401, "Fetch Failed3"));
                      }
                    });
                  } else {
                    res
                      .status(200)
                      .send(new response(false, 401, "Fetch Failed2"));
                  }
                } else {
                  res
                    .status(200)
                    .send(new response(false, 401, "Fetch Failed1"));
                }
              });
            } else {
              res.status(200).send(new response(false, 403, "Unauthorized"));
            }
          }
        } else {
          res.status(200).send(new response(false, 403, "Unauthorized2"));
        }
      });
    } else {
      res.status(200).send(new response(false, 400, "Invalid input format"));
    }
  } catch (e) {
    console.log(e);
    res.status(500).send(new response(false, 500, "Something went wrong"));
  }
};
exports.getSelectUser = async (req, res) => {
  try {
    const middleware = {
      user_id: "required|text|" + req.body.user_id,
      auth_code: "required|text|" + req.body.auth_code
    };
    // console.log(middleware);
    if (utility.validateRequest(middleware)) {
      const result = await admin.getAuth(req.body, function(errAuth, resAuth) {
        console.log(errAuth);
        if (!errAuth) {
          if (!utility.issetVal(resAuth)) {
            res.status(200).send(new response(false, 403, "Unauthorized1"));
          } else {
            console.log(resAuth.auth_code);
            if (resAuth.auth_code == req.body.auth_code) {
              //here goes the function
              user.getSelectUser(null, function(errRes, rowsRes) {
                // console.log(PreparedData);
                if (!utility.issetVal(errRes)) {
                  if (utility.issetVal(rowsRes)) {
                    res
                      .status(200)
                      .send(new response(true, 200, "Fetch Success", rowsRes));
                  } else {
                    res
                      .status(200)
                      .send(new response(false, 401, "Fetch Failed4"));
                  }
                } else {
                  res
                    .status(200)
                    .send(new response(false, 401, "Fetch Failed3"));
                }
              });
            } else {
              res.status(200).send(new response(false, 403, "Unauthorized"));
            }
          }
        } else {
          res.status(200).send(new response(false, 403, "Unauthorized2"));
        }
      });
    } else {
      res.status(200).send(new response(false, 400, "Invalid input format"));
    }
  } catch (e) {
    console.log(e);
    res.status(500).send(new response(false, 500, "Something went wrong"));
  }
};

exports.getSelectRecommended = async (req, res) => {
  try {
    const middleware = {
      user_id: "required|text|" + req.body.user_id,
      auth_code: "required|text|" + req.body.auth_code
    };
    // console.log(middleware);
    if (utility.validateRequest(middleware)) {
      const result = await admin.getAuth(req.body, function(errAuth, resAuth) {
        console.log(errAuth);
        if (!errAuth) {
          if (!utility.issetVal(resAuth)) {
            res.status(200).send(new response(false, 403, "Unauthorized1"));
          } else {
            console.log(resAuth.auth_code);
            if (resAuth.auth_code == req.body.auth_code) {
              //here goes the function
              let bodyGet = {
                month: req.body.month,
                year: req.body.year
              };
              AlumniRecommend.getSelectUser(bodyGet, function(errRes, rowsRes) {
                console.log(errRes);
                if (utility.issetVal(rowsRes)) {
                  res
                    .status(200)
                    .send(new response(true, 200, "Fetch Success", rowsRes));
                } else {
                  res
                    .status(200)
                    .send(new response(false, 401, "Fetch Failed4"));
                }
              });
            } else {
              res.status(200).send(new response(false, 403, "Unauthorized"));
            }
          }
        } else {
          res.status(200).send(new response(false, 403, "Unauthorized2"));
        }
      });
    } else {
      res.status(200).send(new response(false, 400, "Invalid input format"));
    }
  } catch (e) {
    console.log(e);
    res.status(500).send(new response(false, 500, "Something went wrong"));
  }
};

exports.getAllUnverified = async (req, res) => {
  try {
    console.log(req.body);
    const middleware = {
      user_id: "required|text|" + req.body.user_id,
      auth_code: "required|text|" + req.body.auth_code,
      page: "required|text|" + req.body.page,
      item: "no|text|" + req.body.item,
      keyword: "no|text|" + req.body.keyword,
      batch: "no|text|" + req.body.batch,
      create_date: "no|text|" + req.body.create_date,
      interest: "no|text|" + req.body.interest
    };
    // console.log(middleware);
    let IdInterests = null;
    if (utility.issetVal(req.body.interest_list)) {
      IdInterests = JSON.parse(req.body.interest_list).map(
        ({ interest_id }) => interest_id
      );
    }

    const bodyCount = {
      verified: 1,
      list_interest: IdInterests,
      keyword: req.body.keyword || null,
      batch: req.body.batch || null,
      create_date: req.body.create_date || null,
      interest: req.body.interest || null
    };

    if (utility.validateRequest(middleware)) {
      const result = await admin.getAuth(req.body, function(errAuth, resAuth) {
        if (!errAuth) {
          if (!utility.issetVal(resAuth)) {
            res.status(200).send(new response(false, 403, "Unauthorized"));
          } else {
            console.log(resAuth.auth_code);
            if (resAuth.auth_code == req.body.auth_code) {
              //here goes the function
              user.getCountData(bodyCount, function(errResCount, rowsResCount) {
                console.log({ errResCount });
                console.log({ rowsResCount });
                if (!errResCount) {
                  if (utility.issetVal(rowsResCount)) {
                    let itemPerRequest = utility.issetVal(req.body.item)
                      ? parseInt(req.body.item)
                      : 15;
                    let page = req.body.page;
                    let total_data = rowsResCount;
                    let total_page = Math.ceil(total_data / itemPerRequest);

                    let limitBefore =
                      page <= 1 || page == null
                        ? 0
                        : (page - 1) * itemPerRequest;

                    const PreparedData = {
                      start: limitBefore,
                      limit: itemPerRequest,
                      verified: 1,
                      keyword: req.body.keyword || null,
                      batch: req.body.batch || null,
                      create_date: req.body.create_date || null,
                      interest: req.body.interest || null,
                      list_interest: IdInterests
                    };

                    user.getAll(PreparedData, function(errRes, rowsRes) {
                      console.log({ errRes });
                      if (!errRes) {
                        const totalInfo = {
                          total_page: total_page,
                          total_data_all: total_data,
                          total_data: rowsRes.length
                        };
                        if (rowsRes != "") {
                          res.status(200).send(
                            new response(true, 200, "Fetch Success", {
                              data: rowsRes,
                              total: totalInfo
                            })
                          );
                        } else {
                          res
                            .status(200)
                            .send(new response(false, 401, "Fetch Failed4"));
                        }
                      } else {
                        res
                          .status(200)
                          .send(new response(false, 401, "Fetch Failed3"));
                      }
                    });
                  } else {
                    res
                      .status(200)
                      .send(new response(false, 401, "Fetch Failed2"));
                  }
                } else {
                  res
                    .status(200)
                    .send(new response(false, 401, "Fetch Failed1"));
                }
              });
            } else {
              res.status(200).send(new response(false, 403, "Unauthorized"));
            }
          }
        } else {
          res.status(200).send(new response(false, 403, "Unauthorized"));
        }
      });
    } else {
      res.status(200).send(new response(false, 400, "Invalid input format"));
    }
  } catch (e) {
    console.log(e);
    res.status(500).send(new response(false, 500, "Something went wrong"));
  }
};

exports.getAllReject = async (req, res) => {
  try {
    const middleware = {
      user_id: "required|text|" + req.body.user_id,
      auth_code: "required|text|" + req.body.auth_code,
      page: "required|text|" + req.body.page,
      item: "no|text|" + req.body.item,
      keyword: "no|text|" + req.body.keyword,
      batch: "no|text|" + req.body.batch,
      create_date: "no|text|" + req.body.create_date,
      interest: "no|text|" + req.body.interest
    };

    let IdInterests = null;
    if (utility.issetVal(req.body.interest_list)) {
      IdInterests = JSON.parse(req.body.interest_list).map(
        ({ interest_id }) => interest_id
      );
    }

    if (utility.validateRequest(middleware)) {
      const result = await admin.getAuth(req.body, function(errAuth, resAuth) {
        if (!errAuth) {
          if (!utility.issetVal(resAuth)) {
            res.status(200).send(new response(false, 403, "Unauthorized"));
          } else {
            console.log(resAuth.auth_code);
            if (resAuth.auth_code == req.body.auth_code) {
              //here goes the function
              const bodyCount = {
                verified: 3,
                list_interest: IdInterests,
                keyword: req.body.keyword || null,
                batch: req.body.batch || null,
                create_date: req.body.create_date || null,
                interest: req.body.interest || null
              };

              user.getCountData(bodyCount, function(errResCount, rowsResCount) {
                console.log(errResCount);
                if (!errResCount) {
                  if (utility.issetVal(rowsResCount)) {
                    let itemPerRequest = utility.issetVal(req.body.item)
                      ? parseInt(req.body.item)
                      : 15;
                    let page = req.body.page;
                    let total_data = rowsResCount;
                    let total_page = Math.ceil(total_data / itemPerRequest);

                    let limitBefore =
                      page <= 1 || page == null
                        ? 0
                        : (page - 1) * itemPerRequest;

                    const PreparedData = {
                      start: limitBefore,
                      limit: itemPerRequest,
                      verified: 3,
                      keyword: req.body.keyword || null,
                      batch: req.body.batch || null,
                      create_date: req.body.create_date || null,
                      interest: req.body.interest || null,
                      list_interest: IdInterests
                    };

                    user.getAll(PreparedData, function(errRes, rowsRes) {
                      console.log(errRes);
                      if (!errRes) {
                        const totalInfo = {
                          total_page: total_page,
                          total_data_all: total_data,
                          total_data: rowsRes.length
                        };
                        if (rowsRes != "") {
                          res.status(200).send(
                            new response(true, 200, "Fetch Success", {
                              data: rowsRes,
                              total: totalInfo
                            })
                          );
                        } else {
                          res
                            .status(200)
                            .send(new response(false, 401, "Fetch Failed4"));
                        }
                      } else {
                        res
                          .status(200)
                          .send(new response(false, 401, "Fetch Failed3"));
                      }
                    });
                  } else {
                    res
                      .status(200)
                      .send(new response(false, 401, "Fetch Failed2"));
                  }
                } else {
                  res
                    .status(200)
                    .send(new response(false, 401, "Fetch Failed1"));
                }
              });
            } else {
              res.status(200).send(new response(false, 403, "Unauthorized"));
            }
          }
        } else {
          res.status(200).send(new response(false, 403, "Unauthorized"));
        }
      });
    } else {
      res.status(200).send(new response(false, 400, "Invalid input format"));
    }
  } catch (e) {
    console.log(e);
    res.status(500).send(new response(false, 500, "Something went wrong"));
  }
};

/* exports.getAllInvited = async (req, res) => {
  try{
    console.log(req.body);
    const middleware = {
      user_id      : 'required|text|'+req.body.user_id,
      auth_code    : 'required|text|'+req.body.auth_code,
      page         : 'required|text|'+req.body.page,
      item         : 'no|text|'+req.body.item,
    }
    // console.log(middleware);
    if(utility.validateRequest(middleware)){
      const result = await admin.getAuth(req.body,function(errAuth,resAuth){

        if(!errAuth){
          if(!utility.issetVal(resAuth)){
            res.status(200).send(
              new response(false, 403, 'Unauthorized')
              )}else{
            if(resAuth.auth_code == req.body.auth_code){
              //here goes the function
              user.getCountData({verified: '0'},function(errResCount,rowsResCount) {
                if (!errResCount) {
                 if (utility.issetVal(rowsResCount)) {
                      let itemPerRequest = utility.issetVal(req.body.item)?  parseInt(req.body.item) : 15;
                      let page = req.body.page;
                      let total_data =  rowsResCount;
                      let total_page = Math.ceil(total_data / itemPerRequest);

                      let limitBefore = page <= 1 || page == null ? 0 : (page-1) * itemPerRequest;

                      const PreparedData = {
                          start : limitBefore,
                          limit : itemPerRequest,
                          verified : '0'
                      }

                      user.getAll(PreparedData,function(errRes,rowsRes) {
                        console.log(errRes);
                        if (!errRes) {
                          const totalInfo = {
                            total_page : total_page,
                            total_data_all : total_data,
                            total_data : rowsRes.length
                          }
                          if (rowsRes !='') {
                              res.status(200).send(new response(true, 200, 'Fetch Success', {
                                  data :rowsRes,
                                  total: totalInfo
                              } ))
                          } else {
                              res.status(200).send(
                                  new response(false, 401, 'Fetch Failed4')
                              )
                          }
                        }else {
                          res.status(200).send(
                            new response(false, 401, 'Fetch Failed3')
                          )
                        }
                      })
                  } else {
                      res.status(200).send(
                          new response(false, 401, 'Fetch Failed2')
                      )
                  }
                } else {
                    res.status(200).send(
                        new response(false, 401, 'Fetch Failed1')
                    )
                }
              })
            }else{
              res.status(200).send(
              new response(false, 403, 'Unauthorized')
              )
            }
          }
        }else{
          res.status(200).send(
            new response(false, 403, 'Unauthorized')
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
} */

exports.getAllInvited = async (req, res) => {
  try {
    console.log(req.body);
    const middleware = {
      user_id: "required|text|" + req.body.user_id,
      auth_code: "required|text|" + req.body.auth_code,
      page: "required|text|" + req.body.page,
      item: "no|text|" + req.body.item,
      keyword: "no|text|" + req.body.keyword,
      batch: "no|text|" + req.body.batch,
      create_date: "no|text|" + req.body.create_date,
      interest: "no|text|" + req.body.interest
    };
    // console.log(middleware);
    let IdInterests = null;
    if (utility.issetVal(req.body.interest_list)) {
      IdInterests = JSON.parse(req.body.interest_list).map(
        ({ interest_id }) => interest_id
      );
    }
    const bodyCount = {
      verified: 0,
      list_interest: IdInterests,
      keyword: req.body.keyword || null,
      batch: req.body.batch || null,
      create_date: req.body.create_date || null,
      interest: req.body.interest || null
    };

    if (utility.validateRequest(middleware)) {
      const result = await admin.getAuth(req.body, function(errAuth, resAuth) {
        console.log({ errAuth });
        if (!errAuth) {
          if (!utility.issetVal(resAuth)) {
            res.status(200).send(new response(false, 403, "Unauthorized"));
          } else {
            if (resAuth.auth_code == req.body.auth_code) {
              //here goes the function
              user.getCountData(bodyCount, function(errResCount, rowsResCount) {
                console.log({ errResCount });
                if (!errResCount) {
                  if (utility.issetVal(rowsResCount)) {
                    let itemPerRequest = utility.issetVal(req.body.item)
                      ? parseInt(req.body.item)
                      : 15;
                    let page = req.body.page;
                    let total_data = rowsResCount;
                    console.log({ total_data: total_data });
                    console.log({ itemRequest: itemPerRequest });
                    let total_page = Math.ceil(total_data / itemPerRequest);

                    let limitBefore =
                      page <= 1 || page == null
                        ? 0
                        : (page - 1) * itemPerRequest;

                    const PreparedData = {
                      start: limitBefore,
                      limit: itemPerRequest,
                      verified: 0,
                      keyword: req.body.keyword || null,
                      batch: req.body.batch || null,
                      create_date: req.body.create_date || null,
                      interest: req.body.interest || null,
                      list_interest: IdInterests
                    };

                    // console.log({PreparedData});

                    user.getAll(PreparedData, function(errRes, rowsRes) {
                      console.log({ rowsRes });
                      console.log({ errRes });
                      if (!errRes) {
                        const totalInfo = {
                          total_page: total_page,
                          total_data_all: total_data,
                          total_data: rowsRes.length
                        };
                        if (rowsRes != "") {
                          res.status(200).send(
                            new response(true, 200, "Fetch Success", {
                              data: rowsRes,
                              total: totalInfo
                            })
                          );
                        } else {
                          res
                            .status(200)
                            .send(new response(false, 401, "Fetch Failed4"));
                        }
                      } else {
                        res
                          .status(200)
                          .send(new response(false, 401, "Fetch Failed3"));
                      }
                    });
                  } else {
                    res
                      .status(200)
                      .send(new response(false, 401, "Fetch Failed2"));
                  }
                } else {
                  res
                    .status(200)
                    .send(new response(false, 401, "Fetch Failed1"));
                }
              });
            } else {
              res.status(200).send(new response(false, 403, "Unauthorized"));
            }
          }
        } else {
          res.status(200).send(new response(false, 403, "Unauthorized"));
        }
      });
    } else {
      res.status(200).send(new response(false, 400, "Invalid input format"));
    }
  } catch (e) {
    console.log(e);
    res.status(500).send(new response(false, 500, "Something went wrong"));
  }
};

exports.getAllActive = async (req, res) => {
  console.log({ "req body": req.body });
  try {
    const middleware = {
      user_id: "required|text|" + req.body.user_id,
      auth_code: "required|text|" + req.body.auth_code,
      page: "required|text|" + req.body.page,
      item: "no|text|" + req.body.item,
      keyword: "no|text|" + req.body.keyword,
      batch: "no|text|" + req.body.batch,
      create_date: "no|text|" + req.body.create_date,
      interest: "no|text|" + req.body.interest
    };
    // console.log(middleware);

    let IdInterests = null;
    if (utility.issetVal(req.body.interest)) {
      IdInterests = JSON.parse(req.body.interest).map(
        ({ interest_id }) => interest_id
      );
    }
    console.log({ IdInterests: IdInterests });

    const bodyCount = {
      verified: 2,
      islogged: 1,
      list_interest: IdInterests,
      keyword: req.body.keyword || null,
      batch: req.body.batch || null,
      create_date: req.body.create_date || null,
      interest: IdInterests || null
    };

    if (utility.validateRequest(middleware)) {
      const result = await admin.getAuth(req.body, function(errAuth, resAuth) {
        if (!errAuth) {
          if (!utility.issetVal(resAuth)) {
            res.status(200).send(new response(false, 403, "Unauthorized"));
          } else {
            console.log(resAuth.auth_code);
            if (resAuth.auth_code == req.body.auth_code) {
              //here goes the function
              user.getCountData(bodyCount, function(errResCount, rowsResCount) {
                console.log(errResCount);
                if (!errResCount) {
                  if (utility.issetVal(rowsResCount)) {
                    let itemPerRequest = utility.issetVal(req.body.item)
                      ? parseInt(req.body.item)
                      : 15;
                    let page = req.body.page;
                    let total_data = rowsResCount;
                    let total_page = Math.ceil(total_data / itemPerRequest);

                    let limitBefore =
                      page <= 1 || page == null
                        ? 0
                        : (page - 1) * itemPerRequest;

                    const PreparedData = {
                      start: limitBefore,
                      limit: itemPerRequest,
                      verified: 2,
                      islogged: 1,
                      keyword: req.body.keyword || null,
                      batch: req.body.batch || null,
                      create_date: req.body.create_date || null,
                      interest: IdInterests || null
                      // list_interest: IdInterests,
                    };

                    user.getAll(PreparedData, function(errRes, rowsRes) {
                      console.log(errRes);
                      if (!errRes) {
                        const totalInfo = {
                          total_page: total_page,
                          total_data_all: total_data,
                          total_data: rowsRes.length
                        };
                        if (rowsRes != "") {
                          res.status(200).send(
                            new response(true, 200, "Fetch Success", {
                              data: rowsRes,
                              total: totalInfo
                            })
                          );
                        } else {
                          res
                            .status(200)
                            .send(new response(false, 401, "Fetch Failed4"));
                        }
                      } else {
                        res
                          .status(200)
                          .send(new response(false, 401, "Fetch Failed3"));
                      }
                    });
                  } else {
                    res
                      .status(200)
                      .send(new response(false, 401, "Fetch Failed2"));
                  }
                } else {
                  res
                    .status(200)
                    .send(new response(false, 401, "Fetch Failed1"));
                }
              });
            } else {
              res.status(200).send(new response(false, 403, "Unauthorized"));
            }
          }
        } else {
          res.status(200).send(new response(false, 403, "Unauthorized"));
        }
      });
    } else {
      res.status(200).send(new response(false, 400, "Invalid input format"));
    }
  } catch (e) {
    console.log(e);
    res.status(500).send(new response(false, 500, "Something went wrong"));
  }
};

exports.getAllInActive = async (req, res) => {
  try {
    const middleware = {
      user_id: "required|text|" + req.body.user_id,
      auth_code: "required|text|" + req.body.auth_code,
      page: "required|text|" + req.body.page,
      item: "no|text|" + req.body.item,
      keyword: "no|text|" + req.body.keyword,
      batch: "no|text|" + req.body.batch,
      create_date: "no|text|" + req.body.create_date,
      interest: "no|text|" + req.body.interest,
      interest_list: "no|text|" + req.body.interest_list
    };
    // console.log(middleware);

    let IdInterests = null;
    if (utility.issetVal(req.body.interest_list)) {
      IdInterests = JSON.parse(req.body.interest_list).map(
        ({ interest_id }) => interest_id
      );
    }

    const bodyCount = {
      verified: 2,
      islogged: 0,
      list_interest: IdInterests,
      keyword: req.body.keyword || null,
      batch: req.body.batch || null,
      create_date: req.body.create_date || null,
      interest: req.body.interest || null
    };

    if (utility.validateRequest(middleware)) {
      const result = await admin.getAuth(req.body, function(errAuth, resAuth) {
        if (!errAuth) {
          if (!utility.issetVal(resAuth)) {
            res.status(200).send(new response(false, 403, "Unauthorized"));
          } else {
            console.log(resAuth.auth_code);
            if (resAuth.auth_code == req.body.auth_code) {
              //here goes the function
              user.getCountData(bodyCount, function(errResCount, rowsResCount) {
                console.log({ rowsResCount });
                console.log({ errResCount });
                if (!errResCount) {
                  if (utility.issetVal(rowsResCount)) {
                    let itemPerRequest = utility.issetVal(req.body.item)
                      ? parseInt(req.body.item)
                      : 15;
                    let page = req.body.page;
                    let total_data = rowsResCount;
                    let total_page = Math.ceil(total_data / itemPerRequest);

                    let limitBefore =
                      page <= 1 || page == null
                        ? 0
                        : (page - 1) * itemPerRequest;

                    const PreparedData = {
                      start: limitBefore,
                      limit: itemPerRequest,
                      verified: 2,
                      islogged: 0,
                      keyword: req.body.keyword || null,
                      batch: req.body.batch || null,
                      create_date: req.body.create_date || null,
                      interest: req.body.interest || null,
                      list_interest: IdInterests
                    };

                    user.getAll(PreparedData, function(errRes, rowsRes) {
                      console.log({ errRes });
                      // console.log({rowsRes});
                      if (!errRes) {
                        const totalInfo = {
                          total_page: total_page,
                          total_data_all: total_data,
                          total_data: rowsRes.length
                        };
                        if (rowsRes != "") {
                          res.status(200).send(
                            new response(true, 200, "Fetch Success", {
                              data: rowsRes,
                              total: totalInfo
                            })
                          );
                        } else {
                          res
                            .status(200)
                            .send(new response(false, 401, "Fetch Failed4"));
                        }
                      } else {
                        res
                          .status(200)
                          .send(new response(false, 401, "Fetch Failed3"));
                      }
                    });
                  } else {
                    res
                      .status(200)
                      .send(new response(false, 401, "Fetch Failed2"));
                  }
                } else {
                  res
                    .status(200)
                    .send(new response(false, 401, "Fetch Failed1"));
                }
              });
            } else {
              res.status(200).send(new response(false, 403, "Unauthorized"));
            }
          }
        } else {
          res.status(200).send(new response(false, 403, "Unauthorized"));
        }
      });
    } else {
      res.status(200).send(new response(false, 400, "Invalid input format"));
    }
  } catch (e) {
    console.log(e);
    res.status(500).send(new response(false, 500, "Something went wrong"));
  }
};

exports.delete = async (req, res) => {
  try {
    const middleware = {
      user_id: "required|text|" + req.query.user_id,
      auth_code: "required|text|" + req.query.auth_code,
      id: "required|text|" + req.query.id
    };
    if (utility.validateRequest(middleware)) {
      const result = await admin.getAuth(req.query, function(errAuth, resAuth) {
        if (!errAuth) {
          if (!utility.issetVal(resAuth)) {
            res.status(200).send(new response(false, 403, "Unauthorized"));
          } else {
            if (resAuth.auth_code == req.query.auth_code) {
              //here goes the function
              const body = {
                user_id: req.query.user_id,
                auth_code: req.query.auth_code,
                id: req.query.id
              };
              user.getById(body, function(errGet, resGet) {
                console.log(errGet);

                if (!errGet) {
                  if (!utility.issetVal(resGet)) {
                    res
                      .status(200)
                      .send(new response(false, 405, "User not registered1"));
                  } else {
                    user.deleteData(body, function(err, resData) {
                      // caches
                      if (!err) {
                        if (utility.issetVal(resGet.img)) {
                          let pathUrl = appDir + "/uploads/user/" + resGet.img;
                          utility.cleanImage(resGet.img, pathDir);
                        }

                        res
                          .status(200)
                          .send(new response(true, 200, "Delete success"));
                      } else {
                        res
                          .status(200)
                          .send(new response(false, 401, "Delete failed"));
                      }
                    });
                  }
                } else {
                  res
                    .status(200)
                    .send(new response(false, 404, "Data not exist"));
                }
              });
            } else {
              res.status(200).send(new response(false, 403, "Unauthorized2"));
            }
          }
        } else {
          res.status(200).send(new response(false, 403, "Unauthorized1"));
        }
      });
    } else {
      res
        .status(200)
        .send(new response(false, 400, "Invalid input format", middleware));
    }
  } catch (e) {
    console.log(e);
    res.status(500).send(new response(false, 500, "Something went wrong"));
  }
};

exports.search = async (req, res) => {
  try {
    const middleware = {
      user_id: "required|text|" + req.body.user_id,
      auth_code: "required|text|" + req.body.auth_code,
      keyword: "required|text|" + req.body.keyword
    };
    if (utility.validateRequest(middleware)) {
      const result = await admin.getAuth(req.body, function(errAuth, resAuth) {
        console.log(errAuth);
        if (!errAuth) {
          if (!utility.issetVal(resAuth)) {
            res.status(200).send(new response(false, 403, "Unauthorized"));
          } else {
            if (resAuth.auth_code == req.body.auth_code) {
              //here goes the function
              const body = {
                user_id: req.body.user_id,
                auth_code: req.body.auth_code,
                keyword: req.body.keyword
              };
              user.getSearch(body, function(errData, resData) {
                console.log(errData);
                if (!errData) {
                  if (!utility.issetVal(resData)) {
                    res
                      .status(200)
                      .send(new response(false, 404, "Data Not Exist!2"));
                  } else {
                    res
                      .status(200)
                      .send(new response(true, 200, "Fetch success", resData));
                  }
                } else {
                  res
                    .status(200)
                    .send(new response(false, 404, "Data not exist!1"));
                }
              });
            } else {
              res.status(200).send(new response(false, 403, "Unauthorized2"));
            }
          }
        } else {
          res.status(200).send(new response(false, 403, "Unauthorized1"));
        }
      });
    } else {
      res.status(200).send(new response(false, 400, "Invalid input format"));
    }
  } catch (e) {
    console.log(e);
    res.status(500).send(new response(false, 500, "Something went wrong"));
  }
};

exports.update = async (req, res) => {
  console.log("EDIT INVITED ALUMNI");
  try {
    let formData = new Array();
    new formidable.IncomingForm()
      .parse(req)
      .on("field", (name, field) => {
        formData.push(
          '"' + name + '"' + ":" + '"' + utility.escapeHtml(field) + '"'
        );
      })
      .on("file", (name, file) => {
        formData.push('"' + name + '"' + ":" + '"' + file.name + '"');
      })
      .on("fileBegin", function(name, file) {
        if (utility.checkImageExtension(file.name)) {
          let fileType = file.type.split("/").pop();
          file.name = utility.generateHash(16) + "." + fileType;
          file.path = pathDir + file.name;
        }
      })
      .on("aborted", () => {
        console.error("Request aborted by the user");
      })
      .on("error", err => {
        console.error("Error", err);
        throw err;
      })
      .on("end", () => {
        let temp = "{" + formData.toString() + "}";
        let formJSON = JSON.parse(temp);

        console.log({ formJSON });

        const middleware = {
          user_id: "required|text|" + formJSON.user_id,
          auth_code: "required|text|" + formJSON.auth_code,
          id: "required|text|" + formJSON.id,
          type: "required|text|" + formJSON.type,
          name: "required|text|" + formJSON.name,
          email: "required|text|" + formJSON.email,
          gender: "required|text|" + formJSON.gender,
          company: "no|text|" + formJSON.company,
          position: "no|text|" + formJSON.position,
          phone: "no|text|" + formJSON.phone,
          dob: "no|text|" + formJSON.dob,
          lineservice_id: "no|text|" + formJSON.lineservice_id,
          img: "no|images|" + formJSON.img,
          publish: "required|number|" + formJSON.publish,
          batch: "no|number|" + formJSON.batch
        };
        if (utility.validateRequest(middleware)) {
          const result = admin.getAuth(formJSON, function(errAuth, resAuth) {
            console.log({ errAuth });
            console.log({ resAuth });
            if (!errAuth) {
              if (!utility.issetVal(resAuth)) {
                utility.cleanImage(formJSON.img, pathDir);
                res.status(200).send(new response(false, 403, "Unauthorized"));
              } else {
                //here goes the function

                let alumni;
                let type;
                if (formJSON.type == "external") {
                  type = "public";
                  alumni = "no";
                } else if (formJSON.type == "internal") {
                  type = "pwc";
                  alumni = "no";
                } else {
                  type = "pwc";
                  alumni = "yes";
                }
                const body = {
                  id: formJSON.id,
                  type: type,
                  alumni: alumni,
                  name: formJSON.name,
                  email: formJSON.email,
                  gender: formJSON.gender,
                  company: formJSON.company,
                  position: formJSON.position,
                  phone: formJSON.phone,
                  dob: formJSON.dob,
                  lineservice_id: formJSON.lineservice_id,
                  img: formJSON.img,
                  publish: formJSON.publish,
                  batch: formJSON.batch
                };

                console.log({ body });
                user.checkEmail(formJSON, function(error, resData1) {
                  console.log({ error });
                  // console.log({resData1});
                  if (!error) {
                    if (utility.issetVal(resData1)) {
                      if (resData1.id != formJSON.id) {
                        res
                          .status(200)
                          .send(
                            new response(false, 402, "Email already registered")
                          );
                      } else {
                        user.getById(body, function(errUser, resUser) {
                          console.log({ resUser });
                          if (!errUser) {
                            if (utility.issetVal(resUser)) {
                              if (body.img != null || body.img != undefined) {
                                if (utility.issetVal(resUser.img)) {
                                  utility.cleanImage(resUser.img, pathDir);
                                }
                              } else {
                                delete body["img"];
                              }
                              user.updateData(body, function(err, resData) {
                                console.log({ err });
                                if (!err) {
                                  if (!utility.issetVal(resData)) {
                                    utility.cleanImage(formJSON.img, pathDir);
                                    res
                                      .status(200)
                                      .send(
                                        new response(
                                          false,
                                          401,
                                          "Update failed1"
                                        )
                                      );
                                  } else {
                                    const newData = user.getById(body, function(
                                      errUser,
                                      resUser
                                    ) {
                                      if (!utility.issetVal(resUser.img)) {
                                        resUser.img = null;
                                      }
                                      resUser.user_id = resUser.id;
                                      user.triggerUpdateUserMongo(
                                        resUser,
                                        function(errTrigger, trigger) {
                                          console.log("TriggerErr", errTrigger);
                                          console.log("trigger", trigger);
                                        }
                                      );
                                    });
                                    res
                                      .status(200)
                                      .send(
                                        new response(
                                          true,
                                          200,
                                          "Update success",
                                          resData
                                        )
                                      );
                                  }
                                } else {
                                  utility.cleanImage(formJSON.img, pathDir);
                                  res
                                    .status(200)
                                    .send(
                                      new response(false, 401, "Update failed2")
                                    );
                                }
                              });
                            } else {
                              console.log(errUser);
                              utility.cleanImage(formJSON.img, pathDir);
                              res
                                .status(200)
                                .send(
                                  new response(false, 404, "Data not exist2")
                                );
                            }
                          } else {
                            console.log(errUser);
                            utility.cleanImage(formJSON.img, pathDir);
                            res
                              .status(200)
                              .send(
                                new response(false, 404, "Data not exist1")
                              );
                          }
                        });
                      }
                    } else {
                      user.getById(body, function(errUser, resUser) {
                        if (!errUser) {
                          if (utility.issetVal(resUser)) {
                            if (body.img != null || body.img != undefined) {
                              if (utility.issetVal(resUser.img)) {
                                utility.cleanImage(resUser.img, pathDir);
                              }
                            } else {
                              delete body["img"];
                            }
                            user.updateData(body, function(err, resData) {
                              console.log({ err });
                              if (!err) {
                                if (!utility.issetVal(resData)) {
                                  utility.cleanImage(formJSON.img, pathDir);
                                  res
                                    .status(200)
                                    .send(
                                      new response(false, 401, "Update failed1")
                                    );
                                } else {
                                  res
                                    .status(200)
                                    .send(
                                      new response(
                                        true,
                                        200,
                                        "Update success",
                                        resData
                                      )
                                    );
                                }
                              } else {
                                utility.cleanImage(formJSON.img, pathDir);
                                res
                                  .status(200)
                                  .send(
                                    new response(false, 401, "Update failed2")
                                  );
                              }
                            });
                          } else {
                            console.log(errUser);
                            utility.cleanImage(formJSON.img, pathDir);
                            res
                              .status(200)
                              .send(
                                new response(false, 404, "Data not exist2")
                              );
                          }
                        } else {
                          console.log(errUser);
                          utility.cleanImage(formJSON.img, pathDir);
                          res
                            .status(200)
                            .send(new response(false, 404, "Data not exist1"));
                        }
                      });
                    }
                  } else {
                    res
                      .status(200)
                      .send(new response(false, 401, "Update Failed"));
                  }
                });
              }
            } else {
              utility.cleanImage(formJSON.img, pathDir);
              res.status(200).send(new response(false, 403, "Unauthorized"));
            }
          });
        } else {
          utility.cleanImage(formJSON.img, pathDir);
          res
            .status(200)
            .send(new response(false, 400, "Invalid input format"));
        }
      });
  } catch (e) {
    console.log(e);
    res.status(500).send(new response(false, 500, "Something went wrong"));
  }
};

exports.delImg = async (req, res) => {
  try {
    const middleware = {
      user_id: "required|text|" + req.body.user_id,
      auth_code: "required|text|" + req.body.auth_code,
      id: "required|text|" + req.body.id
    };
    if (utility.validateRequest(middleware)) {
      const result = admin.getAuth(req.body, function(errAuth, resAuth) {
        if (utility.issetVal(resAuth)) {
          if (resAuth.auth_code == req.body.auth_code) {
            user.getById({ id: req.body.id }, (errUser, resUser) => {
              if (utility.issetVal(resUser)) {
                if (utility.issetVal(resUser.img)) {
                  let bodyUpdate = {
                    id: req.body.id,
                    img: ""
                  };
                  user.updateData(bodyUpdate, (errUpdate, resUpdate) => {
                    if (!errUpdate) {
                      utility.cleanImage(resUser.img, pathDir);
                      res
                        .status(200)
                        .send(new response(true, 200, "Delete Image Success"));
                    } else {
                      res
                        .status(200)
                        .send(new response(false, 401, "Delete Image Failed"));
                    }
                  });
                } else {
                  res
                    .status(200)
                    .send(new response(false, 401, "Delete Image Failed"));
                }
              } else {
                res
                  .status(200)
                  .send(new response(false, 405, "Data Not Exist"));
              }
            });
          } else {
            res.status(200).send(new response(false, 403, "Unauthorized"));
          }
        } else {
          res.status(200).send(new response(false, 403, "Unauthorized"));
        }
      });
    } else {
      res.status(200).send(new response(false, 400, "Invalid input format"));
    }
  } catch (error) {
    console.log(error);
    res.status(500).send(new response(false, 500, "Something went wrong"));
  }
};

exports.listRecommendation = async (req, res) => {
  try {
    const middleware = {
      user_id: "required|text|" + req.body.user_id,
      auth_code: "required|text|" + req.body.auth_code,
      page: "required|text|" + req.body.page,
      item: "no|text|" + req.body.item,
      month: "no|number|" + req.body.month,
      year: "no|number|" + req.body.year,
      keyword: "no|text|" + req.body.keyword,
      batch: "no|number|" + req.body.batch,
      sort: "no|number|" + req.body.sort
    };
    // console.log(middleware);
    if (utility.validateRequest(middleware)) {
      const result = await admin.getAuth(req.body, function(errAuth, resAuth) {
        if (!errAuth) {
          if (!utility.issetVal(resAuth)) {
            res.status(200).send(new response(false, 403, "Unauthorized"));
          } else {
            if (resAuth.auth_code == req.body.auth_code) {
              //here goes the function
              const body = {
                keyword: req.body.keyword,
                batch: req.body.batch,
                create_date: req.body.create_date,
                month: req.body.month,
                year: req.body.year,
                sort: req.body.sort
              };
              utility.issetVal(req.body.month)
                ? (body.month = req.body.month)
                : (body.month = null);
              utility.issetVal(req.body.year)
                ? (body.year = req.body.year)
                : (body.year = null);
              console.log(body);
              AlumniRecommend.getCountData(body, function(
                errResCount,
                rowsResCount
              ) {
                console.log({ errResCount });
                // console.log(rowsResCount);
                if (!errResCount) {
                  if (utility.issetVal(rowsResCount)) {
                    let itemPerRequest = utility.issetVal(req.body.item)
                      ? parseInt(req.body.item)
                      : 15;
                    let page = req.body.page;
                    let total_data = rowsResCount;
                    let total_page = Math.ceil(total_data / itemPerRequest);

                    let limitBefore =
                      page <= 1 || page == null
                        ? 0
                        : (page - 1) * itemPerRequest;

                    const PreparedData = {
                      start: limitBefore,
                      limit: itemPerRequest,
                      keyword: req.body.keyword,
                      batch: req.body.batch,
                      create_date: req.body.create_date,
                      month: req.body.month,
                      year: req.body.year,
                      sort: req.body.sort
                    };

                    utility.issetVal(req.body.month)
                      ? (PreparedData.month = req.body.month)
                      : (PreparedData.month = null);
                    utility.issetVal(req.body.year)
                      ? (PreparedData.year = req.body.year)
                      : (PreparedData.year = null);
                    // console.log(PreparedData);
                    AlumniRecommend.getAll(PreparedData, function(
                      errRes,
                      rowsRes
                    ) {
                      // console.log({rowsRes});
                      console.log({ errRes });
                      if (!errRes) {
                        const totalInfo = {
                          total_page: total_page,
                          total_data_all: total_data,
                          total_data: rowsRes.length
                        };
                        if (rowsRes != "") {
                          res.status(200).send(
                            new response(true, 200, "Fetch Success", {
                              data: rowsRes,
                              total: totalInfo
                            })
                          );
                        } else {
                          res
                            .status(200)
                            .send(new response(false, 401, "Fetch Failed4"));
                        }
                      } else {
                        res
                          .status(200)
                          .send(new response(false, 401, "Fetch Failed3"));
                      }
                    });
                  } else {
                    res
                      .status(200)
                      .send(new response(false, 401, "Fetch Failed2"));
                  }
                } else {
                  res
                    .status(200)
                    .send(new response(false, 401, "Fetch Failed1"));
                }
              });
            } else {
              res.status(200).send(new response(false, 403, "Unauthorized"));
            }
          }
        } else {
          res.status(200).send(new response(false, 403, "Unauthorized"));
        }
      });
    } else {
      res.status(200).send(new response(false, 400, "Invalid input format"));
    }
  } catch (e) {
    console.log(e);
    res.status(500).send(new response(false, 500, "Something went wrong"));
  }
};

exports.insertHighlight = async (req, res) => {
  try {
    const middleware = {
      user_id: "required|text|" + req.body.user_id,
      auth_code: "required|text|" + req.body.auth_code,
      recommendation: "required|text|" + req.body.recommendation_id,
      month: "required|text|" + req.body.month,
      year: "required|text|" + req.body.year,
      achievement: "no|text|" + req.body.achievement
    };
    if (utility.validateRequest(middleware)) {
      const result = await admin.getAuth(req.body, function(errAuth, resAuth) {
        if (!errAuth) {
          if (resAuth == null || undefined) {
            res.status(200).send(new response(false, 403, "Unauthorized"));
          } else {
            if (resAuth.auth_code == req.body.auth_code) {
              //here goes the function
              let id = utility.generateHash(32);
              const body = {
                id: id,
                user_id: req.body.recommendation_id,
                month: req.body.month,
                year: req.body.year,
                achievement: req.body.achievement,
                create_date: moment(Date.now()).format("YYYY-MM-DD HH:mm:ss")
              };
              alumniHighlight.getHighlight(body, function(err, resData) {
                if (!err) {
                  if (!utility.issetVal(resData)) {
                    alumniHighlight.addData(body, function(err, resData) {
                      if (!err) {
                        res
                          .status(200)
                          .send(
                            new response(true, 200, "Register success", resData)
                          );
                      } else {
                        res
                          .status(200)
                          .send(new response(false, 400, "Register failed"));
                      }
                    });
                  } else {
                    res
                      .status(200)
                      .send(new response(false, 402, "Already Highlight"));
                  }
                } else {
                  res
                    .status(200)
                    .send(new response(false, 400, "Register failed"));
                }
              });
            } else {
              res.status(200).send(new response(false, 403, "Unauthorized"));
            }
          }
        } else {
          res.status(200).send(new response(false, 403, "Unauthorized"));
        }
      });
    } else {
      res.status(200).send(new response(false, 400, "Invalid input format"));
    }
  } catch (e) {
    console.log(e);
    res.status(500).send(new response(false, 500, "Something went wrong"));
  }
};

exports.updateHighlight = async (req, res) => {
  try {
    const middleware = {
      user_id: "required|text|" + req.body.user_id,
      auth_code: "required|text|" + req.body.auth_code,
      recommendation: "required|text|" + req.body.recommendation_id,
      month: "required|text|" + req.body.month,
      year: "required|text|" + req.body.year,
      achievement: "no|text|" + req.body.achievement,
      id: "required|text|" + req.body.id
    };
    if (utility.validateRequest(middleware)) {
      const result = await admin.getAuth(req.body, function(errAuth, resAuth) {
        if (!errAuth) {
          if (resAuth == null || undefined) {
            res.status(200).send(new response(false, 403, "Unauthorized"));
          } else {
            if (resAuth.auth_code == req.body.auth_code) {
              //here goes the function
              const body = {
                id: req.body.id,
                user_id: req.body.recommendation_id,
                month: req.body.month,
                year: req.body.year,
                achievement: req.body.achievement,
                create_date: moment(Date.now()).format("YYYY-MM-DD HH:mm:ss")
              };
              alumniHighlight.getHighlight(body, function(err, resData) {
                if (!err) {
                  if (!utility.issetVal(resData)) {
                    alumniHighlight.updateData(body, function(err, resData) {
                      if (!err) {
                        res
                          .status(200)
                          .send(
                            new response(true, 200, "Update success", resData)
                          );
                      } else {
                        res
                          .status(200)
                          .send(new response(false, 401, "Update failed"));
                      }
                    });
                  } else {
                    // if(resData.user_id == body.user_id){
                    //   res.status(200).send(
                    //     new response(false, 405, 'No Data Effected')
                    //   )
                    // } else {
                    alumniHighlight.updateData(body, function(err, resData) {
                      if (!err) {
                        res
                          .status(200)
                          .send(
                            new response(true, 200, "Update success", resData)
                          );
                      } else {
                        res
                          .status(200)
                          .send(new response(false, 401, "Update failed"));
                      }
                    });
                    // }
                  }
                } else {
                  res
                    .status(200)
                    .send(new response(false, 401, "Update failed"));
                }
              });
            } else {
              res.status(200).send(new response(false, 403, "Unauthorized"));
            }
          }
        } else {
          res.status(200).send(new response(false, 403, "Unauthorized"));
        }
      });
    } else {
      res.status(200).send(new response(false, 400, "Invalid input format"));
    }
  } catch (e) {
    console.log(e);
    res.status(500).send(new response(false, 500, "Something went wrong"));
  }
};

exports.listHighlight = async (req, res) => {
  try {
    const middleware = {
      user_id: "required|text|" + req.body.user_id,
      auth_code: "required|text|" + req.body.auth_code,
      page: "required|text|" + req.body.page,
      item: "no|text|" + req.body.item,
      keyword: "no|text|" + req.body.keyword,
      batch: "no|text|" + req.body.batch,
      create_date: "no|text|" + req.body.create_date,
      month: "no|text|" + req.body.month,
      year: "no|text|" + req.body.year
    };
    // console.log(middleware);
    if (utility.validateRequest(middleware)) {
      const result = await admin.getAuth(req.body, function(errAuth, resAuth) {
        console.log({ errAuth });
        if (!errAuth) {
          if (!utility.issetVal(resAuth)) {
            res.status(200).send(new response(false, 403, "Unauthorized"));
          } else {
            if (resAuth.auth_code == req.body.auth_code) {
              //here goes the function

              let bodyCount = {
                keyword: req.body.keyword,
                batch: req.body.batch,
                create_date: req.body.create_date,
                month: req.body.month,
                year: req.body.year
              };

              alumniHighlight.getCountData(bodyCount, function(
                errResCount,
                rowsResCount
              ) {
                console.log({ rowsResCount });
                console.log(errResCount);
                if (!utility.issetVal(errResCount)) {
                  if (utility.issetVal(rowsResCount)) {
                    let itemPerRequest = utility.issetVal(req.body.item)
                      ? parseInt(req.body.item)
                      : 15;
                    let page = req.body.page;
                    let total_data = rowsResCount;
                    let total_page = Math.ceil(total_data / itemPerRequest);

                    let limitBefore =
                      page <= 1 || page == null
                        ? 0
                        : (page - 1) * itemPerRequest;

                    const PreparedData = {
                      start: limitBefore,
                      limit: itemPerRequest,
                      keyword: req.body.keyword,
                      batch: req.body.batch,
                      create_date: req.body.create_date,
                      month: req.body.month,
                      year: req.body.year
                    };

                    alumniHighlight.getAll(PreparedData, function(
                      errRes,
                      rowsRes
                    ) {
                      console.log({ errRes });
                      // console.log({rowsRes});
                      if (!errRes) {
                        const totalInfo = {
                          total_page: total_page,
                          total_data_all: total_data,
                          total_data: rowsRes.length
                        };
                        if (utility.issetVal(rowsRes)) {
                          res.status(200).send(
                            new response(true, 200, "Fetch Success", {
                              data: rowsRes,
                              total: totalInfo
                            })
                          );
                        } else {
                          res
                            .status(200)
                            .send(new response(false, 401, "Fetch Failed5"));
                        }
                      } else {
                        res
                          .status(200)
                          .send(new response(false, 401, "Fetch Failed3"));
                      }
                    });
                  } else {
                    res
                      .status(200)
                      .send(new response(false, 401, "Fetch Failed2"));
                  }
                } else {
                  res
                    .status(200)
                    .send(new response(false, 401, "Fetch Failed1"));
                }
              });
            } else {
              res.status(200).send(new response(false, 403, "Unauthorized"));
            }
          }
        } else {
          res.status(200).send(new response(false, 403, "Unauthorized"));
        }
      });
    } else {
      res.status(200).send(new response(false, 400, "Invalid input format"));
    }
  } catch (e) {
    console.log(e);
    res.status(500).send(new response(false, 500, "Something went wrong"));
  }
};

exports.changeStatus = async (req, res) => {
  try {
    const middleware = {
      user_id: "required|text|" + req.body.user_id,
      auth_code: "required|text|" + req.body.auth_code,
      id: "required|text|" + req.body.id,
      action: "required|text|" + req.body.action,
      type: "no|number|" + req.body.type
    };
    if (utility.validateRequest(middleware)) {
      const result = await admin.getAuth(req.body, function(errAuth, resAuth) {
        if (!errAuth) {
          if (!utility.issetVal(resAuth)) {
            res.status(200).send(new response(false, 403, "Unauthorized"));
          } else {
            //here goes the function
            const body = {
              id: req.body.id
            };
            let retrn;
            if (req.body.action == "verified") {
              body.verified = "2";
              retrn = true;
            } else if (req.body.action == "rejected") {
              body.verified = "3";
              retrn = true;
            } else {
              retrn = false;
            }
            if (retrn == true) {
              user.getById(body, function(errGet, resGet) {
                // console.log({errGet : errGet});
                console.log({ "getById resGet": resGet });
                if (!errGet) {
                  if (!utility.issetVal(resGet)) {
                    res
                      .status(200)
                      .send(new response(false, 404, "Data Not Exist"));
                  } else {
                    if (body.verified == "2") {
                      user.updateData(body, function(err, resData) {
                        console.log({ "error UpdateData": err });
                        console.log({ "resData UpdateData": resData });
                        if (!err) {
                          /* const newData = user.getById(body, function(errUser, resUser) {
                            if(!utility.issetVal(resUser.img)) {
                              resUser.img = null;
                            }
                            resUser.user_id = resUser.id;
                            user.triggerUpdateUserMongo(resUser, function(errTrigger, trigger) {
                              console.log('TriggerErr', errTrigger);
                              console.log('trigger', trigger);
                            })
                          }) */
                          let bodyMail = {
                            email: resGet.email,
                            name: resGet.name
                          };
                          user.emailVerify(bodyMail, (errMail, resMail) => {
                            if (!errMail) {
                              res
                                .status(200)
                                .send(
                                  new response(
                                    true,
                                    200,
                                    "Change Status success"
                                  )
                                );
                            } else {
                              res
                                .status(200)
                                .send(
                                  new response(
                                    false,
                                    401,
                                    "Change Status failed"
                                  )
                                );
                            }
                          });
                        } else {
                          res
                            .status(200)
                            .send(
                              new response(false, 401, "Change Status failed")
                            );
                        }
                      });
                    } else {
                      let { type, email } = resGet;
                      console.log(type, email);
                      if (req.body.type == "2") {
                        utility.readJson(dataPathExternal, "utf8", function(
                          errJson,
                          resJson
                        ) {
                          // console.log({errJson : errJson});
                          // console.log({resJson : resJson});
                          if (utility.issetVal(resJson)) {
                            let mailBody = {
                              receiver: email,
                              subject: resJson.subject,
                              body: resJson.content
                            };
                            console.log(mailBody);
                            nodemailer.mailSend(mailBody, function(
                              errMail,
                              resMail
                            ) {
                              // console.log({errMail : errMail});
                              // console.log({resMail : resMail});
                              if (utility.issetVal(resMail)) {
                                user.updateData(body, function(err, resData) {
                                  console.log({ "error UpdateData": err });
                                  console.log({
                                    "resData UpdateData": resData
                                  });
                                  if (!err) {
                                    res
                                      .status(200)
                                      .send(
                                        new response(
                                          true,
                                          200,
                                          "Change Status success"
                                        )
                                      );
                                  } else {
                                    res
                                      .status(200)
                                      .send(
                                        new response(
                                          false,
                                          401,
                                          "Change Status failed"
                                        )
                                      );
                                  }
                                });
                              } else {
                                res
                                  .status(200)
                                  .send(
                                    new response(
                                      false,
                                      401,
                                      "Change Status failed"
                                    )
                                  );
                              }
                            });
                          } else {
                            res
                              .status(200)
                              .send(
                                new response(false, 401, "Change Status failed")
                              );
                          }
                        });
                      } else {
                        utility.readJson(dataPathUser, "utf8", function(
                          errJson,
                          resJson
                        ) {
                          // console.log({errJson : errJson});
                          // console.log({resJson : resJson});
                          if (utility.issetVal(resJson)) {
                            let mailBody = {
                              receiver: email,
                              subject: resJson.subject,
                              body: resJson.content
                            };
                            console.log(mailBody);
                            nodemailer.mailSend(mailBody, function(
                              errMail,
                              resMail
                            ) {
                              // console.log({errMail : errMail});
                              // console.log({resMail : resMail});
                              if (utility.issetVal(resMail)) {
                                user.updateData(body, function(err, resData) {
                                  console.log({ "error UpdateData": err });
                                  console.log({
                                    "resData UpdateData": resData
                                  });
                                  if (!err) {
                                    res
                                      .status(200)
                                      .send(
                                        new response(
                                          true,
                                          200,
                                          "Change Status success"
                                        )
                                      );
                                  } else {
                                    res
                                      .status(200)
                                      .send(
                                        new response(
                                          false,
                                          401,
                                          "Change Status failed"
                                        )
                                      );
                                  }
                                });
                              } else {
                                res
                                  .status(200)
                                  .send(
                                    new response(
                                      false,
                                      401,
                                      "Change Status failed"
                                    )
                                  );
                              }
                            });
                          } else {
                            res
                              .status(200)
                              .send(
                                new response(false, 401, "Change Status failed")
                              );
                          }
                        });
                      }
                    }
                  }
                } else {
                  res
                    .status(200)
                    .send(new response(false, 404, "Data not exist"));
                }
              });
            } else {
              res
                .status(200)
                .send(new response(false, 405, "Field Action Not Registered"));
            }
          }
        } else {
          res.status(200).send(new response(false, 403, "Unauthorized1"));
        }
      });
    } else {
      res.status(200).send(new response(false, 400, "Invalid input format"));
    }
  } catch (e) {
    res.status(500).send(new response(false, 500, "Something went wrong"));
  }
};

exports.changePublish = async (req, res) => {
  try {
    const middleware = {
      user_id: "required|text|" + req.body.user_id,
      auth_code: "required|text|" + req.body.auth_code,
      id: "required|text|" + req.body.id,
      action: "required|text|" + req.body.action
    };
    if (utility.validateRequest(middleware)) {
      const result = await admin.getAuth(req.body, function(errAuth, resAuth) {
        if (!errAuth) {
          if (!utility.issetVal(resAuth)) {
            res.status(200).send(new response(false, 403, "Unauthorized"));
          } else {
            //here goes the function
            const body = {
              id: req.body.id
            };
            let retrn;
            if (req.body.action == "active") {
              body.publish = "1";
              retrn = true;
            } else if (req.body.action == "inactive") {
              body.publish = "0";
              retrn = true;
            } else {
              retrn = false;
            }
            if (retrn == true) {
              user.getById(body, function(errGet, resGet) {
                if (!errGet) {
                  if (!utility.issetVal(resGet)) {
                    res
                      .status(200)
                      .send(new response(false, 404, "Data Not Exist"));
                  } else {
                    user.updateData(body, function(err, resData) {
                      if (!err) {
                        res
                          .status(200)
                          .send(
                            new response(true, 200, "Change Status success")
                          );
                      } else {
                        res
                          .status(200)
                          .send(
                            new response(false, 401, "Change Status failed")
                          );
                      }
                    });
                  }
                } else {
                  res
                    .status(200)
                    .send(new response(false, 404, "Data not exist"));
                }
              });
            } else {
              res
                .status(200)
                .send(new response(false, 405, "Field Action Not Registered"));
            }
          }
        } else {
          res.status(200).send(new response(false, 403, "Unauthorized1"));
        }
      });
    } else {
      res.status(200).send(new response(false, 400, "Invalid input format"));
    }
  } catch (e) {
    res.status(500).send(new response(false, 500, "Something went wrong"));
  }
};

exports.importExcel = async (req, res) => {
  try {
    let formData = new Array();
    new formidable.IncomingForm()
      .parse(req)
      .on("field", (name, field) => {
        formData.push(
          '"' + name + '"' + ":" + '"' + utility.escapeHtml(field) + '"'
        );
      })
      .on("file", (name, file) => {
        formData.push('"' + name + '"' + ":" + '"' + file.name + '"');
      })
      .on("fileBegin", function(name, file) {
        if (utility.checkExcelExtension(file.name)) {
          file.name =
            "import-user-" +
            moment(Date.now()).format("DD-MM-YYYY") +
            "." +
            utility.detectMimeType(file.type);
          file.path = appDir + "/uploads/excel/user/" + file.name;
          // console.log(file)
        }
      })
      .on("aborted", () => {
        console.error("Request aborted by the user");
      })
      .on("error", err => {
        console.error("Error", err);
        throw err;
      })
      .on("end", () => {
        let temp = "{" + formData.toString() + "}";
        let formJSON = JSON.parse(temp);

        const middleware = {
          user_id: "required|text|" + formJSON.user_id,
          auth_code: "required|text|" + formJSON.auth_code,
          files: "required|excel|" + formJSON.files
        };
        console.log({ middleware: middleware });
        if (utility.validateRequest(middleware)) {
          const result = admin.getAuth(formJSON, function(errAuth, resAuth) {
            if (!errAuth) {
              if (!utility.issetVal(resAuth)) {
                res.status(200).send(new response(false, 403, "Unauthorized"));
              } else {
                if (resAuth.auth_code == formJSON.auth_code) {
                  let wb = new Excel.Workbook();
                  let path = require("path");

                  console.log(fileDir);
                  let filePath = path.resolve(fileDir, formJSON.files);

                  wb.xlsx.readFile(filePath).then(function() {
                    // console.log(Sheet1);
                    let sh = wb.getWorksheet("Sheet1");

                    // sh.getRow(1).getCell(2).value = 32;
                    wb.xlsx.writeFile("sample2.xlsx");
                    /* console.log({name : sh.getRow(1).getCell(1).value});
                    console.log({email : sh.getRow(1).getCell(2).value});
                    console.log({phone : sh.getRow(1).getCell(3).value});
                    console.log({type : sh.getRow(1).getCell(4).value});
                    console.log({dob : sh.getRow(1).getCell(5).value});
                    console.log({gender : sh.getRow(1).getCell(6).value});
                    console.log({shCount :  sh.rowCount}); */
                    let success = 0;
                    let failed = 0;
                    //Get all the rows data [1st and 2nd column]
                    for (i = 2; i <= sh.rowCount; i++) {
                      let type;
                      switch (sh.getRow(i).getCell(4).value) {
                        case "Internal":
                          type = "pwc";
                          break;
                        case "Alumni":
                          type = "pwc";
                          break;
                        default:
                          type = "public";
                          break;
                      }
                      let body = {
                        id: utility.generateHash(32),
                        name: sh.getRow(i).getCell(1).value,
                        email: sh.getRow(i).getCell(2).value
                          ? sh.getRow(i).getCell(2).value.text
                          : null,
                        phone: sh.getRow(i).getCell(3).value,
                        company: "",
                        position: "",
                        alumni: "no",
                        dob: sh.getRow(i).getCell(5).value,
                        gender: sh.getRow(i).getCell(6).value,
                        source: "excel",
                        islogged: 0,
                        bio: "",
                        lineservice_id: "",
                        achievement: "",
                        join_date: "",
                        resign_date: "",
                        password: "",
                        salt_hash: utility.generateHash(5),
                        reset_code: "",
                        auth_code: utility.generateHash(32),
                        img: "",
                        eula: 0,
                        verified: 0,
                        publish: 1,
                        type: type,
                        create_date: moment(Date.now()).format(
                          "YYYY-MM-DD HH:mm:ss"
                        )
                      };
                      // console.log({body : body});
                      user.checkEmail(body, function(error, resData1) {
                        console.log({ error: error });
                        // console.log({resData1 : resData1});
                        if (!error) {
                          if (resData1 == undefined) {
                            const result = user.addData(body, function(
                              err,
                              resData
                            ) {
                              if (!err) {
                                success++;
                              } else {
                                failed++;
                              }
                            });
                          } else {
                            failed++;
                          }
                        } else {
                          failed++;
                        }
                        console.log({ failed: failed });
                      });
                    }

                    const Return = {
                      "Total Data": parseInt(sh.rowCount) - parseInt(1),
                      Success: success,
                      Failed: failed
                    };
                    res
                      .status(200)
                      .send(new response(true, 200, "Import Data Success"));
                  });
                } else {
                  res
                    .status(200)
                    .send(new response(false, 403, "Unauthorized"));
                }
              }
            } else {
              res.status(200).send(new response(false, 403, "Unauthorized"));
            }
          });
        } else {
          res
            .status(200)
            .send(new response(false, 400, "Invalid input format"));
        }
      });
  } catch (e) {
    console.log(e);
    res.status(500).send(new response(false, 500, "Something went wrong"));
  }
};

exports.getDetail = async (req, res) => {
  try {
    const middleware = {
      user_id: "required|text|" + req.body.user_id,
      auth_code: "required|text|" + req.body.auth_code,
      id: "required|text|" + req.body.id
    };
    console.log(middleware);
    if (utility.validateRequest(middleware)) {
      const result = await admin.getAuth(req.body, function(errAuth, resAuth) {
        console.log(errAuth);
        if (!errAuth) {
          if (!utility.issetVal(resAuth)) {
            res.status(200).send(new response(false, 403, "Unauthorized"));
          } else {
            console.log(resAuth.auth_code);
            if (resAuth.auth_code == req.body.auth_code) {
              //here goes the function
              const body = {
                id: req.body.id
              };

              user.getById(body, (errRes, resData) => {
                if (!errRes) {
                  if (utility.issetVal(resData)) {
                    alumniInterest.getAllByAlumni_id(
                      { user_id: req.body.id },
                      (errInterest, resInterest) => {
                        console.log("errInter", errInterest);
                        console.log("inter", resInterest);
                        resData.interest_list = resInterest;
                        res
                          .status(200)
                          .send(
                            new response(true, 200, "Fetch success", resData)
                          );
                      }
                    );
                  } else {
                    res
                      .status(200)
                      .send(new response(false, 401, "Fetch Failed4"));
                  }
                } else {
                  res
                    .status(200)
                    .send(new response(false, 401, "Fetch Failed3"));
                }
              });
            } else {
              res.status(200).send(new response(false, 403, "Unauthorized1"));
            }
          }
        } else {
          res.status(200).send(new response(false, 403, "Unauthorized2"));
        }
      });
    } else {
      res.status(200).send(new response(false, 400, "Invalid input format"));
    }
  } catch (e) {
    console.log(e);
    res.status(500).send(new response(false, 500, "Something went wrong"));
  }
};

exports.getDetailHighlight = async (req, res) => {
  try {
    const middleware = {
      user_id: "required|text|" + req.body.user_id,
      auth_code: "required|text|" + req.body.auth_code,
      id: "required|text|" + req.body.id
    };
    // console.log(middleware);
    if (utility.validateRequest(middleware)) {
      const result = await admin.getAuth(req.body, function(errAuth, resAuth) {
        // console.log(errAuth);
        if (!errAuth) {
          if (!utility.issetVal(resAuth)) {
            res.status(200).send(new response(false, 403, "Unauthorized"));
          } else {
            // console.log(resAuth.auth_code);
            if (resAuth.auth_code == req.body.auth_code) {
              //here goes the function
              const body = {
                id: req.body.id
              };
              alumniHighlight.getById(body, function(errRes, resData) {
                console.log(resData);
                if (!errRes) {
                  if (utility.issetVal(resData)) {
                    res
                      .status(200)
                      .send(new response(true, 200, "Fetch success", resData));
                  } else {
                    res
                      .status(200)
                      .send(new response(false, 401, "Fetch Failed4"));
                  }
                } else {
                  res
                    .status(200)
                    .send(new response(false, 401, "Fetch Failed3"));
                }
              });
            } else {
              res.status(200).send(new response(false, 403, "Unauthorized1"));
            }
          }
        } else {
          res.status(200).send(new response(false, 403, "Unauthorized2"));
        }
      });
    } else {
      res.status(200).send(new response(false, 400, "Invalid input format"));
    }
  } catch (e) {
    console.log(e);
    res.status(500).send(new response(false, 500, "Something went wrong"));
  }
};

exports.deleteHighlight = async (req, res) => {
  try {
    const middleware = {
      user_id: "required|text|" + req.query.user_id,
      auth_code: "required|text|" + req.query.auth_code,
      id: "required|text|" + req.query.id
    };
    if (utility.validateRequest(middleware)) {
      const result = await admin.getAuth(req.query, function(errAuth, resAuth) {
        if (!errAuth) {
          if (!utility.issetVal(resAuth)) {
            res.status(200).send(new response(false, 403, "Unauthorized"));
          } else {
            if (resAuth.auth_code == req.query.auth_code) {
              //here goes the function
              const body = {
                user_id: req.query.user_id,
                auth_code: req.query.auth_code,
                id: req.query.id
              };
              alumniHighlight.getById(body, function(errGet, resGet) {
                console.log(errGet);

                if (!errGet) {
                  if (!utility.issetVal(resGet)) {
                    res
                      .status(200)
                      .send(
                        new response(
                          false,
                          405,
                          "alumniHighlight not registered1"
                        )
                      );
                  } else {
                    alumniHighlight.deleteData(body, function(err, resData) {
                      // caches
                      if (!err) {
                        res
                          .status(200)
                          .send(new response(true, 200, "Delete success"));
                      } else {
                        res
                          .status(200)
                          .send(new response(false, 401, "Delete failed"));
                      }
                    });
                  }
                } else {
                  res
                    .status(200)
                    .send(new response(false, 404, "Data not exist"));
                }
              });
            } else {
              res.status(200).send(new response(false, 403, "Unauthorized2"));
            }
          }
        } else {
          res.status(200).send(new response(false, 403, "Unauthorized1"));
        }
      });
    } else {
      res
        .status(200)
        .send(new response(false, 400, "Invalid input format", middleware));
    }
  } catch (e) {
    console.log(e);
    res.status(500).send(new response(false, 500, "Something went wrong"));
  }
};

exports.getDetailRecommendation = async (req, res) => {
  try {
    const middleware = {
      user_id: "required|text|" + req.body.user_id,
      auth_code: "required|text|" + req.body.auth_code,
      id: "required|text|" + req.body.id,
      month: "required|text|" + req.body.month,
      year: "required|text|" + req.body.year
    };
    // console.log(middleware);
    if (utility.validateRequest(middleware)) {
      const result = await admin.getAuth(req.body, function(errAuth, resAuth) {
        console.log(errAuth);
        if (!errAuth) {
          if (!utility.issetVal(resAuth)) {
            res.status(200).send(new response(false, 403, "Unauthorized"));
          } else {
            // console.log(resAuth.auth_code);
            if (resAuth.auth_code == req.body.auth_code) {
              //here goes the function
              const body = {
                id: req.body.id,
                month: req.body.month,
                year: req.body.year
              };
              AlumniRecommend.getDetail(body, function(errRes, resData) {
                if (!errRes) {
                  if (utility.issetVal(resData)) {
                    res
                      .status(200)
                      .send(new response(true, 200, "Fetch success", resData));
                  } else {
                    res
                      .status(200)
                      .send(new response(false, 401, "Fetch Failed4"));
                  }
                } else {
                  res
                    .status(200)
                    .send(new response(false, 401, "Fetch Failed3"));
                }
              });
            } else {
              res.status(200).send(new response(false, 403, "Unauthorized1"));
            }
          }
        } else {
          res.status(200).send(new response(false, 403, "Unauthorized2"));
        }
      });
    } else {
      res.status(200).send(new response(false, 400, "Invalid input format"));
    }
  } catch (e) {
    console.log(e);
    res.status(500).send(new response(false, 500, "Something went wrong"));
  }
};

exports.findAutoComplete = async (req, res) => {
  try {
    const middleware = {
      user_id: "required|text|" + req.body.user_id,
      auth_code: "required|text|" + req.body.auth_code,
      keyword: "no|text|" + req.body.keyword
    };
    if (utility.validateRequest(middleware)) {
      admin.getAuth(req.body, function(errAuth, resAuth) {
        if (resAuth.auth_code == req.body.auth_code) {
          user.getAutocomplete(
            { keyword: req.body.keyword },
            (errGet, Autocomplete) => {
              if (utility.issetVal(Autocomplete)) {
                res
                  .status(200)
                  .send(
                    new response(true, 200, "Fetch Succes", {
                      data: Autocomplete
                    })
                  );
              } else {
                res.status(200).send(new response(false, 401, "Fetch Failed"));
              }
            }
          );
        } else {
          res.status(200).send(new response(false, 403, "Unauthorized2"));
        }
      });
    } else {
      res
        .status(200)
        .send(new response(false, 400, "Invalid input format", middleware));
    }
  } catch (e) {
    res.status(500).send(new response(false, 500, "Something went wrong"));
  }
};

exports.getAllVerified = async (req, res) => {
  try {
    const middleware = {
      user_id: "required|text|" + req.body.user_id,
      auth_code: "required|text|" + req.body.auth_code,
      page: "required|text|" + req.body.page,
      item: "no|text|" + req.body.item,
      interest_list: "no|text|" + req.body.interest_list,
      keyword: "no|text|" + req.body.keyword,
      batch: "no|text|" + req.body.batch,
      create_date: "no|text|" + req.body.create_date
    };
    // console.log(middleware);
    if (utility.validateRequest(middleware)) {
      const result = await admin.getAuth(req.body, function(errAuth, resAuth) {
        // console.log({errAuth : errAuth});
        // console.log({resAuth : resAuth});
        if (!errAuth) {
          if (!utility.issetVal(resAuth)) {
            res.status(200).send(new response(false, 403, "Unauthorized"));
          } else {
            // console.log(resAuth.auth_code);
            if (resAuth.auth_code == req.body.auth_code) {
              //here goes the function
              const bodyCount = {
                verified: 2,
                keyword: req.body.keyword,
                batch: req.body.batch,
                create_date: req.body.create_date,
                interest_list: req.body.interest_list
              };
              // console.log({bodyCount : bodyCount});
              user.getCountVerified(bodyCount, function(
                errResCount,
                rowsResCount
              ) {
                console.log({ errResCount: errResCount });
                console.log({ rowsResCount: rowsResCount });
                if (!errResCount) {
                  if (utility.issetVal(rowsResCount)) {
                    let itemPerRequest = utility.issetVal(req.body.item)
                      ? parseInt(req.body.item)
                      : 15;
                    let page = req.body.page;
                    let total_data = rowsResCount;
                    let total_page = Math.ceil(total_data / itemPerRequest);
                    let limitBefore =
                      page <= 1 || page == null
                        ? 0
                        : (page - 1) * itemPerRequest;

                    const PreparedData = {
                      start: limitBefore,
                      limit: itemPerRequest,
                      verified: 2,
                      keyword: req.body.keyword,
                      batch: req.body.batch,
                      create_date: req.body.create_date,
                      interest_list: req.body.interest_list
                    };
                    // console.log({PreparedData : PreparedData});
                    user.getDataVerified(PreparedData, function(
                      errRes,
                      rowsRes
                    ) {
                      // console.log({errRes : errRes});
                      // console.log({rowsRes : rowsRes});
                      if (!errRes) {
                        const totalInfo = {
                          total_page: total_page,
                          total_data_all: total_data,
                          total_data: rowsRes.length
                        };
                        if (rowsRes != "") {
                          res.status(200).send(
                            new response(true, 200, "Fetch Success", {
                              data: rowsRes,
                              total: totalInfo
                            })
                          );
                        } else {
                          res
                            .status(200)
                            .send(new response(false, 401, "Fetch Failed4"));
                        }
                      } else {
                        res
                          .status(200)
                          .send(new response(false, 401, "Fetch Failed3"));
                      }
                    });
                  } else {
                    res
                      .status(200)
                      .send(new response(false, 404, "Data Not Exist1"));
                  }
                } else {
                  res
                    .status(200)
                    .send(new response(false, 404, "Data Not Exist2"));
                }
              });
            } else {
              res.status(200).send(new response(false, 403, "Unauthorized"));
            }
          }
        } else {
          res.status(200).send(new response(false, 403, "Unauthorized"));
        }
      });
    } else {
      res.status(200).send(new response(false, 400, "Invalid input format"));
    }
  } catch (e) {
    console.log(e);
    res.status(500).send(new response(false, 500, "Something went wrong"));
  }
};

exports.getAllVerifiedNoPaging = async (req, res) => {
  try {
    const middleware = {
      user_id: "required|text|" + req.body.user_id,
      auth_code: "required|text|" + req.body.auth_code,
      keyword: "no|text|" + req.body.keyword
    };
    if (utility.validateRequest(middleware)) {
      const result = await admin.getAuth(req.body, function(errAuth, resAuth) {
        if (resAuth.auth_code == req.body.auth_code) {
          user.getSelectUser(
            { keyword: req.body.keyword },
            (errRes, resUser) => {
              console.log({ resUser: resUser });
              console.log({ errRes: errRes });
              if (utility.issetVal(resUser)) {
                res
                  .status(200)
                  .send(new response(true, 200, "Fetch Success", resUser));
              } else {
                res.status(200).send(new response(false, 401, "Fetch Failed4"));
              }
            }
          );
        } else {
          res.status(200).send(new response(false, 403, "Unauthorized"));
        }
      });
    } else {
      res.status(200).send(new response(false, 400, "Invalid input format"));
    }
  } catch (error) {
    res.status(500).send(new response(false, 500, "Something went wrong"));
  }
};

exports.crawAll = async (req, res) => {
  try {
    const middleware = {};
    // console.log(middleware);
    if (utility.validateRequest(middleware)) {
      user.crawAll(null, function(errRes, rowsRes) {
        // console.log({errRes : errRes});
        // console.log({rowsRes : rowsRes});
        if (!errRes) {
          if (utility.issetVal(rowsRes)) {
            res
              .status(200)
              .send(new response(true, 200, "Fetch Success", rowsRes));
          } else {
            res.status(200).send(new response(false, 401, "Fetch Failed4"));
          }
        } else {
          res.status(200).send(new response(false, 401, "Fetch Failed3"));
        }
      });
    } else {
      res.status(200).send(new response(false, 400, "Invalid input format"));
    }
  } catch (e) {
    console.log(e);
    res.status(500).send(new response(false, 500, "Something went wrong"));
  }
};

exports.crawGetOne = async (req, res) => {
  try {
    const id = req.params;

    if (id != "" || null || undefined) {
      user.crawGetOne(id, (errRes, rowsRes) => {
        if (!errRes) {
          if (rowsRes) {
            res
              .status(200)
              .send(new response(true, 200, "Fetch Success", rowsRes));
          } else {
            res.status(200).send(new response(false, 401, "No Data"));
          }
        } else {
          res.status(200).send(new response(false, 401, "Error to Get Data"));
        }
      });
    } else {
      res.status(200).send(new response(false, 401, "Invalid input format"));
    }
  } catch (error) {
    res.status(500).send("Server Error");
  }
};
exports.ExportAlumniActive = async (req, res) => {
  let IdInterests = null;
  if (utility.issetVal(req.body.interest)) {
    IdInterests = JSON.parse(req.body.interest).map(
      ({ interest_id }) => interest_id
    );
  }
  const body = {
    keyword: req.body.keyword || null,
    batch: req.body.batch || null,
    create_date: req.body.create_date || null,
    interest: IdInterests || null
  };
  user.ExportAlumniActive(body, (errEx, resEx) => {
    // console.log(resEx);
    if (utility.issetVal(resEx)) {
      const data = resEx;
      // console.log(data);
      let fileName = 'alumni_active-'+ moment(Date.now()).format('DD-MM-YYYY')+ '.xlsx'
      var workbook = new Excel.Workbook();
      var worksheet = workbook.addWorksheet('Sheet');
      var fill = {
        type: 'pattern',
        pattern:'solid',
        fgColor:{ argb:'F4B084'}
      }
      var font = {bold: true}
      
      worksheet.getCell('A1').fill = fill; worksheet.getCell('B1').fill = fill; worksheet.getCell('C1').fill = fill;
      worksheet.getCell('A1').font = font; worksheet.getCell('B1').font = font; worksheet.getCell('C1').font = font;

      worksheet.getCell('D1').fill = fill; worksheet.getCell('E1').fill = fill; worksheet.getCell('F1').fill = fill;
      worksheet.getCell('D1').font = font; worksheet.getCell('E1').font = font; worksheet.getCell('F1').font = font;

      worksheet.getCell('G1').fill = fill; worksheet.getCell('H1').fill = fill; worksheet.getCell('I1').fill = fill;
      worksheet.getCell('G1').font = font; worksheet.getCell('H1').font = font; worksheet.getCell('I1').font = font;

      worksheet.getCell('J1').fill = fill; worksheet.getCell('K1').fill = fill; worksheet.getCell('L1').fill = fill;
      worksheet.getCell('J1').font = font; worksheet.getCell('K1').font = font; worksheet.getCell('L1').font = font;

      worksheet.getCell('M1').fill = fill; worksheet.getCell('N1').fill = fill; worksheet.getCell('O1').fill = fill;
      worksheet.getCell('M1').font = font; worksheet.getCell('N1').font = font; worksheet.getCell('O1').font = font;

      worksheet.getCell('P1').fill = fill; worksheet.getCell('Q1').fill = fill; worksheet.getCell('R1').fill = fill;
      worksheet.getCell('P1').font = font; worksheet.getCell('Q1').font = font; worksheet.getCell('R1').font = font; 

      worksheet.getCell('S1').fill = fill; worksheet.getCell('T1').fill = fill; worksheet.getCell('U1').fill = fill;
      worksheet.getCell('S1').font = font; worksheet.getCell('T1').font = font; worksheet.getCell('U1').font = font;

      worksheet.getCell('V1').fill = fill; worksheet.getCell('W1').fill = fill;
      worksheet.getCell('V1').font = font; worksheet.getCell('W1').font = font;
      
  
      workbook.views = [
          {
              x: 0, y: 0, width: 10000, height: 20000,
              firstSheet: 0, activeTab: 1, visibility: 'visible'
          }
      ];
      
      if(data){
                
        worksheet.columns = [
            {header: '#', key: 'no' },
            {header: 'Name', key: 'name', width: 30 },
            {header: 'Email', key: 'email', width: 30},
            {header: 'Phone 1', key: 'phone', width: 20},
            {header: 'Phone 2', key: 'phone1', width: 20},
            {header: 'Gender', key: 'gender'},
            {header: 'Type', key: 'type'},
            {header: 'Batch', key: 'batch'},
            {header: 'Company', key: 'company', width: 32},
            {header: 'Position', key: 'position', width: 30},
            {header: 'DoB', key: 'dob', width: 32, outlineLevel: 2, type: 'date'},
            {header: 'Line Service', key: 'lineservice_title', width: 20},
            {header: 'Eula Version', key: 'eula_version', width: 20},
            {header: '#Followed Interest', key: 'interest', width: 20},
            {header: '#Hastag Used', key: 'hastag', width: 20},
            {header: '#Post', key: 'post'},
            {header: '#Polling', key: 'polling'},
            {header: '#Comment', key:'comment', width: 12},
            {header: '#Like', key:'like'},
            {header: '#Job Shared', key: 'job_shared', width: 20},
            {header: '#Job Recommend', key: 'job_recommend', width: 20},
            {header: 'Create Date', key: 'create_date', width: 32, outlineLevel: 1, type: 'date', formulae: [new Date(2019, 0, 1)]},
            {header: 'First Time Login', key: 'first_login', width: 32, outlineLevel: 1, type: 'date', formulae: [new Date(2019, 0, 1)]}
        ];

        data.forEach((element,i) => {
            element["no"]= i+1
            worksheet.addRow(element).commit();
            });
    
        

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader("Content-Disposition", "attachment; filename=" + fileName);
    res.set('Set-Cookie', 'fileDownload=true; path=/')
    workbook.xlsx.write(res)
        .then(function (data) {
            res.end();
            console.log(`Export Alumni Active Success!`);
        });
    }
      // res.status(200).send("Success Export");
    } else {
      res.status(200).send(new response(false, 401, "No Data"));
    }
  });
};
