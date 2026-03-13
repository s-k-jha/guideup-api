const Booking = require('../models/Booking')
const { successResponse, errorResponse } = require('../utils/apiResponse')

const joinMeeting = async (req, res) => {
  try {

    const { bookingId } = req.params

    const booking = await Booking.findById(bookingId)

    if (!booking) {
      return errorResponse(res, "Booking not found", 404)
    }

    if (!booking.meetingLink) {
      return errorResponse(res, "Meeting link not ready yet don't worry your paid amount will be safe", 400)
    }

    const now = new Date()

    const meetingStart = new Date(`${booking.date}T${booking.startTime}:00+05:30`)

    const joinAllowed = new Date(meetingStart.getTime() - 5 * 60 * 1000)

    if (now < joinAllowed) {
      return errorResponse(res, "Session not started yet", 400)
    }

    if (!booking.studentJoinedAt) {
      booking.studentJoinedAt = now
      await booking.save()
    }

    return successResponse(res, {
      meetingLink: booking.meetingLink,
      date: booking.date,
      startTime: booking.startTime
    })

  } catch (error) {
    return errorResponse(res, error.message, 500)
  }
}

module.exports = { joinMeeting }