import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Feedback - Walmart Ops',
  description: 'Share your feedback and help us improve Walmart Ops',
};

export default function FeedbackLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
