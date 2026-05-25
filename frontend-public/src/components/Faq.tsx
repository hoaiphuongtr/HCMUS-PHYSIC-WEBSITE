import { JsonLd, faqPageSchema } from "@/components/JsonLd";

type FaqItem = {
  question: string;
  answer: string;
};

export function Faq({
  items,
  heading,
}: {
  items: FaqItem[];
  heading?: string;
}) {
  if (!items.length) return null;
  return (
    <section className="py-12">
      <JsonLd schema={faqPageSchema(items)} />
      {heading ? (
        <h2 className="text-2xl md:text-3xl font-bold mb-6 text-slate-900">
          {heading}
        </h2>
      ) : null}
      <div className="divide-y divide-slate-200 border-y border-slate-200">
        {items.map((item, idx) => (
          <details
            key={`faq-${idx}`}
            className="group py-4"
          >
            <summary className="flex justify-between items-center cursor-pointer text-base font-semibold text-slate-900 hover:text-blue-700">
              <span>{item.question}</span>
              <span className="text-blue-700 group-open:rotate-45 transition-transform text-2xl leading-none">
                +
              </span>
            </summary>
            <p className="mt-3 text-slate-700 leading-relaxed">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
