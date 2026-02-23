import nodemailer from 'nodemailer';

const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS;

// Reuse transporter setup
let transporter = null;

if (emailUser && emailPass) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });
}

const sendMail = async (to, subject, html) => {
  if (!transporter) {
    console.warn('⚠️ Email not sent — no transporter configured');
    return;
  }
  await transporter.sendMail({
    from: `"SunoCampus" <${emailUser}>`,
    to,
    subject,
    html,
  });
};

// ============================================================
// EVENT REGISTRATION CONFIRMATION — Sent to student
// ============================================================
export const sendEventRegistrationEmail = async (studentEmail, studentName, event) => {
  const locationInfo = event.mode === 'Online'
    ? `<strong>Meeting Link:</strong> <a href="${event.zoomLink}">${event.zoomLink}</a>`
    : event.mode === 'Hybrid'
      ? `<strong>Location:</strong> ${event.location}<br><strong>Meeting Link:</strong> <a href="${event.zoomLink}">${event.zoomLink}</a>`
      : `<strong>Location:</strong> ${event.location}`;

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
      <div style="background: linear-gradient(135deg, #1e3a5f, #2563eb); padding: 30px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">🎉 Registration Confirmed!</h1>
      </div>
      <div style="padding: 30px;">
        <p style="font-size: 16px; color: #333;">Hi <strong>${studentName}</strong>,</p>
        <p style="font-size: 15px; color: #555;">You've successfully registered for the following event:</p>
        
        <div style="background: #f8fafc; border-left: 4px solid #2563eb; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
          <h2 style="margin: 0 0 10px 0; color: #1e3a5f; font-size: 20px;">${event.title}</h2>
          <p style="margin: 5px 0; color: #555;"><strong>Category:</strong> ${event.category}</p>
          <p style="margin: 5px 0; color: #555;"><strong>Date:</strong> ${new Date(event.eventDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p style="margin: 5px 0; color: #555;"><strong>Time:</strong> ${event.eventTime}</p>
          <p style="margin: 5px 0; color: #555;"><strong>Mode:</strong> ${event.mode}</p>
          <p style="margin: 5px 0; color: #555;">${locationInfo}</p>
        </div>

        <p style="font-size: 14px; color: #888; margin-top: 20px;">See you there! 🚀</p>
      </div>
      <div style="background: #f1f5f9; padding: 15px; text-align: center; font-size: 12px; color: #94a3b8;">
        SunoCampus — Your College Network
      </div>
    </div>
  `;

  try {
    await sendMail(studentEmail, `✅ Registered: ${event.title}`, html);
  } catch (error) {
    console.error('Registration email error:', error.message);
  }
};

// ============================================================
// EVENT FULL NOTIFICATION — Sent to contributor
// ============================================================
export const sendEventFullEmail = async (contributorEmail, contributorName, event) => {
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
      <div style="background: linear-gradient(135deg, #059669, #10b981); padding: 30px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">🎊 Event is FULL!</h1>
      </div>
      <div style="padding: 30px;">
        <p style="font-size: 16px; color: #333;">Hi <strong>${contributorName}</strong>,</p>
        <p style="font-size: 15px; color: #555;">Great news! Your event has reached full capacity:</p>
        
        <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
          <h2 style="margin: 0 0 10px 0; color: #065f46; font-size: 20px;">${event.title}</h2>
          <p style="margin: 5px 0; color: #555;"><strong>Total Seats:</strong> ${event.totalSeats}</p>
          <p style="margin: 5px 0; color: #555;"><strong>Registered:</strong> ${event.registeredCount} / ${event.totalSeats}</p>
          <p style="margin: 5px 0; color: #555;"><strong>Status:</strong> <span style="color: #dc2626; font-weight: bold;">FULL — Registration Closed</span></p>
        </div>

        <p style="font-size: 14px; color: #555;">Registration has been automatically closed. You can view all registered students from your dashboard.</p>
      </div>
      <div style="background: #f1f5f9; padding: 15px; text-align: center; font-size: 12px; color: #94a3b8;">
        SunoCampus — Your College Network
      </div>
    </div>
  `;

  try {
    await sendMail(contributorEmail, `🎊 Event FULL: ${event.title}`, html);
  } catch (error) {
    console.error('Event full email error:', error.message);
  }
};

// ============================================================
// EVENT CANCELLATION — Sent to all registered students
// ============================================================
export const sendEventCancellationEmail = async (studentList, event) => {
  // studentList = [{ email, name }, ...]
  const promises = studentList.map(({ email, name }) => {
    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #dc2626, #ef4444); padding: 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">⚠️ Event Cancelled</h1>
        </div>
        <div style="padding: 30px;">
          <p style="font-size: 16px; color: #333;">Hi <strong>${name}</strong>,</p>
          <p style="font-size: 15px; color: #555;">We're sorry to inform you that the following event has been cancelled:</p>
          
          <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
            <h2 style="margin: 0 0 10px 0; color: #991b1b; font-size: 20px;">${event.title}</h2>
            <p style="margin: 5px 0; color: #555;"><strong>Was scheduled for:</strong> ${new Date(event.eventDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p style="margin: 5px 0; color: #555;"><strong>Time:</strong> ${event.eventTime}</p>
          </div>

          <p style="font-size: 14px; color: #555;">Your registration has been removed. We apologize for any inconvenience.</p>
        </div>
        <div style="background: #f1f5f9; padding: 15px; text-align: center; font-size: 12px; color: #94a3b8;">
          SunoCampus — Your College Network
        </div>
      </div>
    `;

    return sendMail(email, `❌ Cancelled: ${event.title}`, html).catch(err =>
      console.error(`Cancellation email to ${email} failed:`, err.message)
    );
  });

  await Promise.allSettled(promises);
};

// ============================================================
// EVENT REMINDER — Sent 1 day before event to all registered students
// ============================================================
export const sendEventReminderEmail = async (studentList, event) => {
  const locationInfo = event.mode === 'Online'
    ? `<strong>Meeting Link:</strong> <a href="${event.zoomLink}">${event.zoomLink}</a>`
    : event.mode === 'Hybrid'
      ? `<strong>Location:</strong> ${event.location}<br><strong>Meeting Link:</strong> <a href="${event.zoomLink}">${event.zoomLink}</a>`
      : `<strong>Location:</strong> ${event.location}`;

  const promises = studentList.map(({ email, name }) => {
    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #d97706, #f59e0b); padding: 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">⏰ Event Tomorrow!</h1>
        </div>
        <div style="padding: 30px;">
          <p style="font-size: 16px; color: #333;">Hi <strong>${name}</strong>,</p>
          <p style="font-size: 15px; color: #555;">Just a reminder — the event you registered for is <strong>tomorrow</strong>!</p>
          
          <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
            <h2 style="margin: 0 0 10px 0; color: #92400e; font-size: 20px;">${event.title}</h2>
            <p style="margin: 5px 0; color: #555;"><strong>Date:</strong> ${new Date(event.eventDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p style="margin: 5px 0; color: #555;"><strong>Time:</strong> ${event.eventTime}</p>
            <p style="margin: 5px 0; color: #555;"><strong>Mode:</strong> ${event.mode}</p>
            <p style="margin: 5px 0; color: #555;">${locationInfo}</p>
          </div>

          <p style="font-size: 14px; color: #555;">Don't forget to show up! We look forward to seeing you there. 🎉</p>
        </div>
        <div style="background: #f1f5f9; padding: 15px; text-align: center; font-size: 12px; color: #94a3b8;">
          SunoCampus — Your College Network
        </div>
      </div>
    `;

    return sendMail(email, `⏰ Reminder: ${event.title} is Tomorrow!`, html).catch(err =>
      console.error(`Reminder email to ${email} failed:`, err.message)
    );
  });

  await Promise.allSettled(promises);
};
