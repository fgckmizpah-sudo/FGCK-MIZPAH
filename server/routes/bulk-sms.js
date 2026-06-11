const express = require('express');
const { readData } = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.post('/', async (req, res) => {
  const { all, memberIds, message } = req.body;
  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const data = await readData();
  let recipients = [];

  if (all) {
    recipients = data.members;
  } else if (Array.isArray(memberIds) && memberIds.length > 0) {
    recipients = data.members.filter((member) => memberIds.includes(member.id));
  }

  const recipientCount = recipients.length;

  // Here we simulate sending SMS for each recipient.
  // In production this should call a real SMS provider.
  console.log(`Bulk SMS sent to ${recipientCount} recipient(s):`, {
    message: message.trim(),
    recipients: recipients.map((member) => ({ id: member.id, phone: member.phone, firstName: member.firstName }))
  });

  res.json({ success: true, count: recipientCount });
});

module.exports = router;
