import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

// GS Chairs lockup for the iOS home-screen icon: bone on espresso. "GS" leads and
// "CHAIRS" sits under it as the subordinate line. Both stay well inside the edges,
// since iOS masks this to a rounded square and clips the corners.
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', lineHeight: 1, gap: 8,
          background: '#2b2622', color: '#f7f4ef', fontWeight: 700,
        }}
      >
        {/* paddingLeft on each line offsets the trailing letter-space so the text optically centers */}
        <div style={{ fontSize: 74, letterSpacing: 4, paddingLeft: 4 }}>GS</div>
        <div style={{ fontSize: 22, letterSpacing: 7, paddingLeft: 7, color: '#c3b8a6' }}>CHAIRS</div>
      </div>
    ),
    { ...size },
  );
}
