const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

// Create app
const app = express();
app.use(bodyParser.json());

// MongoDB connection
mongoose.connect('mongodb://127.0.0.1:27017/practice3', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Error:', err));

// Define Account Schema and Model
const accountSchema = new mongoose.Schema({
  name: { type: String, required: true },
  balance: { type: Number, required: true, min: 0 }
});

const Account = mongoose.model('Account', accountSchema);

// Create sample users (run once)
app.get('/create-sample', async (req, res) => {
  try {
    await Account.deleteMany({});
    await Account.insertMany([
      { name: 'Alice', balance: 1000 },
      { name: 'Bob', balance: 500 }
    ]);
    res.json({ message: '✅ Sample accounts created successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error creating sample accounts.' });
  }
});

// Transfer API
app.post('/transfer', async (req, res) => {
  try {
    const { fromAccount, toAccount, amount } = req.body;

    if (!fromAccount || !toAccount || !amount) {
      return res.status(400).json({ error: 'All fields (fromAccount, toAccount, amount) are required.' });
    }

    const sender = await Account.findOne({ name: fromAccount });
    const receiver = await Account.findOne({ name: toAccount });

    if (!sender || !receiver) {
      return res.status(404).json({ error: 'One or both accounts not found.' });
    }

    if (sender.balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance.' });
    }

    // Sequential update without transactions
    sender.balance -= amount;
    await sender.save();

    receiver.balance += amount;
    await receiver.save();

    res.json({
      message: `✅ Transfer successful! ₹${amount} transferred from ${fromAccount} to ${toAccount}.`,
      senderBalance: sender.balance,
      receiverBalance: receiver.balance
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during transfer.' });
  }
});

// Show all accounts
app.get('/accounts', async (req, res) => {
  try {
    const accounts = await Account.find({});
    res.json(accounts);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching accounts.' });
  }
});

// Start server
const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
