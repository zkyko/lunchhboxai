'use client';

import { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { RecommendationCard } from '../components/RecommendationCard';
import { AlternativesList } from '../components/AlternativesList';
import { OrderHistory } from '../components/OrderHistory';
import { NutritionStats } from '../components/NutritionStats';
import { StatusBanner } from '../components/StatusBanner';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface Recommendation {
  topPick: {
    id: string;
    name: string;
    restaurant: string;
    price: number;
    score: number;
    estimatedNutrition?: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    };
    reasoning: string;
    suggestedModifications?: string[];
  };
  alternatives: Array<{
    id: string;
    name: string;
    restaurant: string;
    price: number;
    score: number;
    estimatedNutrition?: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    };
  }>;
  reasoning: string;
  dailySummary: string;
  cached?: boolean;
}

interface Status {
  date: string;
  isOfficeDay: boolean;
  hasOrder: boolean;
  order?: {
    id: number;
    itemName: string;
    restaurantName: string;
    status: string;
  };
}

export default function Home() {
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'today' | 'history' | 'stats'>('today');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    setError(null);

    try {
      const [statusRes, recRes] = await Promise.all([
        fetch(`${API_BASE}/api/status`),
        fetch(`${API_BASE}/api/recommendation`),
      ]);

      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setStatus(statusData);
      }

      if (recRes.ok) {
        const recData = await recRes.json();
        setRecommendation(recData);
      } else {
        setError('Could not load recommendation. Make sure the backend is running.');
      }
    } catch (err) {
      setError('Failed to connect to the server. Is the backend running?');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/recommendation?refresh=true`);
      if (res.ok) {
        const data = await res.json();
        setRecommendation(data);
      }
    } catch (err) {
      console.error('Refresh error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(itemId: string) {
    try {
      const prepareRes = await fetch(`${API_BASE}/api/order/prepare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId }),
      });

      if (prepareRes.ok) {
        const { orderId } = await prepareRes.json();
        
        await fetch(`${API_BASE}/api/order/${orderId}/approve`, {
          method: 'POST',
        });

        fetchData();
      }
    } catch (err) {
      console.error('Approve error:', err);
    }
  }

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      <Header onRefresh={handleRefresh} loading={loading} />

      {status && <StatusBanner status={status} />}

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('today')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'today'
              ? 'bg-green-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          Today&apos;s Pick
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'history'
              ? 'bg-green-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          Order History
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'stats'
              ? 'bg-green-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          Nutrition Stats
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
          <button
            onClick={fetchData}
            className="mt-2 text-red-600 underline hover:text-red-800"
          >
            Try again
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      ) : (
        <>
          {activeTab === 'today' && recommendation && (
            <div className="space-y-6">
              <RecommendationCard
                item={recommendation.topPick}
                reasoning={recommendation.reasoning}
                onApprove={() => handleApprove(recommendation.topPick.id)}
                disabled={status?.hasOrder}
              />

              {recommendation.alternatives.length > 0 && (
                <AlternativesList
                  items={recommendation.alternatives}
                  onSelect={(id) => handleApprove(id)}
                  disabled={status?.hasOrder}
                />
              )}
            </div>
          )}

          {activeTab === 'history' && <OrderHistory apiBase={API_BASE} />}

          {activeTab === 'stats' && <NutritionStats apiBase={API_BASE} />}
        </>
      )}
    </main>
  );
}
