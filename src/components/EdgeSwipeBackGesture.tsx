import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface EdgeSwipeBackGestureProps {
  children?: React.ReactNode;
}

export const EdgeSwipeBackGesture: React.FC<EdgeSwipeBackGestureProps> = ({ children }) => {
  const { goBack, currentScreen } = useApp();

  const [gestureState, setGestureState] = useState<{
    isActive: boolean;
    edge: 'left' | 'right' | null;
    distance: number;
    touchY: number;
    isReady: boolean;
  }>({
    isActive: false,
    edge: null,
    distance: 0,
    touchY: 0,
    isReady: false,
  });

  const touchStartRef = useRef<{
    x: number;
    y: number;
    edge: 'left' | 'right' | null;
    isEdge: boolean;
    isScrolling: boolean | null;
    hasVibrated: boolean;
  }>({
    x: 0,
    y: 0,
    edge: null,
    isEdge: false,
    isScrolling: null,
    hasVibrated: false,
  });

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;

      const touch = e.touches[0];
      const x = touch.clientX;
      const y = touch.clientY;
      const screenWidth = window.innerWidth;

      // 38px gesture activation boundary from left or right edge
      const EDGE_ZONE = 38;
      let edge: 'left' | 'right' | null = null;

      if (x <= EDGE_ZONE) {
        edge = 'left';
      } else if (x >= screenWidth - EDGE_ZONE) {
        edge = 'right';
      }

      if (!edge) {
        touchStartRef.current = {
          x,
          y,
          edge: null,
          isEdge: false,
          isScrolling: null,
          hasVibrated: false,
        };
        return;
      }

      // Check if user is touching an interactive slider or range input
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'range')) {
        touchStartRef.current = {
          x,
          y,
          edge: null,
          isEdge: false,
          isScrolling: null,
          hasVibrated: false,
        };
        return;
      }

      touchStartRef.current = {
        x,
        y,
        edge,
        isEdge: true,
        isScrolling: null,
        hasVibrated: false,
      };
    };

    const handleTouchMove = (e: TouchEvent) => {
      const state = touchStartRef.current;
      if (!state.isEdge || !state.edge || e.touches.length !== 1) return;

      const touch = e.touches[0];
      const deltaX = touch.clientX - state.x;
      const deltaY = touch.clientY - state.y;

      // Determine intent: vertical scroll vs horizontal back swipe
      if (state.isScrolling === null) {
        if (Math.abs(deltaY) > 8 && Math.abs(deltaY) > Math.abs(deltaX)) {
          // User is scrolling page vertically - cancel gesture
          state.isScrolling = true;
          setGestureState((prev) => (prev.isActive ? { ...prev, isActive: false } : prev));
          return;
        }
        if (Math.abs(deltaX) > 10) {
          state.isScrolling = false;
        }
      }

      if (state.isScrolling === true) {
        return;
      }

      // Calculate directional pull distance
      let pullDistance = 0;
      if (state.edge === 'left' && deltaX > 0) {
        pullDistance = deltaX;
      } else if (state.edge === 'right' && deltaX < 0) {
        pullDistance = Math.abs(deltaX);
      }

      if (pullDistance > 12) {
        // Prevent default browser rubberband/pull actions while back gesture is in flight
        if (e.cancelable) {
          e.preventDefault();
        }

        const THRESHOLD = 65;
        const isReady = pullDistance >= THRESHOLD;

        // Gentle haptic feedback when crossing the trigger threshold
        if (isReady && !state.hasVibrated) {
          try {
            if (navigator.vibrate) {
              navigator.vibrate(15);
            }
          } catch {}
          state.hasVibrated = true;
        } else if (!isReady) {
          state.hasVibrated = false;
        }

        setGestureState({
          isActive: true,
          edge: state.edge,
          distance: pullDistance,
          touchY: touch.clientY,
          isReady,
        });
      } else {
        setGestureState((prev) => (prev.isActive ? { ...prev, isActive: false } : prev));
      }
    };

    const handleTouchEnd = () => {
      const state = touchStartRef.current;
      if (state.isEdge && state.isScrolling === false) {
        setGestureState((current) => {
          if (current.isActive && current.isReady) {
            // Success haptic pulse
            try {
              if (navigator.vibrate) {
                navigator.vibrate([18]);
              }
            } catch {}

            // Trigger safe navigation
            goBack();
          }
          return {
            isActive: false,
            edge: null,
            distance: 0,
            touchY: 0,
            isReady: false,
          };
        });
      }

      touchStartRef.current = {
        x: 0,
        y: 0,
        edge: null,
        isEdge: false,
        isScrolling: null,
        hasVibrated: false,
      };
    };

    const handleTouchCancel = () => {
      setGestureState({
        isActive: false,
        edge: null,
        distance: 0,
        touchY: 0,
        isReady: false,
      });
      touchStartRef.current = {
        x: 0,
        y: 0,
        edge: null,
        isEdge: false,
        isScrolling: null,
        hasVibrated: false,
      };
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleTouchCancel, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [goBack]);

  const clampedTouchY = Math.min(
    Math.max(gestureState.touchY, 100),
    typeof window !== 'undefined' ? window.innerHeight - 100 : 500
  );

  const pullProgress = Math.min(1, Math.max(0, (gestureState.distance - 12) / 55));
  const translateX = Math.min(gestureState.distance * 0.45, 42);

  return (
    <>
      {children}

      {/* Modern Android 14+ / iOS Edge Slide Back Visual Feedback Indicator */}
      {gestureState.isActive && (
        <div
          className="fixed z-9999 pointer-events-none transition-transform duration-75 ease-out select-none"
          style={{
            top: `${clampedTouchY - 26}px`,
            left: gestureState.edge === 'left' ? `${translateX}px` : undefined,
            right: gestureState.edge === 'right' ? `${translateX}px` : undefined,
          }}
        >
          <div
            className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-full shadow-2xl backdrop-blur-md transition-all duration-150 ${
              gestureState.isReady
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white scale-110 shadow-blue-500/50 ring-2 ring-white/50'
                : 'bg-slate-900/90 border border-slate-700/80 text-slate-300 scale-95 shadow-black/60'
            }`}
          >
            {gestureState.edge === 'left' ? (
              <ChevronLeft
                className={`w-5 h-5 transition-transform ${
                  gestureState.isReady ? '-translate-x-0.5' : ''
                }`}
              />
            ) : (
              <ChevronRight
                className={`w-5 h-5 transition-transform ${
                  gestureState.isReady ? 'translate-x-0.5' : ''
                }`}
              />
            )}
            <span className="text-[11px] font-black tracking-wide pr-0.5">
              {gestureState.isReady
                ? currentScreen === 'home'
                  ? 'Exit Prompt'
                  : 'Back'
                : 'Slide'}
            </span>
          </div>
        </div>
      )}
    </>
  );
};
