'use client';

import { useState } from 'react';
import { apiPath } from '@/lib/app-paths';

export default function ReportIssue() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const response = await fetch(apiPath('/api/report'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitted(true);
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        setError(errorData.error || 'Failed to submit report. Please try again.');
      }
    } catch (err) {
      console.error('Error submitting report:', err);
      setError('An error occurred. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-2 sm:py-0">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100">Report a Bug</h1>

      <div className="surface-card p-4 sm:p-6">
        {submitted ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">✅</div>
            <h2 className="text-xl font-semibold text-gray-100 dark:text-gray-100 mb-2">
              Thank you for your feedback!
            </h2>
            <p className="text-gray-300 dark:text-gray-300 mb-4">
              Your report has been sent successfully. We&apos;ll look into it and get back to you if needed.
            </p>
            <button
              type="button"
              onClick={() => setSubmitted(false)}
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Submit Another Report
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-200 dark:text-gray-200 mb-2">
                Your Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="glass-input w-full px-4 py-3 rounded-lg text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-200 dark:text-gray-200 mb-2">
                Your Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="glass-input w-full px-4 py-3 rounded-lg text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="your.email@example.com"
              />
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-200 dark:text-gray-200 mb-2">
                Subject
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                className="glass-input w-full px-4 py-3 rounded-lg text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Brief description of the issue"
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-200 dark:text-gray-200 mb-2">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={6}
                className="glass-input w-full px-4 py-3 rounded-lg text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Please describe the issue in detail. Include steps to reproduce if applicable."
              />
            </div>

            {error && (
              <div className="p-4 bg-red-900/30 border border-red-500 dark:border-red-500 rounded-lg">
                <p className="text-sm text-red-200 dark:text-red-200">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Sending...' : 'Submit Report'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
