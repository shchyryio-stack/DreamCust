"use client";

import { useState, useEffect } from 'react';
import { submitReview, submitReviewComment } from '@/services/api';
import { useRouter } from 'next/navigation';
import { useToast } from '@/context/ToastContext';

export default function ProductReviews({ product }: { product: any }) {
  const { showToast } = useToast();
  const [reviews, setReviews] = useState(product.reviews || []);

  useEffect(() => {
    setReviews(product.reviews || []);
  }, [product.reviews]);

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem('token'));
  }, []);

  const sortedReviews = [...reviews].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) {
      setError('Please select a rating');
      showToast('Please select a rating', 'warning');
      return;
    }
    if (!comment.trim()) {
      setError('Please enter a comment');
      showToast('Please enter a comment', 'warning');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      const data = await submitReview(product._id, rating, comment);
      
      if (data.reviews) {
        setReviews(data.reviews);
      }
      
      setComment('');
      setRating(0);
      showToast('Review submitted successfully!', 'success');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      showToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReplySubmit = async (reviewId: string) => {
    if (!replyText.trim()) return;
    
    if (!product._id || !reviewId) {
      console.error('Validation failed: Missing product or review ID');
      showToast('Failed to post reply: Missing details', 'error');
      return;
    }

    try {
      setIsReplying(true);
      const newComment = await submitReviewComment(product._id, reviewId, replyText);

      const updatedReviews = reviews.map((r: any) => {
        if (r._id === reviewId) {
          return { ...r, comments: [...(r.comments || []), newComment] };
        }
        return r;
      });
      
      setReviews(updatedReviews);
      setReplyText('');
      setReplyingTo(null);
      showToast('Reply posted successfully!', 'success');
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to post reply', 'error');
    } finally {
      setIsReplying(false);
    }
  };

  const StarIcon = ({ filled }: { filled: boolean }) => (
    <svg className={`w-5 h-5 ${filled ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );

  return (
    <div className="mt-16 bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
      <h2 className="text-2xl font-extrabold text-[#1A1A1A] mb-8">Customer Reviews</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        {/* Left Col: Review Form */}
        <div className="md:col-span-1">
          <div className="bg-[#F5F6F8] p-6 rounded-[24px]">
            <h3 className="text-lg font-bold text-[#1A1A1A] mb-4">Write a Review</h3>
            
            {!isLoggedIn ? (
              <div className="text-center py-6">
                <p className="text-gray-500 font-medium mb-4">Please log in to share your thoughts.</p>
                <a href="/login" className="inline-block bg-[#1E6FE8] hover:bg-[#1557BE] text-white px-6 py-2 rounded-xl font-bold transition-colors shadow-sm">
                  Log in
                </a>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-500 mb-2">Rating</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="focus:outline-none transition-transform hover:scale-110"
                      >
                        <StarIcon filled={star <= (hoverRating || rating)} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-500 mb-2">Comment</label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm focus:border-[#1E6FE8] focus:ring-1 focus:ring-[#1E6FE8] outline-none transition-all resize-none h-24"
                    placeholder="What did you like or dislike?"
                  />
                </div>

                {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#1A1A1A] hover:bg-black text-white py-3 rounded-xl font-bold transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Right Col: Review List */}
        <div className="md:col-span-2">
          {sortedReviews.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4 opacity-50">⭐</div>
              <p className="text-gray-500 font-medium text-lg">No reviews yet.</p>
              <p className="text-gray-400">Be the first to review this product!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {sortedReviews.map((review: any) => (
                <div key={review._id} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-50 text-[#1E6FE8] font-bold rounded-full flex items-center justify-center text-sm">
                        {review.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-[#1A1A1A]">{review.name}</p>
                        <p className="text-xs font-medium text-gray-400">
                          {new Date(review.createdAt).toLocaleDateString()}
                          {review.updatedAt && new Date(review.updatedAt).getTime() > new Date(review.createdAt).getTime() + 1000 && (
                            <span className="italic ml-1">(edited {new Date(review.updatedAt).toLocaleDateString()})</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <StarIcon key={star} filled={star <= review.rating} />
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-600 mt-3 leading-relaxed text-sm">
                    {review.comment}
                  </p>

                  <div className="mt-3 flex items-center gap-4">
                    {isLoggedIn && (
                      <button 
                        onClick={() => setReplyingTo(replyingTo === review._id ? null : review._id)}
                        className="text-xs font-bold text-gray-400 hover:text-[#1E6FE8] transition-colors uppercase tracking-wider"
                      >
                        {replyingTo === review._id ? 'Cancel Reply' : 'Reply'}
                      </button>
                    )}
                  </div>

                  {replyingTo === review._id && (
                    <div className="mt-4 flex gap-3 animate-fade-in-up">
                      <div className="w-8 h-8 bg-gray-100 text-gray-400 font-bold rounded-full flex items-center justify-center text-xs shrink-0">?</div>
                      <div className="flex-1 flex gap-2">
                        <input
                          type="text"
                          maxLength={150}
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Write a reply..."
                          className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#1E6FE8] outline-none"
                        />
                        <button 
                          disabled={isReplying || !replyText.trim()}
                          onClick={() => handleReplySubmit(review._id)}
                          className="bg-[#1E6FE8] text-white px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50 transition-colors"
                        >
                          Post
                        </button>
                      </div>
                    </div>
                  )}

                  {review.comments && review.comments.length > 0 && (
                    <div className="mt-5 pl-6 border-l-2 border-gray-100 space-y-4">
                      {review.comments.slice().reverse().map((comment: any) => (
                        <div key={comment._id} className="flex gap-3">
                          <div className="w-8 h-8 bg-gray-100 text-gray-500 font-bold rounded-full flex items-center justify-center text-xs shrink-0">
                            {comment.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="bg-gray-50 px-4 py-3 rounded-2xl rounded-tl-sm">
                              <p className="font-bold text-[#1A1A1A] text-sm mb-0.5">{comment.name}</p>
                              <p className="text-gray-600 text-sm">{comment.text}</p>
                            </div>
                            <p className="text-xs font-medium text-gray-400 mt-1 ml-2">
                              {new Date(comment.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
