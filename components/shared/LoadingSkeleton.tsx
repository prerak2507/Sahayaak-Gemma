'use client';

export function LoadingSkeleton({ type = 'card' }: { type?: 'card' | 'table' | 'stats' | 'page' }) {
  if (type === 'stats') {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="stat-card">
            <div className="skeleton h-8 w-20 mb-2" />
            <div className="skeleton h-3 w-24" />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className="space-y-3">
        <div className="skeleton h-10 w-full rounded-lg" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="skeleton h-14 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (type === 'page') {
    return (
      <div className="space-y-6 p-6">
        <div className="skeleton h-8 w-64 mb-2" />
        <div className="skeleton h-4 w-96" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton h-40 rounded-2xl" />
          ))}
        </div>
        <div className="skeleton h-64 rounded-2xl mt-6" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="card p-0 overflow-hidden">
          <div className="skeleton h-4 w-3/4 m-6 mb-2" />
          <div className="skeleton h-3 w-1/2 mx-6 mb-2" />
          <div className="skeleton h-3 w-full mx-6 mb-4" />
          <div className="skeleton h-8 w-full rounded-none" />
        </div>
      ))}
    </div>
  );
}
