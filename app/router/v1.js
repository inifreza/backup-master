const express = require('express');
const router = express.Router();

// Require All Controllers
const user = require('../controllers/controller_user')
const admin = require('../controllers/controller_admin')
const lineService = require('../controllers/controller_lineService')
const jobGrade = require('../controllers/controller_jobGrade')
const role = require('../controllers/controller_role')
const rejection = require('../controllers/controller_rejection')
const form = require('../controllers/controller_form')
const hashtag = require('../controllers/controller_hashtag')
const forbidden = require('../controllers/controller_forbidden_word')
const eula = require('../controllers/controller_eula')
const appVersion = require('../controllers/controller_appVersion')
const appActivity = require('../controllers/controller_appActivity')
const quote = require('../controllers/controller_quote')
const interest = require('../controllers/controller_interest')
const post = require('../controllers/controller_post')
const news = require('../controllers/controller_news')
const event = require('../controllers/controller_event')
const job = require('../controllers/controller_job')
const setting = require('../controllers/controller_setting')
const postWeekly = require('../controllers/controller_post_weekly')
const postMonthly = require('../controllers/controller_post_monthly')
const broadcast = require('../controllers/controller_broadcast')
const sandbox = require('../controllers/controller_sandbox')
const display = require('../controllers/controller_display')
const company = require('../controllers/controller_company_profile')
const content = require('../controllers/controller_content')
const feedback = require('../controllers/controller_feedback')
const room = require('../controllers/controller_room')
const invitation = require('../controllers/controller_invitation')
const device = require('../controllers/controller_device')

const post_model = require('../models/post')

// Admin
router.post('/admin/login', admin.login)
router.post('/admin/create', admin.insert)
router.post('/admin/get_list', admin.getAll)
router.post('/admin/search', admin.search)
router.delete('/admin/', admin.delete)
router.put('/admin/', admin.update)
router.post('/admin/change_active', admin.changeActive)
router.post('/admin/change_inactive', admin.changeInActive)
router.post('/admin/get_detail', admin.getDetail)
router.post('/admin/set_password', admin.setPassword)
router.get('/admin/crawAuth', admin.crawAuth)

// Routing User
router.post('/user/create', user.insert)
router.post('/user/get_list_all', user.getAll)
router.post('/user/getSelectUser', user.getSelectUser)
router.post('/user/getSelectRecommended', user.getSelectRecommended)
router.post('/user/get_list_invited', user.getAllInvited)
router.post('/user/get_list_unverified', user.getAllUnverified)
router.post('/user/get_list_verified', user.getAllVerified)
router.post('/user/get_list_verified_noPaging', user.getAllVerifiedNoPaging)
router.post('/user/get_list_reject', user.getAllReject)
router.post('/user/get_list_active', user.getAllActive)
router.post('/user/get_list_inactive', user.getAllInActive)
router.post('/user/recommendation_list', user.listRecommendation)
router.post('/user/recommendation_detail', user.getDetailRecommendation)
router.post('/user/highlight_list', user.listHighlight)
router.post('/user/search', user.search)
router.post('/user/change_status', user.changeStatus)
router.post('/user/change_publish', user.changePublish)
router.post('/user/get_detail', user.getDetail)
router.put('/user/del_img',user.delImg)
router.delete('/user/', user.delete)
router.put('/user/', user.update)


router.post('/user_highlight/insert', user.insertHighlight)
router.delete('/user_highlight/', user.deleteHighlight)
router.put('/user_highlight/', user.updateHighlight)
router.post('/user_highlight/get_detail', user.getDetailHighlight)

router.post('/user/find_autocomplete', user.findAutoComplete)

router.post('/user/getVerified',user.getAllVerified)
router.get('/user/crawOne/:id',user.crawGetOne)
router.get('/user/crawAll',user.crawAll)

//Export 
router.post("/export/alumniActive", user.ExportAlumniActive)
router.post('/export/feedback',feedback.exportFeedback)
router.post('/export/jobRecommend',job.exportJobRecommend)
router.get('/export/polling',post.exportPolling)



//Import
router.post('/import/alumni', user.importExcel)

// Line Of Service
// router.post('/lineOfService/get_list', lineService.getAll)

// Job Grade
router.post('/jobGrade/get_list', jobGrade.getAll)

// Role
router.post('/role/get_list', role.getAll)

// Rejection
router.post('/rejection/user', rejection.getDetailUser)
router.post('/rejection/external', rejection.getDetailExternal)
router.put('/rejection/user', rejection.updateUser)
router.put('/rejection/external', rejection.updateExternal)

// Form Validation
router.post('/user/sentValidation?', form.sentValidation)
router.post('/form/create', form.insert)
router.post('/form/get_list', form.getAll)
router.post('/form/get_detail', form.getDetail)
router.post('/form/get_answer', form.getAnswer)
router.delete('/form/', form.delete)
router.put('/form/', form.update)
router.post('/form/use', form.use_this_form)
router.post('/form/replicate', form.replicate)
router.post('/form/autocomplete', form.autocomplete)
router.post('/form/latest', form.latest)
router.post('/form/preview', form.preview)
router.post('/form/participant/list', form.getParticipant)
router.post('/form/participant/delete', form.deleteParticipant)
router.post('/form/analyze/result', form.analyzeResult)
router.post('/form/individual/result', form.individualResult)
router.post('/form/individual/list', form.getIndividual)
router.post('/form/view',form.viewValidation)


// form view
router.post('/form/view/submit', form.submitPreview)

// Question
router.post('/question/create', form.insertQuestion)
router.put('/question/', form.updateQuestion)
router.delete('/question/', form.deleteQuestion)

// Answer
router.post('/answer/create', form.insertAnswer)
router.put('/answer/', form.updateAnswer)
router.delete('/answer/', form.deleteAnswer)

// Hastag
router.post('/hashtag/create', hashtag.insert)
router.post('/hashtag/get_list', hashtag.getAll)
router.post('/hashtag/get_detail', hashtag.getDetail)
router.get('/hashtag/getHashtag', hashtag.getHashtag)
router.delete('/hashtag/', hashtag.delete)
router.put('/hashtag/', hashtag.update)

// Interest
router.post('/interest/create', interest.insert)
router.post('/interest/get_list', interest.getAll)
router.post('/interest/get_detail', interest.getDetail)
router.post('/interest/get_parent', interest.getParent)
router.post('/interest/get_child', interest.getChild)
router.post('/interest/get_child_include_user', interest.getChildWithUser)
router.delete('/interest/', interest.delete)
router.put('/interest/', interest.update)

// Forbidden Word
router.post('/forbidden/create', forbidden.insert)
router.post('/forbidden/get_list', forbidden.getAll)
router.post('/forbidden/get_detail', forbidden.getDetail)
router.delete('/forbidden/', forbidden.delete)
router.put('/forbidden/', forbidden.update)

// lineOfService
router.post('/lineOfService/create', lineService.insert)
router.post('/lineOfService/get_list', lineService.getAll)
router.post('/lineOfService/get_data', lineService.getList)
router.post('/lineOfService/get_detail', lineService.getDetail)
router.delete('/lineOfService/', lineService.delete)
router.put('/lineOfService/', lineService.update)

// eula
router.post('/eula/create', eula.insert)
router.post('/eula/get_list', eula.getAll)
router.post('/eula/get_detail', eula.getDetail)
router.delete('/eula/', eula.delete)
router.put('/eula/', eula.update)

// quote
router.post('/quote/create', quote.insert)
router.post('/quote/get_list', quote.getAll)
router.post('/quote/get_detail', quote.getDetail)
router.delete('/quote/', quote.delete)
router.put('/quote/', quote.update)

// Post
router.post('/post/create', post.insert)
router.post('/post/get_list', post.getAll)
router.post('/post/getOption', post.getOption)
router.post('/post/get_byHashtag', post.getAllByHashtag)
router.post('/post/get_detail', post.getDetail)
router.post('/post/', post.deleteSoft)
router.put('/post/', post.update)
router.get('/post/pinnedPost', post.pinnedPost)
router.post('/post/getLike', post.getLikes)
router.post('/post/getComment', post.getComment)
router.post('/post/report', post.getListReport)
router.delete('/post/report/', post.deleteReport)
router.put('/post/report', post.updateReport)
router.post('/post/removed', post.listRemoved)
router.delete('/post/removed', post.deletePermanent)
router.get('/post/getone/:id', (req,res)=> {
    const id = req.params
    post_model.getById(id, (err, data) => {
        res.json(data);
    })
})
router.post('/post/getfeatured', (req,res)=> {

    post_model.checkFeatured({type : req.body.type, featured: '1'}, (err, data) => {
        res.json(data);
    })
})

router.post('/post/getAllHashtagByUser', post.getAllHashtagByUser)
router.post('/post/getAllByUser', post.getAllByUser)
router.post('/post/getCommentByUser', post.getCommentByUser)
router.post('/post/getLikesByUser', post.getLikeByUser)
router.post('/post/insertVideo', post.insertVideo)

// Post v2
router.post('/polling/replicate', post.replicate)
router.post('/polling/participant/list', post.getParticipant)
router.post('/polling/participant/list', post.getParticipant)
router.delete('/polling/participant/', post.deleteParticipant)
router.post('/polling/analyze/result', post.analyzeResult)
router.post('/polling/individual/result', post.individualResult)
router.post('/polling/individual/list', post.getIndividual)
router.post('/polling/individual/answered', post.getIndividualDetail)
router.post('/polling/autocomplete', post.autocompletePolling)
router.post('/polling/latest', post.latestPolling)
router.delete('/polling/option/', post.deleteOption)


// Post Comment
router.delete('/post/comment/', post.deleteComment)
router.put('/post/comment', post.updateComment)
router.post('/post/getComment/detail', post.getDetailComment)

// News
router.post('/news/create', news.insert)
router.post('/news/get_list', news.getAll)
router.post('/news/get_detail', news.getDetail)
router.delete('/news/', news.delete)
router.put('/news/', news.update)

router.post('/news/insertImages', news.insertImages)
router.post('/news/setPrimary', news.setPrimary)
router.delete('/news/images', news.deleteImages)

// event
router.post('/event/cron_job', event.cronJob)
router.post('/event/get_list', event.getAll)
router.post('/event/get_detail', event.getDetail)
router.post('/event/getLike', event.getDetailLike)
router.post('/event/getComment', event.getComment)
router.get('/event/get_hashtag', event.gethashtagEvent)
router.delete('/event/', event.delete)
router.put('/event/', event.update)
router.post('/event/getCommentByUser', event.getCommentByUser)
router.post('/event/getLikesByUser', event.getLikesByUser)

router.post('/event/insertImages', event.insertImages)
router.post('/event/setPrimary', event.setPrimary)
router.delete('/event/images', event.deleteImages)

// Event Comment
router.delete('/event/comment/', event.deleteComment)
router.put('/event/comment', event.updateComment)
router.post('/event/getComment/detail', event.getDetailComment)

// appVersion
router.post('/app_version/create', appVersion.insert)
router.post('/app_version/get_list', appVersion.getAll)
router.post('/app_version/get_detail', appVersion.getDetail)
router.delete('/app_version/', appVersion.delete)
router.put('/app_version/', appVersion.update)


// job
router.post('/job/create', job.insert)
router.post('/job/get_list', job.getAll)
router.post('/job/get_detail', job.getDetail)
router.delete('/job/', job.delete)
router.put('/job/', job.update)
router.post('/job/get_recommendation', job.getRecommendation)
router.post('/job/get_recommendation/export', job.exportRecommendation)
router.post('/job/getJob_share', job.getJobShare)
router.post('/job/getJob_share/export', job.exportShare)
router.post('/job_share/getAllByUser', job.getShareByUser)
router.post('/job_recommendation/getAllByUser', job.getRecommendationByUser)


// Setting
router.post('/setting', setting.get)
router.post('/setting/update', setting.update)

// Post Weekly
router.post('/post/weekly/insert', postWeekly.insert)
router.post('/post/addWeekly', postWeekly.addWeekly)
router.post('/post/weekly/list', postWeekly.getAll)
router.post('/post/weekly/detail', postWeekly.getDetail)
router.post('/post/weekly/edit', postWeekly.edit)
router.delete('/post/weekly/delete', postWeekly.delete)
router.delete('/post/weekly/byPost?', postWeekly.delPostWeek)
router.delete('/post/weekly/byWeek', postWeekly.delWeekHigh)
router.post('/post/weekly/view_post', postWeekly.viewPost)

// Post Monthly
router.post('/post/monthly/insert', postMonthly.insert)
router.post('/post/addMonthly', postMonthly.addMonthly)
router.post('/post/monthly/list', postMonthly.getAll)
router.post('/post/monthly/detail', postMonthly.getDetail)
router.post('/post/monthly/edit', postMonthly.edit)
router.delete('/post/monthly/delete', postMonthly.delete)
router.delete('/post/monthly/byPost?', postMonthly.deletePost)
router.delete('/post/monthly/byMonth?', postMonthly.deleteMonthly)
router.post('/post/monthly/view_post', postMonthly.viewPost)

//Broadcast
router.post('/broadcast', broadcast.insertBroadcast)
router.post('/broadcast/get_list', broadcast.getListBroadcast)
router.post('/broadcast/get_detail', broadcast.getDetailBroadcast)
router.delete('/broadcast/', broadcast.deleteBroadcast)

router.post('/sandbox/pushNotif', sandbox.pushNotif)
router.post('/sandbox/getAllVerified', sandbox.getAllVerified)

// display 
router.post('/post/weekly/set_display',display.setWeekly)
router.post('/post/weekly/show_display',display.displayWeekly)
router.post('/post/monthly/set_display',display.setMonthly)
router.post('/post/monthly/show_display',display.displayMonthly)

// App Activity
router.post('/appActivity/getAllByUser', appActivity.getAllByUser)

// Message
router.post('/room/addRoom', room.addRoom)
router.post('/room/get_adminlist', room.chat_adminList)

router.post('/post/insertImages', post.insertImages)
router.post('/post/setPrimary', post.setPrimary)
router.delete('/post/images', post.deleteImages)

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

//Company
router.post('/company/add', company.add)
router.post('/company/get', company.getAll)

//Deeplink
router.post('/post/deeplink', post.deeplink)
router.post('/event/deeplink', event.deeplink)
router.post('/news/deeplink', news.deeplink)
router.post('/job/deeplink', job.deeplink)


//invitation
router.post('/invitation/import', invitation.importExcel)
router.post('/invitation/get_list', invitation.getAll)
router.post('/invitation/resent', invitation.resentInvitation)
router.post('/invitation/create', invitation.create)

// device
router.post('/device/getSpesificUser', device.getSpesificUser)
module.exports = router
