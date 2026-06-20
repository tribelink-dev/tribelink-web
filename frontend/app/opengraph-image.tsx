import { ImageResponse } from 'next/og';

export const alt = 'Triberoutes - Kerala Homestays & Cultural Experiences';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #FEFDFB 0%, #fef3c7 50%, #fde68a 100%)',
          padding: 60,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 100,
            height: 100,
            borderRadius: '50%',
            background: '#fef3c7',
            border: '4px solid #78350f',
            marginBottom: 32,
            fontSize: 36,
            fontWeight: 800,
            color: '#78350f',
          }}
        >
          TR
        </div>
        <div
          style={{
            fontSize: 64,
            fontWeight: 800,
            color: '#78350f',
            textAlign: 'center',
            lineHeight: 1.1,
            marginBottom: 20,
          }}
        >
          Triberoutes
        </div>
        <div
          style={{
            fontSize: 32,
            fontWeight: 500,
            color: '#92400e',
            textAlign: 'center',
            maxWidth: 900,
            lineHeight: 1.4,
          }}
        >
          Live with a Keralite family. Cultural experiences guided by local hosts.
        </div>
      </div>
    ),
    { ...size }
  );
}
