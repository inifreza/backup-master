let crypto = require('crypto')
let request = require('request');
let im = require('imagemagick');
let moment = require('moment')
const fs = require('fs');
const path = require('path');
let createTextVersion = require("textversionjs");
// const request = require('request');

const utility = {

  isObjectEmpty(data) {
    return Object.keys(data).length === 0 ? true : false;
  },
  

  validateJSON(body) {
    try {
      var data = JSON.parse(body);
      return data; //if came to here, then valid
    } catch(e) {
      return null; //failed to parse
    }
  },

  generateHash : function (param) {
    var text = "";
    var charset = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    for (var i = 0; i < param; i++)
      text += charset.charAt(Math.floor(Math.random() * charset.length));
    return text;
  },

  doHash : function (pass, salt) {
    let hash = crypto.createHash('sha256');
    hash.update(salt+pass);
    return hash.digest('hex');
  },

  isArray : function (obj){
     if (obj.constructor === object)
      return true;
     else
      return false;
  },

  BooleanParse : function (obj) {
    Boolean.parse = function(obj){
      var falsy = /^(?:f(?:alse)?|no?|0+)$/i;
      return !falsy.test(obj) && !!obj
    }   
  },
  isJson : function (item) {
    item = typeof item !== "string"
        ? JSON.stringify(item)
        : item;

    try {
        item = JSON.parse(item);
    } catch (e) {
        return false;
    }

    if (typeof item === "object" && item !== null) {
        return true;
    }

    return false;
  },

  checkImageExtension : function (obj){
     let image_name = obj;
     let image_length = image_name.length;
     let poin = image_name.lastIndexOf(".");
     let accu1 = image_name.substring(poin,image_length);
     let accu = accu1.toLowerCase();
     //console.log(accu);
     if ((accu !='.png') && (accu !='.jpg') && (accu !='.jpeg')){
       return false;
     }else{
       return true;
     }
  },


  checkVideoExtension : function (obj){
    let video_name = obj;
    let video_length = video_name.length;
    let poin = video_name.lastIndexOf(".");
    let accu1 = video_name.substring(poin,video_length);
    let accu = accu1.toLowerCase();
    //console.log(accu);
    if ((accu !='.mp4') && (accu !='.mkv') && (accu !='.flv') && (accu !='.3gp') && (accu !='.avi') && (accu !='.wmv')){
      return false;
    }else{
      return true;
    }
 },

  cleanJSON : function (obj) {
    for (let propName in obj) {
      if (obj[propName] === null || obj[propName] === undefined ) {  /* || obj[propName].trim() === '' */
        delete obj[propName];
      }
    }
    return obj;
  },

  validateRequest : function(obj) {
    let objLength =  Object.keys(obj).length;
    let index= 0;
    for (let propName in obj) {
      let SplitObject = obj[propName].split("|");
      let param  = SplitObject[SplitObject.length-1];
      let type   = SplitObject[SplitObject.length-2]
      let option = SplitObject[SplitObject.length-3];


      if(option == 'required'){
        if(param === null || param === 'undefined' || param.trim() === ''){
          false;
        }else{
          if(type == "email"){
            callback = this.regex(param,type);
            if(callback){
              index++;
            }
          }else if(type == "number"){
            callback = this.regex(param,type);
            if(callback){
              index++;
            }
          }else if(type == "images"){
            callback = this.checkImageExtension(param,type);
            if(callback){
              index++;
            }
          }else if(type == "video"){
            callback = this.checkVideoExtension(param,type);
            if(callback){
              index++;
            }
          }else if(type == "excel"){
            callback = this.checkExcelExtension(param,type);
            if(callback){
              index++;
            }
          }else if(type == "date"){
            callback = moment(param, "DD-MMM-YYYY", true).isValid();
            if(callback){
              index++;
            }
          }else if(type == "json"){
            callback = this.validateJSON(param);
            if(callback){
              index++;
            }
          }else {
            index++;
          }
        }
      }else{
        if(param === null || param === 'undefined' || param.trim() === ''){
          index++;
        }else{
          if(type == "email"){
            callback = this.regex(param,type);
            if(callback){
              index++;
            }
          }else if(type == "number"){
            callback = this.regex(param,type);
            if(callback){
              index++;
            }
          }
          else if(type == "images"){
            callback = this.checkImageExtension(param,type);
            if(callback){
              index++;
            }
          }else if(type == "video"){
            callback = this.checkVideoExtension(param,type);
            if(callback){
              index++;
            }
          }else if(type == "excel"){
            callback = this.checkExcelExtension(param,type);
            if(callback){
              index++;
            }
          }else if(type == "date"){
            callback = moment(param, "DD-MMM-YYYY", true).isValid();
            if(callback){
              index++;
            }
          }else if(type == "json"){
            callback = this.validateJSON(param);
            if(callback){
              index++;
            }
          }else {
            index++;
          }
        }
      }

    }
    return objLength == index ? true : false;
  },

  regex : function(key, type){
    let regexNumber = /^[0-9]*$/;
    let regexEmail = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if(type == 'email'){
      return regexEmail.test(key);
    } else if(type == 'number'){
      return regexNumber.test(key);
    }
  },

  checkFK :  function(model, id){
    return new Promise((resolve, reject) => {
  		model.findOne({ _id: id }, (err, result) => {
  			if (result) {
  				return resolve(true);
  			}
  			else return reject(new Error(`FK Constraint 'checkObjectsExists' for '${id.toString()}' failed`));
  		});
  	});
  },

  cleanImage : function(imgJSON, path){
    if(imgJSON != undefined || imgJSON != null){
      let pathUrl = path + imgJSON;
      if (fs.existsSync(pathUrl)) {
        console.log('file Found');
        fs.unlinkSync(pathUrl)
      }
    }
  },

  issetVal :  function(obj){
    if (obj == '' || obj == undefined || obj == null || obj == 'null' || obj.length == 0)
      return false;
    else
      return true;
  },

  booleanParse :  function(obj){
    if (obj == 'true' || obj == true )
      return 1;
    else
      return 0;
  },
  intToBooleanParse :  function(obj){
    if (obj == '1' )
      return 'true';
    else
      return 'false';
  },

  checkExcelExtension : function (obj){
    let file_name = obj;
    let file_length = file_name.length;
    let poin = file_name.lastIndexOf(".");
    let accu1 = file_name.substring(poin,file_length);
    let accu = accu1.toLowerCase();
    //console.log(accu);
    if ((accu !='.xls') && (accu !='.xlsx')){
      return false;
    }else{
      return true;
    }
  },

  detectSize : function(obj){
    const stats = fs.statSync(obj);
    const fileSizeInBytes = stats.size;
    //Convert the file size to megabytes (optional)
    return fileSizeInBytes
  },

  detectMimeType : function (obj) {
    
    if(obj == 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'){
      return 'xlsx';
    } else if(obj == "video/x-ms-wmv" ){
      return 'wmv';
    }else if(obj == "video/x-m4v" ){
      return 'm4v';
    }else if(obj == "video/x-matroska" ){
      return 'mkv';
    }else if(obj == "video/mp4" ){
      return 'mp4';
    }else if(obj == "video/x-msvideo" ){
      return 'avi';
    }else if(obj == "video/3gpp" ){
      return '3gp';
    }else {
      return false;
    }
  },
  
  readJson : function (filePath = dataPath, encoding = 'utf8', callback) {
    fs.readFile(filePath, encoding, (err, data) => {
        if (err) {
          callback(err, null)
        }else{
          callback(null, JSON.parse(data));
        }

    });
  },

  writeJson : function (fileData, filePath = dataPath, encoding = 'utf8', callback){
    fs.writeFile(filePath, fileData, encoding, (err) => {
        if (err) {
          callback(err, null)
        }else {
          callback(null, 'success');
        }
    });
  },

  requestGet : function(url, callback){
    request.get(url, function (err, response, body) {
      if (err) {
          callback(err, null);
      }else {
        callback(null, JSON.parse(body));
      }
    });
  },
  
  requestPost : function(url, form, header, callback){
    // console.log(form)
    // return false;
    request.post(
      {
        uri: url,
        json: form,
        headers : header,
      },
      (err, httpResponse, resBody) => {
        console.error('error:', err); // Print the error if one occurred
        console.log('statusCode:', httpResponse && httpResponse.statusCode); // Print the response status code if a response was received
        console.log('body:', httpResponse); // Print the HTML for the Google homepage.
        if (err) {
          callback(err, null);
        }else {
          if(this.isJson(resBody)){
            callback(null, JSON.parse(resBody));
          } else {
            callback(null, resBody);
          }
        }
      }
    );
  },

  resizeImages : function(imgJSON, path){
    im.resize({
      srcData: fs.readFileSync('kittens.jpg', 'binary'),
      width:   200,
      height: 200
    }, function(err, stdout, stderr){
      if (err) throw err;
      fs.writeFileSync('kittens-resized.jpg', stdout, 'binary');
      console.log('resized kittens.jpg to fit within 256x256px');
    });
  },

  checkInput : function(data){
    data = data.trim()
    data = data.replace(new RegExp("\\\\", "g"), "")
    data = data.replace(/'/g, "\\'");
    data = this.escapeHtml(data);
    return data;
  },
  
  escapeHtml : function (text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
  },
  
  unescapeHtml : function(unsafe) {
    return unsafe
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, "\"")
        .replace(/&#039;/g, "'");
  },

  fetchImage : function(uri, filename, callback){
    request.head(uri, function(err, res, body){    
      request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
    })
  },

  processImagesAsync : function(images, filename, extenstion , pathFile){
    filename = filename.replace(/\//g, '_');
   
    // console.log(filename);
    localPath = pathFile+filename+extenstion;
    this.fetchImage(images, localPath, (err)=>{

    });
    // console.log(pathFile);
  },

  validateFont : function(font){
    switch (font) {
      case 'none':
        return  true
      case 'bold':
        return true
      case 'italic':
        return true
      case 'underline':
        return true
      default:
        return false
    }
  },
    
  requestFCM : function(type, url, server_key, tokens, datas){
    const body = {};
    
    if(type=="android"){
      body['registration_ids'] = tokens;
      body['priority'] = 'high';
      body['data'] = {
        'request' : datas
      };
      body['content_available'] = true;
    } else {
      body['registration_ids'] = tokens;
      body['notification'] = {
        'title' : datas['headline'],
        'body'  : datas['sub_headline'],
        'sound' : "default",
        'badge' : "0",
        'click_action' : "OPEN_CHAT"
      };
      body['priority'] = 'high';
      body['data'] = {
        'request' : datas
      };
      body['content_available'] = true;
    }
 
    let headers = {
      'Authorization': 'key='+server_key
    };
    // console.log(body)
    let options = { 
      method: 'POST',
      url: url,
      headers: headers,
      body: body,
      json: true 
    };

    request(options, function (error, response, bodys) {
      if(type=="android"){
        console.log('ini rest',type, body, datas, bodys);
      }
    });
  },

  validateTypePost(obj) {
    switch (obj) {
      case "post":
          return true
      case "polling":
          return true
      default:
          return false
    }
  },

  validateSortPost(obj) {
    switch (obj) {
      case "newest":
          return true
      case "popular":
          return true
      case "weekly":
          return true
      case "monthly":
          return true
      default:
          return false
    }
  },

  validateActivity(obj) {
    switch (obj) {
      case "home":
          return true
      case "alumni":
          return true
      case "event":
          return true
      case "message":
          return true
      case "jobs":
          return true
      case "profile":
          return true
      default:
          return false
    }
  },

  htmlConvertString(data){
    return createTextVersion(data);
  }
};
module.exports = utility;
