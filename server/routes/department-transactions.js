const express = require('express');
const { readData, writeData } = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  const data = await readData();
  const transactions = (data.departmentTransactions || [])
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  res.json(transactions);
});

router.post('/', async (req, res) => {
  const { department, amount, date, transactionType } = req.body;
  const data = await readData();
  if (!data.departmentTransactions) {
    data.departmentTransactions = [];
  }
  if (!data.lastTransactionId) {
    data.lastTransactionId = 0;
  }
  const newTransaction = {
    id: ++data.lastTransactionId,
    department,
    amount: Number(amount),
    date: new Date(date).toISOString(),
    transactionType,
    createdAt: new Date().toISOString()
  };
  data.departmentTransactions.push(newTransaction);
  await writeData(data);
  res.json(newTransaction);
});

router.delete('/:id', async (req, res) => {
  const data = await readData();
  if (!data.departmentTransactions) {
    data.departmentTransactions = [];
  }
  data.departmentTransactions = data.departmentTransactions.filter((item) => item.id !== Number(req.params.id));
  await writeData(data);
  res.json({ success: true });
});

module.exports = router;
