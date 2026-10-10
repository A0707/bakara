import React from 'react';
const paths = {
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="2" />
      <rect x="14" y="3" width="7" height="7" rx="2" />
      <rect x="3" y="14" width="7" height="7" rx="2" />
      <rect x="14" y="14" width="7" height="7" rx="2" />
    </>
  ),
  down: (
    <>
      <path d="M7 7l10 10M7 17h10V7" />
      <path d="M4 21h16" />
    </>
  ),
  up: (
    <>
      <path d="M7 17L17 7M7 7h10v10" />
      <path d="M4 21h16" />
    </>
  ),
  building: (
    <>
      <path d="M4 21V5a2 2 0 012-2h9a2 2 0 012 2v16M2 21h20M17 10h3v11M8 7h1m3 0h1M8 11h1m3 0h1M8 15h1m3 0h1M9 21v-3h4v3" />
    </>
  ),
  wallet: (
    <>
      <rect x="3" y="5" width="18" height="15" rx="3" />
      <path d="M17 11h4v5h-4a2.5 2.5 0 010-5ZM3 8h16M6 5V3h12" />
    </>
  ),
  arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
  logout: (
    <>
      <path d="M9 4H4v16h5M13 8l4 4-4 4m-5-4h13" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  download: (
    <>
      <path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  shield: (
    <>
      <path d="M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6l-8-3Z" />
      <path d="m8 12 3 3 5-6" />
    </>
  ),
  chevron: <path d="m9 6 6 6-6 6" />,
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 11h18" />
    </>
  ),
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  close: <path d="m6 6 12 12M6 18 18 6" />,
  eye: (
    <>
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
};
export default function Icon({ name, size = 20, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {paths[name] || paths.grid}
    </svg>
  );
}
