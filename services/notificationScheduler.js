const cron = require("node-cron");
const nodemailer = require("nodemailer");

const Employee = require("../models/Employee");
const NotificationLog = require("../models/NotificationLog");
const SystemSettings = require("../models/SystemSettings");

let scheduledTask = null;

function getDateKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function getMonthDay(date = new Date()) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${month}-${day}`;
}

async function ensureSettings() {
  let settings = await SystemSettings.findOne();

  if (!settings) {
    settings = await SystemSettings.create({});
  }

  return settings;
}

function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: String(process.env.SMTP_SECURE || "false").toLowerCase() === "true",
    auth: {
      user,
      pass
    }
  });
}

async function sendNotificationEmail(transporter, mailOptions) {
  if (!transporter) {
    throw new Error("SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS in server/.env");
  }

  await transporter.sendMail(mailOptions);
}

async function hasNotificationBeenSent(dedupeKey) {
  const existing = await NotificationLog.findOne({ dedupeKey, status: "sent" });
  return Boolean(existing);
}

async function recordNotificationLog({
  dedupeKey,
  type,
  notificationDateKey,
  recipientEmail,
  recipientName,
  employeeId = null,
  holidayName = "",
  subject,
  status,
  errorMessage = ""
}) {
  await NotificationLog.findOneAndUpdate(
    { dedupeKey },
    {
      dedupeKey,
      type,
      notificationDateKey,
      recipientEmail,
      recipientName,
      employeeId,
      holidayName,
      subject,
      status,
      errorMessage
    },
    { upsert: true, returnDocument: "after" }
  );
}

function buildBirthdayEmail(employee, companyName) {
  const subject = `Happy Birthday, ${employee.fullName}!`;
  const text = [
    `Hi ${employee.fullName},`,
    "",
    `Wishing you a very happy birthday from everyone at ${companyName}!`,
    "Have a wonderful day and a fantastic year ahead.",
    "",
    `Best regards,`,
    companyName
  ].join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; color: #0f172a;">
      <h2 style="margin-bottom: 12px;">Happy Birthday, ${employee.fullName}!</h2>
      <p>Wishing you a wonderful birthday from everyone at <strong>${companyName}</strong>.</p>
      <p>Have a fantastic day and a great year ahead.</p>
      <p style="margin-top: 24px;">Best regards,<br/>${companyName}</p>
    </div>
  `;

  return { subject, text, html };
}

function buildHolidayEmail(employee, holiday, companyName) {
  const subject = `${holiday.name} Holiday Greetings`;
  const text = [
    `Hi ${employee.fullName},`,
    "",
    `Warm wishes to you for ${holiday.name}.`,
    holiday.description || `Enjoy the holiday from all of us at ${companyName}.`,
    "",
    `Best regards,`,
    companyName
  ].join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; color: #0f172a;">
      <h2 style="margin-bottom: 12px;">${holiday.name} Greetings</h2>
      <p>Hi ${employee.fullName},</p>
      <p>${holiday.description || `Enjoy the holiday from all of us at <strong>${companyName}</strong>.`}</p>
      <p style="margin-top: 24px;">Best regards,<br/>${companyName}</p>
    </div>
  `;

  return { subject, text, html };
}

async function processBirthdayNotifications({ date, settings, transporter, fromAddress }) {
  if (!settings.notifications?.emailEnabled || !settings.notifications?.birthdayAlertsEnabled) {
    return;
  }

  const monthDay = getMonthDay(date);
  const dateKey = getDateKey(date);
  const employees = await Employee.find({
    birthDate: { $ne: null }
  });
  const birthdayEmployees = employees.filter((employee) => {
    if (!employee.birthDate) {
      return false;
    }

    return getMonthDay(new Date(employee.birthDate)) === monthDay;
  });

  for (const employee of birthdayEmployees) {
    const dedupeKey = `birthday:${dateKey}:${employee._id}`;

    if (await hasNotificationBeenSent(dedupeKey)) {
      continue;
    }

    const email = buildBirthdayEmail(employee, settings.companyName || "StaffHub");

    try {
      await sendNotificationEmail(transporter, {
        from: fromAddress,
        to: employee.email,
        subject: email.subject,
        text: email.text,
        html: email.html
      });

      await recordNotificationLog({
        dedupeKey,
        type: "birthday",
        notificationDateKey: dateKey,
        recipientEmail: employee.email,
        recipientName: employee.fullName,
        employeeId: String(employee._id),
        subject: email.subject,
        status: "sent"
      });
    } catch (error) {
      await recordNotificationLog({
        dedupeKey,
        type: "birthday",
        notificationDateKey: dateKey,
        recipientEmail: employee.email,
        recipientName: employee.fullName,
        employeeId: String(employee._id),
        subject: email.subject,
        status: "failed",
        errorMessage: error.message || "Birthday email failed"
      });
    }
  }
}

async function processHolidayNotifications({ date, settings, transporter, fromAddress }) {
  if (!settings.notifications?.emailEnabled || !settings.notifications?.holidayAlertsEnabled) {
    return;
  }

  const monthDay = getMonthDay(date);
  const dateKey = getDateKey(date);
  const holidays = (settings.notifications?.holidays || []).filter((holiday) => holiday.active && holiday.monthDay === monthDay);

  if (holidays.length === 0) {
    return;
  }

  const employees = await Employee.find();

  for (const holiday of holidays) {
    for (const employee of employees) {
      const dedupeKey = `holiday:${dateKey}:${holiday.name}:${employee._id}`;

      if (await hasNotificationBeenSent(dedupeKey)) {
        continue;
      }

      const email = buildHolidayEmail(employee, holiday, settings.companyName || "StaffHub");

      try {
        await sendNotificationEmail(transporter, {
          from: fromAddress,
          to: employee.email,
          subject: email.subject,
          text: email.text,
          html: email.html
        });

        await recordNotificationLog({
          dedupeKey,
          type: "holiday",
          notificationDateKey: dateKey,
          recipientEmail: employee.email,
          recipientName: employee.fullName,
          employeeId: String(employee._id),
          holidayName: holiday.name,
          subject: email.subject,
          status: "sent"
        });
      } catch (error) {
        await recordNotificationLog({
          dedupeKey,
          type: "holiday",
          notificationDateKey: dateKey,
          recipientEmail: employee.email,
          recipientName: employee.fullName,
          employeeId: String(employee._id),
          holidayName: holiday.name,
          subject: email.subject,
          status: "failed",
          errorMessage: error.message || "Holiday email failed"
        });
      }
    }
  }
}

async function runScheduledNotifications() {
  const settings = await ensureSettings();
  const transporter = createTransporter();
  const senderName = settings.notifications?.senderName || settings.companyName || "StaffHub";
  const senderEmail = settings.notifications?.senderEmail || process.env.SMTP_FROM_EMAIL || settings.companyEmail || process.env.SMTP_USER || "";
  const fromAddress = senderEmail ? `"${senderName}" <${senderEmail}>` : senderName;
  const date = new Date();

  await processBirthdayNotifications({ date, settings, transporter, fromAddress });
  await processHolidayNotifications({ date, settings, transporter, fromAddress });
}

function stopNotificationScheduler() {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask.destroy();
    scheduledTask = null;
  }
}

async function scheduleNotificationJob() {
  const settings = await ensureSettings();
  const cronExpression = settings.notifications?.scheduleCron || "0 8 * * *";

  stopNotificationScheduler();

  scheduledTask = cron.schedule(cronExpression, async () => {
    try {
      await runScheduledNotifications();
      console.log("Scheduled notifications processed");
    } catch (error) {
      console.error("Scheduled notifications failed:", error.message);
    }
  });
}

async function startNotificationScheduler() {
  await scheduleNotificationJob();

  try {
    await runScheduledNotifications();
    console.log("Initial notification check completed");
  } catch (error) {
    console.error("Initial notification check failed:", error.message);
  }
}

module.exports = {
  runScheduledNotifications,
  scheduleNotificationJob,
  startNotificationScheduler,
  stopNotificationScheduler
};
