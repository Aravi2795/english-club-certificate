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
      // Ensure html2canvas is loaded
      if (typeof html2canvas === 'undefined') {
        window.print();
        return true;
      }

      // High-DPI capture (scale: 3 for 300dpi print sharpness)
      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        imageTimeout: 15000
      });

      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return true;
    } catch (err) {
      console.error('PNG export failed:', err);
      alert('Could not generate PNG image automatically. Please use the Print button to save as PDF/Image.');
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
      if (typeof html2canvas === 'undefined' || typeof jspdf === 'undefined' && typeof window.jspdf === 'undefined') {
        window.print();
        return true;
      }

      const jsPDF = window.jspdf ? window.jspdf.jsPDF : window.jsPDF;

      // Capture canvas at 3x scale
      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        imageTimeout: 15000
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
      pdf.save(filename);
      return true;
    } catch (err) {
      console.error('PDF generation error:', err);
      window.print();
      return false;
    }
  }

  printCertificate(elementId) {
    window.print();
  }
}

window.pdfGenerator = new CertificatePDFGenerator();
