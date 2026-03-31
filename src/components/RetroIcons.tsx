import React from 'react';

// Wrapper for common SVG properties
const RetroSvg = ({ className = '', children, viewBox = "0 0 100 100" }: { className?: string, children: React.ReactNode, viewBox?: string }) => (
  <svg 
    viewBox={viewBox} 
    className={`retro-icon retro-wobble ${className}`}
    fill="currentColor"
    stroke="currentColor" 
    xmlns="http://www.w3.org/2000/svg"
  >
    {children}
  </svg>
);

// 1. Dashboard / Home
export const RetroDashboard = ({ className }: { className?: string }) => (
  <RetroSvg className={className}>
    <rect x="20" y="25" width="60" height="50" rx="10" fill="none" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="50" cy="50" r="10" fill="none" strokeWidth="8" />
    <path d="M50 50 L65 35" strokeWidth="8" strokeLinecap="round" />
    <circle cx="35" cy="50" r="4" fill="currentColor" />
    <circle cx="65" cy="50" r="4" fill="currentColor" />
    <path d="M30 65 C40 75 60 75 70 65" fill="none" strokeWidth="8" strokeLinecap="round" />
    <path d="M40 25 L40 10 M60 25 L60 10" strokeWidth="8" strokeLinecap="round" />
  </RetroSvg>
);

// 2. Shopping Cart / Cashier
export const RetroCart = ({ className }: { className?: string }) => (
  <RetroSvg className={className}>
    <path d="M10 20 L25 20 L35 70 L80 70 L90 35 L28 35" fill="none" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="45" cy="85" r="8" fill="none" strokeWidth="8" />
    <circle cx="75" cy="85" r="8" fill="none" strokeWidth="8" />
    <path d="M45 50 C45 45 42 40 48 40 C55 40 50 50 45 50 Z" fill="currentColor" />
    <path d="M65 50 C65 45 62 40 68 40 C75 40 70 50 65 50 Z" fill="currentColor" />
    <path d="M48 60 C55 65 65 65 70 60" fill="none" strokeWidth="6" strokeLinecap="round" />
  </RetroSvg>
);

// 3. Package / Produk
export const RetroBox = ({ className }: { className?: string }) => (
  <RetroSvg className={className}>
    <rect x="20" y="35" width="60" height="50" rx="4" fill="none" strokeWidth="8" strokeLinejoin="round" />
    <path d="M20 35 L10 20 C20 15 30 25 35 35 Z" fill="none" strokeWidth="8" strokeLinejoin="round" />
    <path d="M80 35 L90 20 C80 15 70 25 65 35 Z" fill="none" strokeWidth="8" strokeLinejoin="round" />
    <path d="M35 55 C35 48 30 45 40 45 C50 45 45 55 35 55 Z" fill="currentColor" />
    <path d="M65 55 C65 48 60 45 70 45 C80 45 75 55 65 55 Z" fill="currentColor" />
    <path d="M45 75 C48 85 52 85 55 75" fill="none" strokeWidth="6" strokeLinecap="round" />
  </RetroSvg>
);

// 4. Alert / Stok Rendah
export const RetroAlert = ({ className }: { className?: string }) => (
  <RetroSvg className={className}>
    <path d="M50 15 L15 80 L85 80 Z" fill="none" strokeWidth="8" strokeLinejoin="round" />
    <path d="M45 45 C45 40 43 35 48 35 C55 35 50 45 45 45 Z" fill="currentColor" />
    <path d="M55 45 C55 40 53 35 58 35 C65 35 60 45 55 45 Z" fill="currentColor" />
    <path d="M45 65 C45 55 55 55 55 65 C55 70 45 70 45 65 Z" fill="none" strokeWidth="6" />
    <path d="M25 40 Q20 30 15 45 Z" fill="currentColor" />
    <path d="M80 30 Q85 20 90 35 Z" fill="currentColor" />
  </RetroSvg>
);

// 5. History / Riwayat
export const RetroHistory = ({ className }: { className?: string }) => (
  <RetroSvg className={className}>
    <circle cx="50" cy="50" r="35" fill="none" strokeWidth="8" />
    <path d="M50 25 L50 50 L65 55" fill="none" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M25 15 C15 15 15 25 25 25 Z" fill="none" strokeWidth="8" />
    <path d="M75 15 C85 15 85 25 75 25 Z" fill="none" strokeWidth="8" />
    <line x1="15" y1="50" x2="5" y2="50" strokeWidth="8" strokeLinecap="round" />
    <line x1="85" y1="50" x2="95" y2="50" strokeWidth="8" strokeLinecap="round" />
    <line x1="30" y1="90" x2="25" y2="100" strokeWidth="8" strokeLinecap="round" />
    <line x1="70" y1="90" x2="75" y2="100" strokeWidth="8" strokeLinecap="round" />
  </RetroSvg>
);

// 6. Transactions / FileText
export const RetroReceipt = ({ className }: { className?: string }) => (
  <RetroSvg className={className}>
    <path d="M25 15 L75 15 L75 80 C75 85 70 90 65 85 C60 80 55 85 50 90 C45 85 40 80 35 85 C30 90 25 85 25 80 Z" fill="none" strokeWidth="8" strokeLinejoin="round" />
    <path d="M35 40 C35 35 32 30 40 30 C45 30 40 40 35 40 Z" fill="currentColor" />
    <path d="M60 40 C60 35 57 30 65 30 C70 30 65 40 60 40 Z" fill="currentColor" />
    <path d="M40 55 C45 65 55 65 60 55" fill="none" strokeWidth="6" strokeLinecap="round" />
    <line x1="40" y1="70" x2="60" y2="70" strokeWidth="6" strokeLinecap="round" />
  </RetroSvg>
);

// 7. Wallet / Piutang
export const RetroWallet = ({ className }: { className?: string }) => (
  <RetroSvg className={className}>
    <rect x="20" y="30" width="60" height="45" rx="5" fill="none" strokeWidth="8" strokeLinejoin="round" />
    <path d="M20 45 L80 45" strokeWidth="8" strokeLinecap="round" />
    <circle cx="70" cy="45" r="8" fill="none" strokeWidth="8" />
    <path d="M35 60 C32 60 30 55 35 55 C40 55 38 60 35 60 Z" fill="currentColor" />
    <path d="M50 60 C47 60 45 55 50 55 C55 55 53 60 50 60 Z" fill="currentColor" />
    <path d="M35 70 C40 75 45 75 50 70" fill="none" strokeWidth="6" strokeLinecap="round" />
  </RetroSvg>
);

// 8. Reports / Chart
export const RetroChart = ({ className }: { className?: string }) => (
  <RetroSvg className={className}>
    <line x1="15" y1="15" x2="15" y2="85" strokeWidth="8" strokeLinecap="round" />
    <line x1="15" y1="85" x2="85" y2="85" strokeWidth="8" strokeLinecap="round" />
    <rect x="25" y="55" width="15" height="30" fill="none" strokeWidth="8" strokeLinejoin="round" />
    <rect x="50" y="35" width="15" height="50" fill="none" strokeWidth="8" strokeLinejoin="round" />
    <rect x="75" y="15" width="15" height="70" fill="none" strokeWidth="8" strokeLinejoin="round" />
    <circle cx="32.5" cy="65" r="3" fill="currentColor" />
    <circle cx="57.5" cy="45" r="3" fill="currentColor" />
    <circle cx="82.5" cy="25" r="3" fill="currentColor" />
    <path d="M78 35 C82 40 86 40 86 35" fill="none" strokeWidth="4" strokeLinecap="round" />
  </RetroSvg>
);

// 9. AI Insight / Sparkles
export const RetroSparkle = ({ className }: { className?: string }) => (
  <RetroSvg className={className}>
    <path d="M50 5 Q55 40 90 50 Q55 60 50 95 Q45 60 10 50 Q45 40 50 5 Z" fill="none" strokeWidth="8" strokeLinejoin="round" />
    <path d="M45 45 C42 45 40 40 45 40 C50 40 48 45 45 45 Z" fill="currentColor" />
    <path d="M55 45 C52 45 50 40 55 40 C60 40 58 45 55 45 Z" fill="currentColor" />
    <path d="M45 55 C48 60 52 60 55 55" fill="none" strokeWidth="5" strokeLinecap="round" />
    <path d="M20 20 Q25 25 30 20 Q25 15 20 20 Z" fill="currentColor" />
    <path d="M75 80 Q80 85 85 80 Q80 75 75 80 Z" fill="currentColor" />
  </RetroSvg>
);

// 10. Users
export const RetroUsers = ({ className }: { className?: string }) => (
  <RetroSvg className={className}>
    <circle cx="50" cy="35" r="15" fill="none" strokeWidth="8" />
    <path d="M25 85 C25 65 40 55 50 55 C60 55 75 65 75 85" fill="none" strokeWidth="8" strokeLinecap="round" />
    <path d="M45 35 C42 35 40 30 46 30 C50 30 48 35 45 35 Z" fill="currentColor" />
    <path d="M55 35 C52 35 50 30 56 30 C60 30 58 35 55 35 Z" fill="currentColor" />
    <path d="M47 42 C49 45 51 45 53 42" fill="none" strokeWidth="4" strokeLinecap="round" />
    {/* Mini hat */}
    <path d="M35 25 L65 25 L55 10 L45 10 Z" fill="currentColor" />
  </RetroSvg>
);

// 11. Database
export const RetroDatabase = ({ className }: { className?: string }) => (
  <RetroSvg className={className}>
    <ellipse cx="50" cy="25" rx="30" ry="10" fill="none" strokeWidth="8" />
    <path d="M20 25 L20 75 C20 85 80 85 80 75 L80 25" fill="none" strokeWidth="8" />
    <path d="M20 50 C20 60 80 60 80 50" fill="none" strokeWidth="8" />
    <circle cx="50" cy="35" r="3" fill="currentColor" />
    <circle cx="50" cy="60" r="3" fill="currentColor" />
    <line x1="35" y1="40" x2="65" y2="40" strokeWidth="6" strokeLinecap="round" />
    <line x1="35" y1="65" x2="65" y2="65" strokeWidth="6" strokeLinecap="round" />
  </RetroSvg>
);

// 12. Settings
export const RetroSettings = ({ className }: { className?: string }) => (
  <RetroSvg className={className}>
    <circle cx="50" cy="50" r="20" fill="none" strokeWidth="8" />
    <path d="M45 50 C42 50 40 46 45 46 C50 46 48 50 45 50 Z" fill="currentColor" />
    <path d="M55 50 C52 50 50 46 55 46 C60 46 58 50 55 50 Z" fill="currentColor" />
    <path d="M47 55 C49 58 51 58 53 55" fill="none" strokeWidth="4" strokeLinecap="round" />
    <path d="M50 15 L50 25 M50 75 L50 85 M15 50 L25 50 M75 50 L85 50 M25 25 L32 32 M68 68 L75 75 M75 25 L68 32 M25 75 L32 68" strokeWidth="8" strokeLinecap="round" />
    <circle cx="50" cy="50" r="35" fill="none" strokeWidth="8" strokeDasharray="15 20" />
  </RetroSvg>
);

// 13. Refresh (RefreshCw)
export const RetroRefresh = ({ className }: { className?: string }) => (
  <RetroSvg className={className}>
    <path d="M25 50 C25 35 35 25 50 25 C60 25 68 30 72 38" fill="none" strokeWidth="8" strokeLinecap="round" />
    <polygon points="65,40 75,40 70,30" fill="currentColor" />
    <path d="M75 50 C75 65 65 75 50 75 C40 75 32 70 28 62" fill="none" strokeWidth="8" strokeLinecap="round" />
    <polygon points="35,60 25,60 30,70" fill="currentColor" />
    <circle cx="50" cy="50" r="6" fill="currentColor" />
    <path d="M35 50 C37 45 43 45 45 50" fill="none" strokeWidth="4" strokeLinecap="round" />
    <path d="M55 50 C57 45 63 45 65 50" fill="none" strokeWidth="4" strokeLinecap="round" />
  </RetroSvg>
);

// 14. Logout
export const RetroLogout = ({ className }: { className?: string }) => (
  <RetroSvg className={className}>
    <path d="M40 15 L20 15 L20 85 L40 85" fill="none" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M60 30 L80 50 L60 70" fill="none" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="30" y1="50" x2="80" y2="50" strokeWidth="8" strokeLinecap="round" />
    {/* Waving hand */}
    <path d="M80 50 C75 40 85 30 95 40 C95 50 85 60 80 50 Z" fill="currentColor" />
  </RetroSvg>
);

// 15. Money / Dollar
export const RetroMoney = ({ className }: { className?: string }) => (
  <RetroSvg className={className}>
    <path d="M50 15 L50 85" fill="none" strokeWidth="8" strokeLinecap="round" />
    <path d="M60 30 C50 20 30 25 35 40 C40 55 60 45 65 60 C70 75 50 80 40 70" fill="none" strokeWidth="8" strokeLinecap="round" />
    {/* Eyes inside the S */}
    <circle cx="45" cy="35" r="4" fill="currentColor" />
    <circle cx="55" cy="55" r="4" fill="currentColor" />
  </RetroSvg>
);

// 16. Bag / Belanja
export const RetroBag = ({ className }: { className?: string }) => (
  <RetroSvg className={className}>
    <path d="M35 30 C35 15 65 15 65 30" fill="none" strokeWidth="8" strokeLinecap="round" />
    <rect x="20" y="30" width="60" height="50" rx="5" fill="none" strokeWidth="8" strokeLinejoin="round" />
    <path d="M35 50 C33 50 30 45 35 45 C40 45 38 50 35 50 Z" fill="currentColor" />
    <path d="M65 50 C63 50 60 45 65 45 C70 45 68 50 65 50 Z" fill="currentColor" />
    <path d="M45 65 C48 70 52 70 55 65" fill="none" strokeWidth="6" strokeLinecap="round" />
  </RetroSvg>
);

// 17. Trash / Hapus
export const RetroTrash = ({ className }: { className?: string }) => (
  <RetroSvg className={className}>
    <path d="M20 25 L80 25" fill="none" strokeWidth="8" strokeLinecap="round" />
    <path d="M40 25 L40 15 L60 15 L60 25" fill="none" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M25 25 L35 85 C35 90 65 90 65 85 L75 25" fill="none" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M45 45 C43 45 40 40 45 40 C50 40 48 45 45 45 Z" fill="currentColor" />
    <path d="M55 45 C53 45 50 40 55 40 C60 40 58 45 55 45 Z" fill="currentColor" />
    <line x1="40" y1="60" x2="45" y2="75" strokeWidth="6" strokeLinecap="round" />
    <line x1="60" y1="60" x2="55" y2="75" strokeWidth="6" strokeLinecap="round" />
  </RetroSvg>
);

// 18. Printer
export const RetroPrinter = ({ className }: { className?: string }) => (
  <RetroSvg className={className}>
    <rect x="30" y="15" width="40" height="25" fill="none" strokeWidth="8" strokeLinejoin="round" />
    <rect x="20" y="40" width="60" height="25" rx="5" fill="none" strokeWidth="8" strokeLinejoin="round" />
    <path d="M35 65 L65 65 L60 85 L40 85 Z" fill="none" strokeWidth="8" strokeLinejoin="round" />
    <path d="M30 52 C30 50 32 50 35 50 C38 50 40 50 40 52 C40 55 30 55 30 52 Z" fill="currentColor" />
    <path d="M60 52 C60 50 62 50 65 50 C68 50 70 50 70 52 C70 55 60 55 60 52 Z" fill="currentColor" />
  </RetroSvg>
);
