/**
 * routes/feedback.js
 * ─────────────────────────────────────────────────────────
 * POST /api/feedback  → save to MongoDB + send emails
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const Feedback = require('../models/Feedback');
const { sendFeedbackEmails } = require('../services/emailService');

const router = express.Router();

// ── POST /api/feedback ────────────────────────────────────
router.post(
  '/',
  [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Name is required')
      .isLength({ max: 100 })
      .withMessage('Name cannot exceed 100 characters'),

    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('A valid email is required'),

    body('message')
      .trim()
      .notEmpty()
      .withMessage('Message is required')
      .isLength({ max: 2000 })
      .withMessage('Message cannot exceed 2000 characters'),

    body('subject')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Subject cannot exceed 200 characters'),
  ],
  async (req, res) => {
    // 1. Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { name, email, message, subject = 'General Enquiry' } = req.body;

    try {
      // 2. Persist to MongoDB
      const feedback = await Feedback.create({ name, email, message, subject });

      // 3. Fire both emails (user confirmation + admin alert)
      // We don't block the response waiting for emails – fire & forget style,
      // but we do update the emailStatus when they finish.
      sendFeedbackEmails(feedback)
        .then(async () => {
          feedback.emailStatus = 'sent';
          await feedback.save();
          console.log(`📧 Feedback emails sent for submission ${feedback._id}`);
        })
        .catch(async (err) => {
          feedback.emailStatus = 'failed';
          await feedback.save();
          console.error('❌ Failed to send feedback emails:', err.message);
        });

      return res.status(201).json({
        success: true,
        message:
          "Message received! We've sent a confirmation to your email and will reply within 24 hours.",
        feedbackId: feedback._id,
      });
    } catch (error) {
      console.error('Feedback route error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to submit feedback. Please try again.',
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
);

module.exports = router;
