import { ImageResponse } from 'next/og';

export const size = { width: 64, height: 64 };
export const contentType = 'image/png';

// GS monogram favicon: bone on espresso. The full "GS CHAIRS" wordmark does not
// survive here, since browsers render this at 16px where a second line of type
// is about two pixels tall. The apple-icon and OG card carry the full lockup.
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#2b2622', color: '#f7f4ef', fontSize: 34, fontWeight: 700,
          letterSpacing: 2, paddingLeft: 2, // paddingLeft offsets the trailing letter-space
        }}
      >
        GS
      </div>
    ),
    { ...size },
  );
}
