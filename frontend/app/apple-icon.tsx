import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#FEFDFB',
        }}
      >
        <div
          style={{
            width: 140,
            height: 140,
            borderRadius: 28,
            background: 'linear-gradient(135deg, #fef3c7 0%, #fbbf24 100%)',
            border: '4px solid #78350f',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
          }}
        >
          <div style={{ fontSize: 48, fontWeight: 800, color: '#78350f', lineHeight: 1 }}>TR</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#92400e', marginTop: 4 }}>Routes</div>
        </div>
      </div>
    ),
    { ...size }
  );
}
