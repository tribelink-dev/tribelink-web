import { KERALA_FAQ_ITEMS } from '@/lib/seo';

export default function KeralaFAQ() {
  return (
    <section
      className="w-full px-page lg:px-page-lg py-16 border-t border-border bg-surface"
      aria-labelledby="kerala-faq-heading"
    >
      <div className="max-w-3xl mx-auto">
        <h2 id="kerala-faq-heading" className="text-2xl font-semibold text-text-primary mb-2">
          Kerala Homestays & Cultural Travel FAQ
        </h2>
        <p className="text-sm text-text-secondary mb-8">
          Common questions about living with a Keralite family and booking cultural experiences on Triberoutes.
        </p>
        <dl className="space-y-6">
          {KERALA_FAQ_ITEMS.map((item) => (
            <div key={item.question}>
              <dt className="text-base font-semibold text-text-primary mb-2">{item.question}</dt>
              <dd className="text-sm text-text-secondary leading-relaxed">{item.answer}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
