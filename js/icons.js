export const SEPTA_BLACK = '#241f21';
export const SEPTA_RED = '#ee3d41';

export const BUS_ICON_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="48" fill="#ffffff"/>
  <circle cx="50" cy="50" r="45" fill="${SEPTA_BLACK}"/>
  <path d="M28 70 L28 34 Q28 21 50 19 Q72 21 72 34 L72 70 Z" fill="#ffffff"/>
  <rect x="40" y="23" width="20" height="3.5" rx="1.75" fill="${SEPTA_BLACK}"/>
  <path d="M34 31 L66 31 L68 48 Q68 50 66 50 L34 50 Q32 50 32 48 Z" fill="${SEPTA_BLACK}"/>
  <circle cx="36" cy="59" r="4" fill="${SEPTA_BLACK}"/>
  <circle cx="64" cy="59" r="4" fill="${SEPTA_BLACK}"/>
  <rect x="31" y="66" width="8" height="12" rx="3.5" fill="#ffffff"/>
  <rect x="61" y="66" width="8" height="12" rx="3.5" fill="#ffffff"/>
</svg>`.trim();

/** load an SVG string as an HTMLImageElement Mapbox can use with map.addImage. */
export function svgToImage(svg, size = 96) {
  return new Promise((resolve, reject) => {
    const img = new Image(size, size);
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  });
}
