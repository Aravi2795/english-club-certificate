/**
 * Communication Club - Excel (.xlsx / .xls), Google Forms & CSV Importer Engine
 */

class GoogleFormsImporter {
  constructor() {}

  // Parse Excel file (ArrayBuffer from FileReader)
  parseExcelArrayBuffer(arrayBuffer) {
    if (typeof XLSX === 'undefined') {
      console.error('SheetJS library (XLSX) is not loaded.');
      return [];
    }

    try {
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Convert sheet to array of row arrays
      const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
      if (!rows || rows.length < 2) return [];

      const headers = rows[0].map(h => String(h).trim().toLowerCase());
      const dataRows = rows.slice(1);
      const colMap = this.detectColumnIndices(headers);
      const settings = window.certStore.getSettings();

      const mappedRecipients = [];

      for (const row of dataRows) {
        const name = colMap.name !== -1 ? String(row[colMap.name] || '').trim() : (String(row[0] || '').trim());
        const email = colMap.email !== -1 ? String(row[colMap.email] || '').trim() : '';
        const rawCategory = colMap.category !== -1 ? String(row[colMap.category] || '').trim() : '';
        const department = colMap.department !== -1 ? String(row[colMap.department] || '').trim() : 'General';
        const roleNote = colMap.roleNote !== -1 ? String(row[colMap.roleNote] || '').trim() : '';
        const eventName = colMap.eventName !== -1 ? String(row[colMap.eventName] || '').trim() : settings.eventName;

        if (!name && !email) continue;

        let category = 'participant';
        const catLower = (rawCategory || '').toLowerCase();
        if (catLower.includes('org') || catLower.includes('coord') || catLower.includes('host') || catLower.includes('lead') || catLower.includes('core')) {
          category = 'organiser';
        }

        mappedRecipients.push({
          name: name || 'Participant',
          email: email || '',
          category: category,
          department: department || 'General',
          roleNote: roleNote || '',
          eventName: eventName || settings.eventName,
          issueDate: settings.issueDate,
          status: 'Pending'
        });
      }

      return mappedRecipients;
    } catch (e) {
      console.error('Error parsing Excel file:', e);
      return [];
    }
  }

  // Parse CSV string into an array of objects
  parseCSV(csvText) {
    if (!csvText || !csvText.trim()) return [];

    const lines = [];
    let currentRow = [];
    let currentCell = '';
    let insideQuotes = false;

    for (let i = 0; i < csvText.length; i++) {
      const char = csvText[i];
      const nextChar = csvText[i + 1];

      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          currentCell += '"';
          i++; // Skip escaped quote
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === ',' && !insideQuotes) {
        currentRow.push(currentCell.trim());
        currentCell = '';
      } else if ((char === '\r' || char === '\n') && !insideQuotes) {
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
        currentRow.push(currentCell.trim());
        if (currentRow.some(cell => cell.length > 0)) {
          lines.push(currentRow);
        }
        currentRow = [];
        currentCell = '';
      } else {
        currentCell += char;
      }
    }

    if (currentCell.length > 0 || currentRow.length > 0) {
      currentRow.push(currentCell.trim());
      if (currentRow.some(cell => cell.length > 0)) {
        lines.push(currentRow);
      }
    }

    if (lines.length < 2) return [];

    const headers = lines[0].map(h => h.trim().toLowerCase());
    const dataRows = lines.slice(1);

    const colMap = this.detectColumnIndices(headers);
    const mappedRecipients = [];
    const settings = window.certStore.getSettings();

    for (const row of dataRows) {
      const name = colMap.name !== -1 ? row[colMap.name] : (row[0] || 'Unknown');
      const email = colMap.email !== -1 ? row[colMap.email] : '';
      const rawCategory = colMap.category !== -1 ? row[colMap.category] : '';
      const department = colMap.department !== -1 ? row[colMap.department] : 'General';
      const roleNote = colMap.roleNote !== -1 ? row[colMap.roleNote] : '';
      const eventName = colMap.eventName !== -1 ? row[colMap.eventName] : settings.eventName;

      if (!name && !email) continue;

      let category = 'participant';
      const catLower = (rawCategory || '').toLowerCase();
      if (catLower.includes('org') || catLower.includes('coord') || catLower.includes('host') || catLower.includes('lead') || catLower.includes('core')) {
        category = 'organiser';
      }

      mappedRecipients.push({
        name: name || 'Participant',
        email: email || '',
        category: category,
        department: department || 'General',
        roleNote: roleNote || '',
        eventName: eventName || settings.eventName,
        issueDate: settings.issueDate,
        status: 'Pending'
      });
    }

    return mappedRecipients;
  }

  detectColumnIndices(headers) {
    const map = {
      name: -1,
      email: -1,
      category: -1,
      department: -1,
      roleNote: -1,
      eventName: -1
    };

    headers.forEach((header, index) => {
      const h = header.toLowerCase();
      // Email detection
      if (h.includes('email') || h.includes('mail') || h.includes('google address')) {
        if (map.email === -1) map.email = index;
      }
      // Name detection
      else if (h.includes('full name') || h.includes('name of') || h.includes('participant name') || h.includes('student name') || h === 'name' || h.includes('candidate')) {
        if (map.name === -1) map.name = index;
      }
      // Category detection
      else if (h.includes('category') || h.includes('role') || h.includes('type') || h.includes('organiser') || h.includes('participant')) {
        if (map.category === -1) map.category = index;
      }
      // Department detection
      else if (h.includes('department') || h.includes('dept') || h.includes('branch') || h.includes('class')) {
        if (map.department === -1) map.department = index;
      }
      // Role note / remarks
      else if (h.includes('achievement') || h.includes('position') || h.includes('responsibility') || h.includes('remarks') || h.includes('note')) {
        if (map.roleNote === -1) map.roleNote = index;
      }
      // Event Name
      else if (h.includes('event') || h.includes('competition') || h.includes('title')) {
        if (map.eventName === -1) map.eventName = index;
      }
    });

    // Fallbacks if not detected by keywords
    if (map.name === -1 && headers.length > 0) map.name = 0;
    if (map.email === -1 && headers.length > 1) map.email = 1;

    return map;
  }

  // Parse Tab-separated values (direct copy-paste from Google Sheets or Excel)
  parseTSV(tsvText) {
    if (tsvText.includes('\t')) {
      const lines = tsvText.trim().split('\n');
      const rows = lines.map(line => line.split('\t').map(c => c.trim()));
      if (rows.length < 2) return [];

      const headers = rows[0].map(h => h.toLowerCase());
      const colMap = this.detectColumnIndices(headers);
      const settings = window.certStore.getSettings();

      return rows.slice(1).map(row => {
        const name = colMap.name !== -1 ? row[colMap.name] : (row[0] || 'Unknown');
        const email = colMap.email !== -1 ? row[colMap.email] : '';
        const rawCategory = colMap.category !== -1 ? row[colMap.category] : '';
        const department = colMap.department !== -1 ? row[colMap.department] : 'General';
        const roleNote = colMap.roleNote !== -1 ? row[colMap.roleNote] : '';

        let category = 'participant';
        const catLower = (rawCategory || '').toLowerCase();
        if (catLower.includes('org') || catLower.includes('coord') || catLower.includes('host') || catLower.includes('lead')) {
          category = 'organiser';
        }

        return {
          name: name || 'Participant',
          email: email || '',
          category: category,
          department: department || 'General',
          roleNote: roleNote || '',
          eventName: settings.eventName,
          issueDate: settings.issueDate,
          status: 'Pending'
        };
      }).filter(r => r.name || r.email);
    }

    return this.parseCSV(tsvText);
  }
}

window.googleFormsImporter = new GoogleFormsImporter();
