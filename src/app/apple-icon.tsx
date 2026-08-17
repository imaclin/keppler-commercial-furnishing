import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

// Keppler lockup for the iOS home-screen icon: bone on espresso. "KEPPLER"
// leads and "COMMERCIAL FURNISHING" sits under it as the subordinate line. Both
// stay well inside the edges, since iOS masks this to a rounded square and
// clips the corners.
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', lineHeight: 1, gap: 10,
          background: '#2b2622', color: '#f7f4ef', fontWeight: 700,
        }}
      >
        {/* paddingLeft on each line offsets the trailing letter-space so the text optically centers */}
        <div style={{ fontSize: 34, letterSpacing: 3, paddingLeft: 3 }}>KEPPLER</div>
        <div style={{ fontSize: 11, letterSpacing: 2, paddingLeft: 2, color: '#c3b8a6' }}>COMMERCIAL FURNISHING</div>
      </div>
    ),
    { ...size },
  );
}
