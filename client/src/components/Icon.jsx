const PATHS = {
  arrowRight: <path d="M5 12h14M13 6l6 6-6 6" />,
  arrowLeft: <path d="M19 12H5M11 18l-6-6 6-6" />,
  check: <path d="M20 6 9 17l-5-5" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  x: <path d="M18 6 6 18M6 6l12 12" />,
  chevronLeft: <path d="m15 18-6-6 6-6" />,
  chevronRight: <path d="m9 18 6-6-6-6" />,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  calendar: (
    <>
      <rect x="3" y="4.5" width="18" height="17" rx="2.5" />
      <path d="M16 2.5v4M8 2.5v4M3 10h18" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  mapPin: (
    <>
      <path d="M12 21.5s7-6.1 7-11.7a7 7 0 1 0-14 0c0 5.6 7 11.7 7 11.7z" />
      <circle cx="12" cy="9.8" r="2.5" />
    </>
  ),
  phone: (
    <path d="M21.5 16.4v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 1.6 3.7 2 2 0 0 1 3.6 1.5h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L7.6 9.3a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.8 2.1z" />
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="m3.5 7 8.5 6 8.5-6" />
    </>
  ),
  droplet: <path d="M12 2.8s6.5 6.9 6.5 12a6.5 6.5 0 0 1-13 0c0-5.1 6.5-12 6.5-12z" />,
  sparkle: <path d="M12 3.5 13.9 9 19.5 11 13.9 13 12 18.5 10.1 13 4.5 11 10.1 9z" />,
  home: (
    <>
      <path d="M3.5 11 12 4l8.5 7" />
      <path d="M5.5 9.5V20h13V9.5" />
      <path d="M10 20v-5.5h4V20" />
    </>
  ),
  driveway: <path d="M9 3 5 21M15 3l4 18M12 4v2.5M12 10.5v3M12 17.5v3" />,
  patio: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="2" />
      <path d="M3.5 9.2h17M3.5 14.8h17M9.2 3.5v5.7M14.8 9.2v5.6M9.2 14.8v5.7" />
    </>
  ),
  deck: <path d="M3 8.5h18M3 12.5h18M3 16.5h18M6 8.5V20M18 8.5V20M8 4.5h8" />,
  fence: (
    <path d="M5.5 21V7.5l2-3 2 3V21M14.5 21V7.5l2-3 2 3V21M3 10.5h18M3 16.5h18" />
  ),
  bin: (
    <>
      <path d="M4 7h16M9.5 7V4.5h5V7" />
      <path d="M6 7l1.1 13.5h9.8L18 7" />
      <path d="M10 11v6M14 11v6" />
    </>
  ),
  chair: <path d="M7 3.5v8M17 3.5v8M6 11.5h12l-1 3.5H7zM8 15v6M16 15v6" />,
  garage: (
    <>
      <path d="M3 20.5V9l9-5 9 5v11.5" />
      <path d="M7 20.5v-8h10v8M7 15.5h10" />
    </>
  ),
  leaf: (
    <>
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10Z" />
      <path d="M2 21c0-3 1.9-5.4 5.1-6" />
    </>
  ),
  shield: (
    <>
      <path d="M12 21.5s8-3.8 8-9.8V5.5l-8-3-8 3v6.2c0 6 8 9.8 8 9.8z" />
      <path d="m8.8 11.8 2.2 2.2 4.3-4.3" />
    </>
  ),
  tag: (
    <>
      <path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z" />
      <circle cx="7.5" cy="7.5" r="1.4" />
    </>
  ),
  star: <path d="m12 2.5 2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5-4.8-4.6 6.6-.9z" />,
  users: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M16 14.1a5 5 0 0 1 5.5 4.9" />
    </>
  ),
  wand: (
    <>
      <path d="M3 21l7-7M10 14l2.5-.8L19 6.7 17.3 5l-6.5 6.5z" />
      <path d="M17.5 2.5v1.5M21.5 6.5H20M20.3 3.7l-1 1" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5M12 7.8h.01" />
    </>
  ),
  alert: (
    <>
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
      <path d="M12 9v4.5M12 17.3h.01" />
    </>
  ),
  refresh: (
    <>
      <path d="M20.5 12a8.5 8.5 0 1 1-2.5-6l2.5 2.5" />
      <path d="M20.5 3.5v5h-5" />
    </>
  ),
  logout: <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />,
  external: <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />,
  trash: <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </>
  ),
  lock: (
    <>
      <rect x="4.5" y="10.5" width="15" height="11" rx="2.5" />
      <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
    </>
  ),
};

export function Icon({ name, size = 20, className = '', strokeWidth = 1.9, ...rest }) {
  return (
    <svg
      className={`icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {PATHS[name] ?? PATHS.sparkle}
    </svg>
  );
}
