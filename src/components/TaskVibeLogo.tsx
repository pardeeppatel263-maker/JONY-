import React from 'react';

interface TaskVibeLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'hero' | 'xl';
  theme?: 'light' | 'dark' | 'on-blue';
  showSubtitle?: boolean;
  iconOnly?: boolean;
}

export const TaskVibeLogo: React.FC<TaskVibeLogoProps> = ({
  size = 'md',
  theme = 'light',
  showSubtitle = true,
  iconOnly = false,
}) => {
  const isXl = size === 'xl';
  const isHero = size === 'hero';
  const isLarge = size === 'lg';
  const isSmall = size === 'sm';

  const textColor =
    theme === 'on-blue'
      ? 'text-white'
      : theme === 'dark'
      ? 'text-slate-900'
      : 'text-white';

  const subColor =
    theme === 'on-blue'
      ? 'text-blue-200'
      : theme === 'dark'
      ? 'text-slate-500'
      : 'text-blue-100';

  const iconContainerClass = isXl
    ? 'w-20 h-20 rounded-2xl shadow-xl'
    : isHero
    ? 'w-16 h-16 rounded-2xl shadow-lg'
    : isLarge
    ? 'w-12 h-12 rounded-xl shadow-md'
    : isSmall
    ? 'w-8 h-8 rounded-lg shadow-xs'
    : 'w-10 h-10 rounded-xl shadow-md';

  return (
    <div className="flex flex-col items-center justify-center select-none">
      <div className="flex items-center gap-2.5">
        {/* 3D App Icon Badge */}
        <div
          className={`relative flex items-center justify-center overflow-hidden shrink-0 transition-transform duration-200 border border-amber-300/30 bg-slate-900 ${iconContainerClass}`}
        >
          <img
            src="/app-icon.png"
            alt="ZoroTask Icon"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.currentTarget.src = '/src/assets/images/taskvibe_app_icon_1790861613994.jpg';
            }}
          />
        </div>

        {/* Brand Name */}
        {!iconOnly && (
          <div className="flex flex-col leading-tight">
            <span
              className={`font-black tracking-tight ${
                isXl || isHero
                  ? 'text-3xl'
                  : isLarge
                  ? 'text-2xl'
                  : isSmall
                  ? 'text-lg font-bold'
                  : 'text-xl'
              } ${textColor}`}
            >
              Zoro<span className="text-amber-400">Task</span>
            </span>
            {showSubtitle && (
              <span
                className={`font-medium tracking-wide uppercase ${
                  isXl || isHero
                    ? 'text-[11px]'
                    : isLarge
                    ? 'text-[9.5px]'
                    : isSmall
                    ? 'text-[7.5px]'
                    : 'text-[8.5px]'
                } ${subColor}`}
              >
                Buy • Survey • Earn • Grow
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
