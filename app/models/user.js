const table = "T_User";
const exec = require("../../helpers/mssql_adapter");
var stringInject = require("stringinject");
const utility = require("../../helpers/utility");
const nodemailer = require("../../helpers/mail_adapter");

// setting image
const globals = require("../../configs/global");
const { config } = require("../../default");
let url = globals[config.environment]; // development || production

// Mongoose
const Comment = require("../../data/schema_postComment");
const Like = require("../../data/schema_postcommentLikes");
const postCommentLikes = require("../models/postcommentLikes");
let mongoose = require("mongoose");
let Schema = mongoose.Schema;
var ModelUser = require("../../data/schema_users");

module.exports = {
  deleteData: function(req, callback) {
    return exec.findByIdAndDelete(req.id, table, callback);
  },

  getById: function(req, callback) {
    let column = [
      "id",
      "name",
      "email",
      "phone",
      "phone1",
      "company",
      "position",
      "bio",
      "achievement",
      "type",
      "alumni",
      exec.knex.raw(`CASE WHEN type = 'pwc' AND  alumni = 'yes'
                THEN 'alumni'
                WHEN type = 'pwc' AND  alumni = 'no'
                THEN 'internal'
                ELSE 'external'
                END as type_alumni
            `),
      exec.knex.raw(`CASE WHEN verified = '2'
                THEN 'Verified'
                WHEN verified = '1'
                THEN 'Unverified'
                WHEN verified = '3'
                THEN 'Reject'
                ELSE 'Invited'
                END as status
            `),
      "batch",
      "dob",
      "gender",
      "img",
      "eula",
      "eula_version",
      "eula_date",
      "publish",
      "first_login",
      "join_date",
      "create_date",
      "resign_date",
      "lineservice_id"
    ];
    return exec.findById(req.id, column, table, callback);
  },

  getCountData: function(req, callback) {
    console.log({
      "req Count": req
    });
    let param = {};
    if (req.verified != undefined) {
      param.verified = req.verified;
    }
    if (req.islogged != undefined) {
      param.islogged = req.islogged;
    }
    console.log({
      "param model": param
    });

    return (
      exec
        .knex("T_User as user")
        .max("user.id as id")
        .max("user.name as name")
        .max("user.email as email")
        .max("user.phone as phone")
        .max("user.company as company")
        .max("user.position as position")
        .max("user.bio as bio")
        .max("user.type as type")
        .max("user.source as source")
        .max("user.achievement as achievement")
        .max("user.alumni as alumni")
        .max("user.batch as batch")
        .max("user.dob as dob")
        .max("user.gender as gender")
        .max("user.img as img")
        .max("user.eula as eula")
        .max("user.publish as publish")
        .max("user.first_login as first_login")
        .max("user.join_date as join_date")
        .max("user.create_date as create_date")
        .max("user.resign_date as resign_date")
        .max("user.lineservice_id as lineservice_id")
        .max("lineservice.title as lineservice_title")
        .max("interest_id as interest_id")
        .max("user.verified as verified")
        .select(
          exec.knex.raw(
            `(select TOP 1 create_date from AT_Form where user_id = [user].id) AS send_date`
          )
        )
        .select(
          exec.knex.raw(
            `(select TOP 1 form_code from AT_Form where user_id = [user].id) AS form_code`
          )
        )
        .select(
          exec.knex.raw(
            `(select TOP 1 form_id from AT_Form where user_id = [user].id) AS form_id`
          )
        )
        .select(
          exec.knex.raw(
            `(select TOP 1 answered from AT_Form where user_id = [user].id) AS answered`
          )
        )
        .leftJoin(
          "T_LineOfService as lineservice",
          "user.lineservice_id",
          "=",
          "lineservice.id"
        )
        .leftJoin(
          "AT_AlumniInterest",
          "AT_AlumniInterest.user_id",
          "=",
          "user.id"
        )
        .where(param)
        /*.where((builder)=>{
                if(utility.issetVal(req.keyword)){
                    builder.whereRaw('verified = ? and (name like ? or email like ?)', [`%${req.keyword}%`,`%${req.keyword}%`])
                } else {
                    builder.where(param)
                }
            })*/
        .modify(function(queryBuilder) {
          if (utility.issetVal(req.keyword)) {
            queryBuilder.whereRaw("(name like ? or email like ? )", [
              `%${req.keyword}%`,
              `%${req.keyword}%`
            ]);
            /* queryBuilder.andWhere('name', 'LIKE', `%${req.keyword}%`).orWhere('email', 'LIKE', `%${req.keyword}%`)
                    queryBuilder.andWhere(()=>{
                        console.log({'req builder' : req.keyword});
                        this.where('user.name', 'LIKE', `%${req.keyword}%`).orWhere('user.email', 'LIKE', `%${req.keyword}%`)
                        this.whereRaw('( name like ? or email like ? )', [`%${req.keyword}%`,`%${req.keyword}%`])
                    }) 
                     queryBuilder.raw(`and (email like '%hali%' or name like '%hali%')`) */
          }
          if (utility.issetVal(req.batch))
            queryBuilder.andWhere("batch", "LIKE", `%${req.batch}%`);
          if (utility.issetVal(req.create_date)) {
            let date = req.create_date.split("-").map(x => {
              return x.trim();
            });
            console.log({
              date
            });
            queryBuilder.whereBetween("user.create_date", date);
          }
          if (utility.issetVal(req.interest)) {
            queryBuilder.whereIn("interest_id", req.interest);
          }
          /* if (utility.issetVal(req.list_interest))
                    queryBuilder.whereIn('interest_id', req.list_interest) */
        })
        .groupBy("user.id")
        .then(datas => {
          console.log({ datas: datas });
          callback(null, datas.length);
        })
        .catch(function(error) {
          console.log({ error: error });
          callback(error, null);
        })
    );
  },

  getSelectUser: function(req, callback) {
    let param = {};

    return exec
      .knex("T_User as user")
      .max("user.id as id")
      .max("user.id as idx")
      .max("user.name as name")
      .max("user.img as img")
      .max("user.verified as verified")
      .max("user.create_date as create_date")
      .modify(function(queryBuilder) {
        if (utility.issetVal(req)) {
          if (utility.issetVal(req.keyword)) {
            queryBuilder.whereRaw("(name like ? or email like ? )", [
              `%${req.keyword}%`,
              `%${req.keyword}%`
            ]);
          }
        }
      })
      .groupBy("user.id")
      .orderBy("create_date", "desc")
      .then(datas => {
        callback(null, datas);
      })
      .catch(function(error) {
        callback(error, null);
      });
  },

  getAll: function(req, callback) {
    console.log({
      "req GetAll": req
    });
    let param = {};
    if (req.verified != undefined) {
      param.verified = req.verified;
    }
    if (req.islogged != undefined) {
      param.islogged = req.islogged;
    }
    console.log({
      "param model": param
    });

    return exec
      .knex("T_User as user")
      .max("user.id as id")
      .max("user.id as idx")
      .max("user.name as name")
      .max("user.email as email")
      .max("user.phone as phone")
      .max("user.company as company")
      .max("user.position as position")
      .max("user.bio as bio")
      .max("user.type as type")
      .max("user.source as source")
      .max("user.achievement as achievement")
      .max("user.alumni as alumni")
      .max("user.batch as batch")
      .max("user.dob as dob")
      .max("user.gender as gender")
      .max("user.img as img")
      .max("user.eula as eula")
      .max("user.eula_version as eula_version")
      .max("user.eula_date as eula_date")
      .max("user.publish as publish")
      .max("user.first_login as first_login")
      .max("user.join_date as join_date")
      .max("user.create_date as create_date")
      .max("user.resign_date as resign_date")
      .max("user.lineservice_id as lineservice_id")
      .max("lineservice.title as lineservice_title")
      .max("interest_id as interest_id")
      .max("user.verified as verified")
      .select(
        exec.knex.raw(
          `(select TOP 1 create_date from AT_Form where user_id = [user].id) AS send_date`
        )
      )
      .select(
        exec.knex.raw(
          `(select TOP 1 form_code from AT_Form where user_id = [user].id) AS form_code`
        )
      )
      .select(
        exec.knex.raw(
          `(select TOP 1 form_id from AT_Form where user_id = [user].id) AS form_id`
        )
      )
      .select(
        exec.knex.raw(
          `(select TOP 1 answered from AT_Form where user_id = [user].id) AS answered`
        )
      )
      .leftJoin(
        "T_LineOfService as lineservice",
        "user.lineservice_id",
        "=",
        "lineservice.id"
      )
      .leftJoin(
        "AT_AlumniInterest",
        "AT_AlumniInterest.user_id",
        "=",
        "user.id"
      )
      .where(param)
      .modify(function(queryBuilder) {
        if (utility.issetVal(req.keyword)) {
          queryBuilder.whereRaw("(name like ? or email like ? )", [
            `%${req.keyword}%`,
            `%${req.keyword}%`
          ]);
        }
        if (utility.issetVal(req.batch))
          queryBuilder.andWhere("batch", "LIKE", `%${req.batch}%`);
        if (utility.issetVal(req.create_date)) {
          let date = req.create_date.split("-").map(x => {
            return x.trim();
          });
          console.log({
            date
          });
          queryBuilder.whereBetween("user.create_date", date);
        }
        if (utility.issetVal(req.interest)) {
          queryBuilder.whereIn("interest_id", req.interest);
        }
        /* if (utility.issetVal(req.list_interest))
                    queryBuilder.whereIn('interest_id', req.list_interest) */
      })
      .groupBy("user.id")
      .orderBy("create_date", "desc")
      .limit(req.limit)
      .offset(req.start)
      .then(datas => {
        return Promise.all(
          datas.map(data => {
            if (data.type == "pwc" && data.alumni == "yes") {
              data.type_alumni = "alumni";
            } else if (data.type == "pwc" && data.alumni == "no") {
              data.type_alumni = "internal";
            } else {
              data.type_alumni = "external";
            }

            // console.log({'data verified' : data.verified});
            switch (data.verified) {
              case 0:
                data.status = "Invited";
                break;
              case 1:
                data.status = "Unverified";
                break;
              case 2:
                data.status = "Verified";
                break;
              case 3:
                data.status = "Reject";
                break;
              default:
                data.status = "Invited";
                break;
            }
            // data.eula_version = null
            // data.eula_date = null
            console.log({ user_id: data.id });
            return exec
              .knex("AT_AlumniInterest as alumniInterest")
              .select(
                "alumniInterest.interest_id",
                "alumniInterest.user_id",
                "interest.title as interest_title"
              )
              .leftJoin(
                "T_Interest as interest",
                "interest.id",
                "=",
                "alumniInterest.interest_id"
              )
              .where("alumniInterest.user_id", data.id)
              .then(resInterest => {
                data.interest = resInterest;
                return data;
              })
              .catch(error => {
                data.interest = null;
                return data;
              });
          })
        );
      })
      .then(datas => {
        callback(null, datas);
      })
      .catch(function(error) {
        callback(error, null);
      });
  },

  getCountDataPublish: function(req, callback) {
    return exec.getCountData(
      {
        publish: req.publish
      },
      table,
      callback
    );
  },

  getAllPublish: function(req, callback) {
    let param = utility.issetVal(req) ? req : {};

    let column = [
      "user.id",
      "user.name",
      "user.email",
      "user.phone",
      "user.company",
      "user.position",
      "user.bio",
      "user.type",
      "user.achievement",
      "user.alumni",
      exec.knex.raw(`CASE WHEN type = 'pwc' AND  alum   ni = 'yes'
                THEN 'alumni'
                WHEN type = 'pwc' AND  alumni = 'no'
                THEN 'internal'
                ELSE 'external'
                END as type_alumni
            `),
      exec.knex.raw(`CASE WHEN verified = '2'
                THEN 'Verified'
                WHEN verified = '1'
                THEN 'Unverified'
                WHEN verified = '3'
                THEN 'Reject'
                ELSE 'Invited'
                END as status
            `),
      "user.batch",
      "user.dob",
      "user.gender",
      "user.img",
      "user.eula",
      "user.eula_version",
      "user.eula_date",
      "user.publish",
      "user.first_login",
      "user.join_date",
      "user.create_date",
      "user.resign_date",
      "user.lineservice_id",
      "lineservice.title as lineservice_title"
    ];

    return exec
      .knex("T_User as user")
      .select(column)
      .leftJoin(
        "T_LineOfService as lineservice",
        "user.lineservice_id",
        "=",
        "lineservice.id"
      )
      .where({
        "user.publish": req.publish
      })
      .orderBy("user.create_date", "desc")
      .limit(req.limit)
      .offset(req.start)
      .then(datas => {
        callback(null, datas);
      })
      .catch(function(error) {
        callback(error, null);
      });
  },

  getSalt: function(req, callback) {
    return exec.findOne(
      {
        email: req.body.email
      },
      "salt_hash",
      null,
      table,
      callback
    );
  },

  getAuth: function(req, callback) {
    return exec.findOne(
      {
        id: req.user_id
      },
      "*",
      null,
      table,
      callback
    );
  },

  checkEmail: function(req, callback) {
    // console.log({'req checkEmail' : req});
    return exec.findOne(
      {
        email: req.email
      },
      "*",
      null,
      table,
      callback
    );
  },

  addData: function(req, callback) {
    // console.log({req, req});
    exec.knex
      .transaction(function(t) {
        return exec
          .knex(table)
          .transacting(t)
          .insert(req)
          .then(function(response) {
            // console.log(req)
            return exec
              .knex("AT_AlumniPrivacy")
              .transacting(t)
              .insert({
                user_id: req.id,
                create_date: req.create_date
              });
          });
      })
      .then(function(res) {
        console.log({ res: res });
        callback(null, res);
      })
      .catch(function(err) {
        callback(err, null);
      });
  },

  getSearch: function(req, callback) {
    return exec.find(
      {
        "email ": req.keyword
      },
      "*",
      table,
      callback
    );
  },

  updateData: function(req, callback) {
    console.log({
      req
    });
    return exec.findByIdAndUpdate(req.id, req, table, callback);
  },

  login: function(req, callback) {
    return exec.findOne(
      {
        email: req.email,
        password: req.password
      },
      "*",
      null,
      table,
      callback
    );
  },

  getData: function(req, callback) {
    return exec.findAll(req, "*", null, table, callback);
  },

  getOne: function(req, callback) {
    return exec.findOne(req, "*", null, table, callback);
  },

  getAllVerified: (req, callback) => {
    return exec
      .knex("T_User as user")
      .select("id")
      .where({
        "user.publish": "1",
        "user.verified": "2",
        "user.islogged": "1"
      })
      .then(datas => {
        return Promise.all(
          datas.map(data => {
            return (data = data.id);
          })
        )
          .then(response => {
            callback(null, response);
          })
          .catch(function(error) {
            callback(error, null);
          });
      })
      .catch(function(error) {
        callback(error, null);
      });
  },

  getAutocomplete: (req, callback) => {
    return exec
      .knex(table)
      .where("verified", 2)
      .where("publish", 1)
      .where("name", "LIKE", `%${req.keyword}%`)
      .orderBy("name")
      .then(datas => {
        callback(null, datas);
      })
      .catch(error => {
        callback(error, null);
      });
  },

  getCountVerified: function(req, callback) {
    console.log({
      "req getCount": req
    });
    let param = utility.issetVal(req)
      ? {
          verified: req.verified
        }
      : {};
    console.log({
      "param getCount": param
    });

    if (req.interest_id) {
      param.interest_id = req.interest_id;
    }
    if (req.batch) {
      param.batch = req.batch;
    }
    console.log(param);
    return exec
      .knex("T_User as user")
      .max("user.id as id")
      .max("user.name as name")
      .max("user.email as email")
      .max("user.phone as phone")
      .max("user.company as company")
      .max("user.position as position")
      .max("user.bio as bio")
      .max("user.type as type")
      .max("user.achievement as achievement")
      .max("user.alumni as alumni")
      .max("user.batch as batch")
      .max("user.dob as dob")
      .max("user.gender as gender")
      .max("user.img as img")
      .max("user.eula as eula")
      .max("user.eula_version as eula_version")
      .max("user.eula_date as eula_date")
      .max("user.publish as publish")
      .max("user.first_login as first_login")
      .max("user.join_date as join_date")
      .max("user.create_date as create_date")
      .max("user.resign_date as resign_date")
      .max("user.lineservice_id as lineservice_id")
      .max("lineservice.title as lineservice_title")
      .max("alumniInterest.interest_id as interest_id")
      .leftJoin(
        "T_LineOfService as lineservice",
        "user.lineservice_id",
        "=",
        "lineservice.id"
      )
      .leftJoin(
        "AT_AlumniInterest as alumniInterest",
        "user.id",
        "=",
        "alumniInterest.user_id"
      )
      .where(param)
      .modify(function(queryBuilder) {
        if (utility.issetVal(req.keyword)) {
          queryBuilder.whereRaw("(name like ? or email like ? )", [
            `%${req.keyword}%`,
            `%${req.keyword}%`
          ]);
          /*  queryBuilder.andWhere('user.name', 'LIKE', `%${req.keyword}%`)
                                .orWhere('user.email', 'LIKE', `%${req.keyword}%`) */
        }
        if (utility.issetVal(req.batch)) {
          queryBuilder.andWhere("user.batch", "LIKE", `%${req.batch}%`);
        }
        if (utility.issetVal(req.create_date)) {
          let date = req.create_date.split("-").map(x => {
            return x.trim();
          });
          console.log({
            date
          });
          queryBuilder.whereBetween("user.create_date", date);
        }
        if (utility.issetVal(req.interest)) {
          queryBuilder.andWhere("interest_id", "LIKE", `%${req.interest}%`);
        }
        if (utility.issetVal(req.list_interest)) {
          queryBuilder.whereIn("interest_id", req.list_interest);
        }
      })
      .groupBy("user.id")
      .then(datas => {
        callback(null, datas.length);
      })
      .catch(function(error) {
        console.log({
          error: error
        });
        callback(error, null);
      });
  },

  getDataVerified: function(req, callback) {
    console.log({
      "req getData": req
    });
    let param = utility.issetVal(req)
      ? {
          verified: req.verified
        }
      : {};
    console.log({
      "param getData": param
    });

    if (req.interest_id) {
      param.interest_id = req.interest_id;
    }
    if (req.batch) {
      param.batch = req.batch;
    }
    /* let column = [
            'user.id', 'user.name', 'user.email', 'user.phone', 'user.company', 'user.position', 'user.bio', 'user.type', 'user.achievement', 'user.alumni', exec.knex.raw(`CASE WHEN type = 'pwc' AND  alumni = 'yes'
                THEN 'alumni'
                WHEN type = 'pwc' AND  alumni = 'no'
                THEN 'internal'
                ELSE 'external'
                END as type_alumni
            `), exec.knex.raw(`CASE WHEN verified = '2'
                THEN 'Verified'
                WHEN verified = '1'
                THEN 'Unverified'
                WHEN verified = '3'
                THEN 'Reject'
                ELSE 'Invited'
                END as status
            `), 'user.batch', 'user.dob', 'user.gender', 'user.img', 'user.eula', 'user.eula_version', 'user.eula_date', 'user.publish', 'user.first_login', 'user.join_date', 'user.create_date', 'user.resign_date', 'user.lineservice_id', 'lineservice.title as lineservice_title', 'alumniInterest.interest_id'
        ]; */

    return (
      exec
        .knex("T_User as user")
        // .select(column)
        .max("user.id as id")
        .max("user.name as name")
        .max("user.verified as status")
        .max("user.email as email")
        .max("user.phone as phone")
        .max("user.company as company")
        .max("user.position as position")
        .max("user.bio as bio")
        .max("user.type as type")
        .max("user.achievement as achievement")
        .max("user.alumni as alumni")
        .max("user.batch as batch")
        .max("user.dob as dob")
        .max("user.gender as gender")
        .max("user.img as img")
        .max("user.eula as eula")
        .max("user.eula_version as eula_version")
        .max("user.eula_date as eula_date")
        .max("user.publish as publish")
        .max("user.first_login as first_login")
        .max("user.join_date as join_date")
        .max("user.create_date as create_date")
        .max("user.resign_date as resign_date")
        .max("user.lineservice_id as lineservice_id")
        .max("lineservice.title as lineservice_title")
        .max("alumniInterest.interest_id as interest_id")
        .max("user.source as source")
        .select(
          exec.knex.raw(
            `(select TOP 1 create_date from AT_Form where user_id = [user].id) AS send_date`
          )
        )
        .select(
          exec.knex.raw(
            `(select TOP 1 form_code from AT_Form where user_id = [user].id) AS form_code`
          )
        )
        .select(
          exec.knex.raw(
            `(select TOP 1 form_id from AT_Form where user_id = [user].id) AS form_id`
          )
        )
        .select(
          exec.knex.raw(
            `(select TOP 1 answered from AT_Form where user_id = [user].id) AS answered`
          )
        )
        .leftJoin(
          "T_LineOfService as lineservice",
          "user.lineservice_id",
          "=",
          "lineservice.id"
        )
        .leftJoin(
          "AT_AlumniInterest as alumniInterest",
          "user.id",
          "=",
          "alumniInterest.user_id"
        )
        .where(param)
        .modify(function(queryBuilder) {
          if (utility.issetVal(req.keyword)) {
            queryBuilder.whereRaw(
              "([user].name like  ? OR [user].email like  ? )",
              [`%${req.keyword}%`, `%${req.keyword}%`]
            );
            /* queryBuilder.andWhere('user.name', 'LIKE', `%${req.keyword}%`)
                                .orWhere('user.email', 'LIKE', `%${req.keyword}%`) */
          }
          if (utility.issetVal(req.batch)) {
            queryBuilder.andWhere("user.batch", "LIKE", `%${req.batch}%`);
          }
          if (utility.issetVal(req.create_date)) {
            let date = req.create_date.split("-").map(x => {
              return x.trim();
            });
            console.log({
              date
            });
            queryBuilder.whereBetween("user.create_date", date);
          }
          if (utility.issetVal(req.interest)) {
            queryBuilder.andWhere("interest_id", "LIKE", `%${req.interest}%`);
          }
          if (utility.issetVal(req.list_interest)) {
            queryBuilder.whereIn("interest_id", req.list_interest);
          }
        })
        .groupBy("user.id")
        .orderBy("create_date", "desc")
        .limit(req.limit)
        .offset(req.start)
        .then(datas => {
          // console.log({datas : datas});
          let result = datas.map(data => {
            if (data.type == "pwc" && data.alumni == "yes") {
              data.type_alumni = "alumni";
            } else if (data.type == "pwc" && data.alumni == "no") {
              data.type_alumni = "internal";
            } else {
              data.type_alumni = "external";
            }

            switch (data.status) {
              case 0:
                data.status = "Invited";
                break;
              case 1:
                data.status = "Unverified";
                break;
              case 2:
                data.status = "Verified";
                break;
              case 3:
                data.status = "Reject";
                break;
              default:
                data.status = "Invited";
                break;
            }
            // data.eula_version = null
            // data.eula_date = null
            return data;
          });
          callback(null, result);
        })
        .catch(function(error) {
          console.log({
            error: error
          });
          callback(error, null);
        })
    );
  },

  crawGetOne: (req, callback) => {
    return exec
      .knex(`${table} as user`)
      .max("user.id as id")
      .max("user.name as name")
      .max("user.email as email")
      .max("user.phone as phone")
      .max("user.company as company")
      .max("user.position as position")
      .max("user.bio as bio")
      .max("user.type as type")
      .max("user.achievement as achievement")
      .max("user.alumni as alumni")
      .max("user.batch as batch")
      .max("user.dob as dob")
      .max("user.gender as gender")
      .max("user.img as img")
      .max("user.eula as eula")
      .max("user.eula_version as eula_version")
      .max("user.eula_date as eula_date")
      .max("user.publish as publish")
      .max("user.first_login as first_login")
      .max("user.join_date as join_date")
      .max("user.create_date as create_date")
      .max("user.resign_date as resign_date")
      .max("user.lineservice_id as lineservice_id")
      .max("lineservice.title as lineservice_title")
      .first()
      .leftJoin(
        "T_LineOfService as lineservice",
        "user.lineservice_id",
        "=",
        "lineservice.id"
      )
      .where({
        "user.id": req.id
      })
      .groupBy("user.id")
      .then(datas => {
        utility.issetVal(datas.img)
          ? (datas.img = url.url_img + "user/" + datas.img)
          : (datas.img = null);
        return datas;
      })
      .then(datas => {
        callback(null, datas);
      })
      .catch(function(error) {
        console.log({
          error: error
        });
        callback(error, null);
      });
  },

  crawAll: function(req, callback) {
    let column = [
      "user.id",
      "user.name",
      "user.email",
      "user.phone",
      "user.bio",
      "user.type",
      "user.alumni",
      exec.knex.raw(`CASE WHEN type = 'pwc' AND  alumni = 'yes'
                THEN 'alumni'
                WHEN type = 'pwc' AND  alumni = 'no'
                THEN 'internal'
                ELSE 'external'
                END as type_alumni
            `),
      exec.knex.raw(`CASE WHEN verified = '2'
                THEN 'verified'
                WHEN verified = '1'
                THEN 'unverified'
                WHEN verified = '3'
                THEN 'reject'
                ELSE 'invited'
                END as status
            `),
      "user.batch",
      "user.img",
      "user.publish",
      "user.first_login",
      "user.join_date"
    ];

    return exec
      .knex("T_User as user")
      .select(column)
      .orderBy("user.name", "desc")
      .then(datas => {
        return Promise.all(
          datas.map(data => {
            utility.issetVal(data.img)
              ? (data.img = url.url_img + "user/" + data.img)
              : (data.img = null);
            return data;
          })
        ).then(response => {
          return response;
        });
      })
      .then(datas => {
        callback(null, datas);
      })
      .catch(function(error) {
        console.log({
          error: error
        });
        callback(error, null);
      });
  },

  emailVerify: function(req, callback) {
    let mailBody = {
      receiver: req.email,
      subject: "PwC OnePlus App Account Verification",
      body:
        "<p><i>*This is a message from OnePlus </i></p>" +
        `<p>Dear ${req.name} </p>` +
        "<p>Congratulation! Your PwC OnePlus Account has been verified.</a></p>" +
        "<p><i>Now you can login into the app using your credential access account.</i></p>" +
        "<p><i>*Do not reply to this e-mail.</i></p>" +
        "<p><i>Thank you!</i></p>"
    };
    nodemailer.mailSend(mailBody, function(err, resData) {
      if (!err) {
        callback(null, true);
      } else {
        callback(err, null);
      }
    });
  },

  triggerUpdateUserMongo: function(req, callback) {
    ModelUser.findOneAndUpdate(
      { user_id: req.user_id },
      req,
      { upsert: true },
      callback
    );
  },

  ExportAlumniActive: function(req, callback) {
    var date = [];
    if (req.create_date != null) {
      const split = req.create_date.split("-").map(x => {
        return x.trim();
      });
      date = split;
    } else {
    }
    return (
      exec
        .knex("T_User as TU")
        .distinct()
        .select([
          "TU.id",
          "TU.name",
          "TU.email",
          "TU.phone",
          "TU.phone1",
          "TU.gender",
          "TU.type",
          "TU.batch",
          "TU.company",
          "TU.position",
          "TU.dob",
          "line.title",
          "TU.eula_version",
          "interest.total as interest",
          "hastag.total as hastag",
          "post.total as post",
          "polling.total as polling",
          "job_shared.total as job_shared",
          "job_recommend.total as job_recommend",
          "TU.create_date",
          "TU.first_login"
        ])
        .leftJoin("T_LineOfService as line", "line.id", "TU.lineservice_id")
        .leftJoin("AT_AlumniInterest as alum", "alum.user_id", "TU.id")
        .leftJoin("T_Interest as int", "int.id", "alum.interest_id")
        //Count User Interest
        .leftJoin(
          exec
            .knex("AT_AlumniInterest as A")
            .select(
              exec.knex.raw(
                "T.id as tid, T.name, count(A.interest_id) as total"
              )
            )
            .leftJoin("T_User as T", "T.id", "A.user_id")
            .groupBy("T.id", "T.name")
            .as("interest"),
          "interest.tid",
          "TU.id"
        )
        //Count User Hastag
        .leftJoin(
          exec
            .knex("T_Hashtag as H")
            .select(exec.knex.raw("T.id as tid, T.name, count(H.id) as total"))
            .leftJoin("AT_PostHashtag as APH", "aph.hashtag_id ", "H.id")
            .leftJoin("T_Post as P", "P.id ", "APH.post_id")
            .leftJoin("T_User as T", "T.id ", "P.user_id")
            .groupBy("T.id", "T.name")
            .as("hastag"),
          "hastag.tid",
          "TU.id"
        )
        // Count User Post
        .leftJoin(
          exec
            .knex("T_Post as P")
            .select(exec.knex.raw("T.id as tid, T.name, count(P.id) as total"))
            .leftJoin("T_User as T", "T.id ", "P.user_id")
            .groupBy("T.id", "T.name")
            .as("post"),
          "post.tid",
          "TU.id"
        )
        //Count User Polling
        .leftJoin(
          exec
            .knex("T_PostPolling as PP")
            .select(exec.knex.raw("T.id as tid, T.name, count(PP.id) as total"))
            .leftJoin("T_Post as P", "P.id ", "PP.post_id")
            .leftJoin("T_User as T", "T.id ", "P.user_id")
            .groupBy("T.id", "T.name")
            .as("polling"),
          "polling.tid",
          "TU.id"
        )
        //Count User Job Shared
        .leftJoin(
          exec
            .knex("AT_JobShare as JS")
            .select(
              exec.knex.raw("T.id as tid, T.name, count(JS.job_id) as total")
            )
            .leftJoin("T_User as T", "T.id ", "=", "JS.user_id")
            .groupBy("T.id", "T.name")
            .as("job_shared"),
          "job_shared.tid",
          "TU.id"
        )
        //Count User Job Recommend
        .leftJoin(
          exec
            .knex("AT_JobRecommend as JR")
            .select(
              exec.knex.raw("T.id as tid, T.name, count(JR.job_id) as total")
            )
            .leftJoin("T_User as T", "T.id ", "JR.user_id")
            .groupBy("T.id", "T.name")
            .as("job_recommend"),
          "job_recommend.tid",
          "TU.id"
        )
        .modify(function(queryBuilder) {
          if (utility.issetVal(req.keyword)) {
            queryBuilder.whereRaw("(name like ? or email like ? )", [
              `%${req.keyword}%`,
              `%${req.keyword}%`
            ]);
          }
          if (utility.issetVal(req.batch))
            queryBuilder.andWhere("batch", "LIKE", `%${req.batch}%`);
          if (utility.issetVal(req.create_date)) {
            let date = req.create_date.split("-").map(x => {
              return x.trim();
            });
            console.log({
              date
            });
            queryBuilder.whereBetween("user.create_date", date);
          }
          if (utility.issetVal(req.interest)) {
            queryBuilder.whereIn("interest_id", req.interest);
          }
          /* if (utility.issetVal(req.list_interest))
                        queryBuilder.whereIn('interest_id', req.list_interest) */
        })
        .orderByRaw("TU.name asc, TU.create_date desc")
        .then(datas => {
          Promise.all(
            datas.map(async data => {
              const like = await Like.countDocuments({ user_id: data.id });
              const comment = await Comment.countDocuments({
                user_id: data.id
              });
              if (like >= 1 && comment >= 1) {
                // console.log("");
                data.like = like;
                data.comment = comment;
                return data;
              } else {
                data.like = null;
                data.comment = null;
                return data;
              }
            })
          )
            .then(datas => {
              callback(null, datas);
            })
            .catch(function(error) {
              console.log({ error });
              callback(error, null);
            });
        })
    );
  }
};
