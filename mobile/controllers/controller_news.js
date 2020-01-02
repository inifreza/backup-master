//models
const Model = require("../../data/schema_NewsBookmarks");
const news = require("../models/news");
const news_image = require("../models/newsImages");
const user = require("../models/user");
const newsBookmarks = require("../models/NewsBookmarks");
const newsLike = require("../models/newsLikes");
const newsShare = require("../models/newsShares");

const moment = require("moment");
let response = require("../../helpers/response");
const utility = require("../../helpers/utility");
const globals = require("../../configs/global");
const { config } = require("../../default");
const path = require("path");
const fs = require("fs");
let url = globals[config.environment]; // development || production
let appDir = path.dirname(require.main.filename);
let pathDir = appDir + "/uploads/news/";

exports.getDetail = async (req, res) => {
  try {
    const middleware = {
      user_id: "required|text|" + req.body.user_id,
      auth_code: "required|text|" + req.body.auth_code,
      id: "required|text|" + req.body.id
    };
    if (utility.validateRequest(middleware)) {
      const result = await user.getAuth(req.body, function(errAuth, resAuth) {
        if (!errAuth) {
          if (!utility.issetVal(resAuth)) {
            res.status(200).send(new response(false, 403, "Unauthorized"));
          } else {
            news.getById({ id: req.body.id }, function(errRes, resData) {
              // console.log({resData});
              if (!utility.issetVal(errRes)) {
                if (utility.issetVal(resData)) {
                  news_image.getImageByNews({ news_id: req.body.id }, function(
                    errImage,
                    resImage
                  ) {
                    var datas = resData;
                    let promiseBookmarked = new Promise((resolve, reject) => {
                      newsBookmarks.getData(
                        { news_id: req.body.id, user_id: req.body.user_id },
                        (errBookmark, resBookmark) => {
                          if (utility.issetVal(resBookmark)) {
                            resolve(1);
                          } else {
                            resolve(0);
                          }
                        }
                      );
                    });
                    let promiseLiked = new Promise((resolve, reject) => {
                      newsLike.getData(
                        { news_id: req.body.id, user_id: req.body.user_id },
                        (errLiked, resLiked) => {
                          if (utility.issetVal(resLiked)) {
                            resolve(1);
                          } else {
                            resolve(0);
                          }
                        }
                      );
                    });
                    let promiseRelated = new Promise((resolve, reject) => {
                      news.getByInterest(resData, (errNews, resNews) => {
                        if (utility.issetVal(resNews)) {
                          resNews = resNews.filter(el => {
                            if (el.id != req.body.id) {
                              return el;
                            }
                          });
                          resolve(resNews);
                        }
                      });
                    });
                    let promiseLikes = new Promise((resolve, reject) => {
                      newsLike.getCount(
                        { news_id: req.body.id },
                        (errLiked, resLikes) => {
                          if (utility.issetVal(resLikes)) {
                            resolve(resLikes);
                          } else {
                            resolve(0);
                          }
                        }
                      );
                    });
                    Promise.all([
                      promiseBookmarked,
                      promiseLiked,
                      promiseRelated,
                      promiseLikes
                    ])
                      .then(([resBookmark, resLiked, resNews, resLikes]) => {
                        console.log({ resLikes });
                        datas.image = null;
                        datas.count_like = null;
                        if (!utility.issetVal(errImage)) {
                          if (utility.issetVal(resImage)) {
                            datas.image = resImage;
                            for (let i = 0; i < resImage.length; i++) {
                              datas.image[i].img =
                                url.url_img + "news/" + datas.image[i].img;
                            }
                          }
                        }
                        datas.count_like = resLikes;
                        datas.bookmarked = resBookmark;
                        datas.liked = resLiked;
                        datas.related = resNews;
                        console.log({ "seakrang ada": datas.count_like });
                        res
                          .status(200)
                          .send(new response(true, 200, "Data exist", datas));
                      })
                      .catch(error => {
                        console.log({ error });
                      });
                  });
                } else {
                  res.status(200).send(new response(false, 401, "No data"));
                }
              } else {
                res.status(200).send(new response(false, 401, "No data"));
              }
            });
          }
        } else {
          res.status(200).send(new response(false, 403, "Unauthorized2"));
        }
      });
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
      page: "required|text|" + req.body.page
    };
    if (utility.validateRequest(middleware)) {
      if (Number(req.body.page)) {
        const result = await user.getAuth(req.body, function(errAuth, resAuth) {
          if (!errAuth) {
            if (!utility.issetVal(resAuth)) {
              res.status(200).send(new response(false, 403, "Unauthorized"));
            } else {
              news.countGetAll(null, function(errCount, resCount) {
                if (errCount) {
                  res.status(200).send(new response(false, 401, "No data"));
                } else {
                  var itemPerPage = 6;
                  var options = {
                    start:
                      req.body.page <= 1 || req.body.page == null
                        ? 0
                        : (req.body.page - 1) * itemPerPage,
                    limit: itemPerPage
                  };
                  news.getAll(options, function(errRes, resData) {
                    if (!utility.issetVal(errRes)) {
                      if (utility.issetVal(resData)) {
                        var datas = {
                          total_page: Math.ceil(resCount / itemPerPage),
                          total_data: resData.length,
                          total_data_all: resCount,
                          remaining:
                            resCount -
                            ((req.body.page - 1) * itemPerPage +
                              resData.length),
                          data: resData
                        };
                        for (let i = 0; i < resData.length; i++) {
                          utility.issetVal(datas.data[i].img)
                            ? (datas.data[i].img =
                                url.url_img + "news/" + datas.data[i].img)
                            : (datas.data[i].img = null);
                        }

                        res
                          .status(200)
                          .send(new response(true, 200, "Data exist", datas));
                      } else {
                        res
                          .status(200)
                          .send(new response(false, 401, "No data"));
                      }
                    } else {
                      res.status(200).send(new response(false, 401, "No data"));
                    }
                  });
                }
              });
            }
          } else {
            res.status(200).send(new response(false, 403, "Unauthorized2"));
          }
        });
      } else {
        res
          .status(200)
          .send(
            new response(false, 401, "Invalid page number, should start with 1")
          );
      }
    } else {
      res.status(200).send(new response(false, 400, "Invalid input format"));
    }
  } catch (e) {
    res.status(500).send(new response(false, 500, "Something went wrong"));
  }
};

exports.getHome = async (req, res) => {
  try {
    const middleware = {
      user_id: "required|text|" + req.body.user_id,
      auth_code: "required|text|" + req.body.auth_code
    };
    if (utility.validateRequest(middleware)) {
      const result = await user.getAuth(req.body, function(errAuth, resAuth) {
        if (!errAuth) {
          if (!utility.issetVal(resAuth)) {
            res.status(200).send(new response(false, 403, "Unauthorized"));
          } else {
            news.getHome(null, function(errRes, resData) {
              if (!utility.issetVal(errRes)) {
                if (utility.issetVal(resData)) {
                  for (let i = 0; i < resData.length; i++) {
                    utility.issetVal(resData[i].img)
                      ? (resData[i].img =
                          url.url_img + "news/" + resData[i].img)
                      : (resData[i].img = null);
                  }

                  res
                    .status(200)
                    .send(new response(true, 200, "Data exist", resData));
                } else {
                  res.status(200).send(new response(false, 401, "No data"));
                }
              } else {
                res.status(200).send(new response(false, 401, "No data"));
              }
            });
          }
        } else {
          res.status(200).send(new response(false, 403, "Unauthorized2"));
        }
      });
    } else {
      res.status(200).send(new response(false, 400, "Invalid input format"));
    }
  } catch (e) {
    res.status(500).send(new response(false, 500, "Something went wrong"));
  }
};

exports.submitBookmark = async (req, res) => {
  try {
    const middleware = {
      user_id: "required|text|" + req.body.user_id,
      auth_code: "required|text|" + req.body.auth_code,
      news_id: "required|text|" + req.body.news_id,
      status: "required|text|" + req.body.status
    };
    if (utility.validateRequest(middleware)) {
      const result = await user.getAuth(req.body, function(errAuth, resAuth) {
        console.log({ errAuth });
        if (!errAuth) {
          if (!utility.issetVal(resAuth)) {
            res.status(200).send(new response(false, 403, "Unauthorized"));
          } else {
            // console.log({resAuth});
            // console.log(req.body);
            if (resAuth.auth_code == req.body.auth_code) {
              if (req.body.status == "1") {
                news.getById({ id: req.body.news_id }, (errGet, resNews) => {
                  if (utility.issetVal(resNews)) {
                    console.log(resNews);
                    let bodyBookmark = {
                      news_id: req.body.news_id,
                      user_id: req.body.user_id,
                      create_date: moment(Date.now()).format(
                        "YYYY-MM-DD HH:mm:ss"
                      )
                    };
                    newsBookmarks.addData(bodyBookmark, (errAdd, resAdd) => {
                      if (!errAdd) {
                        res
                          .status(200)
                          .send(
                            new response(
                              true,
                              200,
                              "Insert Succes",
                              bodyBookmark
                            )
                          );
                      } else {
                        res
                          .status(200)
                          .send(new response(false, 401, "Insert Failed"));
                      }
                    });
                  } else {
                    res
                      .status(200)
                      .send(new response(false, 404, "Data Not Exist"));
                  }
                });
              } else {
                Model.find(
                  { user_id: req.body.user_id },
                  (errGet, resBookmark) => {
                    console.log({ resBookmark });
                    if (utility.issetVal(resBookmark)) {
                      newsBookmarks.deleteData(
                        { id: resBookmark.id, user_id: resBookmark.user_id },
                        (errDel, resDel) => {
                          console.log({ errDel });
                          console.log({ resDel });
                          if (utility.issetVal(resDel)) {
                            res
                              .status(200)
                              .send(new response(true, 200, "Delete Succes"));
                          } else {
                            res
                              .status(200)
                              .send(new response(false, 401, "Delete Failed"));
                          }
                        }
                      );
                    } else {
                      res
                        .status(200)
                        .send(new response(false, 404, "Data Not Exist"));
                    }
                  }
                );
              }
            } else {
              res.status(200).send(new response(false, 403, "Unauthorized3"));
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
    res.status(500).send(new response(false, 500, "Something went wrong"));
  }
};

exports.submitLike = async (req, res) => {
  console.log("Submit Like");
  try {
    const middleware = {
      user_id: "required|text|" + req.body.user_id,
      auth_code: "required|text|" + req.body.auth_code,
      news_id: "required|text|" + req.body.news_id,
      status: "required|text|" + req.body.status
    };
    if (utility.validateRequest(middleware)) {
      const result = await user.getAuth(req.body, function(errAuth, resAuth) {
        console.log({ errAuth });
        if (!errAuth) {
          if (!utility.issetVal(resAuth)) {
            res.status(200).send(new response(false, 403, "Unauthorized"));
          } else {
            // console.log({resAuth});
            // console.log(req.body);
            if (resAuth.auth_code == req.body.auth_code) {
              if (req.body.status == "1") {
                news.getById({ id: req.body.news_id }, (errGet, resNews) => {
                  if (utility.issetVal(resNews)) {
                    console.log(resNews);
                    let bodyBookmark = {
                      news_id: req.body.news_id,
                      user_id: req.body.user_id,
                      create_date: moment(Date.now()).format(
                        "YYYY-MM-DD HH:mm:ss"
                      )
                    };
                    newsLike.addData(bodyBookmark, (errAdd, resAdd) => {
                      if (!errAdd) {
                        res
                          .status(200)
                          .send(new response(true, 200, "Insert Succes"));
                      } else {
                        res
                          .status(200)
                          .send(new response(false, 401, "Insert Failed"));
                      }
                    });
                  } else {
                    res
                      .status(200)
                      .send(new response(false, 404, "Data Not Exist"));
                  }
                });
              } else {
                newsLike.getData(
                  { news_id: req.body.news_id },
                  (errGet, [resNewsLike]) => {
                    console.log({ resNewsLike });
                    if (utility.issetVal(resNewsLike)) {
                      newsLike.deleteData(
                        { id: resNewsLike.id },
                        (errDel, resDel) => {
                          console.log({ errDel });
                          console.log({ resDel });
                          if (utility.issetVal(resDel)) {
                            res
                              .status(200)
                              .send(new response(true, 200, "Delete Succes"));
                          } else {
                            res
                              .status(200)
                              .send(new response(false, 401, "Delete Failed"));
                          }
                        }
                      );
                    } else {
                      res
                        .status(200)
                        .send(new response(false, 404, "Data Not Exist"));
                    }
                  }
                );
              }
            } else {
              res.status(200).send(new response(false, 403, "Unauthorized3"));
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
    res.status(500).send(new response(false, 500, "Something went wrong"));
  }
};

exports.submitShare = async (req, res) => {
  try {
    const middleware = {
      user_id: "required|text|" + req.body.user_id,
      auth_code: "required|text|" + req.body.auth_code,
      news_id: "required|text|" + req.body.news_id
    };
    if (utility.validateRequest(middleware)) {
      const result = await user.getAuth(req.body, function(errAuth, resAuth) {
        console.log({ errAuth });
        if (!errAuth) {
          if (!utility.issetVal(resAuth)) {
            res.status(200).send(new response(false, 403, "Unauthorized"));
          } else {
            // console.log({resAuth});
            // console.log(req.body);
            if (resAuth.auth_code == req.body.auth_code) {
              news.getById({ id: req.body.news_id }, (errGet, resNews) => {
                if (utility.issetVal(resNews)) {
                  console.log(resNews);
                  let bodyBookmark = {
                    news_id: req.body.news_id,
                    user_id: req.body.user_id,
                    create_date: moment(Date.now()).format(
                      "YYYY-MM-DD HH:mm:ss"
                    )
                  };
                  newsShare.addData(bodyBookmark, (errAdd, resAdd) => {
                    if (!errAdd) {
                      res
                        .status(200)
                        .send(new response(true, 200, "Insert Succes"));
                    } else {
                      res
                        .status(200)
                        .send(new response(false, 401, "Insert Failed"));
                    }
                  });
                } else {
                  res
                    .status(200)
                    .send(new response(false, 404, "Data Not Exist"));
                }
              });
            } else {
              res.status(200).send(new response(false, 403, "Unauthorized3"));
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
    res.status(500).send(new response(false, 500, "Something went wrong"));
  }
};

exports.getBookmarkNews = async (req, res) => {
  try {
    Model.find({ user_id: req.body.user_id }, (errGet, resBookmark) => {
      console.log(resBookmark);

      res.send(resBookmark);
    });
  } catch (error) {
    res.send(error);
  }
};
