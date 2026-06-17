import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'HW — Handcrafted American solid-wood furniture';

// Default social share card: HW wordmark on a warm bone background.
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', background: '#f7f4ef', color: '#2b2622',
        }}
      >
        <div style={{ fontSize: 240, fontWeight: 700, letterSpacing: 24 }}>HW</div>
        <div style={{ fontSize: 34, letterSpacing: 10, color: '#6b4f3a', textTransform: 'uppercase' }}>
          Handcrafted Solid-Wood Furniture
        </div>
      </div>
    ),
    { ...size },
  );
}
