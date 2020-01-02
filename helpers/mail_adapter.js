const nodemailer = require('nodemailer');

let transporter = nodemailer.createTransport({
  host: '37.60.246.112',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
      user: 'smtp-mail@eannovate.com', // generated ethereal user
      pass: 'developer123'  // generated ethereal password
  },
  tls:{
    rejectUnauthorized:false
  }
});

module.exports = {
  mailSend: function(req, callback){
    // setup email data with unicode symbols
    let mailOptions = {
        from: '"OnePlus" smtp-mail@eannovate.com', // sender address
        to: req.receiver, // list of receivers
        subject: req.subject, // Subject line
        text: 'Email from OnePlus: ', // plain text body
        html: req.body // html body
    };

    // send mail with defined transport object
    transporter.sendMail(mailOptions, callback);

  }
}
