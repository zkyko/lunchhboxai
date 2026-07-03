'use client';

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

interface StatusBannerProps {
  status: Status;
}

export function StatusBanner({ status }: StatusBannerProps) {
  if (status.hasOrder && status.order) {
    const statusColors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      approved: 'bg-blue-100 text-blue-800 border-blue-200',
      submitted: 'bg-green-100 text-green-800 border-green-200',
      delivered: 'bg-green-100 text-green-800 border-green-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
    };

    const color = statusColors[status.order.status] || statusColors.pending;

    return (
      <div className={`rounded-lg border p-4 mb-6 ${color}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">
              Today's Order: {status.order.itemName}
            </p>
            <p className="text-sm opacity-80">
              from {status.order.restaurantName}
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-sm font-medium capitalize bg-white/50">
            {status.order.status}
          </span>
        </div>
      </div>
    );
  }

  if (!status.isOfficeDay) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-blue-800">
          <span className="font-medium">Home day!</span> Consider meal prep or
          cooking at home today.
        </p>
      </div>
    );
  }

  return null;
}
