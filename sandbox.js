const utility = require('./helpers/utility')

let request = utility.requestFCM(
      'android'
    , 'https://fcm.googleapis.com/fcm/send'
    , "AAAAzZ13Sig:APA91bECKujsyPfeBWTyXNZTjjhcaEXtsoSmXLErr_ARabWvqcndaTjgtoG27qm7xX0GqUYEiKGvzr7zQtDMJJ0-PdpZ6GSbenGsW9QF5L6UkTWKEkaJSLrio-sb-uAR45TUSXWQ6AOL"
    , ["fgDLvT29ePU:APA91bHHatvYP2AcKX5osQOVqgUdgOVShthCkjJHn9lE9B1YoFG_RwVKizvVKqZOl0NJgGmgsmEBe-lRIu1bAV43kzp1aGcpufvuZtR5hc9TxdhVbrSpz_DRGBSyi9FdcKh4b1voHZHz"]
    , {
    "headline": "Test Notif",
    "sub_headline": "notif subheadline",
    "content": {
        "id": "P2d9SUCInsMssCSJ1zU0Pui5m08rZEet",
        "title": "sdfsdf",
        "redirect" : "yes",
        "path" : "user" 
    }
});

console.log(request)