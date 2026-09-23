/**
 * Communication Club - Admin Dashboard & Live Studio Controller
 */

class AdminApp {
  constructor() {
    this.currentCategoryTab = 'participant'; // 'participant' | 'organiser'
    this.activeSection = 'studio'; // 'studio' | 'recipients' | 'dispatcher' | 'settings'
    this.selectedRecipient = null;
    this.init();
  }

  init() {
    if (!window.authManager.isAdminLoggedIn()) {
      this.showLoginModal();
    } else {
      this.renderAdminView();
    }

    this.bindEvents();
  }

  showLoginModal() {
    const modal = document.getElementById('admin-login-modal');
    if (modal) modal.style.display = 'flex';
  }

  hideLoginModal() {
    const modal = document.getElementById('admin-login-modal');
    if (modal) modal.style.display = 'none';
  }

  bindEvents() {
    // Admin Login Form
    const loginForm = document.getElementById('admin-login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const user = document.getElementById('admin-user').value;
        const pass = document.getElementById('admin-pass').value;

        if (window.authManager.loginAdmin(user, pass)) {
          this.hideLoginModal();
          this.renderAdminView();
          this.showToast('Welcome back, Admin Coordinator!', 'success');
        } else {
          this.showToast('Invalid credentials. Default: admin / admin123', 'error');
        }
      });
    }

    // Tab Navigation
    document.querySelectorAll('.admin-nav-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.target;
        this.switchSection(target);
      });
    });

    // Category Toggle in Studio
    document.querySelectorAll('.cat-toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.cat-toggle-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentCategoryTab = btn.dataset.category;
        this.populateStudioForm();
        this.updateLivePreview();
      });
    });

    // Live WYSIWYG Input Listeners
    const studioInputs = [
      'input-club-name', 'input-inst-name', 'input-event-name', 'input-issue-date',
      'input-coord-name', 'input-coord-title', 'input-coord2-title',
      'input-main-title', 'input-sub-title', 'input-presented-text', 'input-citation-body'
    ];

    studioInputs.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', () => this.updateLivePreview());
      }
    });

    // Save Template Settings
    const saveBtn = document.getElementById('btn-save-settings');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => this.saveCurrentSettings());
    }

    // Excel / CSV File Upload Dropzone
    const fileInput = document.getElementById('excel-file-input') || document.getElementById('csv-file-input');
    if (fileInput) {
      fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
    }

    // Google Form / Sheets Paste Box
    const pasteBtn = document.getElementById('btn-parse-paste');
    if (pasteBtn) {
      pasteBtn.addEventListener('click', () => this.handlePasteImport());
    }

    // Add Single Recipient Form
    const addRecipForm = document.getElementById('form-add-recipient');
    if (addRecipForm) {
      addRecipForm.addEventListener('submit', (e) => this.handleAddRecipient(e));
    }

    // Start Batch Dispatch
    const startDispatchBtn = document.getElementById('btn-start-dispatch');
    if (startDispatchBtn) {
      startDispatchBtn.addEventListener('click', () => this.handleBatchDispatch());
    }

    // Reset Data
    const resetBtn = document.getElementById('btn-reset-db');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to reset all data and settings to defaults?')) {
          window.certStore.resetToDefault();
          this.renderAdminView();
          this.showToast('Database reset to defaults!', 'info');
        }
      });
    }

    // Table search & filter
    const searchInput = document.getElementById('table-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', () => this.renderRecipientsTable());
    }

    const catFilter = document.getElementById('table-cat-filter');
    if (catFilter) {
      catFilter.addEventListener('change', () => this.renderRecipientsTable());
    }

    // Listen to data store updates
    window.addEventListener('comm_club_recipients_updated', () => {
      this.renderRecipientsTable();
      this.updateRecipientCounts();
    });
  }

  switchSection(sectionId) {
    this.activeSection = sectionId;
    document.querySelectorAll('.admin-nav-item').forEach(b => {
      b.classList.toggle('active', b.dataset.target === sectionId);
    });
    document.querySelectorAll('.admin-section-view').forEach(view => {
      view.classList.toggle('active', view.id === `section-${sectionId}`);
    });

    if (sectionId === 'studio') {
      this.updateLivePreview();
    } else if (sectionId === 'recipients') {
      this.renderRecipientsTable();
    } else if (sectionId === 'dispatcher') {
      this.updateDispatcherStats();
    }
  }

  renderAdminView() {
    this.populateStudioForm();
    this.updateLivePreview();
    this.renderRecipientsTable();
    this.updateRecipientCounts();
    this.updateDispatcherStats();
  }

  populateStudioForm() {
    const settings = window.certStore.getSettings();
    const cat = this.currentCategoryTab;
    const catConfig = settings[cat] || {};

    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val || '';
    };

    setVal('input-club-name', settings.clubName);
    setVal('input-inst-name', settings.institutionName);
    setVal('input-event-name', settings.eventName);
    setVal('input-issue-date', settings.issueDate);
    setVal('input-coord-title', settings.coordinator1Title || 'CLUB CO-ORDINATOR');
    setVal('input-coord2-title', settings.coordinator2Title || 'CLUB CO-COORDINATOR');

    setVal('input-main-title', catConfig.mainTitle || 'CERTIFICATE');
    setVal('input-sub-title', catConfig.subTitle || 'OF APPRECIATION');
    setVal('input-presented-text', catConfig.presentedText || 'THIS CERTIFICATE IS PRESENTED TO');
    setVal('input-citation-body', catConfig.bodyCitation || '');
  }

  collectStudioSettings() {
    const settings = window.certStore.getSettings();
    const cat = this.currentCategoryTab;

    const getVal = (id) => {
      const el = document.getElementById(id);
      return el ? el.value.trim() : '';
    };

    settings.clubName = getVal('input-club-name') || settings.clubName;
    settings.institutionName = getVal('input-inst-name') || settings.institutionName;
    settings.eventName = getVal('input-event-name') || settings.eventName;
    settings.issueDate = getVal('input-issue-date') || settings.issueDate;
    settings.coordinator1Title = getVal('input-coord-title') || settings.coordinator1Title;
    settings.coordinator2Title = getVal('input-coord2-title') || settings.coordinator2Title;

    settings[cat] = {
      ...settings[cat],
      mainTitle: getVal('input-main-title') || 'CERTIFICATE',
      subTitle: getVal('input-sub-title') || 'OF APPRECIATION',
      presentedText: getVal('input-presented-text') || 'THIS CERTIFICATE IS PRESENTED TO',
      bodyCitation: getVal('input-citation-body')
    };

    return settings;
  }

  updateLivePreview() {
    const previewContainer = document.getElementById('studio-certificate-preview');
    if (!previewContainer) return;

    const currentSettings = this.collectStudioSettings();
    const sampleRecipient = {
      id: this.currentCategoryTab === 'organiser' ? 'TCC-2026-ORG-9012' : 'TCC-2026-PAR-8801',
      name: this.currentCategoryTab === 'organiser' ? 'Priya Dharshini R' : 'Arjun S',
      category: this.currentCategoryTab,
      eventName: currentSettings.eventName,
      issueDate: currentSettings.issueDate
    };

    window.certRenderer.mountCertificate(previewContainer, sampleRecipient, currentSettings);
  }

  saveCurrentSettings() {
    const updated = this.collectStudioSettings();
    window.certStore.saveSettings(updated);
    this.showToast('Template & Event details saved successfully!', 'success');
  }

  // File Upload Handler (Excel .xlsx / .xls or CSV .csv)
  handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const filename = file.name.toLowerCase();
    const isExcel = filename.endsWith('.xlsx') || filename.endsWith('.xls');

    const reader = new FileReader();

    if (isExcel) {
      reader.onload = (evt) => {
        const data = new Uint8Array(evt.target.result);
        const parsed = window.googleFormsImporter.parseExcelArrayBuffer(data);
        if (parsed.length > 0) {
          window.certStore.bulkAddRecipients(parsed);
          this.showToast(`Successfully imported ${parsed.length} recipients from Excel sheet!`, 'success');
          this.renderRecipientsTable();
        } else {
          this.showToast('Could not extract records from Excel sheet. Please verify column headers.', 'error');
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      reader.onload = (evt) => {
        const content = evt.target.result;
        const parsed = window.googleFormsImporter.parseCSV(content);
        if (parsed.length > 0) {
          window.certStore.bulkAddRecipients(parsed);
          this.showToast(`Successfully imported ${parsed.length} recipients from CSV!`, 'success');
          this.renderRecipientsTable();
        } else {
          this.showToast('Could not parse any records from CSV.', 'error');
        }
      };
      reader.readAsText(file);
    }
  }

  // Direct Google Forms / Sheets Paste Handler
  handlePasteImport() {
    const textarea = document.getElementById('paste-import-box');
    if (!textarea || !textarea.value.trim()) {
      this.showToast('Please paste Excel / Google Sheets rows into the box first.', 'error');
      return;
    }

    const parsed = window.googleFormsImporter.parseTSV(textarea.value);
    if (parsed.length > 0) {
      window.certStore.bulkAddRecipients(parsed);
      textarea.value = '';
      this.showToast(`Successfully imported ${parsed.length} records!`, 'success');
      this.renderRecipientsTable();
    } else {
      this.showToast('No valid rows found in pasted text.', 'error');
    }
  }

  handleAddRecipient(e) {
    e.preventDefault();
    const name = document.getElementById('new-recip-name').value.trim();
    const email = document.getElementById('new-recip-email').value.trim();
    const category = document.getElementById('new-recip-category').value;
    const department = document.getElementById('new-recip-dept').value.trim();
    const roleNote = document.getElementById('new-recip-role').value.trim();

    if (!name || !email) {
      this.showToast('Name and Email are required.', 'error');
      return;
    }

    window.certStore.addRecipient({
      name,
      email,
      category,
      department: department || 'General',
      roleNote: roleNote || '',
      status: 'Pending'
    });

    e.target.reset();
    document.getElementById('add-recipient-modal').style.display = 'none';
    this.showToast(`Added ${name} to recipients!`, 'success');
  }

  renderRecipientsTable() {
    const tbody = document.getElementById('recipients-table-body');
    if (!tbody) return;

    const recipients = window.certStore.getRecipients();
    const searchVal = (document.getElementById('table-search-input')?.value || '').toLowerCase();
    const filterCat = document.getElementById('table-cat-filter')?.value || 'all';

    const filtered = recipients.filter(r => {
      const matchSearch = (r.name || '').toLowerCase().includes(searchVal) ||
                          (r.email || '').toLowerCase().includes(searchVal) ||
                          (r.id || '').toLowerCase().includes(searchVal);
      const matchCat = filterCat === 'all' || r.category === filterCat;
      return matchSearch && matchCat;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:2rem; color:var(--text-muted);">No recipients found. Upload an Excel (.xlsx) / CSV file or add manually above!</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(r => `
      <tr>
        <td><strong style="font-family:monospace; color:var(--primary);">${r.id}</strong></td>
        <td><strong>${r.name}</strong></td>
        <td><span style="color:var(--text-muted);">${r.email}</span></td>
        <td>
          <span class="status-badge ${r.category === 'organiser' ? 'pending' : ''}" style="${r.category === 'organiser' ? 'background:rgba(99,102,241,0.15); color:#818cf8;' : ''}">
            ${r.category === 'organiser' ? '🌟 Organiser' : '🎓 Participant'}
          </span>
        </td>
        <td>${r.department || '-'}</td>
        <td>
          <span class="status-badge ${r.status === 'Sent' ? 'sent' : 'pending'}">
            ${r.status === 'Sent' ? '✔ Sent' : '⏳ Pending'}
          </span>
        </td>
        <td>
          <div style="display:flex; gap:6px;">
            <button class="btn btn-secondary btn-sm" onclick="window.adminApp.previewRecipient('${r.id}')" title="Preview Certificate">👁</button>
            <button class="btn btn-secondary btn-sm" onclick="window.adminApp.sendDirectMail('${r.id}')" title="Send Email">✉</button>
            <button class="btn btn-secondary btn-sm" style="color:#f43f5e;" onclick="window.adminApp.deleteRecipient('${r.id}')" title="Delete">🗑</button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  updateRecipientCounts() {
    const recipients = window.certStore.getRecipients();
    const total = recipients.length;
    const orgs = recipients.filter(r => r.category === 'organiser').length;
    const parts = recipients.filter(r => r.category === 'participant').length;
    const sent = recipients.filter(r => r.status === 'Sent').length;

    const setText = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    setText('count-total-recipients', total);
    setText('count-organisers', orgs);
    setText('count-participants', parts);
    setText('count-sent', sent);
    setText('badge-recipients-count', total);
  }

  updateDispatcherStats() {
    const recipients = window.certStore.getRecipients();
    const pending = recipients.filter(r => r.status === 'Pending').length;
    const sent = recipients.filter(r => r.status === 'Sent').length;

    const el = document.getElementById('dispatch-pending-count');
    if (el) el.textContent = pending;
  }

  previewRecipient(id) {
    const recipient = window.certStore.findCertificateById(id);
    if (!recipient) return;

    this.selectedRecipient = recipient;
    const modal = document.getElementById('preview-modal');
    const container = document.getElementById('preview-modal-cert-container');
    if (modal && container) {
      window.certRenderer.mountCertificate(container, recipient);
      modal.style.display = 'flex';
    }
  }

  sendDirectMail(id) {
    const recipient = window.certStore.findCertificateById(id);
    if (!recipient) return;
    const mailto = window.emailDispatcher.generateMailtoLink(recipient, window.certStore.getSettings());
    window.location.href = mailto;
    window.certStore.updateRecipient(id, { status: 'Sent' });
    this.showToast(`Opened email composer for ${recipient.email}`, 'info');
  }

  deleteRecipient(id) {
    if (confirm('Delete this certificate record?')) {
      window.certStore.deleteRecipient(id);
      this.showToast('Recipient removed.', 'info');
    }
  }

  async handleBatchDispatch() {
    const recipients = window.certStore.getRecipients();
    const pending = recipients.filter(r => r.status === 'Pending');

    if (pending.length === 0) {
      this.showToast('No pending recipients to email. All certificates have already been dispatched!', 'info');
      return;
    }

    const logBox = document.getElementById('dispatch-log-window');
    const progressFill = document.getElementById('dispatch-progress-fill');
    const progressText = document.getElementById('dispatch-progress-text');

    if (logBox) logBox.innerHTML = '';

    const addLog = (msg) => {
      if (logBox) {
        logBox.innerHTML += `<div>${new Date().toLocaleTimeString()} - ${msg}</div>`;
        logBox.scrollTop = logBox.scrollHeight;
      }
    };

    const updateProgress = (pct, sent, total) => {
      if (progressFill) progressFill.style.width = `${pct}%`;
      if (progressText) progressText.textContent = `${sent} / ${total} Dispatched (${pct}%)`;
    };

    this.showToast(`Starting automated dispatch for ${pending.length} recipients...`, 'info');
    await window.emailDispatcher.dispatchBatch(pending, window.certStore.getSettings(), updateProgress, addLog);
    this.showToast(`Automated batch email dispatch completed successfully!`, 'success');
    this.updateRecipientCounts();
    this.updateDispatcherStats();
    this.renderRecipientsTable();
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container') || document.body;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.adminApp = new AdminApp();
});
