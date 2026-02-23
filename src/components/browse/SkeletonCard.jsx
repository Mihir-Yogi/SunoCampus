const SkeletonCard = ({ type = 'post', index = 0 }) => {
  return (
    <div
      className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-card-enter opacity-0"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Image placeholder */}
      <div className={`w-full skeleton-shimmer ${type === 'event' ? 'aspect-[16/9]' : 'aspect-video'}`} />

      <div className="p-4 space-y-3">
        {/* Author row */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full skeleton-shimmer" />
          <div className="space-y-1.5 flex-1">
            <div className="h-3 skeleton-shimmer rounded w-24" />
            <div className="h-2.5 skeleton-shimmer rounded w-16" />
          </div>
        </div>

        {/* Title */}
        <div className="h-4 skeleton-shimmer rounded w-3/4" />

        {/* Content lines */}
        <div className="space-y-1.5">
          <div className="h-3 skeleton-shimmer rounded w-full" />
          <div className="h-3 skeleton-shimmer rounded w-5/6" />
          {type === 'post' && <div className="h-3 skeleton-shimmer rounded w-2/3" />}
        </div>

        {/* Event-specific: seats bar */}
        {type === 'event' && (
          <div className="space-y-1">
            <div className="flex justify-between">
              <div className="h-2.5 skeleton-shimmer rounded w-20" />
            </div>
            <div className="h-1.5 skeleton-shimmer rounded-full w-full" />
          </div>
        )}

        {/* Bottom row */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <div className="h-3 skeleton-shimmer rounded w-10" />
            <div className="h-3 skeleton-shimmer rounded w-10" />
          </div>
          {type === 'event' && <div className="h-6 skeleton-shimmer rounded-lg w-16" />}
        </div>
      </div>
    </div>
  );
};

export default SkeletonCard;
