require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Allow cross-origin requests from frontend
app.use(express.json()); // Parse JSON bodies

// Create a transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS.replace(/\s+/g, '') // Removes spaces if any were left in the password string
  }
});

// Verify the transporter configuration
transporter.verify(function (error, success) {
  if (error) {
    console.error('Error connecting to SMTP:', error);
  } else {
    console.log('Server is ready to take our messages (SMTP verified)');
  }
});

// POST endpoint for contact form submission
app.post('/api/contact', async (req, res) => {
  const { name, email, phone, message } = req.body;

  // Basic validation
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required fields.' });
  }

  try {
    // Construct email options
    const mailOptions = {
      from: `"${name}" <${process.env.EMAIL_USER}>`, // sender address (use authorized email to avoid spoofing issues)
      replyTo: email,
      to: process.env.EMAIL_USER, // send to your own cafe email
      subject: `New Contact Form Submission from ${name}`, // Subject line
      text: `
        You have a new contact form submission for Cozy Cup Cafe!
        
        Name: ${name}
        Email: ${email}
        Phone: ${phone || 'Not provided'}
        
        Message:
        ${message}
      `,
      html: `
        <h3>New Contact Form Submission for Cozy Cup Cafe!</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
        <p><strong>Message:</strong><br>${message.replace(/\n/g, '<br>')}</p>
      `
    };

    // Send email
    let info = await transporter.sendMail(mailOptions);
    console.log('Message sent: %s', info.messageId);
    
    res.status(200).json({ success: true, message: 'Message sent successfully!' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ success: false, error: 'Failed to send message.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
