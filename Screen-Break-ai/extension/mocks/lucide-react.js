// Mock for lucide-react icons
const MockIcon = ({ size = 24, className = '', ...props }) => (
  React.createElement('div', {
    'data-testid': 'mock-icon',
    className: `mock-icon ${className}`,
    style: { width: size, height: size, display: 'inline-block' },
    ...props
  })
);

export const Activity = MockIcon;
export const Eye = MockIcon;
export const TrendingUp = MockIcon;
export const Award = MockIcon;
export const Clock = MockIcon;
export const Target = MockIcon;
export const MousePointer = MockIcon;
export const Keyboard = MockIcon;
export const Monitor = MockIcon;
export const BarChart3 = MockIcon;
export const Settings = MockIcon;
export const Download = MockIcon;
export const Bell = MockIcon;
export const Moon = MockIcon;
export const Sun = MockIcon;
export const Palette = MockIcon;
export const Volume2 = MockIcon;
export const VolumeX = MockIcon;
export const Play = MockIcon;
export const Pause = MockIcon;
export const RotateCcw = MockIcon;
export const X = MockIcon;
export const Check = MockIcon;
export const ChevronDown = MockIcon;
export const FileText = MockIcon;
export const Database = MockIcon;
export const Code = MockIcon;
export const Share2 = MockIcon;
export const Save = MockIcon;
export const RefreshCw = MockIcon;
export const CheckCircle = MockIcon;