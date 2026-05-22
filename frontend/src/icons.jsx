// Minimal stroke icons (24x24, currentColor)
const I = ({d, w=24, h=24, fill='none', stroke=1.7, children, vb='0 0 24 24', ...rest}) => (
  <svg width={w} height={h} viewBox={vb} fill={fill} stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" {...rest}>
    {d ? <path d={d}/> : children}
  </svg>
);

const Icons = {
  Dashboard: (p) => <I {...p}><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></I>,
  Megaphone: (p) => <I {...p}><path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1Z"/><path d="M14 8c1.5 1 1.5 7 0 8"/><path d="M17 6c3 2 3 10 0 12"/></I>,
  Chart: (p) => <I {...p}><path d="M3 3v18h18"/><path d="M7 14l3-4 3 3 5-7"/></I>,
  Users: (p) => <I {...p}><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.4 3.5-5 6.5-5s5.7 1.6 6.5 5"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14c2.5.1 4.4 1.5 5 4"/></I>,
  Code: (p) => <I {...p}><path d="M8 8l-4 4 4 4"/><path d="M16 8l4 4-4 4"/><path d="M14 5l-4 14"/></I>,
  User: (p) => <I {...p}><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.5-7 8-7s8 3 8 7"/></I>,
  Settings: (p) => <I {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.6 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/></I>,
  Bell: (p) => <I {...p}><path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 7H4c0-1 2-2 2-7Z"/><path d="M10.5 20a2 2 0 0 0 3 0"/></I>,
  Trash: (p) => <I {...p}><path d="M4 7h16"/><path d="M10 11v6M14 11v6"/><path d="M5 7l1 13a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-13"/><path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"/></I>,
  Search: (p) => <I {...p}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></I>,
  Plus: (p) => <I {...p}><path d="M12 5v14M5 12h14"/></I>,
  Filter: (p) => <I {...p}><path d="M4 5h16M7 12h10M10 19h4"/></I>,
  Download: (p) => <I {...p}><path d="M12 4v12m0 0 4-4m-4 4-4-4"/><path d="M4 20h16"/></I>,
  Upload: (p) => <I {...p}><path d="M12 20V8m0 0 4 4m-4-4-4 4"/><path d="M4 4h16"/></I>,
  Copy: (p) => <I {...p}><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a1 1 0 0 1 1-1h10"/></I>,
  Check: (p) => <I {...p}><path d="m5 12 5 5L20 7"/></I>,
  X: (p) => <I {...p}><path d="M6 6l12 12M18 6 6 18"/></I>,
  ChevronRight: (p) => <I {...p}><path d="m9 6 6 6-6 6"/></I>,
  ChevronDown: (p) => <I {...p}><path d="m6 9 6 6 6-6"/></I>,
  ChevronLeft: (p) => <I {...p}><path d="m15 6-6 6 6 6"/></I>,
  ArrowUp: (p) => <I {...p}><path d="M12 19V5m0 0-6 6m6-6 6 6"/></I>,
  ArrowDown: (p) => <I {...p}><path d="M12 5v14m0 0-6-6m6 6 6-6"/></I>,
  ArrowRight: (p) => <I {...p}><path d="M5 12h14m0 0-6-6m6 6-6 6"/></I>,
  Heart: (p) => <I {...p}><path d="M20.8 8.6A5 5 0 0 0 12 6a5 5 0 0 0-8.8 2.6c0 5 8.8 10.4 8.8 10.4s8.8-5.4 8.8-10.4Z"/></I>,
  Shield: (p) => <I {...p}><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z"/><path d="m9 12 2 2 4-4"/></I>,
  Lock: (p) => <I {...p}><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></I>,
  Globe: (p) => <I {...p}><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14 0 18M12 3c-3 3.5-3 14 0 18"/></I>,
  Wallet: (p) => <I {...p}><rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 10h18"/><circle cx="16" cy="15" r="1.4" fill="currentColor"/></I>,
  Phone: (p) => <I {...p}><rect x="7" y="3" width="10" height="18" rx="2"/><path d="M11 18h2"/></I>,
  Whatsapp: (p) => <I {...p}><path d="M3 21l1.5-4A8 8 0 1 1 8 20.5L3 21Z"/><path d="M8.5 9c.5 2.5 3 5 5.5 5.5l1-1.5 2.5 1c-.5 1.5-2 2-3.5 2-3.3 0-7-3.7-7-7 0-1.5.5-3 2-3.5l1 2.5L8.5 9Z"/></I>,
  Mail: (p) => <I {...p}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></I>,
  Edit: (p) => <I {...p}><path d="M4 20h4l10-10-4-4L4 16v4Z"/><path d="m13 7 4 4"/></I>,
  Eye: (p) => <I {...p}><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></I>,
  Star: (p) => <I {...p}><path d="m12 3 2.6 5.6 6.4.6-4.8 4.4 1.4 6.4L12 17l-5.6 3 1.4-6.4L3 9.2l6.4-.6L12 3Z"/></I>,
  Calendar: (p) => <I {...p}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></I>,
  Send: (p) => <I {...p}><path d="m22 2-7 20-3-9-9-3 19-8Z"/></I>,
  Refresh: (p) => <I {...p}><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 4v4h-4"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 20v-4h4"/></I>,
  Sun: (p) => <I {...p}><circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"/></I>,
  Moon: (p) => <I {...p}><path d="M20 14A8 8 0 1 1 10 4a7 7 0 0 0 10 10Z"/></I>,
  Menu: (p) => <I {...p}><path d="M4 6h16M4 12h16M4 18h16"/></I>,
  Logout: (p) => <I {...p}><path d="M14 8V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2v-2"/><path d="m17 8 4 4-4 4M9 12h12"/></I>,
  Home: (p) => <I {...p}><path d="m3 11 9-8 9 8v9a2 2 0 0 1-2 2h-4v-7h-6v7H5a2 2 0 0 1-2-2v-9Z"/></I>,
  Book: (p) => <I {...p}><path d="M4 4h11a4 4 0 0 1 4 4v13H8a4 4 0 0 1-4-4V4Z"/><path d="M4 17a4 4 0 0 1 4-4h11"/></I>,
  Pin: (p) => <I {...p}><path d="M12 22V12"/><path d="M8 6h8l-1 5a3 3 0 0 1-3 2 3 3 0 0 1-3-2l-1-5Z"/></I>,
  Pixel: (p) => <I {...p}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></I>,
  Sparkles: (p) => <I {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.4 2.4M16 16l2.4 2.4M5.6 18.4 8 16M16 8l2.4-2.4"/></I>,
};

window.Icons = Icons;
