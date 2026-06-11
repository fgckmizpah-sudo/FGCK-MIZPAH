import { useEffect, useState } from 'react';
import client from '../api';
import { titleCase } from '../utils/string';

function ExportPage() {
  const [category, setCategory] = useState('members');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [isExporting, setIsExporting] = useState(false);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const filterDataByMonthYear = (data, dateField) => {
    if (!data) return [];
    return data.filter((item) => {
      const dateStr = item[dateField];
      if (!dateStr) return false;
      const date = new Date(dateStr);
      return date.getMonth() + 1 === Number(month) && date.getFullYear() === Number(year);
    });
  };

  const exportToExcel = async () => {
    try {
      setIsExporting(true);
      const XLSX = await import('xlsx');

      let data = [];
      let fileName = `export_${category}_${year}_${month}.xlsx`;
      const wb = XLSX.utils.book_new();

      if (category === 'members') {
        const response = await client.get('/members');
        data = response.data.map((member) => ({
          'Membership Number': member.memberNumber || '',
          'Name': member.firstName || '',
          'Gender': member.gender || '',
          'Group': titleCase(member.group || ''),
          'Date Joined': formatDate(member.joinedAt)
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, 'Members');
      } else if (category === 'tithes') {
        const response = await client.get('/tithe');
        const filtered = filterDataByMonthYear(response.data, 'date');
        data = filtered.map((tithe) => ({
          'Date': formatDate(tithe.date),
          'Member': tithe.memberName || '',
          'Amount': tithe.amount || 0
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, 'Tithes');
      } else if (category === 'offerings') {
        const response = await client.get('/givings');
        const filtered = filterDataByMonthYear(response.data, 'givingDate');
        data = filtered.map((giving) => ({
          'Date': formatDate(giving.givingDate),
          'Member': giving.memberName || '',
          'Amount': giving.amount || 0,
          'Category': giving.category || ''
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, 'Offerings');
      } else if (category === 'expenses') {
        const response = await client.get('/expenses');
        const filtered = filterDataByMonthYear(response.data, 'date');
        data = filtered.map((expense) => ({
          'Date': formatDate(expense.date),
          'Description': expense.description || '',
          'Amount': expense.amount || 0,
          'Category': expense.category || ''
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, 'Expenses');
      } else if (category === 'projects') {
        const response = await client.get('/projects');
        const filtered = filterDataByMonthYear(response.data, 'date');
        data = filtered.map((project) => ({
          'Date': formatDate(project.date),
          'Project Name': project.projectName || '',
          'Amount': project.amount || 0,
          'Status': project.status || ''
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, 'Projects');
      } else if (category === 'attendance') {
        const response = await client.get('/attendance');
        const filtered = filterDataByMonthYear(response.data, 'date');
        data = filtered.map((att) => ({
          'Date': formatDate(att.date),
          'Category': att.category || '',
          'Total': att.total || 0
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
      } else if (category === 'inventory') {
        const response = await client.get('/inventory');
        data = response.data.map((item) => ({
          'Item Name': item.itemName || '',
          'Quantity': item.quantity || 0,
          'Unit': item.unit || '',
          'Location': item.location || ''
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, 'Inventory');
      }

      if (data.length === 0) {
        window.alert(`No ${category} data found for ${month}/${year}`);
        setIsExporting(false);
        return;
      }

      XLSX.writeFile(wb, fileName);
      window.alert(`${category} data exported successfully!`);
    } catch (error) {
      console.error('Export error:', error);
      window.alert('Export failed. Please ensure xlsx library is installed: npm install xlsx');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div>
      <h1 className="page-title">Export Data</h1>
      <div className="section-card">
        <div className="section-card-header">
          <h2>Export Records to Excel</h2>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); exportToExcel(); }}>
          <div className="input-row">
            <div className="form-field">
              <label>Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="members">Members</option>
                <option value="tithes">Tithes</option>
                <option value="offerings">Offerings</option>
                <option value="expenses">Expenses</option>
                <option value="projects">Projects</option>
                <option value="attendance">Attendance</option>
                <option value="inventory">Inventory</option>
              </select>
            </div>
            <div className="form-field">
              <label>Month</label>
              <select value={month} onChange={(e) => setMonth(e.target.value)}>
                {months.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>Year</label>
              <select value={year} onChange={(e) => setYear(e.target.value)}>
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
          <button className="button-primary" type="submit" disabled={isExporting}>
            {isExporting ? 'Exporting...' : 'Export to Excel'}
          </button>
        </form>
      </div>
      {category === 'inventory' && (
        <div className="section-card">
          <p style={{ color: '#666', fontSize: '14px' }}>Note: Inventory data is not filtered by month/year as it represents current stock levels.</p>
        </div>
      )}
    </div>
  );
}

export default ExportPage;
