let response = require("../../helpers/response");
const utility = require("../../helpers/utility");
const globals = require("../../configs/global");
const { config } = require("../../default");
let url = globals[config.environment]; // development || production
const nodemailer = require("../../helpers/mail_adapter");
let moment = require("moment");
const formidable = require("formidable");
const path = require("path");
const fs = require("fs");
let appDir = path.dirname(require.main.filename);
let pathDir = appDir + "/uploads/user/";
let fileDir = appDir + "/uploads/excel/";
let Excel = require("exceljs");
const jwt = require("jsonwebtoken");
// Model
const otp = require('../models/otp')
const user = require('../models/user')
const AlumniRecommend = require('../models/AT_AlumniRecommend')
const alumniHighlight = require('../models/alumniHighlight')
const device = require('../models/device')
const alumniPrivacy = require('../models/alumniPrivacy')
const almuniEducation = require('../models/AT_AlumniEducation')
const alumniInterest = require('../models/AT_AlumniInterest')
const setting = require('../models/setting')
const search = require('../models/search')

exports.login = async (req, res) => {
  try {
    const middleware = {
      email: "required|text|" + req.body.email,
      password: "required|text|" + req.body.password
    };
    // console.log(middleware);
    if (utility.validateRequest(middleware)) {
      const salt = await user.getSalt(req, function(error, resSalt) {
        if (!error) {
          if (!utility.issetVal(resSalt)) {
            res
              .status(200)
              .send(new response(false, 405, "Email not registered1"));
          } else {
            let password = utility.doHash(req.body.password, resSalt.salt_hash);
            const loginData = {
              email: req.body.email,
              password: password,
              publish: "1"
            };
            const result = user.login(loginData, function(err, resData) {
              if (!err) {
                if (!utility.issetVal(resData)) {
                  res
                    .status(200)
                    .send(new response(false, 407, "Password is wrong!"));
                } else {
                  if (resData.verified == 2) {
                    if (!utility.issetVal(resData.islogged)) {
                      user.updateData(
                        {
                          islogged: 1,
                          first_login: moment(Date.now()).format(
                            "YYYY-MM-DD HH:mm:ss"
                          ),
                          id: resData.id
                        },
                        (err, res) => {}
                      );
                    }

                    if (resData.publish != loginData.publish) {
                      res
                        .status(200)
                        .send(
                          new response(false, 406, "Account is Not Published")
                        );
                    }

                    setting.getOne(null, function(errOne, resSetting) {
                      console.log({ errOne });
                      if (utility.issetVal(resSetting)) {
                        res.status(200).send(
                          new response(true, 200, "Login success", {
                            auth_code: resData.auth_code,
                            user_id: resData.id,
                            setting: {
                              show_month: resSetting.show_month,
                              show_week: resSetting.show_week,
                              show_polling: resSetting.show_polling,
                              show_comment: resSetting.show_comment,
                              show_share: resSetting.show_share,
                              show_messaging: resSetting.show_messaging,
                              show_post: resSetting.show_post
                            },
                            token: jwt.sign(
                              {
                                user_id: resData.id,
                                auth_code: resData.auth_code
                              },
                              "RAHASIA"
                            )
                          })
                        );
                      } else {
                        res
                          .status(200)
                          .send(new response(false, 401, "Login failed1"));
                      }
                    });
                  } else {
                    res
                      .status(200)
                      .send(new response(false, 401, "Login failed2"));
                  }
                }
              } else {
                res.status(200).send(new response(false, 401, "Login failed2"));
              }
            });
          }
        } else {
          res
            .status(200)
            .send(new response(false, 405, "Email not registered2"));
        }
      });
    } else {
      res.status(200).send(new response(false, 400, "Invalid input format"));
    }
  } catch (e) {
    res.status(500).send(new response(false, 500, "Something went wrong"));
  }
};

exports.forgetPassword = async (req, res) => {
  try {
    const middleware = {
      email: "required|text|" + req.body.email
    };
    if (utility.validateRequest(middleware)) {
      user.checkEmail(
        {
          email: req.body.email
        },
        function(errRes, resData) {
          // console.log(errRes)
          if (!errRes) {
            if (utility.issetVal(resData)) {
              const myDate = new Date();
              myDate.setMinutes(myDate.getMinutes() + 15);
              const body = {
                id: resData.id,
                reset_code: utility.generateHash(5),
                reset_expired: moment(myDate).format("YYYY-MM-DD HH:mm:ss")
              };
              // console.log(body);
              user.updateData(body, function(err, resData) {
                // console.log(err)
                if (utility.issetVal(err)) {
                  res
                    .status(200)
                    .send(new response(false, 401, "Forget Password Failed!3"));
                } else {
                  if (utility.issetVal(resData)) {
                    let link =
                      url.url_cms +
                      "forget_password.php?email=" +
                      req.body.email +
                      "&code=" +
                      body.reset_code;
                    // console.log(url)
                    const mailBody = {
                      receiver: req.body.email,
                      subject: "Reset password request",
                      body:
                        "<p><i>*This is a message from OnePlus </i></p>" +
                        "<p>Thank you for using this app, to change your password, please click this link below.</p>" +
                        "<p>Reset Password : <a href=" +
                        link +
                        ">*Click here*</a></p>" +
                        "<p><i>*Do not reply to this e-mail.</i></p>" +
                        "<p><i>Thank you!</i></p>"
                    };
                    nodemailer.mailSend(mailBody, function(err, resData) {
                      // console.log(err);
                      if (!err) {
                        res
                          .status(200)
                          .send(new response(true, 200, "Email send!"));
                      } else {
                        res
                          .status(200)
                          .send(
                            new response(false, 401, "Forget Password Failed!2")
                          );
                      }
                    });
                  } else {
                    res
                      .status(200)
                      .send(
                        new response(false, 401, "Forget Password Failed!1")
                      );
                  }
                }
              });
            } else {
              res
                .status(200)
                .send(new response(false, 405, "Email Not Registered4"));
            }
          } else {
            res
              .status(200)
              .send(new response(false, 405, "Email Not Registered3"));
          }
        }
      );
    } else {
      res.status(200).send(new response(false, 400, "Invalid input format"));
    }
  } catch (e) {
    res.status(500).send(new response(false, 500, "Something went wrong"));
  }
};

exports.sendMailer = async (req, res) => {
  try {
    const middleware = {
      email: "required|text|" + req.body.email
    };
    if (utility.validateRequest(middleware)) {
      user.checkEmail(
        {
          email: req.body.email
        },
        function(errRes, resData) {
          // console.log(errRes)
          if (!errRes) {
            if (utility.issetVal(resData)) {
              const myDate = new Date();
              myDate.setMinutes(myDate.getMinutes() + 15);
              const body = {
                id: resData.id,
                reset_code: utility.generateHash(5),
                reset_expired: moment(myDate).format("YYYY-MM-DD HH:mm:ss")
              };
              // console.log(body);
              user.updateData(body, function(err, resData) {
                // console.log(err)
                if (utility.issetVal(err)) {
                  res
                    .status(200)
                    .send(new response(false, 401, "Forget Password Failed!3"));
                } else {
                  if (utility.issetVal(resData)) {
                    let link =
                      url.url_cms +
                      "forget_password.php?email=" +
                      req.body.email +
                      "&code=" +
                      body.reset_code;
                    // console.log(url)
                    const mailBody = {
                      receiver: req.body.email,
                      subject: "Reset password request",
                      body:
                        "<p><i>*This is a message from OnePlus </i></p>" +
                        "<p>Thank you for using this app, to change your password, please click this link below.</p>" +
                        "<p>Reset Password : <a href=" +
                        link +
                        ">*Click here*</a></p>" +
                        "<p><i>*Do not reply to this e-mail.</i></p>" +
                        "<p><i>Thank you!</i></p>"
                    };
                    nodemailer.mailSend(mailBody, function(err, resData) {
                      // console.log(err);
                      if (!err) {
                        res
                          .status(200)
                          .send(new response(true, 200, "Email send!"));
                      } else {
                        res
                          .status(200)
                          .send(
                            new response(false, 401, "Forget Password Failed!2")
                          );
                      }
                    });
                  } else {
                    res
                      .status(200)
                      .send(
                        new response(false, 401, "Forget Password Failed!1")
                      );
                  }
                }
              });
            } else {
              res
                .status(200)
                .send(new response(false, 405, "Email Not Registered4"));
            }
          } else {
            res
              .status(200)
              .send(new response(false, 405, "Email Not Registered3"));
          }
        }
      );
    } else {
      res.status(200).send(new response(false, 400, "Invalid input format"));
    }
  } catch (e) {
    res.status(500).send(new response(false, 500, "Something went wrong"));
  }
};

exports.registration = async (req, res) => {
  try {
    const middleware = {
      phone: "required|text|" + req.body.phone
    };
    // console.log(middleware);
    if (utility.validateRequest(middleware)) {
      const body = {
        phone: req.body.phone,
        publish: 1
      };
      await user.checkUser(body, function(error, resData) {
        // console.log(resData.publish);
        if (!error) {
          if (!utility.issetVal(resData)) {
            res
              .status(200)
              .send(new response(false, 405, "Account not registered1"));
          } else if (utility.issetVal(resData.password)) {
            res
              .status(200)
              .send(new response(false, 402, "Account Already Active"));
          } else if (resData.publish != body.publish) {
            res.status(200).send(new response(false, 406, "Account Inactive!"));
          } else {
            resData.from = "onePlus";
            resData.img = utility.issetVal(resData.img)
              ? url.url_img + "user/" + resData.img
              : null;
            res
              .status(200)
              .send(new response(true, 200, "Fetch Success", resData));
          }
        } else {
          res
            .status(200)
            .send(new response(false, 405, "Account not registered2"));
        }
      });
    } else {
      res.status(200).send(new response(false, 400, "Invalid input format"));
    }
  } catch (e) {
    res.status(500).send(new response(false, 500, "Something went wrong"));
  }
};

exports.validateUser = async (req, res) => {
  try {
    const middleware = {
      phone: "required|text|" + req.body.phone,
      email: "required|text|" + req.body.email
    };
    // console.log(url);
    if (utility.validateRequest(middleware)) {
      const body = {
        phone: req.body.phone,
        email: req.body.email,
        publish: 1
      };
      await user.validateEmail(body, function(error, resData) {
        // console.log(error);
        if (!error) {
          if (!utility.issetVal(resData)) {
            body.cURLphone =
              globals.endpoint360 +
              "/api/api_event_developer.php?action=check_user_360&param=" +
              body.phone;
            user.curlPhone(body, function(errRes, resData) {
              // console.log(resData);
              if (utility.issetVal(errRes)) {
                res
                  .status(200)
                  .send(
                    new response(false, 500, "Failed: Something Wrong!", errRes)
                  );
              } else {
                if (utility.issetVal(resData.data)) {
                  resData.data.from = "pwc360";
                  res
                    .status(200)
                    .send(
                      new response(
                        true,
                        200,
                        "Fetch Success Curl",
                        resData.data
                      )
                    );
                } else {
                  body.cURLemail =
                    globals.endpoint360 +
                    "/api/api_event_developer.php?action=check_user_360&param=" +
                    body.email;
                  user.curlEmail(body, function(errRes, resData) {
                    // console.log(resData);
                    if (utility.issetVal(errRes)) {
                      res
                        .status(200)
                        .send(
                          new response(
                            false,
                            500,
                            "Failed: Something Wrong!",
                            errRes
                          )
                        );
                    } else {
                      if (utility.issetVal(resData.data)) {
                        resData.data.from = "pwc360";
                        res
                          .status(200)
                          .send(
                            new response(
                              true,
                              200,
                              "Fetch Success Curl",
                              resData.data
                            )
                          );
                      } else {
                        res
                          .status(200)
                          .send(
                            new response(false, 405, "Account not registered1")
                          );
                      }
                    }
                  });
                }
              }
            });
          } else if (utility.issetVal(resData.password)) {
            res
              .status(200)
              .send(new response(false, 402, "Account Already Active"));
          } else if (resData.publish != body.publish) {
            res.status(200).send(new response(false, 406, "Account Inactive!"));
          } else {
            resData.from = "onePlus";
            resData.img = utility.issetVal(resData.img)
              ? url.url_img + "user/" + resData.img
              : null;
            res
              .status(200)
              .send(new response(true, 200, "Fetch Success", resData));
          }
        } else {
          res
            .status(200)
            .send(new response(false, 405, "Account not registered2"));
        }
        // console.log(body);
      });
    } else {
      res.status(200).send(new response(false, 400, "Invalid input format"));
    }
  } catch (e) {
    res.status(500).send(new response(false, 500, "Something went wrong"));
  }
};

exports.completeProfile = async (req, res) => {
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
          console.log(appDir);
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
          name: "required|text|" + formJSON.name,
          lineservice_id: "required|text|" + formJSON.lineservice_id,
          batch: "no|text|" + formJSON.batch,
          phone: "required|text|" + formJSON.phone,
          phone1: "no|text|" + formJSON.phone1,
          email: "required|text|" + formJSON.email,
          password: "required|text|" + formJSON.password,
          eula: "required|text|" + formJSON.eula,
          publish: "required|number|" + formJSON.publish,
          from: "required|text|" + formJSON.from,
          img: "no|images|" + formJSON.img
        };
        if (utility.validateRequest(middleware)) {
          //here goes the function

          if (formJSON.from == "pwc360") {
            let salt = utility.generateHash(5);
            let id = utility.generateHash(32);
            let auth_code = utility.generateHash(32);
            let password = utility.doHash(formJSON.password, salt);

            const body = {
              id: id,
              name: formJSON.name,
              email: formJSON.email,
              phone: formJSON.phone,
              company: "",
              position: "",
              bio: "",
              achievement: "",
              gender: "",
              password: password,
              salt_hash: salt,
              alumni: formJSON.alumni,
              img: formJSON.img,
              eula: 1,
              reset_code: "",
              auth_code: auth_code,
              verified: 0,
              publish: formJSON.publish,
              join_date: "",
              resign_date: "",
              create_date: moment(Date.now()).format("YYYY-MM-DD HH:mm:ss"),
              lineservice_id: formJSON.lineservice_id,
              type: "pwc",
              source: "Self Regis",
              phone1: formJSON.phone1,
              dob: "",
              reset_expired: moment(Date.now()).format("YYYY-MM-DD HH:mm:ss")
            };
            if (body.img == undefined) {
              body.img = "";
            }
            const result = user.addData(body, function(err, resData) {
              if (!err) {
                res
                  .status(200)
                  .send(new response(true, 200, "Register success", body));
              } else {
                res
                  .status(200)
                  .send(new response(false, 401, "Register failed1", err));
              }
            });
          } else if (formJSON.from == "external") {
            let salt = utility.generateHash(5);
            let id = utility.generateHash(32);
            let auth_code = utility.generateHash(32);
            let password = utility.doHash(formJSON.password, salt);

            const body = {
              id: id,
              type: "public",
              alumni: "no",
              name: formJSON.name,
              email: formJSON.email,
              gender: "",
              company: "",
              position: "",
              phone: formJSON.phone,
              phone1: formJSON.phone1,
              dob: "",
              bio: "",
              lineservice_id: formJSON.lineservice_id,
              achievement: "",
              join_date: "",
              resign_date: "",
              password: password,
              salt_hash: salt,
              reset_code: "",
              auth_code: auth_code,
              img: formJSON.img,
              source: "Self Regis",
              eula: 1,
              eula_version: "123",
              eula_date: moment(Date.now()).format("YYYY-MM-DD HH:mm:ss"),
              verified: 1,
              publish: formJSON.publish,
              create_date: moment(Date.now()).format("YYYY-MM-DD HH:mm:ss"),
              reset_expired: moment(Date.now()).format("YYYY-MM-DD HH:mm:ss")
            };
            if (body.img == undefined) {
              body.img = "";
            }
            const result = user.addData(body, function(err, resData) {
              console.log(body);
              if (!err) {
                res
                  .status(200)
                  .send(new response(true, 200, "Register success", body));
              } else {
                res
                  .status(200)
                  .send(new response(false, 401, "Register failed2", err));
              }
            });
          } else {
            let salt = utility.generateHash(5);
            let auth_code = utility.generateHash(32);
            let password = utility.doHash(formJSON.password, salt);

            const body = {
              id: formJSON.id,
              type: "pwc",
              alumni: formJSON.alumni,
              name: formJSON.name,
              email: formJSON.email,
              gender: "",
              company: "",
              position: "",
              phone: formJSON.phone,
              phone1: formJSON.phone1,
              dob: "",
              bio: "",
              lineservice_id: formJSON.lineservice_id,
              achievement: "",
              join_date: "",
              resign_date: "",
              password: password,
              salt_hash: salt,
              reset_code: "",
              auth_code: auth_code,
              img: formJSON.img,
              eula: 1,
              verified: 2,
              publish: formJSON.publish,
              create_date: moment(Date.now()).format("YYYY-MM-DD HH:mm:ss")
            };

            if (body.img == undefined) {
              body.img = "";
            }
            const result = user.updateData(body, function(err, resData) {
              if (!err) {
                const newData = user.getById(body, function(errUser, resUser) {
                  if(utility.issetVal(resUser)){
                    if(!utility.issetVal(resUser.img)) {
                      resUser.img = null;
                    }
                    resUser.user_id = resUser.id;
                    user.triggerUpdateUserMongo(resUser, function(errTrigger, trigger) {
                      console.log('TriggerErr', errTrigger);
                      console.log('trigger', trigger);
                      
                    })
                    const title  = utility.issetVal(resUser.batch)? 
                                   resUser.name+' -  Batch '+resUser.batch :resUser.name;
                    const bodySearch = {
                      type_id : resUser.id
                      , type  : 'user'
                      , title : title
                      , description : resUser.batch
                      , img : resUser.img
                    }
  
                    search.updateData(bodySearch, (errCount, resCount)=>{
                      console.log('errCount', errCount)
                      console.log('resCount', resCount)
                    });
                  }
                })
                res.status(200).send(
                  new response(true, 200, 'Update success', resData))
              } else {
                res
                  .status(200)
                  .send(new response(false, 401, "Update failed1", err));
              }
            });
          }
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

exports.resetPassword = async (req, res) => {
  try {
    const middleware = {
      email: "required|text|" + req.body.email,
      password: "required|text|" + req.body.password,
      reset_code: "required|text|" + req.body.reset_code
    };
    if (utility.validateRequest(middleware)) {
      user.checkEmail(
        {
          email: req.body.email
        },
        function(errRes, resData) {
          if (!errRes) {
            if (utility.issetVal(resData)) {
              if (resData.reset_code == req.body.reset_code) {
                const body = {
                  id: resData.id,
                  password: utility.doHash(req.body.password, resData.salt_hash)
                };
                user.updateData(body, function(err, resData) {
                  console.log(err);
                  if (utility.issetVal(err)) {
                    res
                      .status(200)
                      .send(
                        new response(false, 401, "Reset Password Failed!3")
                      );
                  } else {
                    res
                      .status(200)
                      .send(new response(true, 200, "Reset Password Success"));
                  }
                });
              } else {
                res
                  .status(200)
                  .send(new response(false, 407, "Reset Code is Wrong!"));
              }
            } else {
              res
                .status(200)
                .send(new response(false, 405, "Email Not Registered4"));
            }
          } else {
            res
              .status(200)
              .send(new response(false, 405, "Email Not Registered3"));
          }
        }
      );
    } else {
      res.status(200).send(new response(false, 400, "Invalid input format"));
    }
  } catch (e) {
    res.status(500).send(new response(false, 500, "Something went wrong"));
  }
};

exports.validateResetPassword = async (req, res) => {
  try {
    const middleware = {
      email: "required|text|" + req.query.email,
      reset_code: "required|text|" + req.query.reset_code
    };
    if (utility.validateRequest(middleware)) {
      user.checkEmail(
        {
          email: req.query.email
        },
        function(errRes, resData) {
          if (!errRes) {
            if (utility.issetVal(resData)) {
              if (resData.reset_code == req.query.reset_code) {
                if (utility.issetVal(resData.reset_expired)) {
                  let now = moment(Date.now()).format("YYYY-MM-DD HH:mm:ss");
                  let expired = moment(resData.reset_expired)
                    .utc()
                    .format("YYYY-MM-DD HH:mm:ss");
                  if (expired >= now) {
                    res.status(200).send(new response(true, 200, "Success!"));
                  } else {
                    res
                      .status(200)
                      .send(new response(false, 401, "Code Expired!"));
                  }
                } else {
                  res
                    .status(200)
                    .send(new response(false, 401, "Code Expired!"));
                }
              } else {
                res
                  .status(200)
                  .send(new response(false, 407, "Reset Code is Wrong!"));
              }
            } else {
              res
                .status(200)
                .send(new response(false, 405, "Email Not Registered4"));
            }
          } else {
            res
              .status(200)
              .send(new response(false, 405, "Email Not Registered3"));
          }
        }
      );
    } else {
      res.status(200).send(new response(false, 400, "Invalid input format"));
    }
  } catch (e) {
    res.status(500).send(new response(false, 500, "Something went wrong"));
  }
};

exports.getAll = async (req, res) => {
  try {
    const middleware = {
      user_id: "required|text|" + req.body.user_id,
      auth_code: "required|text|" + req.body.auth_code,
      page: "required|text|" + req.body.page,
      search_name: "no|text|" + req.body.search_name,
      interest_id: "no|text|" + req.body.interest_id,
      batch: "no|text|" + req.body.batch
    };
    // console.log(middleware);
    if (utility.validateRequest(middleware)) {
      const result = await user.getAuth(req.body, function(errAuth, resAuth) {
        console.log(errAuth);
        if (!errAuth) {
          if (!utility.issetVal(resAuth)) {
            res.status(200).send(new response(false, 403, "Unauthorized1"));
          } else {
            if (resAuth.auth_code == req.body.auth_code) {
              //here goes the function
              let body = {
                verified: "2"
              };
              utility.issetVal(req.body.search_name)
                ? (body.name = req.body.search_name)
                : (body.name = null);
              utility.issetVal(req.body.interest_id)
                ? (body.interest_id = req.body.interest_id)
                : (body.interest_id = null);
              utility.issetVal(req.body.batch)
                ? (body.batch = req.body.batch)
                : (body.batch = null);

              user.getCountData(body, function(errResCount, rowsResCount) {
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
                      verified: "2"
                    };
                    utility.issetVal(req.body.search_name)
                      ? (PreparedData.name = req.body.search_name)
                      : (PreparedData.name = null);
                    utility.issetVal(req.body.interest_id)
                      ? (PreparedData.interest_id = req.body.interest_id)
                      : (PreparedData.interest_id = null);
                    utility.issetVal(req.body.batch)
                      ? (PreparedData.batch = req.body.batch)
                      : (PreparedData.batch = null);

                    user.getAll(PreparedData, function(errRes, rowsRes) {
                      // console.log(PreparedData);
                      if (!errRes) {
                        if (utility.issetVal(rowsRes)) {
                          const totalInfo = {
                            total_page: total_page,
                            total_data_all: total_data,
                            total_data: rowsRes.length
                          };
                          for (var i = 0; i < rowsRes.length; i++) {
                            if (!utility.issetVal(rowsRes[i].img)) {
                              rowsRes[i].img = null;
                            } else {
                              rowsRes[i].img =
                                url.url_img + "user/" + rowsRes[i].img;
                            }
                          }
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

exports.getMention = async (req, res) => {
  try {
    const middleware = {
      user_id: "required|text|" + req.body.user_id,
      auth_code: "required|text|" + req.body.auth_code
    };
    if (utility.validateRequest(middleware)) {
      const result = await user.getAuth(req.body, function(errAuth, resAuth) {
        if (utility.issetVal(resAuth)) {
          if (resAuth.auth_code == req.body.auth_code) {
            const PreparedData = {
              verified: "2"
            };
            user.getMention(PreparedData, function(errRes, rowsRes) {
              if (utility.issetVal(rowsRes)) {
                res.status(200).send(
                  new response(true, 200, "Fetch Success", {
                    data: rowsRes
                  })
                );
              } else {
                res.status(200).send(new response(false, 401, "Fetch Failed4"));
              }
            });
          } else {
            res.status(200).send(new response(false, 403, "Unauthorized2"));
          }
        } else {
          res.status(200).send(new response(false, 403, "Unauthorized1"));
        }
      });
    } else {
      res.status(200).send(new response(false, 400, "Invalid input format"));
    }
  } catch (error) {
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
    // console.log(middleware);
    if (utility.validateRequest(middleware)) {
      const result = await user.getAuth(req.body, function(errAuth, resAuth) {
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

              user.getById(body, function(errRes, resData) {
                console.log({ resData: resData });
                // console.log(errRes);
                if (!errRes) {
                  if (utility.issetVal(resData)) {
                    resData.img = url.url_img + "user/" + resData.img;
                    res
                      .status(200)
                      .send(new response(true, 200, "Fetch success", resData));
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

exports.listHighlight = async (req, res) => {
  try {
    const middleware = {
      user_id: "required|text|" + req.body.user_id,
      auth_code: "required|text|" + req.body.auth_code,
      page: "required|text|" + req.body.page,
      item: "no|text|" + req.body.item
    };
    // console.log(middleware);
    if (utility.validateRequest(middleware)) {
      const result = await user.getAuth(req.body, function(errAuth, resAuth) {
        console.log(errAuth);
        if (!errAuth) {
          if (!utility.issetVal(resAuth)) {
            res.status(200).send(new response(false, 403, "Unauthorized"));
          } else {
            if (resAuth.auth_code == req.body.auth_code) {
              //here goes the function
              let body = {};
              utility.issetVal(req.body.year)
                ? (body.year = req.body.year)
                : (body.year = null);

              alumniHighlight.getCountData(body, function(
                errResCount,
                rowsResCount
              ) {
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
                      limit: itemPerRequest
                    };
                    utility.issetVal(req.body.year)
                      ? (PreparedData.year = req.body.year)
                      : (PreparedData.year = null);

                    alumniHighlight.getAll(PreparedData, function(
                      errRes,
                      rowsRes
                    ) {
                      console.log(errRes);
                      if (!errRes) {
                        const totalInfo = {
                          total_page: total_page,
                          total_data_all: total_data,
                          total_data: rowsRes.length
                        };
                        if (utility.issetVal(rowsRes)) {
                          for (var i = 0; i < rowsRes.length; i++) {
                            if (!utility.issetVal(rowsRes[i].img)) {
                              rowsRes[i].img = null;
                            } else {
                              rowsRes[i].img =
                                url.url_img + "user/" + rowsRes[i].img;
                            }
                          }
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

exports.getDetailHighlight = async (req, res) => {
  try {
    const middleware = {
      user_id: "required|text|" + req.body.user_id,
      auth_code: "required|text|" + req.body.auth_code,
      id: "required|text|" + req.body.id
    };
    // console.log(middleware);
    if (utility.validateRequest(middleware)) {
      const result = await user.getAuth(req.body, function(errAuth, resAuth) {
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
                // console.log(resData);
                // console.log(errRes);
                if (!errRes) {
                  if (utility.issetVal(resData)) {
                    resData.img = url.url_img + "user/" + resData.img;
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

exports.submitRecommend = async (req, res) => {
  try {
    const middleware = {
      auth_code: "required|text|" + req.body.auth_code,
      user_id: "required|text|" + req.body.user_id,
      recommendation_id: "required|text|" + req.body.recommendation_id,
      reason: "required|text|" + req.body.reason
    };
    if (utility.validateRequest(middleware)) {
      const result = user.getAuth(req.body, function(errAuth, resAuth) {
        if (!errAuth) {
          if (!utility.issetVal(resAuth)) {
            res.status(200).send(new response(false, 403, "Unauthorized"));
          } else {
            //here goes the function
            const body = {
              id: utility.generateHash(32),
              user_id: req.body.recommendation_id,
              recommender_id: req.body.user_id,
              reason: req.body.reason,
              month: moment(Date.now()).format("MM"),
              year: moment(Date.now()).format("YYYY"),
              create_date: moment(Date.now()).format("YYYY-MM-DD HH:mm:ss")
            };
            AlumniRecommend.addData(body, function(err, resData) {
              console.log(body);
              if (!err) {
                res
                  .status(200)
                  .send(new response(true, 200, "Recommend success", resData));
              } else {
                res
                  .status(200)
                  .send(new response(false, 401, "Recommend failed", err));
              }
            });
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
  } catch (e) {
    console.log(e);
    res.status(500).send(new response(false, 500, "Something went wrong"));
  }
};

exports.update = async (req, res) => {
  console.log("Controller_user/update");
  // console.log(req.body)
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
          console.log("valid");
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
          name: "required|text|" + formJSON.name,
          lineservice_id: "no|text|" + formJSON.lineservice_id,
          batch: "required|text|" + formJSON.batch,
          img: "no|images|" + formJSON.img,
          facebook: "no|text|" + formJSON.facebook,
          twitter: "no|text|" + formJSON.twitter,
          linkedin: "no|text|" + formJSON.linkedin,
          instagram: "no|text|" + formJSON.instagram,
          whatsapp: "no|number|" + formJSON.whatsapp
        };

        // console.log(formJSON)
        // console.log(utility.validateRequest(middleware))

        if (utility.validateRequest(middleware)) {
          user.getAuth(formJSON, function(errAuth, resAuth) {
            // console.log({err : errAuth})
            // console.log({resAuth : resAuth})
            // console.log(!errAuth)
            if (!errAuth) {
              if (!utility.issetVal(resAuth)) {
                res.status(200).send(new response(false, 403, "Unauthorized2"));
              } else {
                if (resAuth.auth_code == formJSON.auth_code) {
                  console.log("setelah fromData");
                  const body = {
                    id: formJSON.user_id,
                    auth_code: formJSON.auth_code,
                    name: formJSON.name,
                    lineservice_id: formJSON.lineservice_id,
                    batch: formJSON.batch,
                    img: formJSON.img,
                    facebook: formJSON.facebook || "",
                    twitter: formJSON.twitter || "",
                    linkedin: formJSON.linkedin || "",
                    instagram: formJSON.instagram || "",
                    whatsapp: formJSON.whatsapp || ""
                  };
                  console.log({ body: body });
                  user.getById(resAuth, function(errUser, resUser) {
                    // console.log({errUser : errUser})
                    // console.log({resUser : resUser})
                    if (!errUser) {
                      if (utility.issetVal(resUser)) {
                        if (
                          utility.cleanJSON(body).img != null ||
                          utility.cleanJSON(body).img != undefined
                        ) {
                          if (utility.issetVal(resUser.img)) {
                            // console.log('aaaa')
                            utility.cleanImage(resUser.img, pathDir);
                          }
                        }
                        user.updateData(utility.cleanJSON(body), function(
                          err,
                          resData
                        ) {
                          if (!err) {
                            if (!utility.issetVal(resData)) {
                              utility.cleanImage(formJSON.img, pathDir);
                              res
                                .status(200)
                                .send(
                                  new response(false, 401, "Update failed")
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
                                user.triggerUpdateUserMongo(resUser, function(
                                  errTrigger,
                                  trigger
                                ) {
                                  // console.log('TriggerErr', errTrigger);
                                  // console.log('trigger', trigger);
                                });
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
                              .send(new response(false, 401, "Update failed"));
                          }
                        });
                      } else {
                        console.log(errUser);
                        utility.cleanImage(formJSON.img, pathDir);
                        res
                          .status(200)
                          .send(new response(false, 404, "Data not exist2"));
                      }
                    } else {
                      console.log(errUser);
                      utility.cleanImage(formJSON.img, pathDir);
                      res
                        .status(200)
                        .send(new response(false, 404, "Data not exist2"));
                    }
                  });
                } else {
                  res
                    .status(200)
                    .send(new response(false, 403, "Unauthorized2"));
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

exports.changePassword = async (req, res) => {
  console.log(`changePassword`);

  try {
    const middleware = {
      user_id: "required|text|" + req.body.user_id,
      auth_code: "required|text|" + req.body.auth_code,
      old_password: "required|text|" + req.body.old_password,
      new_password: "required|text|" + req.body.new_password
    };

    if (utility.validateRequest(middleware)) {
      await user.getAuth(req.body, function(errAuth, resAuth) {
        if (!errAuth) {
          if (!utility.issetVal(resAuth)) {
            res.status(200).send(new response(false, 403, "Unauthorized"));
          } else {
            if (resAuth.auth_code == req.body.auth_code) {
              let body = {
                id: resAuth.id
              };
              user.getById(body, function(errGet, resGet) {
                let forgetpassword = utility.doHash(resGet.password);
                if (!utility.issetVal(errGet)) {
                  let old_password = utility.doHash(
                    req.body.old_password,
                    resGet.salt_hash
                  );

                  if (old_password === resGet.password) {
                    let new_password = utility.doHash(
                      req.body.new_password,
                      resGet.salt_hash
                    );
                    body["password"] = new_password;
                    user.updateData(body, function(err, resData) {
                      if (!err) {
                        res
                          .status(200)
                          .send(
                            new response(true, 200, "Set Password success")
                          );
                      } else {
                        res
                          .status(200)
                          .send(
                            new response(false, 401, "Set Password Failed")
                          );
                      }
                    });
                  } else {
                    res
                      .status(200)
                      .send(new response(false, 407, "incorrect password"));
                  }
                } else {
                  res
                    .status(200)
                    .send(new response(false, 404, "err:: Data Not exist"));
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
    res.status(500).send(new response(false, 500, "Something went wrong"));
  }
};

exports.changeEmail = async (req, res) => {
  console.log("Change Email");

  try {
    const middleware = {
      user_id: "required|text|" + req.body.user_id,
      auth_code: "required|text|" + req.body.auth_code,
      new_email: "required|text|" + req.body.new_email
    };

    if (utility.validateRequest(middleware)) {
      await user.getAuth(req.body, function(errAuth, resAuth) {
        if (!errAuth) {
          if (!utility.issetVal(resAuth)) {
            res.status(200).send(new response(false, 403, "Unauthorized"));
          } else {
            // proses di mulai dari sini
            if (resAuth.auth_code == req.body.auth_code) {
              user.checkEmail(
                {
                  email: req.body.new_email
                },
                function(errRes, resData) {
                  console.log("Check Email");

                  if (resData) {
                    res
                      .status(200)
                      .send(new response(false, 402, "Email Already Exist"));
                  } else {
                    let body = {
                      id: resAuth.id,
                      email: req.body.new_email
                    };
                    user.updateData(body, function(err, resData) {
                      if (!err) {
                        res
                          .status(200)
                          .send(new response(true, 200, "Set Email success"));
                      } else {
                        res
                          .status(200)
                          .send(new response(false, 401, "Set Email Failed"));
                      }
                    });
                  }
                }
              );
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

exports.updatePrivacy = async (req, res) => {
  try {
    // console.log(req.body);
    const middleware = {
      user_id: "required|text|" + req.body.user_id,
      auth_code: "required|text|" + req.body.auth_code
    };
    if (utility.validateRequest(middleware)) {
      const result = user.getAuth(req.body, function(errAuth, resAuth) {
        if (!errAuth) {
          if (!utility.issetVal(resAuth)) {
            res.status(200).send(new response(false, 403, "Unauthorized"));
          } else {
            //here goes the function
            const body = {
              user_id: req.body.user_id,
              dob: req.body.dob,
              lineservice: req.body.lineservice,
              phone: req.body.phone,
              email: req.body.email,
              experience: req.body.experience,
              education: req.body.education
            };
            // console.log(body);
            alumniPrivacy.getOne(
              {
                user_id: body.user_id
              },
              function(err, resById) {
                if (!err) {
                  if (utility.issetVal(resById)) {
                    alumniPrivacy.updateData(utility.cleanJSON(body), function(
                      err,
                      resData
                    ) {
                      console.log("data", err);
                      if (!err) {
                        if (!utility.issetVal(resData)) {
                          // console.log('res', resData)
                          res
                            .status(200)
                            .send(new response(false, 401, "Update failed"));
                        } else {
                          res
                            .status(200)
                            .send(
                              new response(true, 200, "Update success", resData)
                            );
                        }
                      } else {
                        res
                          .status(200)
                          .send(new response(false, 401, "Update failed"));
                      }
                    });
                  } else {
                    res
                      .status(200)
                      .send(new response(false, 404, "Data not exist2"));
                  }
                } else {
                  res
                    .status(200)
                    .send(new response(false, 404, "Data not exist2"));
                }
              }
            );
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

exports.changePhone = async (req, res) => {
  console.log("Change Number Phone");

  try {
    const middleware = {
      user_id: "required|text|" + req.body.user_id,
      auth_code: "required|text|" + req.body.auth_code,
      new_phone: "required|text|" + req.body.new_phone
    };

    if (utility.validateRequest(middleware)) {
      await user.getAuth(req.body, function(errAuth, resAuth) {
        if (!errAuth) {
          if (!utility.issetVal(resAuth)) {
            res.status(200).send(new response(false, 403, "Unauthorized"));
          } else {
            // proses di mulai dari sini
            if (resAuth.auth_code == req.body.auth_code) {
              // console.log('sekarang waktu nya update number phone ')
              // console.log(resAuth)

              user.checkPhone(
                {
                  phone: req.body.new_phone
                },
                function(errRes, resData) {
                  // console.log('Cek Phone')
                  // console.log({
                  //   errRes: errRes
                  // })
                  // console.log({
                  //   resData: resData
                  // })
                  if (resData) {
                    res
                      .status(200)
                      .send(
                        new response(false, 402, "Number Phone Already Exist")
                      );
                  } else {
                    let body = {
                      id: resAuth.id,
                      phone: req.body.new_phone
                    };
                    user.updateData(body, function(err, resData) {
                      if (err) {
                        res
                          .status(200)
                          .send(
                            new response(false, 401, "Set Number Phone Failed")
                          );
                      } else {
                        res
                          .status(200)
                          .send(
                            new response(true, 200, "Set Number Phone success")
                          );
                      }
                    });
                  }
                }
              );
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
    res.status(500).send(new response(false, 500, "Something went wrong"));
  }
};
exports.getPrivacy = async (req, res) => {
  try {
    const middleware = {
      user_id: "required|text|" + req.body.user_id,
      auth_code: "required|text|" + req.body.auth_code
    };
    if (utility.validateRequest(middleware)) {
      const result = user.getAuth(req.body, function(errAuth, resAuth) {
        if (!errAuth) {
          if (!utility.issetVal(resAuth)) {
            res.status(200).send(new response(false, 403, "Unauthorized"));
          } else {
            //here goes the function
            const body = {
              user_id: req.body.user_id
            };

            alumniPrivacy.getOne(body, function(err, resData) {
              if (!err) {
                if (utility.issetVal(resData)) {
                  res
                    .status(200)
                    .send(new response(true, 200, "Fetch success", resData));
                } else {
                  res
                    .status(200)
                    .send(new response(false, 401, "Fetch Failed"));
                }
              } else {
                res.status(200).send(new response(false, 401, "Fetch Failed2"));
              }
            });
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

exports.getListEducation = async (req, res) => {
  // console.log(req.body)
  try {
    const middleware = {
      user_id: "required|text|" + req.body.user_id,
      auth_code: "required|text|" + req.body.auth_code,
      school: "no|text|" + req.body.school
    };

    if (utility.validateRequest(middleware)) {
      await user.getAuth(req.body, function(errAuth, resAuth) {
        if (!errAuth) {
          if (!utility.issetVal(resAuth)) {
            res.status(200).send(new response(false, 403, "Unauthorized"));
          } else {
            // proses di mulai dari sini
            const school = {
              column: "school",
              bySearch: req.body.school,
              user_id: req.body.user_id
            };

            almuniEducation.getCountData(school, function(
              errGetCount,
              resGetCount
            ) {
              // console.log({errGetCount});
              // console.log(resGetCount)
              let itemPerRequest = utility.issetVal(req.body.item)
                ? parseInt(req.body.item)
                : 15;
              let page = req.body.page;
              let total_data = resGetCount;
              let total_page = Math.ceil(total_data / itemPerRequest);

              let limitBefore =
                page <= 1 || page == null ? 0 : (page - 1) * itemPerRequest;

              const PreparedData = {
                user_id: req.body.user_id,
                column: "school",
                colOrder: "end_date",
                orderBy: "asc",
                bySearch: req.body.school,
                start: limitBefore,
                limit: itemPerRequest
              };

              if (resGetCount) {
                almuniEducation.getByFilter(PreparedData, function(
                  errRes,
                  resData
                ) {
                  if (!utility.issetVal(errRes)) {
                    // console.log(resData)
                    const totalInfo = {
                      total_page: total_page,
                      total_data_all: total_data,
                      total_data: resData.length
                    };

                    if (utility.issetVal(resData)) {
                      let arrayData = [];
                      resData.map(data => {
                        // data['start_date'] = moment(moment(data.start_date,'DD-MM-YYYY')).format("YYYY")
                        // data['end_date'] = moment(moment(data.end_date,'DD-MM-YYYY')).format("YYYY")
                        arrayData.push(data);
                      });
                      res.status(200).send(
                        new response(true, 200, "Fetch Success", {
                          data: arrayData,
                          total: totalInfo
                        })
                      );
                    } else {
                      res
                        .status(200)
                        .send(new response(false, 401, "Fetch Failed"));
                    }
                  } else {
                    res
                      .status(200)
                      .send(new response(false, 401, "Fetch Failed2"));
                  }
                });
              } else {
                res.status(200).send(new response(false, 401, "Fetch Failed"));
              }
            });
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

exports.insertEducation = async (req, res) => {
  console.log("Insert Education");
  let start_date = moment(moment(req.body.start_date, "YYYY")).format(
    "YYYY-MM-DD"
  );
  let end_date = moment(moment(req.body.end_date, "YYYY")).format("YYYY-MM-DD");

  try {
    const middleware = {
      user_id: "required|text|" + req.body.user_id,
      auth_code: "required|text|" + req.body.auth_code,
      school: "required|text|" + req.body.school,
      field_of_study: "required|text|" + req.body.field_of_study,
      degree: "required|text|" + req.body.degree,
      field_of_study: "required|text|" + req.body.field_of_study,
      start_date: "required|text|" + start_date,
      end_date: "required|text|" + end_date
    };

    if (utility.validateRequest(middleware)) {
      await user.getAuth(req.body, function(errAuth, resAuth) {
        if (!errAuth) {
          if (!utility.issetVal(resAuth)) {
            res.status(200).send(new response(false, 403, "Unauthorized"));
          } else {
            // proses di mulai dari sini
            if (resAuth.auth_code == req.body.auth_code) {
              console.log("sekarang Insert Education ");

              let body = {
                id: utility.generateHash(32),
                user_id: req.body.user_id,
                school: req.body.school,
                field_of_study: req.body.field_of_study,
                degree: req.body.degree,
                field_of_study: req.body.field_of_study,
                start_date: start_date,
                end_date: end_date
              };
              console.log(body);
              almuniEducation.addData(body, function(err, resData) {
                if (!err) {
                  res
                    .status(200)
                    .send(
                      new response(true, 200, "Insert Data success1", resData)
                    );
                } else {
                  res
                    .status(200)
                    .send(new response(false, 401, "Insert Data failed1", err));
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
    res.status(500).send(new response(false, 500, "Something went wrong"));
  }
};

exports.deleteEducation = async (req, res) => {
  console.log("Delete Education");
  try {
    const middleware = {
      user_id: "required|text|" + req.query.user_id,
      auth_code: "required|text|" + req.query.auth_code,
      id: "required|text|" + req.query.id
    };

    if (utility.validateRequest(middleware)) {
      await user.getAuth(req.query, function(errAuth, resAuth) {
        if (!errAuth) {
          if (!utility.issetVal(resAuth)) {
            res.status(200).send(new response(false, 403, "Unauthorized"));
          } else {
            // proses di mulai dari sini
            if (resAuth.auth_code == req.query.auth_code) {
              // console.log('Waktunya Delete')
              let body = {
                id: req.query.id
              };
              almuniEducation.deleteData(body, function(errData, resData) {
                // console.log(resData)
                if (resData) {
                  res
                    .status(200)
                    .send(new response(true, 200, "Delete success"));
                } else {
                  res
                    .status(200)
                    .send(new response(false, 401, "Delete failed"));
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
    res.status(500).send(new response(false, 500, "Something went wrong"));
  }
};

exports.detailEducation = async (req, res) => {
  try {
    const middleware = {
      user_id: "required|text|" + req.body.user_id,
      auth_code: "required|text|" + req.body.auth_code,
      id: "required|text|" + req.body.id
    };
    console.log(middleware);
    if (utility.validateRequest(middleware)) {
      const result = await user.getAuth(req.body, function(errAuth, resAuth) {
        console.log(errAuth);
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

              almuniEducation.getById(body, function(errRes, resData) {
                // console.log(resData);
                // console.log(errRes);
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

exports.updateEducation = async (req, res) => {
  console.log("Update Education");
  // console.log(req.body)
  let start_date = moment(moment(req.body.start_date, "YYYY")).format(
    "YYYY-MM-DD"
  );
  let end_date = moment(moment(req.body.end_date, "YYYY")).format("YYYY-MM-DD");

  try {
    const middleware = {
      user_id: "required|text|" + req.body.user_id,
      auth_code: "required|text|" + req.body.auth_code,
      school: "required|text|" + req.body.school,
      field_of_study: "required|text|" + req.body.field_of_study,
      degree: "required|text|" + req.body.degree,
      field_of_study: "required|text|" + req.body.field_of_study,
      start_date: "required|text|" + start_date,
      end_date: "required|text|" + end_date
    };

    // console.log(middleware)

    if (utility.validateRequest(middleware)) {
      await user.getAuth(req.body, function(errAuth, resAuth) {
        if (!errAuth) {
          if (!utility.issetVal(resAuth)) {
            res.status(200).send(new response(false, 403, "Unauthorized"));
          } else {
            // proses di mulai dari sini
            if (resAuth.auth_code == req.body.auth_code) {
              console.log("sekarang Update Education ");

              let body = {
                id: req.body.id,
                user_id: req.body.user_id,
                school: req.body.school,
                field_of_study: req.body.field_of_study,
                degree: req.body.degree,
                field_of_study: req.body.field_of_study,
                start_date: start_date,
                end_date: end_date
              };

              almuniEducation.updateData(body, function(errRes, resGet) {
                if (resGet) {
                  res
                    .status(200)
                    .send(new response(true, 200, "Set Education success"));
                } else {
                  res
                    .status(200)
                    .send(new response(false, 401, "Set Education Failed"));
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
    res.status(500).send(new response(false, 500, "Something went wrong"));
  }
};

exports.addDevice = async (req, res) => {
  try {
    const middleware = {
      user_id: "required|text|" + req.body.user_id,
      auth_code: "required|text|" + req.body.auth_code,
      uuid: "required|text|" + req.body.uuid,
      token: "required|text|" + req.body.token,
      type: "required|text|" + req.body.type,
      os: "required|text|" + req.body.os,
      model: "required|text|" + req.body.model
    };

    // console.log(middleware)

    if (utility.validateRequest(middleware)) {
      await user.getAuth(req.body, function(errAuth, resAuth) {
        if (!errAuth) {
          if (!utility.issetVal(resAuth)) {
            res.status(200).send(new response(false, 403, "Unauthorized"));
          } else {
            // proses di mulai dari sini
            if (resAuth.auth_code == req.body.auth_code) {
              // console.log('sekarang Add Device ')

              let body = {
                id: utility.generateHash(32),
                subject_id: req.body.user_id,
                user_type: "user",
                uuid: req.body.uuid,
                token: req.body.token,
                type: req.body.type,
                os: req.body.os,
                model: req.body.model,
                create_date: moment(Date.now()).format("YYYY-MM-DD HH:mm:ss")
              };

              device.deleteData({ token: body.token }, function(
                errRes,
                resGet
              ) {
                // console.log(utility.issetVal(errRes))
                if (!errRes) {
                  console.log("delete device success");
                } else {
                  console.log("delete device failed");
                }
              });
              device.addData(body, function(errRes, resGet) {
                // console.log(utility.issetVal(errRes))
                console.log(body);
                if (!errRes) {
                  res
                    .status(200)
                    .send(
                      new response(true, 200, "Insert Device Success", body)
                    );
                } else {
                  res
                    .status(200)
                    .send(new response(false, 401, "Insert Device Failed"));
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
    res.status(500).send(new response(false, 500, "Something went wrong"));
  }
};

exports.deleteDevice = async (req, res) => {
  try {
    const middleware = {
      user_id: "required|text|" + req.body.user_id,
      auth_code: "required|text|" + req.body.auth_code,
      token: "required|text|" + req.body.token
    };

    // console.log(middleware)

    if (utility.validateRequest(middleware)) {
      await user.getAuth(req.body, function(errAuth, resAuth) {
        if (!errAuth) {
          if (!utility.issetVal(resAuth)) {
            res.status(200).send(new response(false, 403, "Unauthorized"));
          } else {
            // proses di mulai dari sini
            if (resAuth.auth_code == req.body.auth_code) {
              // console.log('sekarang Add Device ')
              device.deleteData({ token: req.body.token }, function(
                errRes,
                resGet
              ) {
                // console.log(utility.issetVal(errRes))
                if (!errRes) {
                  res
                    .status(200)
                    .send(new response(true, 200, "Delete Device Success"));
                } else {
                  res
                    .status(200)
                    .send(new response(false, 401, "Delete Device Failed"));
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
    res.status(500).send(new response(false, 500, "Something went wrong"));
  }
};

exports.crawAuth = async (req, res) => {
  try {
    const middleware = {
      user_id: "required|text|" + req.query.user_id,
      auth_code: "required|text|" + req.query.auth_code
    };

    // console.log(middleware)

    if (utility.validateRequest(middleware)) {
      await user.getAuth(req.query, function(errAuth, resAuth) {
        console.log(req.query);
        if (!errAuth) {
          if (!utility.issetVal(resAuth)) {
            res.status(200).send(new response(false, 403, "Unauthorized"));
          } else {
            // proses di mulai dari sini
            if (resAuth.auth_code == req.query.auth_code) {
              res.status(200).send(new response(true, 200, "Authorized"));
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
    res.status(500).send(new response(false, 500, "Something went wrong"));
  }
};

exports.getAllVerified = async (req, res) => {
  try {
    const middleware = {
      user_id: "required|text|" + req.body.user_id,
      auth_code: "required|text|" + req.body.auth_code,
      page: "required|text|" + req.body.page,
      item: "no|text|" + req.body.item
    };
    // console.log(middleware);
    if (utility.validateRequest(middleware)) {
      const result = await user.getAuth(req.body, function(errAuth, resAuth) {
        // console.log({errAuth : errAuth});
        // console.log({resAuth : resAuth});
        if (!errAuth) {
          if (!utility.issetVal(resAuth)) {
            res.status(200).send(new response(false, 403, "Unauthorized"));
          } else {
            // console.log(resAuth.auth_code);
            if (resAuth.auth_code == req.body.auth_code) {
              //here goes the function
              let bodyCount = {
                verified: "2"
              };
              if (utility.issetVal(req.body.search)) {
                bodyCount.keyword = req.body.search;
              }
              if (utility.issetVal(req.body.search_by_batch)) {
                bodyCount.batch = req.body.search_by_batch;
              }
              if (utility.issetVal(req.body.search_by_interest)) {
                bodyCount.interest_id = req.body.search_by_interest;
              }
              // console.log({bodyCount : bodyCount});
              user.getCountVerified(bodyCount, function(
                errResCount,
                rowsResCount
              ) {
                // console.log({errResCount : errResCount});
                // console.log({rowsResCount: rowsResCount});
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
                      verified: 2
                    };
                    if (utility.issetVal(req.body.search)) {
                      PreparedData.keyword = req.body.search;
                    }
                    if (utility.issetVal(req.body.search_by_batch)) {
                      PreparedData.batch = req.body.search_by_batch;
                    }
                    if (utility.issetVal(req.body.search_by_interest)) {
                      PreparedData.interest_id = req.body.search_by_interest;
                    }
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
                      .send(new response(false, 404, "Data Not Exist"));
                  }
                } else {
                  res
                    .status(200)
                    .send(new response(false, 404, "Data Not Exist"));
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

exports.validatePassword = async (req, res) => {
  console.log("VALIDATE PASSWORD");
  const { user_id, auth_code, password } = req.body;
  try {
    const middleware = {
      user_id: "required|text|" + user_id,
      auth_code: "required|text|" + auth_code,
      password: "required|text|" + password
    };
    if (utility.validateRequest(middleware)) {
      await user.getAuth(req.body, function(errAuth, resAuth) {
        if (utility.issetVal(resAuth)) {
          console.log(resAuth);
          let passwordDohash = utility.doHash(password, resAuth.salt_hash);
          // console.log({passwordDohash : passwordDohash});
          let bodyGetOne = {
            password: resAuth.password,
            doHashPassword: passwordDohash
          };
          // console.log({bodyGetOne : bodyGetOne});
          if (bodyGetOne.password === bodyGetOne.doHashPassword) {
            res.status(200).send(new response(true, 200, "Validate Success"));
          } else {
            res.status(200).send(new response(false, 401, "Validate Failed"));
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
    res.status(500).send(new response(false, 500, "Something went wrong"));
  }
};

exports.checkPrivacy = async (req, res) => {
  try {
    const middleware = {
      user_id: "required|text|" + req.body.user_id,
      auth_code: "required|text|" + req.body.auth_code,
      alumni_id: "required|text|" + req.body.alumni_id
    };
    if (utility.validateRequest(middleware)) {
      const result = user.getAuth(req.body, function(errAuth, resAuth) {
        if (!errAuth) {
          if (!utility.issetVal(resAuth)) {
            res.status(200).send(new response(false, 403, "Unauthorized"));
          } else {
            //here goes the function
            const body = {
              user_id: req.body.alumni_id
            };

            alumniPrivacy.getOne(body, function(err, resData) {
              if (!err) {
                if (utility.issetVal(resData)) {
                  res
                    .status(200)
                    .send(new response(true, 200, "Fetch success", resData));
                } else {
                  res
                    .status(200)
                    .send(new response(false, 401, "Fetch Failed"));
                }
              } else {
                res.status(200).send(new response(false, 401, "Fetch Failed2"));
              }
            });
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

exports.getListByAlumni = async (req, res) => {
  try {
    const middleware = {
      user_id: "required|text|" + req.body.user_id,
      auth_code: "required|text|" + req.body.auth_code,
      alumni_id: "required|text|" + req.body.alumni_id,
      page: "no|text|" + req.body.page
    };

    if (utility.validateRequest(middleware)) {
      await user.getAuth(req.body, function(errAuth, resAuth) {
        if (!errAuth) {
          if (!utility.issetVal(resAuth)) {
            res.status(200).send(new response(false, 403, "Unauthorized"));
          } else {
            // proses di mulai dari sini
            const school = {
              column: "user_id",
              user_id: req.body.alumni_id
            };

            almuniEducation.getCountData(school, function(
              errGetCount,
              resGetCount
            ) {
              console.log({ errGetCount });
              console.log({ resGetCount });
              let itemPerRequest = utility.issetVal(req.body.item)
                ? parseInt(req.body.item)
                : 15;
              let page = req.body.page;
              let total_data = resGetCount;
              let total_page = Math.ceil(total_data / itemPerRequest);

              let limitBefore =
                page <= 1 || page == null ? 0 : (page - 1) * itemPerRequest;

              const PreparedData = {
                user_id: req.body.alumni_id,
                column: "user_id",
                colOrder: "end_date",
                orderBy: "desc",
                bySearch: null,
                start: limitBefore,
                limit: itemPerRequest
              };

              if (resGetCount) {
                almuniEducation.getByFilter(PreparedData, function(
                  errRes,
                  resData
                ) {
                  console.log({ errRes });
                  console.log({ resData });
                  if (!utility.issetVal(errRes)) {
                    // console.log(resData)
                    const totalInfo = {
                      total_page: total_page,
                      total_data_all: total_data,
                      total_data: resData.length
                    };

                    if (utility.issetVal(resData)) {
                      let arrayData = [];
                      resData.map(data => {
                        // data['start_date'] = moment(moment(data.start_date,'DD-MM-YYYY')).format("YYYY")
                        // data['end_date'] = moment(moment(data.end_date,'DD-MM-YYYY')).format("YYYY")
                        arrayData.push(data);
                      });
                      res.status(200).send(
                        new response(true, 200, "Fetch Success", {
                          data: arrayData,
                          total: totalInfo
                        })
                      );
                    } else {
                      res
                        .status(200)
                        .send(new response(false, 401, "Fetch Failed"));
                    }
                  } else {
                    res
                      .status(200)
                      .send(new response(false, 401, "Fetch Failed2"));
                  }
                });
              } else {
                res.status(200).send(new response(false, 401, "Fetch Failed"));
              }
            });
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

exports.getListInterestByAlumni = async (req, res) => {
  try {
    const middleware = {
      user_id: "required|text|" + req.body.user_id,
      auth_code: "required|text|" + req.body.auth_code,
      alumni_id: "required|text|" + req.body.alumni_id,
      page: "no|text|" + req.body.page
    };

    if (utility.validateRequest(middleware)) {
      await user.getAuth(req.body, function(errAuth, resAuth) {
        console.log({ errAuth });
        if (!errAuth) {
          if (!utility.issetVal(resAuth)) {
            res.status(200).send(new response(false, 403, "Unauthorized"));
          } else {
            alumniInterest.getCountByAlumni_id(
              { user_id: req.body.alumni_id },
              function(errCount, resCount) {
                let itemPerRequest = utility.issetVal(req.body.item)
                  ? parseInt(req.body.item)
                  : 15;
                let page = req.body.page;
                let total_data = resCount;
                let total_page = Math.ceil(total_data / itemPerRequest);

                let limitBefore =
                  page <= 1 || page == null ? 0 : (page - 1) * itemPerRequest;

                const PreparedData = {
                  start: limitBefore,
                  limit: itemPerRequest,
                  user_id: req.body.alumni_id
                };
                alumniInterest.getAllByAlumni_id(PreparedData, function(
                  errGet,
                  resGet
                ) {
                  // console.log({resGet : resGet.length});
                  const totalInfo = {
                    total_page: total_page,
                    total_data_all: total_data,
                    total_data: resGet.length
                  };
                  if (utility.issetVal(resGet)) {
                    res.status(200).send(
                      new response(true, 200, "Fetch Success", {
                        data: resGet,
                        total: totalInfo
                      })
                    );
                  } else {
                    res
                      .status(200)
                      .send(new response(false, 400, "Fetch failed"));
                  }
                });
              }
            );
            // proses di mulai dari sini
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
    res.status(500).send(new response(false, 500, "Something went wrong"));
  }
};

exports.getAllVerifiedWithoutMe = async (req, res) => {
  try {
    const middleware = {
      user_id: "required|text|" + req.body.user_id,
      auth_code: "required|text|" + req.body.auth_code,
      page: "required|text|" + req.body.page,
      item: "no|text|" + req.body.item
    };
    // console.log(middleware);
    if (utility.validateRequest(middleware)) {
      const result = await user.getAuth(req.body, function(errAuth, resAuth) {
        // console.log({errAuth : errAuth});
        // console.log({resAuth : resAuth});
        if (!errAuth) {
          if (!utility.issetVal(resAuth)) {
            res.status(200).send(new response(false, 403, "Unauthorized"));
          } else {
            // console.log(resAuth.auth_code);
            if (resAuth.auth_code == req.body.auth_code) {
              //here goes the function
              let bodyCount = {
                verified: "2",
                user_id: req.body.user_id
              };
              if (utility.issetVal(req.body.search)) {
                bodyCount.keyword = req.body.search;
              }
              if (utility.issetVal(req.body.search_by_batch)) {
                bodyCount.batch = req.body.search_by_batch;
              }
              if (utility.issetVal(req.body.search_by_interest)) {
                bodyCount.interest_id = req.body.search_by_interest;
              }
              // console.log({bodyCount : bodyCount});
              user.getCountVerifiedWithoutMe(bodyCount, function(
                errResCount,
                rowsResCount
              ) {
                // console.log({errResCount : errResCount});
                // console.log({rowsResCount: rowsResCount});
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
                      user_id: req.body.user_id
                    };
                    if (utility.issetVal(req.body.search)) {
                      PreparedData.keyword = req.body.search;
                    }
                    if (utility.issetVal(req.body.search_by_batch)) {
                      PreparedData.batch = req.body.search_by_batch;
                    }
                    if (utility.issetVal(req.body.search_by_interest)) {
                      PreparedData.interest_id = req.body.search_by_interest;
                    }
                    // console.log({PreparedData : PreparedData});
                    user.getDataVerifiedWithoutMe(PreparedData, function(
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
                      .send(new response(false, 404, "Data Not Exis2t"));
                  }
                } else {
                  res
                    .status(200)
                    .send(new response(false, 404, "Data Not Exist1"));
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

exports.requestOtp = async (req, res) => {
  try {
    const middleware = {
      subject: `required|text|${req.body.subject}`,
      type: `required|text|${req.body.type}`
    };
    if (utility.validateRequest(middleware)) {
      let bodyNumber = {
        id: utility.generateHash(32),
        subject: req.body.subject,
        type: req.body.type,
        token: Math.floor(100000 + Math.random() * 900000),
        verification_expired: moment(new Date())
          .add(5, "minutes")
          .format("YYYY-MM-DD HH:mm:ss"),
        create_date: moment(new Date()).format("YYYY-MM-DD HH:mm:ss")
      };
      otp.addData(bodyNumber, (errAdd, resAdd) => {
        console.log(errAdd);
        if (!errAdd) {
          if (req.body.type == "email") {
            const mailBody = {
              receiver: req.body.subject,
              subject: "Request OTP Verification",
              body:
                "<p><i>*This is a message from OnePlus </i></p>" +
                "<p>Thank you for using this app, this your OTP Code " +
                bodyNumber.token +
                ".</p>" +
                "<p><i>*Do not reply to this e-mail.</i></p>" +
                "<p><i>Thank you!</i></p>"
            };
            nodemailer.mailSend(mailBody, function(err, resData) {
              console.log("errMailer", err);
              console.log("Mailer", resData);
            });
          }
          res.status(200).send(
            new response(true, 200, "Success!", {
              otp: bodyNumber.token
            })
          );
        } else {
          res
            .status(200)
            .send(new response(false, 401, "Failed Generate Token"));
        }
      });
    } else {
      res.status(200).send(new response(false, 400, "Invalid input format"));
    }
  } catch (error) {
    res.status(500).send(new response(false, 500, "Something went wrong"));
  }
};

exports.validateOtp = async (req, res) => {
  try {
    const middleware = {
      subject: `required|text|${req.body.subject}`,
      type: `required|text|${req.body.type}`,
      otp: `required|number|${req.body.otp}`
    };
    if (utility.validateRequest(middleware)) {
      otp.getOne(
        { subject: req.body.subject, type: req.body.type },
        (errNumber, resNumber) => {
          console.log({ resNumber: resNumber });
          if (resNumber.token == req.body.otp) {
            let now = moment(Date.now()).format("YYYY-MM-DD HH:mm:ss");
            let expired = moment(resNumber.verification_expired)
              .utc()
              .format("YYYY-MM-DD HH:mm:ss");
            console.log({ now: now });
            console.log({ expired: expired });
            if (expired >= now) {
              res.status(200).send(new response(true, 200, "Success!"));
            } else {
              res.status(200).send(new response(false, 401, "Code Expired!"));
            }
          } else {
            res
              .status(200)
              .send(new response(false, 407, "Reset Code is Wrong!"));
          }
        }
      );
    } else {
      res.status(200).send(new response(false, 400, "Invalid input format"));
    }
  } catch (error) {
    res.status(500).send(new response(false, 500, "Something went wrong"));
  }
};

exports.updateEula = async (req, res) => {
  try {
    const middleware = {
      user_id: `required|text|${req.body.user_id}`,
      auth_code: `required|text|${req.body.auth_code}`,
      eula_version: `required|text|${req.body.eula_version}`
    };
    if (utility.validateRequest(middleware)) {
      user.getAuth(req.body, (errAuth, resAuth) => {
        if (resAuth.auth_code == req.body.auth_code) {
          user.updateData(
            {
              id: req.body.user_id,
              eula_version: req.body.eula_version,
              eula_date: moment(Date.now()).format("YYYY-MM-DD HH:mm:ss")
            },
            (errUpdate, resUpdate) => {
              console.log({ errUpdate: errUpdate });
              if (!errUpdate) {
                res.status(200).send(new response(true, 200, "Update Success"));
              } else {
                res.status(200).send(new response(false, 401, "Update Failed"));
              }
            }
          );
        } else {
          res.status(200).send(new response(false, 403, "Unauthorized"));
        }
      });
    } else {
      res
        .status(200)
        .send(new response(false, 400, "Invalid input format", middleware));
    }
  } catch (error) {
    res.status(500).send(new response(false, 500, "Something went wrong"));
  }
};
