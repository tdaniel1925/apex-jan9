// SPEC: FEATURE 6 > Email Notifications
// Email module exports

export {
  sendWelcomeEmail,
  sendNewTeamMemberEmail,
  sendContactNotificationEmail,
  sendSpilloverNotificationEmail,
} from "./templates";

export { resend, EMAIL_FROM, APP_NAME, APP_URL } from "./client";
