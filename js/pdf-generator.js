/**
 * Communication Club - High-Definition PDF & PNG Exporter Engine
 */

class CertificatePDFGenerator {
  constructor() {}

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

      // High-DPI capture with fixed 1000x707 dimensions (mobile safe)
      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: 1000,
        height: 707,
        windowWidth: 1200,
        imageTimeout: 15000,
        scrollX: 0,
        scrollY: 0
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
      console.error('PNG export failed:', err);
      window.print();
      return false;
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

      // Capture canvas at 3x scale with explicit dimensions
      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: 1000,
        height: 707,
        windowWidth: 1200,
        imageTimeout: 15000,
        scrollX: 0,
        scrollY: 0
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

