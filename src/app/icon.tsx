import { ImageResponse } from 'next/og';

export const size = { width: 64, height: 64 };
export const contentType = 'image/png';

// HW wordmark favicon: bone monogram on espresso.
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#2b2622', color: '#f7f4ef', fontSize: 30, fontWeight: 700, letterSpacing: 1,
        }}
      >
        HW
      </div>
    ),
    { ...size },
  );
}
