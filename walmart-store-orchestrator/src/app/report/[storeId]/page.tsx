'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { getStoreById, Store } from '@/data/stores';
import { StoreReport } from '@/lib/llm/types';
import { ReportCard, ReportCardSkeleton } from '@/components/report';
import { ArrowLeft, AlertCircle } from 'lucide-react';

interface ReportPageProps {
  params: Promise<{ storeId: string }>;
}

export default function ReportPage({ params }: ReportPageProps) {
  const { storeId } = use(params);
  const router = useRouter();
  const [store, setStore] = useState<Store | null>(null);
  const [report, setReport] = useState<StoreReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    const foundStore = getStoreById(storeId);
    if (foundStore) {
      setStore(foundStore);
      fetchReport(storeId);
    } else {
      setError('Store not found');
      setLoading(false);
    }
  }, [storeId]);

  const fetchReport = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/report/${id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch report');
      }

      setReport(data.report);
      setIsDemo(data.demo || false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    if (!store) return;

    try {
      setIsRegenerating(true);
      setError(null);

      const response = await fetch(`/api/report/${storeId}`, {
        method: 'POST',
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to regenerate report');
      }

      setReport(data.report);
      setIsDemo(data.demo || false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to regenerate report');
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="mb-6 flex items-center gap-2 text-white/60 hover:text-white transition-colors"
      >
        <ArrowLeft size={20} />
        <span>Back to Dashboard</span>
      </button>

      {/* Demo mode banner */}
      {isDemo && !loading && (
        <div className="mb-6 p-4 rounded-xl bg-yellow-500/20 border border-yellow-500/30 flex items-start gap-3">
          <AlertCircle size={20} className="text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-yellow-400">Demo Mode</h3>
            <p className="text-sm text-white/70">
              This report is generated with mock data. Configure LLM API keys in your environment
              to enable AI-powered analysis from Perplexity, Grok, Gemini, Claude, ChatGPT, and DeepSeek.
            </p>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/20 border border-red-500/30 flex items-start gap-3">
          <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-400">Error</h3>
            <p className="text-sm text-white/70">{error}</p>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && <ReportCardSkeleton />}

      {/* Report content */}
      {!loading && report && (
        <ReportCard
          report={report}
          onRegenerate={handleRegenerate}
          isRegenerating={isRegenerating}
        />
      )}

      {/* Not found state */}
      {!loading && !report && !error && (
        <div className="glass-card p-8 text-center">
          <AlertCircle size={48} className="text-white/40 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">No Report Available</h2>
          <p className="text-white/60 mb-4">
            Unable to generate a report for this store. Please try again later.
          </p>
          <button
            onClick={() => fetchReport(storeId)}
            className="glass-button"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
