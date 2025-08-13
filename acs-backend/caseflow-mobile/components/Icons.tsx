import React from 'react';

interface IconProps {
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}

const iconSize = { width: 24, height: 24 };

export const HomeIcon: React.FC<IconProps> = ({ width, height, color = "currentColor" }) => (
  <svg width={width || iconSize.width} height={height || iconSize.height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline>
  </svg>
);

export const ListTodoIcon: React.FC<IconProps> = ({ width, height, color = "currentColor" }) => (
  <svg width={width || iconSize.width} height={height || iconSize.height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="6" height="6" rx="1"></rect><path d="m3 17 2 2 4-4"></path><path d="M13 6h8"></path><path d="M13 12h8"></path><path d="M13 18h8"></path>
  </svg>
);

export const ClockIcon: React.FC<IconProps> = ({ width, height, color = "currentColor" }) => (
  <svg width={width || iconSize.width} height={height || iconSize.height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>
  </svg>
);

export const CheckCircle2Icon: React.FC<IconProps> = ({ width, height, color = "currentColor" }) => (
  <svg width={width || iconSize.width} height={height || iconSize.height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path><path d="m9 12 2 2 4-4"></path>
  </svg>
);

export const CheckCircleIcon: React.FC<IconProps> = ({ width, height, color = "currentColor" }) => (
  <svg width={width || iconSize.width} height={height || iconSize.height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path><path d="m9 12 2 2 4-4"></path>
  </svg>
);

export const ExclamationTriangleIcon: React.FC<IconProps> = ({ width, height, color = "currentColor" }) => (
  <svg width={width || iconSize.width} height={height || iconSize.height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><path d="M12 9v4"></path><path d="m12 17 .01 0"></path>
  </svg>
);

export const ArrowPathIcon: React.FC<IconProps> = ({ width, height, color = "currentColor" }) => (
  <svg width={width || iconSize.width} height={height || iconSize.height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path><path d="M21 3v5h-5"></path><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path><path d="M3 21v-5h5"></path>
  </svg>
);

export const DocumentTextIcon: React.FC<IconProps> = ({ width, height, color = "currentColor" }) => (
  <svg width={width || iconSize.width} height={height || iconSize.height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline>
  </svg>
);

export const PhotoIcon: React.FC<IconProps> = ({ width, height, color = "currentColor" }) => (
  <svg width={width || iconSize.width} height={height || iconSize.height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect><circle cx="9" cy="9" r="2"></circle><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
  </svg>
);

export const StarIcon: React.FC<IconProps & { filled?: boolean }> = ({ width, height, color = "currentColor", filled }) => (
  <svg width={width || iconSize.width} height={height || iconSize.height} viewBox="0 0 24 24" fill={filled ? color : "none"} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
  </svg>
);

export const LogOutIcon: React.FC<IconProps> = ({ width, height, color = "currentColor" }) => (
  <svg width={width || 20} height={height || 20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line>
  </svg>
);

export const RefreshCwIcon: React.FC<IconProps> = ({ width, height, color = "currentColor" }) => (
  <svg width={width || 20} height={height || 20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path><path d="M21 3v5h-5"></path><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path><path d="M3 21v-5h5"></path>
  </svg>
);

export const SparklesIcon: React.FC<IconProps> = ({ width, height, color = "currentColor" }) => (
    <svg width={width || 16} height={height || 16} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m12 3-1.9 3.8-3.8 1.9 3.8 1.9L12 14.4l1.9-3.8 3.8-1.9-3.8-1.9L12 3z"/><path d="M5 9l-1 2-2 1 2 1 1 2 1-2 2-1-2-1-1-2z"/><path d="M19 15l-1 2-2 1 2 1 1 2 1-2 2-1-2-1-1-2z"/>
    </svg>
);

export const ChevronDownIcon: React.FC<IconProps> = ({ width, height, color = "currentColor" }) => (
    <svg width={width || 16} height={height || 16} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
);

export const ChevronUpIcon: React.FC<IconProps> = ({ width, height, color = "currentColor" }) => (
    <svg width={width || 16} height={height || 16} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="18 15 12 9 6 15"></polyline>
    </svg>
);

export const CheckIcon: React.FC<IconProps> = ({ width, height, color = "currentColor" }) => (
    <svg width={width || iconSize.width} height={height || iconSize.height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
);

export const XIcon: React.FC<IconProps> = ({ width, height, color = "currentColor" }) => (
    <svg width={width || iconSize.width} height={height || iconSize.height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

export const InfoIcon: React.FC<IconProps> = ({ width, height, color = "currentColor" }) => (
    <svg width={width || iconSize.width} height={height || iconSize.height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line>
    </svg>
);

export const ArrowUpIcon: React.FC<IconProps> = ({ width, height, color = "currentColor" }) => (
    <svg width={width || iconSize.width} height={height || iconSize.height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline>
    </svg>
);

export const ArrowDownIcon: React.FC<IconProps> = ({ width, height, color = "currentColor" }) => (
    <svg width={width || iconSize.width} height={height || iconSize.height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline>
    </svg>
);

export const CameraIcon: React.FC<IconProps> = ({ width, height, color = "currentColor" }) => (
    <svg width={width || iconSize.width} height={height || iconSize.height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path>
        <circle cx="12" cy="13" r="3"></circle>
    </svg>
);

export const MapPinIcon: React.FC<IconProps> = ({ width, height, color = "currentColor" }) => (
    <svg width={width || iconSize.width} height={height || iconSize.height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
        <circle cx="12" cy="10" r="3"></circle>
    </svg>
);

export const UserIcon: React.FC<IconProps> = ({ width, height, color = "currentColor" }) => (
  <svg width={width || iconSize.width} height={height || iconSize.height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>
  </svg>
);



export const ClipboardIcon: React.FC<IconProps> = ({ width, height, color = "currentColor" }) => (
    <svg width={width || 20} height={height || 20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="8" height="4" x="8" y="2" rx="1" ry="1"></rect>
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
    </svg>
);

export const AttachmentIcon: React.FC<IconProps> = ({ width, height, color = "currentColor" }) => (
    <svg width={width || iconSize.width} height={height || iconSize.height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
    </svg>
);

export const SearchIcon: React.FC<IconProps> = ({ width, height, color = "currentColor", className }) => (
    <svg
        width={width || iconSize.width}
        height={height || iconSize.height}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <circle cx="11" cy="11" r="8"></circle>
        <path d="m21 21-4.35-4.35"></path>
    </svg>
);
