import { useEffect, useState } from 'react';
import client from '../api';

function Departments() {
  const [transactions, setTransactions] = useState([]);
  const [expandedDepartment, setExpandedDepartment] = useState(null);
  const [transactionForm, setTransactionForm] = useState({
    department: 'Men',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    transactionType: 'deposit'
  });
  const [showTransactionForm, setShowTransactionForm] = useState(true);

  const departmentOptions = ['Men', 'Ladies', 'Youth', 'Teens', 'Sunday School', 'Choir', 'Praise & Worship', 'Intercessory'];

  const loadTransactions = async () => {
    try {
      const response = await client.get('/department-transactions');
      setTransactions(response.data);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    }
  };

  useEffect(() => {
    loadTransactions().catch(console.error);
  }, []);

  const handleTransactionChange = (field) => (event) => {
    setTransactionForm({ ...transactionForm, [field]: event.target.value });
  };

  const handleTransactionSubmit = async (event) => {
    event.preventDefault();
    if (!transactionForm.amount) {
      window.alert('Please enter an amount');
      return;
    }
    try {
      await client.post('/department-transactions', {
        department: transactionForm.department,
        amount: Number(transactionForm.amount),
        date: transactionForm.date,
        transactionType: transactionForm.transactionType
      });
      setTransactionForm({
        department: 'Men',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        transactionType: 'deposit'
      });
      loadTransactions();
    } catch (error) {
      window.alert('Failed to record transaction');
      console.error(error);
    }
  };

  const getTodayString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getDepartmentBalance = (dept) => {
    let balance = 0;
    transactions
      .filter((t) => t.department === dept)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .forEach((t) => {
        if (t.transactionType === 'deposit') {
          balance += t.amount;
        } else {
          balance -= t.amount;
        }
      });
    return balance;
  };

  const getDepartmentTransactions = (dept) => {
    return transactions
      .filter((t) => t.department === dept)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const getTransactionsWithBalance = (dept) => {
    let balance = 0;
    return getDepartmentTransactions(dept)
      .map((t) => {
        if (t.transactionType === 'deposit') {
          balance += t.amount;
        } else {
          balance -= t.amount;
        }
        return { ...t, balance };
      })
      .reverse();
  };

  const uniqueDepartments = [...new Set(transactions.map((t) => t.department))].sort();

  return (
    <div>
      <h1 className="page-title">Departments</h1>
      <div className="section-card">
        <div className="section-card-header">
          <h2>Record Transaction</h2>
          <button className="close-button" type="button" onClick={() => setShowTransactionForm((visible) => !visible)}>
            {showTransactionForm ? 'Close' : 'Open'}
          </button>
        </div>
        {showTransactionForm ? (
          <form onSubmit={handleTransactionSubmit}>
            <div className="input-row">
              <div className="form-field">
                <label>Department</label>
                <select value={transactionForm.department} onChange={handleTransactionChange('department')} required>
                  {departmentOptions.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label>Amount</label>
                <input type="number" value={transactionForm.amount} onChange={handleTransactionChange('amount')} step="0.01" required />
              </div>
            </div>
            <div className="input-row">
              <div className="form-field">
                <label>Date</label>
                <input type="date" value={transactionForm.date} onChange={handleTransactionChange('date')} max={getTodayString()} required />
              </div>
              <div className="form-field">
                <label>Transaction Type</label>
                <select value={transactionForm.transactionType} onChange={handleTransactionChange('transactionType')} required>
                  <option value="deposit">Deposit</option>
                  <option value="withdraw">Withdraw</option>
                </select>
              </div>
            </div>
            <button className="button-primary" type="submit">Record Transaction</button>
          </form>
        ) : (
          <p>Transaction form is hidden. Click Open to show the form.</p>
        )}
      </div>
      <div className="section-card">
        <h2>Transaction History</h2>
        {uniqueDepartments.length === 0 ? (
          <p>No transactions recorded yet.</p>
        ) : (
          <div>
            {uniqueDepartments.map((dept) => (
              <div key={dept} style={{ marginBottom: '16px', border: '1px solid #ddd', borderRadius: '4px' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px',
                    backgroundColor: '#f5f5f5',
                    cursor: 'pointer'
                  }}
                  onClick={() => setExpandedDepartment(expandedDepartment === dept ? null : dept)}
                >
                  <span style={{ fontWeight: '600', fontSize: '16px' }}>
                    {expandedDepartment === dept ? '▼' : '▶'} {dept}
                  </span>
                  <span style={{
                    fontWeight: 'bold',
                    fontSize: '16px',
                    color: getDepartmentBalance(dept) >= 0 ? '#27ae60' : '#e74c3c'
                  }}>
                    Balance: {getDepartmentBalance(dept).toFixed(2)}
                  </span>
                </div>
                {expandedDepartment === dept && (
                  <table className="table-list" style={{ margin: 0, borderTop: 'none' }}>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Amount</th>
                        <th>Type</th>
                        <th>Date</th>
                        <th>Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getTransactionsWithBalance(dept).map((transaction, index) => (
                        <tr
                          key={transaction.id}
                          style={{
                            backgroundColor: transaction.transactionType === 'deposit' ? '#e3f2fd' : '#ffebee'
                          }}
                        >
                          <td>{index + 1}</td>
                          <td>{transaction.amount.toFixed(2)}</td>
                          <td style={{ textTransform: 'capitalize' }}>{transaction.transactionType}</td>
                          <td>{new Date(transaction.date).toLocaleDateString()}</td>
                          <td style={{ fontWeight: 'bold', color: transaction.balance >= 0 ? '#27ae60' : '#e74c3c' }}>
                            {transaction.balance.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Departments;
