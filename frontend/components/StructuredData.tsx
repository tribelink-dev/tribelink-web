import { generateOrganizationSchema, generateWebsiteSchema } from '@/lib/seo';

/**
 * Server component to inject structured data
 * Next.js automatically moves script tags with type="application/ld+json" to the head
 */
export default function StructuredData() {
  const organizationSchema = generateOrganizationSchema();
  const websiteSchema = generateWebsiteSchema();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteSchema),
        }}
      />
    </>
  );
}

