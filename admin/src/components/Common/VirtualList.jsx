import React, { useEffect, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

const VirtualList = ({
    items = [],
    renderItem,
    getItemKey = (item, index) => item?.id ?? index,
    estimateSize = 56,
    overscan = 5,
    className = "",
    emptyMessage = "No records found.",

    // Infinite loading props
    hasMore = false,
    isLoadingMore = false,
    onEndReached,
    endThreshold = 10, // start loading when this many rows from the end
    loadingText = "Loading more...",
}) => {
    const parentRef = useRef(null);

    // Always call the latest onEndReached without re-triggering the effect
    const onEndReachedRef = useRef(onEndReached);
    useEffect(() => {
        onEndReachedRef.current = onEndReached;
    }, [onEndReached]);

    const virtualizer = useVirtualizer({
        count: items.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => estimateSize,
        overscan,
        getItemKey: (index) => getItemKey(items[index], index),
    });

    const virtualItems = virtualizer.getVirtualItems();
    const lastVisibleIndex = virtualItems.length
        ? virtualItems[virtualItems.length - 1].index
        : -1;

    // Fires when: the user scrolls near the end, new rows arrive, or a
    // request finishes (isLoadingMore -> false). There is no "sticky" guard,
    // so a skipped call can never block later loads; duplicate calls are
    // prevented by isLoadingMore and by the loader's own lock.
    useEffect(() => {
        if (!hasMore || isLoadingMore || items.length === 0) return;

        if (lastVisibleIndex >= items.length - endThreshold) {
            onEndReachedRef.current?.();
        }
    }, [lastVisibleIndex, items.length, hasMore, isLoadingMore, endThreshold]);

    return (
        <div
            ref={parentRef}
            className={`h-full min-h-0 overflow-y-auto overflow-x-hidden ${className}`}
        >
            {items.length === 0 ? (
                <div className="flex h-full min-h-[150px] items-center justify-center px-4 text-center text-sm text-gray-500">
                    {emptyMessage}
                </div>
            ) : (
                <div
                    className="relative w-full"
                    style={{ height: `${virtualizer.getTotalSize()}px` }}
                >
                    {virtualItems.map((virtualItem) => (
                        <div
                            key={virtualItem.key}
                            data-index={virtualItem.index}
                            ref={virtualizer.measureElement}
                            className="absolute left-0 top-0 w-full"
                            style={{
                                transform: `translateY(${virtualItem.start}px)`,
                            }}
                        >
                            {renderItem(
                                items[virtualItem.index],
                                virtualItem.index
                            )}
                        </div>
                    ))}
                </div>
            )}

            {isLoadingMore && items.length > 0 && (
                <div className="py-3 text-center text-xs text-gray-500">
                    {loadingText}
                </div>
            )}
        </div>
    );
};

export default VirtualList;