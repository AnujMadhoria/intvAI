const nodemailer = require('nodemailer');

// Create a transporter
const transporter = nodemailer.createTransport({
  service: 'gmail', // or your email service
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const sendInterviewScheduledEmail = async (toEmail, interviewDetails) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USERNAME,
      to: toEmail,
      subject: 'Interview Scheduled',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Interview Scheduled</h2>
          <p>Hello ${interviewDetails.candidateName || 'Candidate'},</p>
          <p>An interview has been scheduled for you with the following details:</p>
          
          <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p><strong>Date & Time:</strong> ${new Date(interviewDetails.scheduledAt).toLocaleString()}</p>
            ${interviewDetails.interviewLink ? `<p><strong>Meeting Link:</strong> <a href="${interviewDetails.interviewLink}">Join Interview</a></p>` : ''}
          </div>
          
          <p>Please make sure to be on time and prepare accordingly.</p>
          <p>Best regards,<br>Interview Team</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('Interview scheduled email sent to:', toEmail);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

module.exports = { sendInterviewScheduledEmail };