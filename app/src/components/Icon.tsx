type IconProps = {
  name: string;
  size?: number;
  stroke?: number;
  color?: string;
};

export function Icon({ name, size = 18, stroke = 1.6, color = 'currentColor' }: IconProps) {
  const p = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: color,
    strokeWidth: stroke,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  switch (name) {
    case 'search':
      return (<svg {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>);
    case 'plus':
      return (<svg {...p}><path d="M12 5v14M5 12h14" /></svg>);
    case 'minus':
      return (<svg {...p}><path d="M5 12h14" /></svg>);
    case 'trash':
      return (
        <svg {...p}>
          <path d="M3 6h18" />
          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          <path d="M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14" />
        </svg>
      );
    case 'menu':
      return (
        <svg {...p}>
          <rect x="3" y="4" width="7" height="7" rx="1.5" />
          <rect x="14" y="4" width="7" height="7" rx="1.5" />
          <rect x="3" y="13" width="7" height="7" rx="1.5" />
          <rect x="14" y="13" width="7" height="7" rx="1.5" />
        </svg>
      );
    case 'receipt':
      return (
        <svg {...p}>
          <path d="M5 3h14v18l-2.5-1.5L14 21l-2.5-1.5L9 21l-2.5-1.5L5 21z" />
          <path d="M9 8h6M9 12h6M9 16h4" />
        </svg>
      );
    case 'stats':
      return (<svg {...p}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></svg>);
    case 'people':
      return (
        <svg {...p}>
          <circle cx="9" cy="8" r="3.5" />
          <path d="M3 20a6 6 0 0 1 12 0" />
          <circle cx="17" cy="9" r="2.5" />
          <path d="M14 18a4 4 0 0 1 7 0" />
        </svg>
      );
    case 'settings':
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
        </svg>
      );
    case 'check':
      return (<svg {...p}><path d="m5 13 4 4L19 7" /></svg>);
    case 'back':
      return (<svg {...p}><path d="M19 12H5M12 19l-7-7 7-7" /></svg>);
    case 'close':
      return (<svg {...p}><path d="M6 6l12 12M18 6 6 18" /></svg>);
    case 'cash':
      return (
        <svg {...p}>
          <rect x="2" y="6" width="20" height="12" rx="2" />
          <circle cx="12" cy="12" r="2.5" />
          <path d="M6 10v.01M18 14v.01" />
        </svg>
      );
    case 'qr':
      return (
        <svg {...p}>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <path d="M14 14h3v3M21 14v.01M14 21h3M21 21v-4M17 17h.01" />
        </svg>
      );
    case 'card':
      return (
        <svg {...p}>
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <path d="M2 10h20M6 15h4" />
        </svg>
      );
    case 'wallet':
      return (
        <svg {...p}>
          <path d="M3 7a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <path d="M3 10h18" />
          <circle cx="16" cy="14" r="1.5" />
        </svg>
      );
    case 'logout':
      return (
        <svg {...p}>
          <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
          <path d="M10 16l-4-4 4-4M6 12h10" />
        </svg>
      );
    case 'upload':
      return (
        <svg {...p}>
          <path d="M12 16V4M7 9l5-5 5 5" />
          <path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
        </svg>
      );
    case 'image':
      return (
        <svg {...p}>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <circle cx="9" cy="10" r="2" />
          <path d="m21 16-5-5-9 9" />
        </svg>
      );
    case 'refresh':
      return (
        <svg {...p}>
          <path d="M20 12a8 8 0 1 1-2.34-5.66L20 8.5" />
          <path d="M20 3.5v5h-5" />
        </svg>
      );
    case 'print':
      return (
        <svg {...p}>
          <path d="M6 9V3h12v6" />
          <rect x="3" y="9" width="18" height="9" rx="1.5" />
          <path d="M6 14h12v7H6z" />
        </svg>
      );
    case 'dot':
      return (<svg {...p}><circle cx="12" cy="12" r="3" fill={color} /></svg>);
    case 'store':
      return (
        <svg {...p}>
          <path d="M3 9 5 4h14l2 5" />
          <path d="M3 9v11h18V9" />
          <path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" />
          <path d="M9 20v-6h6v6" />
        </svg>
      );
    case 'bag':
      return (
        <svg {...p}>
          <path d="M5 7h14l-1.2 12.4a2 2 0 0 1-2 1.6H8.2a2 2 0 0 1-2-1.6z" />
          <path d="M9 7a3 3 0 0 1 6 0" />
        </svg>
      );
    case 'bike':
      return (
        <svg {...p}>
          <circle cx="6" cy="17" r="3" />
          <circle cx="18" cy="17" r="3" />
          <path d="M6 17 10 7h4M14 7l4 10M10 7h6" />
        </svg>
      );
    case 'user':
      return (
        <svg {...p}>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21a8 8 0 0 1 16 0" />
        </svg>
      );
    case 'note':
      return (
        <svg {...p}>
          <path d="M5 3h14v18H5z" />
          <path d="M9 8h6M9 12h6M9 16h4" />
        </svg>
      );
    case 'table':
      return (
        <svg {...p}>
          <rect x="3" y="6" width="18" height="10" rx="1.5" />
          <path d="M5 16v4M19 16v4" />
        </svg>
      );
    case 'clock':
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      );
    case 'spark':
      return (
        <svg {...p}>
          <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
        </svg>
      );
    case 'chev-r':
      return (<svg {...p}><path d="m9 6 6 6-6 6" /></svg>);
    default:
      return null;
  }
}
