const mongoose = require('mongoose');

const reviewCommentSchema = new mongoose.Schema(
  {
    reviewId: { type: mongoose.Schema.Types.ObjectId, ref: 'Review', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true },
  },
  { timestamps: true }
);

const ReviewComment = mongoose.model('ReviewComment', reviewCommentSchema);
module.exports = ReviewComment;
