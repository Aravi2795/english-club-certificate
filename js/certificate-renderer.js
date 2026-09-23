/**
 * Communication Club - High Definition Certificate Renderer Engine
 * Faithfully renders the official Sona College of Technology Certificate
 */

class CertificateRenderer {
  constructor() {}

  generateVerifyUrl(certId) {
    const origin = window.location.origin && window.location.origin !== 'null' ? window.location.origin : '';
    const pathname = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
    return `${origin}${pathname}verify.html?id=${encodeURIComponent(certId)}`;
  }

  compileCitationText(templateStr, data) {
    if (!templateStr) {
      return `In recognition of outstanding achievements in “ <strong>${data.eventName}</strong> ”<br>that significantly benefited <strong>${data.clubName}</strong> on ${data.issueDate}.`;
    }
    return templateStr
      .replace(/{{name}}/g, data.name || '')
      .replace(/{{eventName}}/g, data.eventName || 'Prelims - Eloquence')
      .replace(/{{clubName}}/g, data.clubName || 'The Communication Club')
      .replace(/{{institutionName}}/g, data.institutionName || 'Sona College of Technology')
      .replace(/{{issueDate}}/g, data.issueDate || '24-09-2026')
      .replace(/{{id}}/g, data.id || 'TCC-2026-PAR-0000');
  }

  renderCertificateHTML(recipient, customSettings = null) {
    const settings = customSettings || window.certStore.getSettings();
    const certId = recipient.id || window.certStore.generateCertificateId(recipient.category);
    const recipientName = recipient.name || '';
    const issueDate = recipient.issueDate || settings.issueDate || '24-09-2026';
    const eventName = recipient.eventName || settings.eventName || 'Prelims - Eloquence';
    const clubName = settings.clubName || 'The Communication Club';
    const instName = settings.institutionName || 'Sona College of Technology';

    const compileData = {
      name: recipientName,
      eventName: eventName,
      clubName: clubName,
      institutionName: instName,
      issueDate: issueDate,
      id: certId
    };

    const isOrganiser = recipient.category === 'organiser';
    const categoryConfig = (isOrganiser && settings.organiser) ? settings.organiser : (settings.participant || {});

    const mainTitle = categoryConfig.mainTitle || 'CERTIFICATE';
    const subTitle = categoryConfig.subTitle || 'OF APPRECIATION';
    const presentedText = categoryConfig.presentedText || 'THIS CERTIFICATE IS PRESENTED TO';
    const bodyCitation = this.compileCitationText(categoryConfig.bodyCitation, compileData);

    const coord1Title = settings.coordinator1Title || 'CLUB CO-ORDINATOR';
    const coord2Title = settings.coordinator2Title || 'CLUB CO-COORDINATOR';
    const coord1SignUrl = settings.coordinator1SignUrl || 'assets/signatures/signature-coordinator.svg';
    const coord2SignUrl = settings.coordinator2SignUrl || 'assets/signatures/signature-parthasarathi.svg';

    return `
      <div class="cert-sheet" id="cert-${certId}" data-cert-id="${certId}">
        
        <!-- Vector Background Curves & Gold Borders matching reference image -->
        <svg class="cert-bg-vector" viewBox="0 0 1000 707" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="certGoldBorderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#fbe69b" />
              <stop offset="25%" stop-color="#d4af37" />
              <stop offset="50%" stop-color="#fff2b2" />
              <stop offset="75%" stop-color="#b8860b" />
              <stop offset="100%" stop-color="#8c6210" />
            </linearGradient>
            
            <linearGradient id="certGoldWaveGrad" x1="20%" y1="0%" x2="80%" y2="100%">
              <stop offset="0%" stop-color="#e8bf4c" />
              <stop offset="20%" stop-color="#fff0a8" />
              <stop offset="45%" stop-color="#d4af37" />
              <stop offset="70%" stop-color="#8c6210" />
              <stop offset="90%" stop-color="#d4af37" />
              <stop offset="100%" stop-color="#fbe69b" />
            </linearGradient>

            <filter id="certWaveShadow" x="-10%" y="-10%" width="130%" height="130%">
              <feDropShadow dx="3" dy="0" stdDeviation="4" flood-color="#000000" flood-opacity="0.3"/>
            </filter>
          </defs>

          <!-- Top & Right Metallic Gold Borders -->
          <rect x="225" y="0" width="775" height="7" fill="url(#certGoldBorderGrad)" />
          <rect x="993" y="0" width="7" height="707" fill="url(#certGoldBorderGrad)" />

          <!-- Obsidian Black Curved Wave (Arching down from top-left and flaring bottom-left) -->
          <path d="M 0,0 L 225,0 C 205,80 110,180 88,270 C 65,360 62,450 110,540 C 145,610 185,665 210,707 L 0,707 Z" fill="#111317" />

          <!-- Metallic Gold Wave Ribbon following the inner curve -->
          <path d="M 225,0 L 246,0 C 226,80 128,180 106,270 C 83,360 80,450 132,540 C 172,615 228,665 268,707 L 210,707 C 185,665 145,610 110,540 C 62,450 65,360 88,270 C 110,180 205,80 225,0 Z" fill="url(#certGoldWaveGrad)" filter="url(#certWaveShadow)" />
        </svg>

        <!-- 3D Gold Rosette Medallion Badge (Left side centered over wave) -->
        <div class="cert-left-medal">
          <img src="assets/badges/gold-seal.svg" alt="Official 3D Gold Rosette Medallion" />
        </div>

        <!-- Main Certificate Content -->
        <div class="cert-main-container">
          
          <!-- Top Header: Sona Logo Banner + 2 Accreditation Strips + NAAC Laurel Wreath Badge -->
          <div class="cert-top-header">
            <div class="cert-sona-banner">
              <img src="assets/logos/sona-banner.png" alt="Sona College of Technology - Learning is a Celebration!" />
            </div>
            <div class="cert-accreditations-strip">
              <img src="assets/logos/accreditations-trio-1.png" alt="NIRF, Anna University, SONA IS A SIRO" class="cert-trio-img" />
              <img src="assets/logos/accreditations-trio-2.png" alt="UGC, AICTE, NBA" class="cert-trio-img" />
            </div>
            <div class="cert-naac-badge">
              <img src="assets/logos/naac-badge.png" alt="NAAC A++ CGPA: 3.65" />
            </div>
          </div>

          <!-- Center Typography -->
          <div class="cert-body-content">
            <h1 class="cert-title-certificate">${mainTitle}</h1>
            <h2 class="cert-title-appreciation">${subTitle}</h2>
            
            <p class="cert-line-presented">${presentedText}</p>
            
            <div class="cert-recipient-name-block">
              <div class="cert-recipient-name">${recipientName}</div>
              <div class="cert-gold-divider-bar"></div>
            </div>

            <p class="cert-citation-paragraph">
              ${bodyCitation}
            </p>
          </div>

          <!-- Bottom Signatures Footer -->
          <div class="cert-signatures-footer">
            <!-- Left Signature: Club Co-ordinator -->
            <div class="cert-sig-block cert-sig-left">
              <img src="${coord1SignUrl}" alt="Club Co-ordinator Signature" class="cert-sig-image" />
              <div class="cert-sig-line"></div>
              <span class="cert-sig-title">${coord1Title}</span>
            </div>

            <!-- Right Signature: Club Co-Coordinator (B. Parthasarathi) -->
            <div class="cert-sig-block cert-sig-right">
              <img src="${coord2SignUrl}" alt="Club Co-Coordinator Signature" class="cert-sig-image" />
              <div class="cert-sig-line"></div>
              <span class="cert-sig-title">${coord2Title}</span>
            </div>
          </div>

          <!-- Discrete Digital Authentication ID Tag -->
          <div class="cert-verify-micro-tag">ID: ${certId}</div>

        </div>
      </div>
    `;
  }

  mountCertificate(container, recipient, customSettings = null) {
    if (!container) return;
    container.innerHTML = this.renderCertificateHTML(recipient, customSettings);
  }
}

window.certRenderer = new CertificateRenderer();
