'use client';

import { useState } from 'react';
import { Button, Card, TextArea } from '@void-confessions/ui';
import { validateConfessionContent, CONFESSION_MAX_LENGTH } from '@void-confessions/core';

export default function Home() {
  const [confession, setConfession] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    const validation = validateConfessionContent(confession);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    setError(undefined);
    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setIsSubmitting(false);
    setSubmitted(true);
    setConfession('');
  };

  return (
    <main className="container mx-auto px-4 py-12 max-w-2xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-void-900 mb-4">Void Confessions</h1>
        <p className="text-gray-600">Share your thoughts anonymously into the void</p>
      </div>

      {submitted ? (
        <Card className="text-center">
          <div className="py-8">
            <div className="text-4xl mb-4">🌌</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Your confession has been sent into the void
            </h2>
            <p className="text-gray-600 mb-6">
              It will be reviewed and may appear anonymously soon.
            </p>
            <Button onClick={() => setSubmitted(false)}>Share Another</Button>
          </div>
        </Card>
      ) : (
        <Card>
          <TextArea
            label="Your Confession"
            placeholder="What would you like to confess to the void?"
            value={confession}
            onChange={(e) => setConfession(e.target.value)}
            error={error}
            helperText={`${confession.length}/${CONFESSION_MAX_LENGTH} characters`}
            rows={6}
          />
          <div className="mt-4 flex justify-end">
            <Button onClick={handleSubmit} isLoading={isSubmitting} disabled={!confession.trim()}>
              Send to the Void
            </Button>
          </div>
        </Card>
      )}

      <div className="mt-12">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Confessions</h2>
        <p className="text-gray-500 text-center py-8">
          No confessions yet. Be the first to share.
        </p>
      </div>
    </main>
  );
}
