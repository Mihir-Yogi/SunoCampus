import nodemailer from 'nodemailer';

const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS;

// Create email transporter only if credentials exist
let transporter = null;

if (emailUser && emailPass) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });

  // Test email connection on startup
  transporter.verify((error, success) => {
    if (error) {
      console.error('❌ Email service error:', error.message);
    } else {
      console.log('✓ Email service ready');
    }
  });
} else {
  console.warn('⚠️  Email credentials not configured (EMAIL_USER or EMAIL_PASS missing)');
}

// Send OTP email
export const sendOTPEmail = async (email, otp) => {
  try {
    if (!transporter || !emailUser || !emailPass) {
      console.error('❌ Email service not configured');
      return false;
    }

    const mailOptions = {
      from: emailUser,
      to: email,
      subject: 'SunoCampus - Email Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e3a5f;">SunoCampus Registration</h2>
          <p>Welcome to SunoCampus!</p>
          <p>Your email verification code is:</p>
          <div style="background: #f0f0f0; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
            <h1 style="color: #1e3a5f; letter-spacing: 3px; margin: 0;">${otp}</h1>
          </div>
          <p>This code expires in 10 minutes.</p>
          <p style="color: #666; font-size: 12px;">If you didn't request this code, please ignore this email.</p>
          <hr style="border: 0; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="color: #999; font-size: 11px;">© 2026 SunoCampus. All rights reserved.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✓ OTP sent to ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Email sending error:', error.message);
    return false;
  }
};

// Send approval email to contributor
export const sendContributorApprovalEmail = async (email, fullName) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'SunoCampus - Contributor Status Approved',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10b981;">Congratulations!</h2>
          <p>Hi ${fullName},</p>
          <p>Your application to become a Contributor on SunoCampus has been approved!</p>
          <p>You now have access to:</p>
          <ul>
            <li>Create and manage posts</li>
            <li>Create and manage events</li>
            <li>View engagement analytics</li>
          </ul>
          <p>Log in to SunoCampus to get started!</p>
          <hr style="border: 0; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="color: #999; font-size: 11px;">© 2026 SunoCampus. All rights reserved.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
};

export default sendOTPEmail;
