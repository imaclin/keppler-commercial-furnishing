import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'GS Chairs: handcrafted American solid-wood furniture';

// Default social share card: GS Chairs wordmark on a warm bone background. The
// wordmark is kept well inside the frame because social platforms crop the edges,
// and it stays wider than the tagline so the hierarchy reads correctly.
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 30,
          background: '#f7f4ef', color: '#2b2622',
        }}
      >
        {/* paddingLeft on each line offsets the trailing letter-space so the text optically centers */}
        <div style={{ fontSize: 118, fontWeight: 700, letterSpacing: 22, paddingLeft: 22, lineHeight: 1 }}>
          GS CHAIRS
        </div>
        <div style={{ fontSize: 22, letterSpacing: 7, paddingLeft: 7, color: '#6b4f3a', textTransform: 'uppercase' }}>
          Handcrafted Solid-Wood Furniture
        </div>
      </div>
    ),
    { ...size },
  );
}
