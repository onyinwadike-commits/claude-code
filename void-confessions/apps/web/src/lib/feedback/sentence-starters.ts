// Phase 5: Sentence Starters Library for User Feedback
import type { SentenceStarter, FeedbackCategory } from './types';

// Sentence starters organized by category
export const sentenceStarters: SentenceStarter[] = [
  // Report Quality
  {
    id: 'rq-1',
    text: 'The sales data in the report seems...',
    category: 'report-quality',
    type: 'complaint',
    sentiment: 'negative',
  },
  {
    id: 'rq-2',
    text: 'I noticed the inventory numbers are...',
    category: 'report-quality',
    type: 'bug',
    sentiment: 'negative',
  },
  {
    id: 'rq-3',
    text: 'The dashboard metrics are really helpful because...',
    category: 'report-quality',
    type: 'praise',
    sentiment: 'positive',
  },
  {
    id: 'rq-4',
    text: 'It would be great if the reports could show...',
    category: 'report-quality',
    type: 'suggestion',
    sentiment: 'neutral',
  },
  {
    id: 'rq-5',
    text: 'The trend analysis helped me understand...',
    category: 'report-quality',
    type: 'praise',
    sentiment: 'positive',
  },
  {
    id: 'rq-6',
    text: 'I found a discrepancy between...',
    category: 'report-quality',
    type: 'bug',
    sentiment: 'negative',
  },

  // AI Accuracy
  {
    id: 'ai-1',
    text: 'The AI recommendation to restock was...',
    category: 'ai-accuracy',
    type: 'suggestion',
    sentiment: 'neutral',
  },
  {
    id: 'ai-2',
    text: 'The predicted sales numbers were off by...',
    category: 'ai-accuracy',
    type: 'complaint',
    sentiment: 'negative',
  },
  {
    id: 'ai-3',
    text: 'I followed the AI suggestion and it resulted in...',
    category: 'ai-accuracy',
    type: 'praise',
    sentiment: 'positive',
  },
  {
    id: 'ai-4',
    text: 'The AI missed an opportunity to...',
    category: 'ai-accuracy',
    type: 'suggestion',
    sentiment: 'neutral',
  },
  {
    id: 'ai-5',
    text: 'The confidence score seems too high/low for...',
    category: 'ai-accuracy',
    type: 'bug',
    sentiment: 'negative',
  },
  {
    id: 'ai-6',
    text: 'The AI correctly predicted that...',
    category: 'ai-accuracy',
    type: 'praise',
    sentiment: 'positive',
  },

  // Usability
  {
    id: 'us-1',
    text: 'I found it difficult to navigate to...',
    category: 'usability',
    type: 'complaint',
    sentiment: 'negative',
  },
  {
    id: 'us-2',
    text: 'The new dashboard layout makes it easier to...',
    category: 'usability',
    type: 'praise',
    sentiment: 'positive',
  },
  {
    id: 'us-3',
    text: 'It takes too many clicks to...',
    category: 'usability',
    type: 'complaint',
    sentiment: 'negative',
  },
  {
    id: 'us-4',
    text: 'I love how quickly I can now...',
    category: 'usability',
    type: 'praise',
    sentiment: 'positive',
  },
  {
    id: 'us-5',
    text: 'The filter options should include...',
    category: 'usability',
    type: 'suggestion',
    sentiment: 'neutral',
  },
  {
    id: 'us-6',
    text: 'I wish there was a shortcut for...',
    category: 'usability',
    type: 'feature',
    sentiment: 'neutral',
  },

  // Feature Request
  {
    id: 'fr-1',
    text: 'It would be amazing if we could...',
    category: 'feature-request',
    type: 'feature',
    sentiment: 'positive',
  },
  {
    id: 'fr-2',
    text: 'My team really needs a way to...',
    category: 'feature-request',
    type: 'feature',
    sentiment: 'neutral',
  },
  {
    id: 'fr-3',
    text: 'Can you add the ability to...',
    category: 'feature-request',
    type: 'feature',
    sentiment: 'neutral',
  },
  {
    id: 'fr-4',
    text: 'We used to have a feature that...',
    category: 'feature-request',
    type: 'feature',
    sentiment: 'neutral',
  },
  {
    id: 'fr-5',
    text: 'Other retail tools I\'ve used allow you to...',
    category: 'feature-request',
    type: 'feature',
    sentiment: 'neutral',
  },
  {
    id: 'fr-6',
    text: 'A game-changer would be...',
    category: 'feature-request',
    type: 'feature',
    sentiment: 'positive',
  },

  // Amazon Warfare
  {
    id: 'aw-1',
    text: 'The price comparison with Amazon shows...',
    category: 'amazon-warfare',
    type: 'suggestion',
    sentiment: 'neutral',
  },
  {
    id: 'aw-2',
    text: 'I noticed Amazon is undercutting us on...',
    category: 'amazon-warfare',
    type: 'complaint',
    sentiment: 'negative',
  },
  {
    id: 'aw-3',
    text: 'The competitive alert helped me respond to...',
    category: 'amazon-warfare',
    type: 'praise',
    sentiment: 'positive',
  },
  {
    id: 'aw-4',
    text: 'We need better tracking for...',
    category: 'amazon-warfare',
    type: 'feature',
    sentiment: 'neutral',
  },
  {
    id: 'aw-5',
    text: 'The threat level indicator for this category is...',
    category: 'amazon-warfare',
    type: 'bug',
    sentiment: 'negative',
  },
  {
    id: 'aw-6',
    text: 'Our response playbook worked well when...',
    category: 'amazon-warfare',
    type: 'praise',
    sentiment: 'positive',
  },

  // Visual Merchandising
  {
    id: 'vm-1',
    text: 'The planogram viewer helped me identify...',
    category: 'visual-merch',
    type: 'praise',
    sentiment: 'positive',
  },
  {
    id: 'vm-2',
    text: 'The shelf heat map shows that...',
    category: 'visual-merch',
    type: 'suggestion',
    sentiment: 'neutral',
  },
  {
    id: 'vm-3',
    text: 'I can\'t seem to update the product placement for...',
    category: 'visual-merch',
    type: 'bug',
    sentiment: 'negative',
  },
  {
    id: 'vm-4',
    text: 'The compliance scoring doesn\'t account for...',
    category: 'visual-merch',
    type: 'complaint',
    sentiment: 'negative',
  },
  {
    id: 'vm-5',
    text: 'It would help if the camera could detect...',
    category: 'visual-merch',
    type: 'feature',
    sentiment: 'neutral',
  },
  {
    id: 'vm-6',
    text: 'After implementing the AI suggestion, my endcap performance...',
    category: 'visual-merch',
    type: 'praise',
    sentiment: 'positive',
  },
];

// Get starters by category
export const getStartersByCategory = (category: FeedbackCategory): SentenceStarter[] => {
  return sentenceStarters.filter((starter) => starter.category === category);
};

// Get starters by sentiment
export const getStartersBySentiment = (
  category: FeedbackCategory,
  sentiment: 'positive' | 'neutral' | 'negative'
): SentenceStarter[] => {
  return sentenceStarters.filter(
    (starter) => starter.category === category && starter.sentiment === sentiment
  );
};

// Get random starters for a category
export const getRandomStarters = (category: FeedbackCategory, count: number = 3): SentenceStarter[] => {
  const categoryStarters = getStartersByCategory(category);
  const shuffled = [...categoryStarters].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

// Get all categories with their starter counts
export const getCategoryStarterCounts = (): Record<FeedbackCategory, number> => {
  const counts: Record<FeedbackCategory, number> = {
    'report-quality': 0,
    'ai-accuracy': 0,
    'usability': 0,
    'feature-request': 0,
    'amazon-warfare': 0,
    'visual-merch': 0,
  };

  sentenceStarters.forEach((starter) => {
    counts[starter.category]++;
  });

  return counts;
};

// Quick feedback templates
export const quickFeedbackTemplates = {
  positive: [
    'Great job on this feature! 👍',
    'This saved me a lot of time!',
    'Exactly what I needed!',
    'Love the new update!',
  ],
  negative: [
    'This needs improvement...',
    'Not working as expected',
    'Found an issue with this',
    'Can this be fixed?',
  ],
  neutral: [
    'I have a suggestion...',
    'Quick question about this...',
    'Noticed something here...',
    'Just wanted to mention...',
  ],
};
