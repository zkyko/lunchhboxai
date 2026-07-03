'use client';

import { useState, useEffect } from 'react';

interface DailyStat {
  date: string;
  totalCalories: number;
  totalProtein: number;
}

interface NutritionStatsProps {
  apiBase: string;
}

export function NutritionStats({ apiBase }: NutritionStatsProps) {
  const [stats, setStats] = useState<DailyStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch(`${apiBase}/api/nutrition/stats?days=7`);
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats || []);
        }
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [apiBase]);


  const avgCalories =
    stats.length > 0
      ? Math.round(stats.reduce((sum, s) => sum + s.totalCalories, 0) / stats.length)
      : 0;

  const avgProtein =
    stats.length > 0
      ? Math.round(stats.reduce((sum, s) => sum + s.totalProtein, 0) / stats.length)
      : 0;

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-100 rounded w-1/3" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-24 bg-gray-100 rounded-lg" />
            <div className="h-24 bg-gray-100 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Weekly Averages
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-orange-50 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-orange-600">{avgCalories}</p>
            <p className="text-sm text-orange-800">Avg Calories/Day</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-blue-600">{avgProtein}g</p>
            <p className="text-sm text-blue-800">Avg Protein/Day</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Daily Breakdown
        </h3>

        {stats.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            No nutrition data yet. Start ordering to track your intake!
          </p>
        ) : (
          <div className="space-y-3">
            {stats.map((day) => (
              <div
                key={day.date}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <span className="text-gray-700 font-medium">
                  {new Date(day.date).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
                <div className="flex gap-4 text-sm">
                  <span className="text-orange-600">
                    {day.totalCalories} cal
                  </span>
                  <span className="text-blue-600">{day.totalProtein}g protein</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl shadow-lg p-6 text-white">
        <h3 className="text-lg font-semibold mb-2">Your Goals</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="opacity-80">Target Calories</p>
            <p className="text-xl font-bold">900-1200</p>
          </div>
          <div>
            <p className="opacity-80">Target Protein</p>
            <p className="text-xl font-bold">60g+</p>
          </div>
          <div>
            <p className="opacity-80">Max Budget</p>
            <p className="text-xl font-bold">$18</p>
          </div>
          <div>
            <p className="opacity-80">Goal</p>
            <p className="text-xl font-bold">Gain Lean Mass</p>
          </div>
        </div>
      </div>
    </div>
  );
}
