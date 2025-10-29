const cron = require("node-cron");
const nodemailer = require("nodemailer");
const Medicine = require('./models/Medicine');
const User = require('./models/User');

// Configure the email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "your-email@gmail.com", // Replace with your email
    pass: process.env.EMAIL_PASS || "your-email-password", // Replace with your email password or app password
  },
});

// Function to send medicine reminders
const sendMedicineReminders = async () => {
  try {
    console.log('Checking for medicine reminders...');

    const now = new Date();
    const reminderWindow = new Date(now.getTime() + (15 * 60 * 1000)); // 15 minutes from now

    // Find all active medicines with reminders enabled
    const medicines = await Medicine.find({
      status: 'active',
      'reminders.enabled': true,
      'frequency.specificTimes': { $exists: true, $ne: [] }
    }).populate('patientId', 'email displayName');

    const remindersSent = [];

    for (const medicine of medicines) {
      if (!medicine.patientId || !medicine.patientId.email) continue;

      const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

      for (const time of medicine.frequency.specificTimes) {
        if (time > currentTime) {
          const [hours, minutes] = time.split(':');
          const doseTime = new Date(now);
          doseTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

          if (doseTime >= now && doseTime <= reminderWindow) {
            // Send email reminder
            const mailOptions = {
              from: process.env.EMAIL_USER || "your-email@gmail.com",
              to: medicine.patientId.email,
              subject: `Medicine Reminder: ${medicine.name}`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #2563eb;">Medicine Reminder</h2>
                  <p>Hello ${medicine.patientId.displayName || 'there'},</p>
                  <p>It's time to take your medicine:</p>
                  <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin: 0; color: #1f2937;">${medicine.name}</h3>
                    <p style="margin: 10px 0;"><strong>Dosage:</strong> ${medicine.dosage.amount || ''} ${medicine.dosage.unit || ''}</p>
                    <p style="margin: 10px 0;"><strong>Scheduled Time:</strong> ${time}</p>
                    ${medicine.instructions?.howToTake ? `<p style="margin: 10px 0;"><strong>Instructions:</strong> ${medicine.instructions.howToTake}</p>` : ''}
                  </div>
                  <p>Please take your medicine on time for better health outcomes.</p>
                  <p style="color: #6b7280; font-size: 14px;">This is an automated reminder from HealthSync+.</p>
                </div>
              `
            };

            try {
              await transporter.sendMail(mailOptions);
              console.log(`Reminder sent for ${medicine.name} to ${medicine.patientId.email}`);

              remindersSent.push({
                medicineId: medicine._id,
                medicineName: medicine.name,
                patientEmail: medicine.patientId.email,
                scheduledTime: time
              });
            } catch (emailError) {
              console.error(`Failed to send reminder for ${medicine.name}:`, emailError);
            }
          }
        }
      }
    }

    console.log(`Medicine reminder check completed. Sent ${remindersSent.length} reminders.`);
    return remindersSent;

  } catch (error) {
    console.error('Error in sendMedicineReminders:', error);
    return [];
  }
};

// Function to check for low stock and send reorder alerts
const checkLowStockAndReorder = async () => {
  try {
    console.log('Checking for low stock medicines...');

    const lowStockMedicines = await Medicine.find({
      status: 'active',
      'inventory.autoReorder': true,
      $expr: {
        $lte: ['$inventory.currentStock', '$inventory.reorderPoint']
      }
    }).populate('patientId', 'email displayName');

    const reorderAlerts = [];

    for (const medicine of lowStockMedicines) {
      if (!medicine.patientId || !medicine.patientId.email) continue;

      // Send reorder alert email
      const mailOptions = {
        from: process.env.EMAIL_USER || "your-email@gmail.com",
        to: medicine.patientId.email,
        subject: `Low Stock Alert: ${medicine.name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">Low Stock Alert</h2>
            <p>Hello ${medicine.patientId.displayName || 'there'},</p>
            <p>Your medicine stock is running low:</p>
            <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
              <h3 style="margin: 0; color: #1f2937;">${medicine.name}</h3>
              <p style="margin: 10px 0;"><strong>Current Stock:</strong> ${medicine.inventory.currentStock} ${medicine.dosage?.unit || 'units'}</p>
              <p style="margin: 10px 0;"><strong>Reorder Point:</strong> ${medicine.inventory.reorderPoint} ${medicine.dosage?.unit || 'units'}</p>
              ${medicine.inventory.supplier ? `<p style="margin: 10px 0;"><strong>Supplier:</strong> ${medicine.inventory.supplier}</p>` : ''}
            </div>
            <p>Please reorder your medicine to avoid running out.</p>
            <p style="color: #6b7280; font-size: 14px;">This is an automated alert from HealthSync+.</p>
          </div>
        `
      };

      try {
        await transporter.sendMail(mailOptions);
        console.log(`Low stock alert sent for ${medicine.name} to ${medicine.patientId.email}`);

        reorderAlerts.push({
          medicineId: medicine._id,
          medicineName: medicine.name,
          patientEmail: medicine.patientId.email,
          currentStock: medicine.inventory.currentStock,
          reorderPoint: medicine.inventory.reorderPoint
        });
      } catch (emailError) {
        console.error(`Failed to send low stock alert for ${medicine.name}:`, emailError);
      }
    }

    console.log(`Low stock check completed. Sent ${reorderAlerts.length} alerts.`);
    return reorderAlerts;

  } catch (error) {
    console.error('Error in checkLowStockAndReorder:', error);
    return [];
  }
};

// Schedule medicine reminders every 15 minutes
cron.schedule("*/15 * * * *", async () => {
  await sendMedicineReminders();
});

// Schedule low stock checks daily at 9 AM
cron.schedule("0 9 * * *", async () => {
  await checkLowStockAndReorder();
});

// Schedule adherence summary emails weekly (every Sunday at 10 AM)
cron.schedule("0 10 * * 0", async () => {
  try {
    console.log('Sending weekly adherence summaries...');

    const users = await User.find({ role: 'patient' });

    for (const user of users) {
      const medicines = await Medicine.find({
        patientId: user._id,
        status: 'active'
      });

      if (medicines.length === 0) continue;

      let totalAdherence = 0;
      let medicineSummaries = [];

      for (const medicine of medicines) {
        const adherenceRate = medicine.getAdherenceRate(7); // Last 7 days
        totalAdherence += adherenceRate;

        medicineSummaries.push({
          name: medicine.name,
          adherenceRate: adherenceRate,
          totalDoses: medicine.adherence.filter(a => {
            const recordDate = new Date(a.date);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return recordDate >= weekAgo;
          }).length
        });
      }

      const averageAdherence = Math.round(totalAdherence / medicines.length);

      const mailOptions = {
        from: process.env.EMAIL_USER || "your-email@gmail.com",
        to: user.email,
        subject: 'Weekly Medicine Adherence Summary - HealthSync+',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Weekly Medicine Adherence Summary</h2>
            <p>Hello ${user.displayName || 'there'},</p>
            <p>Here's your medicine adherence summary for the past week:</p>

            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0 0 15px 0; color: #1f2937;">Overall Adherence: ${averageAdherence}%</h3>

              ${medicineSummaries.map(med => `
                <div style="margin-bottom: 10px; padding: 10px; background: white; border-radius: 4px;">
                  <strong>${med.name}</strong>: ${med.adherenceRate}% (${med.totalDoses} doses taken)
                </div>
              `).join('')}
            </div>

            <p>Keep up the good work! Consistent medication adherence is crucial for your health.</p>
            <p style="color: #6b7280; font-size: 14px;">This is an automated summary from HealthSync+.</p>
          </div>
        `
      };

      try {
        await transporter.sendMail(mailOptions);
        console.log(`Weekly summary sent to ${user.email}`);
      } catch (emailError) {
        console.error(`Failed to send weekly summary to ${user.email}:`, emailError);
      }
    }

    console.log('Weekly adherence summaries sent.');

  } catch (error) {
    console.error('Error sending weekly summaries:', error);
  }
});

console.log("Medicine Reminder & Notification system is running...");
console.log("Schedules:");
console.log("- Medicine reminders: Every 15 minutes");
console.log("- Low stock alerts: Daily at 9 AM");
console.log("- Weekly adherence summaries: Sundays at 10 AM");
