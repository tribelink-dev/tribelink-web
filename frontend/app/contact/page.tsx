import type { Metadata } from 'next';
import { getBaseUrl, getDefaultOgImage } from '@/lib/seo';
import SeoContentPage from '@/components/seo/SeoContentPage';

export const metadata: Metadata = {
  title: 'Contact Triberoutes',
  description:
    'Contact Triberoutes for help with Kerala homestay bookings, cultural experiences, hosting, or general inquiries. info@triberoutes.com',
  alternates: { canonical: `${getBaseUrl()}/contact` },
  openGraph: {
    title: 'Contact Triberoutes',
    url: `${getBaseUrl()}/contact`,
    images: [{ url: getDefaultOgImage(), width: 1200, height: 630 }],
  },
};

export default function ContactPage() {
  return (
    <SeoContentPage
      title="Contact Us"
      description="We're here to help with bookings, hosting questions, and anything about Kerala cultural travel."
    >
      <section>
        <h2 className="text-xl font-semibold text-text-primary">Email</h2>
        <p>
          <a href="mailto:info@triberoutes.com" className="text-brand font-medium hover:underline">
            info@triberoutes.com
          </a>
        </p>
      </section>
      <section>
        <h2 className="text-xl font-semibold text-text-primary">Location</h2>
        <p>Kerala, India</p>
      </section>
      <section>
        <h2 className="text-xl font-semibold text-text-primary">Help topics</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Booking a Kerala homestay or cultural experience</li>
          <li>Becoming a host on Triberoutes</li>
          <li>Traveler safety and support</li>
          <li>Partnerships and press inquiries</li>
        </ul>
      </section>
      <section>
        <h2 className="text-xl font-semibold text-text-primary">Privacy &amp; Terms</h2>
        <p>
          For privacy policy and terms of service inquiries, please email{' '}
          <a href="mailto:info@triberoutes.com" className="text-brand hover:underline">
            info@triberoutes.com
          </a>
          . Full legal pages are coming soon.
        </p>
      </section>
    </SeoContentPage>
  );
}
