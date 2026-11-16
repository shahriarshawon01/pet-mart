import React from 'react';

export function Skeleton({ className = '', ...props }) {
  return (
    <div
      className={`animate-pulse bg-zinc-200 rounded-lg ${className}`}
      {...props}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white border border-border rounded-2xl overflow-hidden">
      <Skeleton className="aspect-[4/3] rounded-none" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-6 w-1/2 mt-1" />
        <div className="flex justify-between pt-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-1/4" />
        </div>
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-pulse">
      {/* Header bar skeleton */}
      <div className="space-y-3">
        <div className="h-4 bg-zinc-200 rounded w-1/4" />
        <div className="h-8 bg-zinc-200 rounded w-1/2" />
        <div className="h-4 bg-zinc-200 rounded w-1/3" />
      </div>

      {/* Hero / Banner skeleton */}
      <div className="h-48 sm:h-64 bg-zinc-200 rounded-2xl" />

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}
