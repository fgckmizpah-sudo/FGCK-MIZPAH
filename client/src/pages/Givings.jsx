import { useEffect, useState, useMemo } from 'react';
import client from '../api';

function Givings() {
  const [members, setMembers] = useState([]);
  const [offerings, setOfferings] = useState([]);
  const [tithes, setTithes] = useState([]);
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [form, setForm] = useState({ memberId: '', amount: '', givingDate: '', category: 'Offering', notes: '' });
  const [openMonths, setOpenMonths] = useState({});
  const [showForm, setShowForm] = useState(true);
  const role = localStorage.getItem('role');

  const categories = [
    'Offering',
    'Mission',
    'Thanksgiving',
    'Sunday school',
    'Kifurushi',
    'Seed',
    'Special offering'
  ];

  const loadData = async () => {
    const role = localStorage.getItem('role');
    const membersRes = await client.get('/members');
    setMembers(membersRes.data);
    // elders should not load offering history or tithes
    if (role === 'elder') {
      setOfferings([]);
      setTithes([]);
      return;
    }
    const [givingsRes, tithesRes] = await Promise.all([
      client.get('/givings', { params: { search, from, to } }),
      client.get('/tithes')
    ]);
    setOfferings(givingsRes.data);
    setTithes(tithesRes.data);
  };

  useEffect(() => { loadData().catch(console.error); }, []);

  const handleFormChange = (field) => (event) => {
    setForm({ ...form, [field]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await client.post('/givings', form);
    setForm({ memberId: '', amount: '', givingDate: '', category: 'Offering', notes: '' });
    loadData();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this offering record?')) return;
    await client.delete(`/givings/${id}`);
    loadData();
  };

  const grouped = useMemo(() => {
    // group by month -> date -> items
    const map = {};
    offerings.forEach((item) => {
      const d = new Date(item.givingDate);
      const monthKey = d.toLocaleString('default', { month: 'long', year: 'numeric' });
      const dateKey = d.toISOString().slice(0, 10); // YYYY-MM-DD
      if (!map[monthKey]) map[monthKey] = {};
      if (!map[monthKey][dateKey]) map[monthKey][dateKey] = [];
      map[monthKey][dateKey].push(item);
    });
    return map;
  }, [offerings]);

  const titheTotalsByDate = useMemo(() => {
    const map = {};
    tithes.forEach((item) => {
      const dateKey = item.givingDate;
      map[dateKey] = (map[dateKey] || 0) + Number(item.amount);
    });
    return map;
  }, [tithes]);

  const toggleMonth = (key) => {
    setOpenMonths((s) => ({ ...s, [key]: !s[key] }));
    setPendingAction(null);
    setSelectedCategory('');
  };

  const monthTotal = (items) => items.reduce((s,i)=>s+Number(i.amount),0);

  const [actionMenuDate, setActionMenuDate] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');

  const formatCurrency = (value) => new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(value);

  const handleActionButton = (dateKey) => {
    if (actionMenuDate === dateKey) {
      setActionMenuDate(null);
      setPendingAction(null);
      setSelectedCategory('');
      return;
    }
    setActionMenuDate(dateKey);
    setPendingAction(null);
    setSelectedCategory('');
  };

  const startPendingAction = (dateKey, action) => {
    setPendingAction({ dateKey, action });
    setActionMenuDate(null);
    setSelectedCategory('');
  };

  const handlePerformAction = async (dateKey, action, category, itemsForDate) => {
    if (!category) {
      return window.alert('Please select a recorded category.');
    }

    const matching = itemsForDate.filter((it) => it.category.toLowerCase() === category.toLowerCase());
    if (!matching.length) {
      return window.alert(`No records found for category ${category} on that date.`);
    }

    if (action === 'delete') {
      if (!window.confirm(`Delete all ${category} records for ${new Date(dateKey).toLocaleDateString()}?`)) return;
      for (const rec of matching) {
        await client.delete(`/givings/${rec.id}`);
      }
    } else if (action === 'edit') {
      const totalAmount = matching.reduce((sum, it) => sum + Number(it.amount), 0).toFixed(2);
      const amountInput = window.prompt(`Enter new amount for ${category} on ${new Date(dateKey).toLocaleDateString()}:`, totalAmount);
      if (amountInput === null) return;
      const newAmount = Number(amountInput);
      if (Number.isNaN(newAmount)) {
        return window.alert('Please enter a valid number.');
      }
      const notesInput = window.prompt('Enter notes (optional):', matching[0].notes || '');
      for (const rec of matching) {
        await client.put(`/givings/${rec.id}`, {
          memberId: rec.memberId,
          amount: newAmount,
          givingDate: rec.givingDate,
          category: rec.category,
          notes: notesInput || ''
        });
      }
    }

    setPendingAction(null);
    setSelectedCategory('');
    loadData();
  };

  return (
    <div>
      <h1 className="page-title">Offerings</h1>

      <div className="section-card">
        <form onSubmit={(e)=>{e.preventDefault(); loadData();}} className="search-row">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search offerings" />
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          <button className="button-secondary" type="button" onClick={loadData}>Filter</button>
          <button className="button-secondary" type="button" onClick={() => { setSearch(''); setFrom(''); setTo(''); loadData(); }}>Clear</button>
        </form>
      </div>

      {role !== 'member' && (
        <div className="section-card">
          <div className="section-card-header">
            <h2>Record new offering</h2>
            <button className="close-button" type="button" onClick={() => setShowForm((visible) => !visible)}>
              {showForm ? 'Close' : 'Open'}
            </button>
          </div>
          {showForm ? (
            <form onSubmit={handleSubmit}>
              <div className="input-row">
                <div className="form-field">
                  <label>Category</label>
                  <select value={form.category} onChange={handleFormChange('category')}>
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="input-row">
                <div className="form-field">
                  <label>Date</label>
                  <input type="date" value={form.givingDate} onChange={handleFormChange('givingDate')} max={new Date().toISOString().split('T')[0]} required />
                </div>
                <div className="form-field">
                  <label>Amount</label>
                  <input type="number" step="0.01" value={form.amount} onChange={handleFormChange('amount')} required />
                </div>
              </div>
              <div className="form-field">
                <label>Notes</label>
                <textarea rows="2" value={form.notes} onChange={handleFormChange('notes')} />
              </div>
              <button className="button-primary" type="submit">Save offering</button>
            </form>
          ) : (
            <p>Offering form is hidden. Click Open to show the form.</p>
          )}
        </div>
      )}

      {localStorage.getItem('role') !== 'elder' && (
        <div className="section-card">
          <h2>Offering history</h2>
          {Object.keys(grouped).length === 0 && <p>No records</p>}
          {Object.entries(grouped).map(([month, dates]) => {
            const allItems = Object.values(dates).flat();
            const monthSum = monthTotal(allItems);
            return (
              <div key={month} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => toggleMonth(month)}>
                  <strong>{month}</strong>
                  <span>Total: {formatCurrency(monthSum)}</span>
                </div>
                {openMonths[month] && (
                  <div style={{ marginTop: 8 }}>
                    {Object.entries(dates).map(([dateKey, itemsForDate]) => {
                      const dateSum = itemsForDate.reduce((s, it) => s + Number(it.amount), 0);
                      return (
                        <div key={dateKey} style={{ marginBottom: 8 }}>
                          <table className="table-list">
                            <thead>
                              <tr>
                                <th>Date</th>
                                <th>Category</th>
                                <th>Amount</th>
                              </tr>
                            </thead>
                            <tbody>
                              {itemsForDate.map((it) => (
                                <tr key={it.id}>
                                  <td>{new Date(it.givingDate).toLocaleDateString()}</td>
                                  <td>{it.category}</td>
                                  <td>{formatCurrency(it.amount)}</td>
                                </tr>
                              ))}
                              <tr>
                                <td colSpan={2}><strong>Date total</strong></td>
                                <td><strong>{formatCurrency(dateSum)}</strong></td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Givings;
