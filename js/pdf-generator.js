/**
 * Communication Club - High-Definition PDF & PNG Exporter Engine
 */

class CertificatePDFGenerator {
  constructor() {}

  /**
   * Converts an image element or URL to a base64 Data URL for 100% reliable canvas rendering.
   */
  async imageToDataURL(imgElement) {
    if (!imgElement) return null;
    if (imgElement.src && imgElement.src.startsWith('data:')) {
      return imgElement.src;
    }

    return new Promise((resolve) => {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth || img.width || 300;
            canvas.height = img.naturalHeight || img.height || 100;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            const dataUrl = canvas.toDataURL('image/png');
            resolve(dataUrl);
          } catch (e) {
            resolve(imgElement.src);
          }
        };
        img.onerror = () => resolve(imgElement.src);
        img.src = imgElement.src;
      } catch (err) {
        resolve(imgElement.src);
      }
    });
  }

  /**
   * Prepares and waits for all images within a certificate element to be loaded.
   */
  async prepareCertificateForExport(element) {
    const images = Array.from(element.querySelectorAll('img'));
    
    // Ensure all images are fully loaded and converted to Data URLs if possible
    await Promise.all(images.map(async (img) => {
      if (!img.complete || img.naturalWidth === 0) {
        await new Promise((res) => {
          img.onload = res;
          img.onerror = res;
          setTimeout(res, 2000); // 2s safety timeout
        });
      }
      try {
        const dataUrl = await this.imageToDataURL(img);
        if (dataUrl && dataUrl.startsWith('data:')) {
          img.src = dataUrl;
        }
      } catch (e) {
        // Continue if conversion fails
      }
    }));

    // Allow CSS layout recalculation
    await new Promise(r => setTimeout(r, 100));
  }

  async exportToPNG(elementId, filename = 'Certificate.png') {
    const element = typeof elementId === 'string' ? document.getElementById(elementId) : elementId;
    if (!element) {
      console.error('Target certificate element not found:', elementId);
      return false;
    }

    try {
      if (typeof html2canvas === 'undefined') {
        window.print();
        return true;
      }

      await this.prepareCertificateForExport(element);

      // High-DPI capture with fixed 1000x707 dimensions
      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
        width: 1000,
        height: 707,
        windowWidth: 1200,
        imageTimeout: 15000,
        scrollX: 0,
        scrollY: 0,
        onclone: (clonedDoc) => {
          const clonedCert = clonedDoc.getElementById(element.id);
          if (clonedCert) {
            clonedCert.style.transform = 'none';
            clonedCert.style.margin = '0';
          }
        }
      });

      canvas.toBlob((blob) => {
        if (!blob) {
          const dataUrl = canvas.toDataURL('image/png', 1.0);
          this.triggerDownload(dataUrl, filename);
          return;
        }
        const blobUrl = URL.createObjectURL(blob);
        this.triggerDownload(blobUrl, filename);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
      }, 'image/png');

      return true;
    } catch (err) {
      console.error('PNG export failed, falling back to direct canvas capture:', err);
      try {
        // Fallback without strict taint
        const canvas = await html2canvas(element, { scale: 2, useCORS: true, allowTaint: true });
        const dataUrl = canvas.toDataURL('image/png');
        this.triggerDownload(dataUrl, filename);
        return true;
      } catch (fallbackErr) {
        window.print();
        return false;
      }
    }
  }

  async exportToPDF(elementId, filename = 'Certificate.pdf') {
    const element = typeof elementId === 'string' ? document.getElementById(elementId) : elementId;
    if (!element) {
      console.error('Target certificate element not found:', elementId);
      return false;
    }

    try {
      if (typeof html2canvas === 'undefined' || (typeof jspdf === 'undefined' && typeof window.jspdf === 'undefined')) {
        window.print();
        return true;
      }

      const jsPDF = window.jspdf ? window.jspdf.jsPDF : window.jsPDF;

      await this.prepareCertificateForExport(element);

      // Capture canvas at 3x scale with explicit dimensions
      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
        width: 1000,
        height: 707,
        windowWidth: 1200,
        imageTimeout: 15000,
        scrollX: 0,
        scrollY: 0,
        onclone: (clonedDoc) => {
          const clonedCert = clonedDoc.getElementById(element.id);
          if (clonedCert) {
            clonedCert.style.transform = 'none';
            clonedCert.style.margin = '0';
          }
        }
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.98);

      // A4 Landscape Dimensions: 297mm x 210mm
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      pdf.addImage(imgData, 'JPEG', 0, 0, 297, 210, undefined, 'FAST');
      
      // Save PDF or open blob for mobile in-app browsers
      try {
        pdf.save(filename);
      } catch (saveErr) {
        const blobUrl = pdf.output('bloburl');
        window.open(blobUrl, '_blank');
      }

      return true;
    } catch (err) {
      console.error('PDF generation error:', err);
      window.print();
      return false;
    }
  }

  triggerDownload(url, filename) {
    const link = document.createElement('a');
    link.download = filename;
    link.href = url;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  printCertificate(elementId) {
    window.print();
  }
}

window.pdfGenerator = new CertificatePDFGenerator();

