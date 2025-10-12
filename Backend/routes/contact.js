// routes/contact.js
router.post('/contact', async (req, res) => {
  const { fullName, email, subject, message } = req.body || {};
  if (!fullName || !email || !message) {
    return res.status(400).json({ message: 'Full name, email and message are required' });
  }
  // Store in DB or forward via email service
  return res.json({ message: 'Thanks, your message has been received.' });
});
