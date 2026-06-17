import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

// HW wordmark for the iOS home-screen icon: bone monogram on espresso.
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#2b2622', color: '#f7f4ef', fontSize: 92, fontWeight: 700, letterSpacing: 4,
        }}
      >
        HW
      </div>
    ),
    { ...size },
  );
}
