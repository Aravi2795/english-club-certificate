/**
 * Communication Club - Client & Participant Portal Controller
 */

class ClientApp {
  constructor() {
    this.currentCertificates = [];
    this.activeCertIndex = 0;
    this.init();
  }

  init() {
    this.bindEvents();
    this.initGoogleSignIn();
    this.checkExistingSession();
    this.checkUrlParams();
  }

  bindEvents() {
    // Manual search form
    const searchForm = document.getElementById('manual-search-form');
    if (searchForm) {
      searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const query = document.getElementById('search-query-input').value.trim();
        this.lookupCertificates(query);
      });
    }

    // Demo Account Chips
    document.querySelectorAll('.demo-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const email = chip.dataset.email;
        const name = chip.dataset.name;
        window.authManager.loginWithDemo(email, name);
      });
    });

    // Auth Changed Listener
    window.addEventListener('comm_club_auth_changed', (e) => {
      const user = e.detail;
      if (user) {
        this.handleUserLoggedIn(user);
      } else {
        this.handleUserLoggedOut();
      }
    });

    // Logout Button
    const logoutBtn = document.getElementById('btn-user-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        window.authManager.logout();
        this.showToast('Logged out of Google account.', 'info');
      });
    }

    // Download PDF Button
    const btnPdf = document.getElementById('btn-download-pdf');
    if (btnPdf) {
      btnPdf.addEventListener('click', () => this.downloadActivePDF());
    }

    // Download PNG Button
    const btnPng = document.getElementById('btn-download-png');
    if (btnPng) {
      btnPng.addEventListener('click', () => this.downloadActivePNG());
    }

    // Print Button
    const btnPrint = document.getElementById('btn-print-cert');
    if (btnPrint) {
      btnPrint.addEventListener('click', () => {
        window.print();
      });
    }

    // Copy Verification Link
    const btnCopyLink = document.getElementById('btn-copy-cert-link');
    if (btnCopyLink) {
      btnCopyLink.addEventListener('click', () => {
        const cert = this.getActiveCertificate();
        if (cert) {
          const url = window.certRenderer.generateVerifyUrl(cert.id);
          navigator.clipboard.writeText(url).then(() => {
            this.showToast('Verification link copied to clipboard! 📋', 'success');
          });
        }
      });
    }
  }

  initGoogleSignIn() {
    // Hook GIS callback
    window.handleGoogleCredentialResponse = (response) => {
      const user = window.authManager.handleGoogleCredential(response);
      if (user) {
        this.showToast(`Signed in as ${user.email} ✔`, 'success');
      }
    };
  }

  checkExistingSession() {
    const user = window.authManager.currentUser;
    if (user) {
      this.handleUserLoggedIn(user);
    }
  }

  checkUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const email = params.get('email');
    const id = params.get('id');

    if (email) {
      this.lookupCertificates(email);
    } else if (id) {
      this.lookupCertificates(id);
    }
  }

  handleUserLoggedIn(user) {
    const userBar = document.getElementById('logged-in-user-bar');
    const claimCard = document.getElementById('claim-auth-card');
    const userEmailEl = document.getElementById('logged-user-email');
    const userNameEl = document.getElementById('logged-user-name');

    if (userBar) userBar.style.display = 'flex';
    if (claimCard) claimCard.style.display = 'none';
    if (userEmailEl) userEmailEl.textContent = user.email;
    if (userNameEl) userNameEl.textContent = user.name;

    // Automatically retrieve certificates for this Google account!
    this.lookupCertificates(user.email);
  }

  handleUserLoggedOut() {
    const userBar = document.getElementById('logged-in-user-bar');
    const claimCard = document.getElementById('claim-auth-card');
    const vaultSection = document.getElementById('certificate-vault-section');

    if (userBar) userBar.style.display = 'none';
    if (claimCard) claimCard.style.display = 'block';
    if (vaultSection) vaultSection.classList.remove('active');
    this.currentCertificates = [];
  }

  lookupCertificates(query) {
    if (!query) return;

    let certs = [];
    if (query.includes('@')) {
      // Lookup by Google Email Address
      certs = window.certStore.findRecipientsByEmail(query);
    } else {
      // Lookup by Certificate ID
      const single = window.certStore.findCertificateById(query);
      if (single) certs = [single];
    }

    if (certs.length === 0) {
      this.showToast(`No certificates found registered under "${query}". Please check your registered Google email.`, 'error');
      return;
    }

    this.currentCertificates = certs;
    this.activeCertIndex = 0;
    this.renderVault();
    this.showToast(`Found ${certs.length} certificate(s)! 🎉`, 'success');
  }

  renderVault() {
    const vaultSection = document.getElementById('certificate-vault-section');
    const tabsContainer = document.getElementById('vault-cert-tabs');
    const certMount = document.getElementById('active-certificate-mount');

    if (!vaultSection || !certMount) return;

    vaultSection.classList.add('active');

    // If multiple certificates (e.g. 1 Organiser + 1 Participant), render tabs
    if (tabsContainer) {
      if (this.currentCertificates.length > 1) {
        tabsContainer.style.display = 'flex';
        tabsContainer.innerHTML = this.currentCertificates.map((c, idx) => `
          <button class="vault-tab ${idx === this.activeCertIndex ? 'active' : ''}" onclick="window.clientApp.switchCertTab(${idx})">
            ${c.category === 'organiser' ? '🌟 Organiser Certificate' : '🎓 Participation Certificate'} (${c.id})
          </button>
        `).join('');
      } else {
        tabsContainer.style.display = 'none';
      }
    }

    // Mount active certificate
    const activeCert = this.getActiveCertificate();
    if (activeCert) {
      window.certRenderer.mountCertificate(certMount, activeCert);

      // Update certificate details in metadata card
      const idEl = document.getElementById('vault-cert-id');
      const catEl = document.getElementById('vault-cert-cat');
      const eventEl = document.getElementById('vault-cert-event');
      const verifyLinkEl = document.getElementById('vault-verify-link');

      if (idEl) idEl.textContent = activeCert.id;
      if (catEl) catEl.textContent = activeCert.category === 'organiser' ? 'Organiser' : 'Participant';
      if (eventEl) eventEl.textContent = activeCert.eventName || window.certStore.getSettings().eventName;
      if (verifyLinkEl) {
        const vUrl = window.certRenderer.generateVerifyUrl(activeCert.id);
        verifyLinkEl.href = vUrl;
        verifyLinkEl.textContent = vUrl;
      }
    }

    // Scroll smoothly to vault
    vaultSection.scrollIntoView({ behavior: 'smooth' });
  }

  switchCertTab(index) {
    this.activeCertIndex = index;
    this.renderVault();
  }

  getActiveCertificate() {
    return this.currentCertificates[this.activeCertIndex] || null;
  }

  async downloadActivePDF() {
    const cert = this.getActiveCertificate();
    if (!cert) return;

    const certElement = document.getElementById(`cert-${cert.id}`);
    if (!certElement) return;

    const filename = `${cert.name.replace(/\s+/g, '_')}_${cert.category.toUpperCase()}_Certificate.pdf`;
    this.showToast('Generating High-Resolution Print PDF...', 'info');
    await window.pdfGenerator.exportToPDF(certElement, filename);
    this.showToast('PDF downloaded successfully! 📄', 'success');
  }

  async downloadActivePNG() {
    const cert = this.getActiveCertificate();
    if (!cert) return;

    const certElement = document.getElementById(`cert-${cert.id}`);
    if (!certElement) return;

    const filename = `${cert.name.replace(/\s+/g, '_')}_${cert.category.toUpperCase()}_Certificate.png`;
    this.showToast('Generating Ultra-HD PNG...', 'info');
    await window.pdfGenerator.exportToPNG(certElement, filename);
    this.showToast('PNG image downloaded successfully! 🖼', 'success');
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
  window.clientApp = new ClientApp();
});
