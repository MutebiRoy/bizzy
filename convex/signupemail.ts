// convex/email.ts
"use node"; // Allows use of Node modules in this file

import nodemailer from "nodemailer";
import { internalAction } from "./_generated/server";
import { v } from "convex/values";

// OPTIONAL: environment variables for SMTP user/pass, if you prefer:
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;

// Create a Nodemailer transporter (example: Gmail SMTP, port 587)
const transporter = nodemailer.createTransport({
  //host: "smtp.gmail.com",
  service: "gmail",
  //port: 587,
  //secure: false, // true if port 465
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
});

// Our internal action that actually sends the email
export const sendNewUserEmail = internalAction({
  args: {
    name: v.string(),
    email: v.string(),
    clerkId: v.string(),
  },
  handler: async (ctx, { name, email, clerkId }) => {
    // Use nodemailer to send an email to al@almutebi.com
    try {
      await transporter.sendMail({
        from: '"Bizmous Notifications" <no-reply@bizmous.com>',
        to: "al@almutebi.com",
        subject: "New User Signed Up on Bizmous",
        text: `A new user just signed up!\n\nName: ${name}\nEmail: ${email}\nClerk ID: ${clerkId}\n`,
      });
      console.log("Email sent successfully to al@almutebi.com");
    } catch (err) {
      console.error("Failed to send email:", err);
    }
  },
});
