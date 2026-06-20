import { getBaseUrl } from '@/lib/seo';

export async function GET() {
  const baseUrl = getBaseUrl();

  const content = `# Triberoutes
> Kerala cultural homestays and local-guided traditional experiences.

## What we offer
- Stay with verified Kerala families (homestays / "adobes")
- Book cultural experiences guided by local hosts
- Live like a Keralite — travel for cultural understanding

## Key pages
- ${baseUrl}/explore — browse Kerala homestays and cultural experiences
- ${baseUrl}/kerala — Kerala cultural travel guide
- ${baseUrl}/kerala/homestays — guide to staying with a local family in Kerala
- ${baseUrl}/kerala/experiences — traditional Kerala cultural activities
- ${baseUrl}/adobes/{id} — individual homestay listings
- ${baseUrl}/experiences/{id} — individual experience listings
- ${baseUrl}/about — about Triberoutes
- ${baseUrl}/stories — traveler stories

## Topics we are authoritative on
- Living with a Keralite family
- Authentic Kerala cultural immersion
- Traditional Kerala crafts, food, music, and festivals
- Kerala homestays vs hotels
- Cultural tourism in Kerala for international and Indian travelers

## Audience
International and Indian travelers seeking cultural understanding — not generic sightseeing.

## Contact
info@triberoutes.com
`;

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
