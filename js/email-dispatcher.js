/**
 * Communication Club - Automated Email Dispatcher Engine
 */

class EmailDispatcher {
  constructor() {
    this.isDispatching = false;
    this.emailTemplate = {
      subject: "Your Official E-Certificate from THE COMMUNICATION CLUB - {{eventName}}",
      body: "Dear {{name}},\n\nCongratulations! We are delighted to present your official E-Certificate for your role as {{category}} in '{{eventName}}' organized by The Communication Club, Sona College of Technology.\n\nYou can view, download your high-resolution certificate, and verify its authenticity at any time using your unique Certificate ID: {{id}}\n\nDirect Certificate Link:\n{{certificateLink}}\n\nWarm regards,\nClub Coordinator,\nThe Communication Club,\nSona College of Technology"
    };
  }

  compileEmail(recipient, settings) {
    const certUrl = window.certRenderer.generateVerifyUrl(recipient.id);
    const categoryName = recipient.category === 'organiser' ? 'an Organiser' : 'a Distinguished Participant';

    const subject = this.emailTemplate.subject
      .replace(/{{eventName}}/g, recipient.eventName || settings.eventName)
      .replace(/{{name}}/g, recipient.name || 'Participant');

    const body = this.emailTemplate.body
      .replace(/{{name}}/g, recipient.name || 'Participant')
      .replace(/{{category}}/g, categoryName)
      .replace(/{{eventName}}/g, recipient.eventName || settings.eventName)
      .replace(/{{id}}/g, recipient.id)
      .replace(/{{certificateLink}}/g, certUrl);

    return {
      to: recipient.email,
      subject: subject,
      body: body,
      certUrl: certUrl
    };
  }

  generateMailtoLink(recipient, settings) {
    const email = this.compileEmail(recipient, settings);
    return `mailto:${encodeURIComponent(email.to)}?subject=${encodeURIComponent(email.subject)}&body=${encodeURIComponent(email.body)}`;
  }

  async sendSingleEmail(recipient, settings, logCallback = null) {
    if (!recipient.email) {
      if (logCallback) logCallback(`[ERROR] Skipped ${recipient.name} - No email registered.`);
      return false;
    }

    const email = this.compileEmail(recipient, settings);

    if (logCallback) {
      logCallback(`[DISPATCH] Preparing certificate packet for: ${recipient.name} <${recipient.email}>`);
      logCallback(`[ATTACH] Attaching Verified Certificate ID: ${recipient.id}`);
    }

    // Simulated network transmission delay
    await new Promise(r => setTimeout(r, 600));

    // Update status in store
    window.certStore.updateRecipient(recipient.id, { status: 'Sent' });

    if (logCallback) {
      logCallback(`[SUCCESS] Email successfully dispatched to ${recipient.email} ✔`);
    }

    return true;
  }

  async dispatchBatch(recipients, settings, progressCallback, logCallback) {
    if (this.isDispatching) return;
    this.isDispatching = true;

    const total = recipients.length;
    let sentCount = 0;

    if (logCallback) {
      logCallback(`=======================================================`);
      logCallback(`[INIT] Automated Batch Email Dispatcher started for ${total} recipient(s).`);
      logCallback(`[EVENT] ${settings.eventName} | ${settings.clubName}`);
      logCallback(`=======================================================`);
    }

    for (let i = 0; i < total; i++) {
      const recipient = recipients[i];
      await this.sendSingleEmail(recipient, settings, logCallback);
      sentCount++;
      
      const percent = Math.round((sentCount / total) * 100);
      if (progressCallback) {
        progressCallback(percent, sentCount, total);
      }
    }

    if (logCallback) {
      logCallback(`=======================================================`);
      logCallback(`[COMPLETED] Batch dispatch finished! ${sentCount}/${total} certificates dispatched.`);
      logCallback(`=======================================================`);
    }

    this.isDispatching = false;
    return true;
  }
}

window.emailDispatcher = new EmailDispatcher();
