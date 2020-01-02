const express = require('express');
const router = express.Router();

// Require All Controllers
const user = require('../controllers/controller_user')
const homeGeneral = require('../controllers/controller_homeGeneral')
const homeInterest = require('../controllers/controller_homeInterest')
const notification = require('../controllers/controller_notification')
const lineService = require('../controllers/controller_lineService')
const interest = require('../controllers/controller_interest')
const news = require('../controllers/controller_news')
const event = require('../controllers/controller_event')
const jobGrade = require('../controllers/controller_jobGrade')
const job = require('../controllers/controller_jobs')
const alumniExperience = require('../controllers/controller_alumniExperience')
const post = require('../controllers/controller_post')
const room = require('../controllers/controller_room')
const appActivity = require('../controllers/controller_appActivity')
const qoute = require('../controllers/controller_quote')
const eula = require('../controllers/controller_eula')
const content = require('../controllers/controller_content')
const company = require('../controllers/controller_company_profile')
const appVersion = require('../controllers/controller_appVersion')
const feedback = require('../controllers/controller_feedback')
const search = require('../controllers/controller_search')

const rooms = require('../controllers/controller_rooms')

// user
router.post('/user/login', user.login)
router.post('/user/addDevice', user.addDevice)
router.post('/user/deleteDevice', user.deleteDevice)
router.get('/user/crawAuth', user.crawAuth)
router.post('/user/forgetPassword', user.forgetPassword)
router.post('/user/register', user.registration)
router.post('/user/register2', user.validateUser)
router.post('/user/completeProfile', user.completeProfile)
router.post('/user/reset_password', user.resetPassword)
router.post('/user/validatePassword', user.validatePassword)
router.get('/user/validate_resetPassword', user.validateResetPassword)
router.post('/user/get_list', user.getAll)
router.post('/user/get_mention', user.getMention)
router.post('/user/getDetail', user.getDetail)
router.put('/user/',user.update)
router.put('/user/change_password',user.changePassword)
router.put('/user/change_email', user.changeEmail)
router.put('/user/change_phone', user.changePhone)
router.put('/user/privacy',user.updatePrivacy)
router.post('/user/privacy',user.getPrivacy)
router.post('/user/checkPrivacy',user.checkPrivacy)
router.post('/user/education/list', user.getListEducation)
router.post('/user/education/list_byAlumni', user.getListByAlumni)
router.post('/user/education/insert', user.insertEducation)
router.post('/user/education/detail', user.detailEducation)
router.put('/user/education/',user.updateEducation)
router.delete('/user/education/', user.deleteEducation)
router.post('/user/experience/list', alumniExperience.getAll)
router.post('/user/experience/insert', alumniExperience.insert)
router.post('/user/experience/detail', alumniExperience.detail)
router.post('/user/experience/listByAlumni', alumniExperience.getByAlumni)
router.put('/user/experience/',alumniExperience.update)
router.delete('/user/experience/', alumniExperience.delete)
router.post('/user/getVerified',user.getAllVerified)
router.post('/user/getWithoutMe',user.getAllVerifiedWithoutMe)
router.post('/user/interest/get_list', user.getListInterestByAlumni)
router.post('/user/request_otp', user.requestOtp)
router.post('/user/validate_otp', user.validateOtp)
router.post('/user/update_eula',user.updateEula)
// ALumni Highlight
router.post('/user/highlight_list', user.listHighlight)
router.post('/user/highlightDetail', user.getDetailHighlight)
router.post('/user/submitRecommend', user.submitRecommend)

// General
router.post('/home/general', homeGeneral.list)
router.post('/home/interest', homeInterest.list)

// lineOfServices
router.post('/lineOfService/get_list', lineService.getAll)
router.post('/lineOfService/get_listWithoutAuth', lineService.getAllWithoutAuth)

// Intaerst
// router.post('/interest/get_all', interest.getList)
router.post('/interest/follow', interest.follow)
router.post('/interest/get_root', interest.getRoot)
router.post('/interest/get_child', interest.getChild)
router.post('/interest/get_followed', interest.getFollowedInterest)
router.post('/interest/get_recent', interest.getRecentInterest)
router.post('/interest/get_full', interest.getFull)

// Notification
router.post('/notification/unread', notification.getUnRead)
router.post('/notification/read_selected',notification.readSelected)
router.post('/notification/read_all', notification.readAll)
router.post('/notification/get_list', notification.getList)

// News

router.post('/news/bookmark', news.getBookmarkNews)
router.post('/news/home', news.getHome)
router.post('/news/list', news.getAll)
router.post('/news/detail', news.getDetail)
router.post('/news/submit_bookmark', news.submitBookmark)
router.post('/news/submit_like', news.submitLike)
router.post('/news/submit_share', news.submitShare)

// event
router.post('/event/home', event.getHome)
router.post('/event/past', event.getAllPast)
router.post('/event/upcoming', event.getAllUpComing)
router.post('/event/detail', event.getDetail)
router.post('/event/listComment', event.getComment)
router.post('/event/insertComment', event.insertComment)
router.post('/event/comment/submit_like', event.submitLikeComment)
router.post('/event/submit_like', event.submitLike)
router.post('/event/submit_bookmark', event.submitBookmark)
router.post('/event/submit_share', event.submitShare)
router.post('/event/get_likes', event.getLikes)
router.post('/event/get_comment_likes',event.getCommentLikes)
 
// Job Grade
router.post('/jobGrade/get_list', jobGrade.getAll)

// job
router.post('/job/get_list', job.getAll)
router.post('/job/get_detail', job.getDetail)
router.post('/job/submit_share', job.shareJob)
router.post('/job/submit_recommend', job.submitRecommend)

// post
router.post('/post/submit_like',post.submitLikePost)
router.post('/post/comment/submit_like', post.submitLikeComment)
router.post('/post/add_comment', post.addComment)
router.post('/post/get_likes',post.getLikes)
router.post('/polling/submit_response', post.submitResponse)
router.post('/post/get_comment',post.getComment)
router.post('/post/create', post.createPost)
router.post('/post/getCommentByUser', post.getCommentByUser)
router.post('/post/getLikesByUser', post.getLikeByUser)
router.post('/post/get_comment_likes', post.getCommentLike)
router.delete('/post/', post.deleteData)
router.delete('/post/comment', post.deleteComment)
// router.post('/post/getLike', post.getLikes)

router.post('/post/get_detail',post.getDetail)
router.post('/post/submitReport', post.submitReport)  
router.delete('/post/report', post.deleteReport)
router.post('/post/list_byAlumni', post.getListByAlumni)
//Chat
router.post('/room/addRoom', room.addRoom)
router.post('/room/addGroup', room.addGroup)
router.post('/room/information', room.getInformation)
router.get('/room/user_information', room.getUserInformation)
router.delete('/room/group', room.deleteGroup)
router.post('/room/leave', room.leaveGroup)
router.post('/room/get_list', rooms.roomList)

// App Activity
router.post('/appActivity/insert', appActivity.insert)

//Quotes
router.post('/quote/get_random',qoute.getRandom)


router.post('/post/insertImages', post.insertImages)
router.post('/post/setPrimary', post.setPrimary)
router.delete('/post/images', post.deleteImages)

// eula Active
router.post('/eula/getActive', eula.getActive)
router.post('/eula/notice', eula.getNotice)

//Content
router.post('/content/get_about', content.getAbout)
router.put('/content/about', content.updateAbout)
router.post('/content/get_birthday', content.getBirthday)
router.put('/content/birthday', content.updateBirthday)
router.post('/content/get_guideline', content.getGuideline)
router.put('/content/guideline', content.updateGuideline)
router.post('/content/get_privacy_policy', content.getPrivacyPolicy)
router.put('/content/privacy_policy', content.updatePrivacyPolicy)
router.post('/content/get_tnc', content.getTnc)
router.put('/content/tnc', content.updateTnc)

//Feedback
router.post('/feedback/get_feedback', feedback.getFeedback)
router.post('/feedback/submit', feedback.submitData)

//Company
router.post('/company/add', company.add)
router.post('/company/get', company.getAll)


//App Version
router.post('/app_version/notice', appVersion.notice)
router.post('/search/get_list', search.getAll)

module.exports = router
