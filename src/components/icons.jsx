// Nav icons — line-art marks authored in /icons/*.svg, ported here so stroke
// and fill follow `currentColor` (the nav sets the colour, incl. white when a
// tab is selected). Geometry is 1:1 with the source files on a 32 grid.

const STROKE = 1.6; // source files are drawn at 1; nudged up for 20px display

export function DigestsIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth={STROKE} strokeMiterlimit={10} aria-hidden="true">
      <path fill="currentColor" stroke="none" d="M24.52,4.31v22.11H7.48V5.03l17.04-.72h0ZM25.52,3.26l-19.04.81v23.35h19.04V3.26h0Z" />
      <polyline points="7.87 28.73 27.32 29.23 26.91 5.3" />
      <line x1="13.14" y1="8.8" x2="22.04" y2="8.8" />
      <line x1="13.14" y1="10.8" x2="19.03" y2="10.8" />
      <polyline points="6.59 7.75 11.45 7.75 11.45 23.49 6.59 23.49" />
    </svg>
  );
}

export function IntakeIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth={STROKE} strokeMiterlimit={10} aria-hidden="true">
      <line x1="8.63" y1="10.07" x2="22.46" y2="8.8" />
      <line x1="9.06" y1="14.27" x2="22.94" y2="14.86" />
      <line x1="9.19" y1="20.74" x2="22.81" y2="18.02" />
      <line x1="9.06" y1="23.43" x2="22.94" y2="23.43" />
      <polyline points="6.48 16.14 6.48 26.87 25.52 26.87 25.52 16.05" />
    </svg>
  );
}

export function DesignIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth={STROKE} strokeMiterlimit={10} aria-hidden="true">
      <line x1="5.54" y1="22.43" x2="25.52" y2="17.02" />
      <polyline points="7.79 26.87 16 5.32 24.21 26.87" />
    </svg>
  );
}
