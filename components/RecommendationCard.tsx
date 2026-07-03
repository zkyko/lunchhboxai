'use client';

interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface RecommendationItem {
  id: string;
  name: string;
  restaurant: string;
  price: number;
  score: number;
  estimatedNutrition?: NutritionInfo;
  reasoning: string;
  suggestedModifications?: string[];
}

interface RecommendationCardProps {
  item: RecommendationItem;
  reasoning: string;
  onApprove: () => void;
  disabled?: boolean;
}

export function RecommendationCard({
  item,
  reasoning,
  onApprove,
  disabled,
}: RecommendationCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <span className="text-white/90 text-sm font-medium">
            Top Pick for Today
          </span>
          <span className="bg-white/20 text-white px-3 py-1 rounded-full text-sm font-bold">
            Score: {item.score}/100
          </span>
        </div>
      </div>

      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">{item.name}</h2>
        <p className="text-gray-600 mb-4">{item.restaurant}</p>

        <div className="flex items-center gap-4 mb-6">
          <span className="text-2xl font-bold text-green-600">
            ${item.price.toFixed(2)}
          </span>

          {item.estimatedNutrition && (
            <div className="flex gap-3 text-sm">
              <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded">
                {item.estimatedNutrition.calories} cal
              </span>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                {item.estimatedNutrition.protein}g protein
              </span>
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
                {item.estimatedNutrition.carbs}g carbs
              </span>
            </div>
          )}
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-gray-700">{reasoning}</p>
        </div>

        {item.suggestedModifications && item.suggestedModifications.length > 0 && (
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Suggested modifications:
            </p>
            <div className="flex flex-wrap gap-2">
              {item.suggestedModifications.map((mod, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                >
                  {mod}
                </span>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={onApprove}
          disabled={disabled}
          className="w-full py-3 px-6 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {disabled ? 'Already Ordered Today' : 'Approve & Prepare Order'}
        </button>
      </div>
    </div>
  );
}
