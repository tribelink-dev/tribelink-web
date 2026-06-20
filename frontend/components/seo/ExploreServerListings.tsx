import Link from 'next/link';
import type { ListingAbode, ListingExperience } from '@/lib/fetchListings';

interface ExploreServerListingsProps {
  abodes: ListingAbode[];
  experiences: ListingExperience[];
}

function formatLocation(item: {
  location?: { district?: string; state?: string };
}): string {
  return [item.location?.district, item.location?.state || 'Kerala']
    .filter(Boolean)
    .join(', ');
}

export default function ExploreServerListings({
  abodes,
  experiences,
}: ExploreServerListingsProps) {
  if (abodes.length === 0 && experiences.length === 0) {
    return null;
  }

  return (
    <section className="sr-only" aria-label="Kerala homestays and cultural experiences">
      <h1>Kerala Homestays &amp; Cultural Experiences</h1>
      <p>
        Live with a Keralite family. Book verified Kerala homestays and traditional cultural
        experiences curated and guided by local hosts on Triberoutes.
      </p>

      {abodes.length > 0 && (
        <div>
          <h2>Kerala Homestays</h2>
          <ul>
            {abodes.map((abode) => (
              <li key={abode._id}>
                <Link href={`/adobes/${abode._id}`}>
                  <h3>{abode.abodeDetails?.title || 'Kerala Homestay'}</h3>
                </Link>
                <p>{formatLocation(abode)}</p>
                {abode.abodeDetails?.description && (
                  <p>{abode.abodeDetails.description.slice(0, 200)}</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {experiences.length > 0 && (
        <div>
          <h2>Kerala Cultural Experiences</h2>
          <ul>
            {experiences.map((exp) => (
              <li key={exp._id}>
                <Link href={`/experiences/${exp._id}`}>
                  <h3>{exp.title || 'Kerala Cultural Experience'}</h3>
                </Link>
                <p>{formatLocation(exp)}</p>
                {exp.description && <p>{exp.description.slice(0, 200)}</p>}
                {exp.provider?.name && <p>Hosted by {exp.provider.name}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
