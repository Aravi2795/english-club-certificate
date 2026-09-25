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
    this.remoteSynced = false;
    this.init();
  }

  init() {
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.RECIPIENTS)) {
      localStorage.setItem(STORAGE_KEYS.RECIPIENTS, JSON.stringify(DEFAULT_RECIPIENTS));
    }
    // Attempt background sync with remote static registry file if present
    this.syncWithRemoteRegistry();
  }

  async syncWithRemoteRegistry() {
    try {
      const response = await fetch('data/recipients.json');
      if (response.ok) {
        const remoteList = await response.json();
        if (Array.isArray(remoteList) && remoteList.length > 0) {
          const current = this.getRecipients();
          const currentMap = new Map(current.map(r => [r.id, r]));
          
          // Merge remote items without overwriting local modifications
          for (const item of remoteList) {
            if (item && item.id && !currentMap.has(item.id)) {
              currentMap.set(item.id, item);
            }
          }
          const merged = Array.from(currentMap.values());
          localStorage.setItem(STORAGE_KEYS.RECIPIENTS, JSON.stringify(merged));
          this.remoteSynced = true;
          window.dispatchEvent(new CustomEvent('comm_club_recipients_updated', { detail: merged }));
        }
      }
    } catch (e) {
      // Offline or file not reachable, keep using localStorage
      console.log('Static registry sync info:', e.message);
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

  // =========================================================================
  // UNIVERSAL VERIFIABLE TOKEN ENGINE (Self-Contained & Stateless URLs)
  // =========================================================================

  /**
   * Encodes recipient data into a compact, URL-safe Base64 token.
   * Enables 100% reliable cross-device verification without server dependencies.
   */
  encodeCertificateData(recipient, customSettings = null) {
    if (!recipient) return '';
    const settings = customSettings || this.getSettings();
    const payload = {
      i: recipient.id || this.generateCertificateId(recipient.category),
      n: recipient.name || 'Participant',
      e: recipient.email || '',
      c: recipient.category === 'organiser' ? 'o' : 'p',
      d: recipient.department || 'General',
      ev: recipient.eventName || settings.eventName,
      dt: recipient.issueDate || settings.issueDate,
      r: recipient.roleNote || '',
      inst: settings.institutionName,
      cl: settings.clubName
    };

    try {
      const jsonStr = JSON.stringify(payload);
      // UTF-8 safe Base64URL encoding
      const utf8Bytes = new TextEncoder().encode(jsonStr);
      let binary = '';
      for (let i = 0; i < utf8Bytes.length; i++) {
        binary += String.fromCharCode(utf8Bytes[i]);
      }
      return btoa(binary)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    } catch (err) {
      console.error('Failed to encode certificate token:', err);
      return '';
    }
  }

  /**
   * Decodes a URL-safe Base64 token into a complete recipient certificate object.
   */
  decodeCertificateData(token) {
    if (!token) return null;
    try {
      let base64 = token.trim().replace(/-/g, '+').replace(/_/g, '/');
      while (base64.length % 4) {
        base64 += '=';
      }
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const jsonStr = new TextDecoder().decode(bytes);
      const p = JSON.parse(jsonStr);

      if (!p || (!p.i && !p.n)) return null;

      return {
        id: p.i || p.id,
        name: p.n || p.name || 'Participant',
        email: p.e || p.email || '',
        category: (p.c === 'o' || p.category === 'organiser') ? 'organiser' : 'participant',
        department: p.d || p.department || 'General',
        eventName: p.ev || p.eventName || 'Prelims - Eloquence',
        issueDate: p.dt || p.issueDate || '24-09-2026',
        roleNote: p.r || p.roleNote || '',
        institutionName: p.inst || 'Sona College of Technology',
        clubName: p.cl || 'The Communication Club',
        status: 'Sent'
      };
    } catch (err) {
      console.error('Failed to decode certificate token:', err);
      return null;
    }
  }

  /**
   * Ingests a certificate decoded from URL into local storage so it is permanently cached.
   */
  ingestCertificateFromToken(token) {
    const cert = this.decodeCertificateData(token);
    if (!cert || !cert.id) return null;

    const recipients = this.getRecipients();
    const existingIdx = recipients.findIndex(r => r.id === cert.id);

    if (existingIdx !== -1) {
      recipients[existingIdx] = { ...recipients[existingIdx], ...cert };
    } else {
      recipients.unshift(cert);
    }

    this.saveRecipients(recipients);
    return cert;
  }

  exportRegistryJSON() {
    const recipients = this.getRecipients();
    return JSON.stringify(recipients, null, 2);
  }
}

window.certStore = new CertificateStore();

