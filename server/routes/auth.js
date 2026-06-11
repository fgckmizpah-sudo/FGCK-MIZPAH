const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { readData, writeData } = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

const normalize = (value) => (value || '').trim().toLowerCase();

const findMemberByUsername = (data, username) => {
  const normalizedUsername = normalize(username);
  return data.members.find((m) => {
    const normalizedMemberName = normalize(m.firstName);
    const firstNamePart = normalizedMemberName.split(' ')[0];
    return normalizedMemberName === normalizedUsername || firstNamePart === normalizedUsername;
  });
};

const getMemberEmail = (member) => normalize(member.recoveryEmail || member.email);

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

router.post('/login', async (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const normalizedUsername = (username || '').trim().toLowerCase();
  const normalizedPassword = (password || '').trim();

  const data = await readData();

  // Check admins first (pastor / elder)
  const admin = data.admins.find((item) => item.username.toLowerCase() === normalizedUsername);
  // Fallback: allow default elder credentials even if not present in data file
  if (!admin && username === 'Elder' && password === 'Eldermizpah123') {
    const token = jwt.sign({ id: 0, username: 'Elder', role: 'elder' }, process.env.JWT_SECRET || 'secret-key', {
      expiresIn: '8h'
    });
    return res.json({ token, user: { id: 0, username: 'Elder', role: 'elder' } });
  }
  if (admin) {
    if (!bcrypt.compareSync(password, admin.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: admin.id, username: admin.username, role: admin.role }, process.env.JWT_SECRET || 'secret-key', {
      expiresIn: '8h'
    });
    return res.json({ token, user: { id: admin.id, username: admin.username, role: admin.role } });
  }

  // Otherwise check members by first name or full name (member login)
  const member = data.members.find((m) => {
    const normalizedMemberName = (m.firstName || '').trim().toLowerCase();
    const firstNamePart = normalizedMemberName.split(' ')[0];
    return normalizedMemberName === normalizedUsername || firstNamePart === normalizedUsername;
  });
  if (!member) return res.status(401).json({ error: 'Invalid credentials' });

  // If member has a stored password, compare it
  if (member.password) {
    if (!bcrypt.compareSync(normalizedPassword, member.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: member.id, username: member.firstName, role: 'member' }, process.env.JWT_SECRET || 'secret-key', {
      expiresIn: '8h'
    });
    return res.json({ token, user: { id: member.id, username: member.firstName, role: 'member' } });
  }

  // No stored password: accept last 3 digits of memberNumber as temporary password
  const digitsMatch = (member.memberNumber || '').slice(-3) === normalizedPassword;
  if (!digitsMatch) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ id: member.id, username: member.firstName, role: 'member' }, process.env.JWT_SECRET || 'secret-key', {
    expiresIn: '8h'
  });
  // indicate that member needs to set a new password
  return res.json({ token, user: { id: member.id, username: member.firstName, role: 'member' }, needPasswordChange: true });
});

router.post('/forgot-password', async (req, res) => {
  const { username, email } = req.body;
  if (!username || !email) {
    return res.status(400).json({ error: 'Username and email are required' });
  }
  const data = await readData();
  const member = findMemberByUsername(data, username);
  if (!member || getMemberEmail(member) !== normalize(email)) {
    return res.status(404).json({ error: 'Member not found with provided email' });
  }
  const otp = generateOtp();
  member.passwordResetOtp = otp;
  member.passwordResetOtpExpiry = Date.now() + 15 * 60 * 1000;
  await writeData(data);
  console.log(`Password reset OTP for ${member.firstName} <${member.email}>: ${otp}`);
  return res.json({ success: true, message: 'OTP sent to recovery email' });
});

router.post('/reset-password', async (req, res) => {
  const { username, email, otp, newPassword, confirmPassword } = req.body;
  if (!username || !email || !otp || !newPassword || !confirmPassword) {
    return res.status(400).json({ error: 'Username, email, otp, and new password are required' });
  }
  if (newPassword !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }
  const data = await readData();
  const member = findMemberByUsername(data, username);
  if (!member || getMemberEmail(member) !== normalize(email)) {
    return res.status(404).json({ error: 'Member not found with provided email' });
  }
  if (!member.passwordResetOtp || member.passwordResetOtp !== otp || !member.passwordResetOtpExpiry || Date.now() > member.passwordResetOtpExpiry) {
    return res.status(400).json({ error: 'Invalid or expired OTP' });
  }
  member.password = bcrypt.hashSync(newPassword, 10);
  member.recoveryEmail = normalize(email);
  delete member.passwordResetOtp;
  delete member.passwordResetOtpExpiry;
  await writeData(data);
  res.json({ success: true });
});

// Set password for member (requires auth)
router.post('/set-password', authMiddleware, async (req, res) => {
  const { newPassword, recoveryEmail } = req.body;
  if (!newPassword) return res.status(400).json({ error: 'New password required' });
  if (!recoveryEmail) return res.status(400).json({ error: 'Recovery email required' });
  const user = req.user;
  if (!user || user.role !== 'member') return res.status(403).json({ error: 'Forbidden' });
  const data = await readData();
  const member = data.members.find((m) => m.id === Number(user.id));
  if (!member) return res.status(404).json({ error: 'Member not found' });
  member.password = bcrypt.hashSync(newPassword, 10);
  member.recoveryEmail = normalize(recoveryEmail);
  delete member.passwordResetOtp;
  delete member.passwordResetOtpExpiry;
  await writeData(data);
  res.json({ success: true });
});

module.exports = router;
