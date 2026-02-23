import cron from 'node-cron';
import Event from '../models/Event.js';
import Registration from '../models/Registration.js';
import { sendEventReminderEmail } from '../utils/eventEmailService.js';

/**
 * Schedule daily cron job at 9:00 AM to send reminders
 * for events happening the next day.
 */
export const scheduleEventReminders = () => {
  // Run every day at 9:00 AM
  cron.schedule('0 9 * * *', async () => {
    console.log('⏰ Running event reminder cron job...');

    try {
      // Find events happening tomorrow
      const now = new Date();
      const tomorrowStart = new Date(now);
      tomorrowStart.setDate(tomorrowStart.getDate() + 1);
      tomorrowStart.setHours(0, 0, 0, 0);

      const tomorrowEnd = new Date(tomorrowStart);
      tomorrowEnd.setHours(23, 59, 59, 999);

      const tomorrowEvents = await Event.find({
        eventDate: { $gte: tomorrowStart, $lte: tomorrowEnd },
        status: 'open', // Don't send for cancelled/full events that were cancelled
      }).lean();

      if (tomorrowEvents.length === 0) {
        console.log('  No events tomorrow. Skipping reminders.');
        return;
      }

      for (const event of tomorrowEvents) {
        const registrations = await Registration.find({ event: event._id })
          .populate('student', 'fullName email')
          .lean();

        const studentList = registrations
          .filter(r => r.student?.email)
          .map(r => ({
            email: r.student.email,
            name: r.student.fullName,
          }));

        if (studentList.length > 0) {
          console.log(`  Sending reminders for "${event.title}" to ${studentList.length} students`);
          await sendEventReminderEmail(studentList, event);
        }
      }

      console.log('✓ Event reminder cron job completed');
    } catch (error) {
      console.error('❌ Event reminder cron error:', error);
    }
  });

  console.log('✓ Event reminder cron scheduled (daily at 9:00 AM)');
};
