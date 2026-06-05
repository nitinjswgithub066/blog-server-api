const fs = require('fs');
const files = [
  'src/emails/email.service.ts',
  'src/emails/templates/commentAlert.template.ts',
  'src/emails/templates/contactMessage.template.ts',
  'src/emails/templates/forgotPassword.template.ts',
  'src/emails/templates/newPostPublished.template.ts',
  'src/emails/templates/newsletterWelcome.template.ts',
  'src/emails/templates/systemAlert.template.ts',
  'src/jobs/analyticsRollup.job.ts',
  'src/jobs/cleanupTempMedia.job.ts',
  'src/jobs/publishScheduledPosts.job.ts',
  'src/jobs/sendPendingEmails.job.ts'
];
for(const f of files) {
  if (fs.existsSync(f)) {
    let text = fs.readFileSync(f, 'utf8');
    text = text.split('\\`').join('`');
    text = text.split('\\$').join('$');
    text = text.split('\\n').join('\n');
    fs.writeFileSync(f, text);
  }
}
console.log('Fixed escaped characters');
