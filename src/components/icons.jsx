// Nav icons — solid, high-contrast marks in the CARTA masthead spirit.
// Each renders a 24-grid <svg> with fill="currentColor" so the nav controls
// its colour. Inner cut-outs use fillRule="evenodd".

export function DigestsIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      {/* riffled booklet: a tilted cover with a page-window, three fanning leaves */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M4.5 9 16.5 4l2.5 8.5L7 16 4.5 9Zm2.1.6 8.8-3.6 1.6 5.2-8.6 2.2-1.8-3.8Z"
      />
      <path d="M7.8 15.6 20.5 13.4l.5 1.8L8.2 17.4l-.4-1.8Z" />
      <path d="M7.5 16.6 20.6 16l.4 2L7.9 18.4l-.4-1.8Z" />
      <path d="M7.3 17.5 19.6 19.3l.2 2.1L7.7 19.3l-.4-1.8Z" />
    </svg>
  );
}

export function IntakeIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      {/* down arrow into a tray */}
      <path d="M12 2.75a1 1 0 0 1 1 1V7.5h1.9a1 1 0 0 1 .74 1.67l-2.9 3.2a1 1 0 0 1-1.48 0l-2.9-3.2A1 1 0 0 1 9.1 7.5H11V3.75a1 1 0 0 1 1-1Z" />
      <path d="M3 13.3h5.05a1 1 0 0 1 .92.6l.86 2.02a1 1 0 0 0 .92.6h4.5a1 1 0 0 0 .92-.6l.86-2.02a1 1 0 0 1 .92-.6H21v5.2A1.5 1.5 0 0 1 19.5 20h-15A1.5 1.5 0 0 1 3 18.5v-5.2Z" />
    </svg>
  );
}

export function DesignIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      {/* slab-serif A — a type specimen */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10.4 3.5h3.2L18.1 17H21v3.5h-6.7v-3.2H16l-.95-3H8.95l-.95 3H9.7v3.2H3V17h2.9L10.4 3.5Zm1.6 4.7 1.6 5h-3.2l1.6-5Z"
      />
    </svg>
  );
}
