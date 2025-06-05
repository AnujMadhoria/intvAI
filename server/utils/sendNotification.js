const Notification = require('../models/Notification');

async function sendNotification(io, userId, type, content, joinLink = '') {
  const notification = await Notification.create({
    userId,
    type,
    content,
    joinLink,
  });

io.to(userId.toString()).emit('newInterview', {
    type,
    message: content,
    link: joinLink,
});}

module.exports = sendNotification;
