import { useEffect, useState } from 'react';
import client from '../api';
import { formatCurrency } from '../utils/currency';

function MyTithe() {
  const [tithes, setTithes] = useState([]);
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const role = localStorage.getItem('role');

  useEffect(() => {
    if (role !== 'member') {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        const [memberRes, tithesRes] = await Promise.all([
          client.get('/members'),
          client.get('/tithes')
        ]);
        setMember(memberRes.data?.[0] || null);
        setTithes(tithesRes.data || []);
      } catch (error) {
        console.error('Failed to load my tithe', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [role]);

  if (role !== 'member') {
    return (
      <div className="section-card">
        <p>Access denied.</p>
      </div>
    );
  }

  const total = tithes.reduce((sum, item) => sum + Number(item.amount), 0);

  return (
    <div>
      <h1 className="page-title">My Tithe</h1>
      <div className="section-card">
        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            <div style={{ marginBottom: 16 }}>
              <strong>Total tithe contribution</strong>
              <p>{formatCurrency(total)}</p>
            </div>
            {tithes.length === 0 ? (
              <p>No tithe records found.</p>
            ) : (
              <table className="table-list">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {tithes.map((tithe) => (
                    <tr key={tithe.id}>
                      <td>{tithe.givingDate}</td>
                      <td>{formatCurrency(tithe.amount)}</td>
                      <td>{tithe.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default MyTithe;
