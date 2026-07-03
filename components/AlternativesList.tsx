'use client';

interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface AlternativeItem {
  id: string;
  name: string;
  restaurant: string;
  price: number;
  score: number;
  estimatedNutrition?: NutritionInfo;
}

interface AlternativesListProps {
  items: AlternativeItem[];
  onSelect: (id: string) => void;
  disabled?: boolean;
}

export function AlternativesList({
  items,
  onSelect,
  disabled,
}: AlternativesListProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Other Great Options
      </h3>

      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h4 className="font-medium text-gray-900">{item.name}</h4>
                <span className="text-sm text-gray-500 bg-gray-200 px-2 py-0.5 rounded">
                  {item.score}/100
                </span>
              </div>
              <p className="text-sm text-gray-600">{item.restaurant}</p>
              {item.estimatedNutrition && (
                <p className="text-xs text-gray-500 mt-1">
                  {item.estimatedNutrition.calories} cal ·{' '}
                  {item.estimatedNutrition.protein}g protein
                </p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <span className="font-semibold text-gray-900">
                ${item.price.toFixed(2)}
              </span>
              <button
                onClick={() => onSelect(item.id)}
                disabled={disabled}
                className="px-4 py-2 text-sm font-medium text-green-600 bg-green-100 rounded-lg hover:bg-green-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Select
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
