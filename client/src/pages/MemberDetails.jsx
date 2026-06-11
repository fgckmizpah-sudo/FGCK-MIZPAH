import { useEffect, useState } from 'react';
import client from '../api';
import { titleCase } from '../utils/string';

function MemberDetails() {
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const role = localStorage.getItem('role');
  const leadershipTitles = ['Elder', 'Deacon', 'Deaconess', 'D.Leader'];

  useEffect(() => {
    if (role !== 'member') {
      setLoading(false);
      return;
    }

    const loadMember = async () => {
      try {
        const response = await client.get('/members');
        setMember(response.data?.[0] || null);
      } catch (error) {
        console.error('Failed to load member details', error);
      } finally {
        setLoading(false);
      }
    };

    loadMember();
  }, [role]);

  if (role !== 'member') {
    return (
      <div className="section-card">
        <p>Access denied.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="page-title">My Details</h1>
      <div className="section-card">
        {loading ? (
          <p>Loading...</p>
        ) : member ? (
          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={{ padding: 16, border: '1px solid #ddd', borderRadius: 6 }}>
              <strong>Member number</strong>
              <p>{member.memberNumber || 'N/A'}</p>
            </div>
            <div style={{ padding: 16, border: '1px solid #ddd', borderRadius: 6 }}>
              <strong>Name</strong>
              <p>{member.firstName || 'N/A'}</p>
            </div>
            <div style={{ padding: 16, border: '1px solid #ddd', borderRadius: 6 }}>
              <strong>Phone</strong>
              <p>{member.phone || 'N/A'}</p>
            </div>
            <div style={{ padding: 16, border: '1px solid #ddd', borderRadius: 6 }}>
              <strong>Group</strong>
              <p>{titleCase(member.group || 'Unassigned')}</p>
            </div>
            <div style={{ padding: 16, border: '1px solid #ddd', borderRadius: 6 }}>
              <strong>Role</strong>
              <p>{member.title ? member.title : 'Member'}</p>
            </div>
            {leadershipTitles.includes(member.title) && (
              <div style={{ padding: 16, border: '1px solid #ddd', borderRadius: 6, background: '#eef2ff' }}>
                <strong>Leadership Status</strong>
                <p>{member.title} Leader</p>
              </div>
            )}
            <div style={{ padding: 16, border: '1px solid #ddd', borderRadius: 6 }}>
              <strong>Gender</strong>
              <p>{member.gender || 'N/A'}</p>
            </div>
            <div style={{ padding: 16, border: '1px solid #ddd', borderRadius: 6 }}>
              <strong>Joined at</strong>
              <p>{member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : 'N/A'}</p>
            </div>
            {member.notes && (
              <div style={{ padding: 16, border: '1px solid #ddd', borderRadius: 6 }}>
                <strong>Notes</strong>
                <p>{member.notes}</p>
              </div>
            )}
          </div>
        ) : (
          <p>No member details found.</p>
        )}
      </div>
    </div>
  );
}

export default MemberDetails;
