const express = require('express')
const router = express.Router()

const { joinMeeting } = require('../controllers/meetingController')

router.get('/:bookingId/join', joinMeeting)

module.exports = router