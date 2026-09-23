/**
 * Communication Club E-Certificate System - Data Store & Local Storage Engine
 */

const STORAGE_KEYS = {
  SETTINGS: 'comm_club_settings_v2',
  RECIPIENTS: 'comm_club_recipients_v2',
  ADMIN_AUTH: 'comm_club_admin_session_v2',
  EMAIL_SETTINGS: 'comm_club_email_config_v2'
};

// Default Settings matching the exact reference certificate
const DEFAULT_SETTINGS = {
  clubName: 'The Communication Club',
  institutionName: 'Sona College of Technology',
  eventName: 'Prelims - Eloquence',
  issueDate: '24-09-2026',
  
  coordinator1Title: 'CLUB CO-ORDINATOR',
  coordinator1SignUrl: 'assets/signatures/signature-coordinator.svg',

  coordinator2Title: 'CLUB CO-COORDINATOR',
  coordinator2SignUrl: 'assets/signatures/signature-parthasarathi.svg',
  
  sealUrl: 'assets/badges/gold-seal.svg',
  
  // Participant Category Template
  participant: {
    mainTitle: 'CERTIFICATE',
    subTitle: 'OF APPRECIATION',
    presentedText: 'THIS CERTIFICATE IS PRESENTED TO',
    bodyCitation: 'In recognition of outstanding achievements in “ <strong>{{eventName}}</strong> ”<br>that significantly benefited <strong>{{clubName}}</strong> on {{issueDate}}.'
  },

  // Organiser Category Template
  organiser: {
    mainTitle: 'CERTIFICATE',
    subTitle: 'OF APPRECIATION',
    presentedText: 'THIS CERTIFICATE IS PRESENTED TO',
    bodyCitation: 'In recognition of outstanding dedication and leadership in “ <strong>{{eventName}}</strong> ”<br>that significantly benefited <strong>{{clubName}}</strong> on {{issueDate}}.'
  }
};

// Default Sample Recipients matching the scenario
const DEFAULT_RECIPIENTS = [
  {
    id: 'TCC-2026-PAR-8801',
    name: 'Arjun S',
    email: 'arjun.s@sonatech.ac.in',
    category: 'participant',
    department: 'Computer Science & Engineering',
    roleNote: 'Distinguished Finalist',
    status: 'Sent',
    issueDate: '24-09-2026',
    eventName: 'Prelims - Eloquence'
  },
  {
    id: 'TCC-2026-ORG-9012',
    name: 'Priya Dharshini R',
    email: 'priya.organizer@sonatech.ac.in',
    category: 'organiser',
    department: 'Information Technology',
    roleNote: 'Lead Student Coordinator',
    status: 'Sent',
    issueDate: '24-09-2026',
    eventName: 'Prelims - Eloquence'
  },
  {
    id: 'TCC-2026-ORG-9013',
    name: 'Kavitha M',
    email: 'kavitha.m@sonatech.ac.in',
    category: 'organiser',
    department: 'Electronics & Communication',
    roleNote: 'Event Host',
    status: 'Pending',
    issueDate: '24-09-2026',
    eventName: 'Prelims - Eloquence'
  },
  {
    id: 'TCC-2026-PAR-8802',
    name: 'Karthik Raja V',
    email: 'karthik.raja@sonatech.ac.in',
    category: 'participant',
    department: 'Mechanical Engineering',
    roleNote: 'Top Finalist',
    status: 'Pending',
    issueDate: '24-09-2026',
    eventName: 'Prelims - Eloquence'
  },
  {
    id: 'TCC-2026-PAR-8803',
    name: 'Sneha Mohan',
    email: 'sneha.mohan@gmail.com',
    category: 'participant',
    department: 'AI & Data Science',
    roleNote: 'Merit Achievement',
    status: 'Sent',
    issueDate: '24-09-2026',
    eventName: 'Prelims - Eloquence'
  }
];

class CertificateStore {
  constructor() {
    this.init();
  }

  init() {
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.RECIPIENTS)) {
      localStorage.setItem(STORAGE_KEYS.RECIPIENTS, JSON.stringify(DEFAULT_RECIPIENTS));
    }
  }

  getSettings() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS)) || DEFAULT_SETTINGS;
    } catch (e) {
      return DEFAULT_SETTINGS;
    }
  }

  saveSettings(newSettings) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));
    window.dispatchEvent(new CustomEvent('comm_club_settings_updated', { detail: newSettings }));
    return newSettings;
  }

  getRecipients() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.RECIPIENTS)) || DEFAULT_RECIPIENTS;
    } catch (e) {
      return DEFAULT_RECIPIENTS;
    }
  }

  saveRecipients(recipients) {
    localStorage.setItem(STORAGE_KEYS.RECIPIENTS, JSON.stringify(recipients));
    window.dispatchEvent(new CustomEvent('comm_club_recipients_updated', { detail: recipients }));
    return recipients;
  }

  findRecipientsByEmail(email) {
    if (!email) return [];
    const cleanEmail = email.trim().toLowerCase();
    const recipients = this.getRecipients();
    return recipients.filter(r => r.email && r.email.trim().toLowerCase() === cleanEmail);
  }

  findCertificateById(certId) {
    if (!certId) return null;
    const cleanId = certId.trim().toUpperCase();
    const recipients = this.getRecipients();
    return recipients.find(r => r.id && r.id.trim().toUpperCase() === cleanId) || null;
  }

  generateCertificateId(category = 'participant') {
    const prefix = category === 'organiser' ? 'TCC-2026-ORG' : 'TCC-2026-PAR';
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${rand}`;
  }

  addRecipient(recipient) {
    const recipients = this.getRecipients();
    if (!recipient.id) {
      recipient.id = this.generateCertificateId(recipient.category);
    }
    recipients.unshift(recipient);
    this.saveRecipients(recipients);
    return recipient;
  }

  updateRecipient(id, updatedFields) {
    let recipients = this.getRecipients();
    recipients = recipients.map(r => r.id === id ? { ...r, ...updatedFields } : r);
    this.saveRecipients(recipients);
    return recipients;
  }

  deleteRecipient(id) {
    let recipients = this.getRecipients();
    recipients = recipients.filter(r => r.id !== id);
    this.saveRecipients(recipients);
    return recipients;
  }

  bulkAddRecipients(newRecipients) {
    const current = this.getRecipients();
    const settings = this.getSettings();
    const prepared = newRecipients.map(r => ({
      id: r.id || this.generateCertificateId(r.category),
      name: r.name || 'Participant',
      email: r.email || '',
      category: (r.category && r.category.toLowerCase().includes('org')) ? 'organiser' : 'participant',
      department: r.department || 'General',
      roleNote: r.roleNote || '',
      status: r.status || 'Pending',
      issueDate: r.issueDate || settings.issueDate,
      eventName: r.eventName || settings.eventName
    }));
    const combined = [...prepared, ...current];
    this.saveRecipients(combined);
    return combined;
  }

  resetToDefault() {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    localStorage.setItem(STORAGE_KEYS.RECIPIENTS, JSON.stringify(DEFAULT_RECIPIENTS));
    return { settings: DEFAULT_SETTINGS, recipients: DEFAULT_RECIPIENTS };
  }
}

window.certStore = new CertificateStore();
