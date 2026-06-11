import { useEffect, useState } from 'react';
import client from '../api';
import { formatCurrency } from '../utils/currency';

function MyProject() {
  const [projects, setProjects] = useState([]);
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
        const memberRes = await client.get('/members');
        const currentMember = memberRes.data?.[0] || null;
        setMember(currentMember);
        if (currentMember) {
          const projectsRes = await client.get('/projects', { params: { memberId: currentMember.id } });
          setProjects(projectsRes.data || []);
        }
      } catch (error) {
        console.error('Failed to load my project contributions', error);
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

  const total = projects.reduce((sum, item) => sum + Number(item.amount), 0);

  return (
    <div>
      <h1 className="page-title">My Project</h1>
      <div className="section-card">
        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            <div style={{ marginBottom: 16 }}>
              <strong>Total project contribution</strong>
              <p>{formatCurrency(total)}</p>
            </div>
            {projects.length === 0 ? (
              <p>No project contribution records found.</p>
            ) : (
              <table className="table-list">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Project</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((project) => (
                    <tr key={project.id}>
                      <td>{project.date}</td>
                      <td>{project.projectName}</td>
                      <td>{formatCurrency(project.amount)}</td>
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

export default MyProject;
