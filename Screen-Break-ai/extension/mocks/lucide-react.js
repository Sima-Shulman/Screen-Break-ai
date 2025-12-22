// __mocks__/lucide-react.js
import React from 'react';

// A generic mock for any icon from lucide-react
const LucideIconMock = ({ size = 24, className, ...props }) => {
  return React.createElement('div', {
    'data-testid': 'lucide-icon',
    className,
    style: { width: size, height: size },
    ...props
  });
};

// Export all the icons used in the components
export const Activity = LucideIconMock;
export const Eye = LucideIconMock;
export const TrendingUp = LucideIconMock;
export const Award = LucideIconMock;
export const Clock = LucideIconMock;
export const Target = LucideIconMock;
export const X = LucideIconMock;
export const Play = LucideIconMock;
export const Pause = LucideIconMock;
export const CheckCircle = LucideIconMock;
export const Settings = LucideIconMock;
export const Save = LucideIconMock;
export const RefreshCw = LucideIconMock;
export const Download = LucideIconMock;
export const Share2 = LucideIconMock;
