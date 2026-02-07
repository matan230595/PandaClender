
function escapeCsvCell(cell: any): string {
  if (cell == null) { // Catches undefined and null
    return '';
  }
  const str = String(cell);
  // If the string contains a comma, double quote, or newline, wrap it in double quotes.
  // Also, any double quotes inside the string must be escaped by another double quote.
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportToCsv(filename: string, data: any[]) {
  if (!data || data.length === 0) {
    console.warn("No data to export.");
    alert("אין נתונים לייצא.");
    return;
  }

  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','), // Header row
    ...data.map(row => 
      headers.map(header => escapeCsvCell(row[header])).join(',')
    )
  ];

  const csvString = csvRows.join('\n');
  const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' });
  
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}