import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Visual Merchandising AI - Walmart Ops',
  description: 'AI-powered visual merchandising dashboard for Walmart operations',
};

export default function MerchandisingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
