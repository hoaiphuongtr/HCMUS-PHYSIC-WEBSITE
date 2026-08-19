import { getBaseUrl, SITE_NAME_VI } from "@/lib/seo";

type Schema = Record<string, unknown>;

export function JsonLd({ schema }: { schema: Schema | Schema[] }) {
  const items = Array.isArray(schema) ? schema : [schema];
  return (
    <>
      {items.map((item) => {
        const json = JSON.stringify(item);
        return (
          <script
            key={json}
            type="application/ld+json"
            // biome-ignore lint/security/noDangerouslySetInnerHtml: server-rendered JSON-LD string
            dangerouslySetInnerHTML={{ __html: json }}
          />
        );
      })}
    </>
  );
}

export const organizationSchema = (): Schema => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME_VI,
  url: getBaseUrl(),
  logo: `${getBaseUrl()}/Logo_Phys-blue.png`,
});

export const websiteSchema = (): Schema => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME_VI,
  url: getBaseUrl(),
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${getBaseUrl()}/tin-tuc?search={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
  inLanguage: "vi-VN",
});

export const articleSchema = (args: {
  title: string;
  description: string;
  url: string;
  image: string;
  publishedAt: string;
  modifiedAt?: string;
  author?: string;
}): Schema => ({
  "@context": "https://schema.org",
  "@type": "Article",
  headline: args.title,
  description: args.description,
  url: args.url,
  image: args.image,
  datePublished: args.publishedAt,
  dateModified: args.modifiedAt ?? args.publishedAt,
  author: {
    "@type": "Person",
    name: args.author ?? SITE_NAME_VI,
  },
  publisher: {
    "@type": "Organization",
    name: SITE_NAME_VI,
    logo: {
      "@type": "ImageObject",
      url: `${getBaseUrl()}/Logo_Phys-blue.png`,
    },
  },
});

export const newsArticleSchema = (args: {
  title: string;
  description: string;
  url: string;
  image: string;
  publishedAt: string;
  modifiedAt?: string;
  author?: string;
}): Schema => ({
  ...articleSchema(args),
  "@type": "NewsArticle",
});

export const personSchema = (args: {
  name: string;
  url: string;
  jobTitle?: string;
  image?: string;
}): Schema => ({
  "@context": "https://schema.org",
  "@type": "Person",
  name: args.name,
  url: args.url,
  ...(args.jobTitle ? { jobTitle: args.jobTitle } : {}),
  ...(args.image ? { image: args.image } : {}),
  worksFor: {
    "@type": "EducationalOrganization",
    name: SITE_NAME_VI,
    url: getBaseUrl(),
  },
});

export const educationalOrganizationSchema = (): Schema => ({
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  name: SITE_NAME_VI,
  url: getBaseUrl(),
  logo: `${getBaseUrl()}/Logo_Phys-blue.png`,
});

export const faqPageSchema = (
  items: { question: string; answer: string }[],
): Schema => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: items.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
});

export const breadcrumbListSchema = (
  items: { name: string; url: string }[],
): Schema => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, idx) => ({
    "@type": "ListItem",
    position: idx + 1,
    name: item.name,
    item: item.url,
  })),
});

export const courseSchema = (args: {
  name: string;
  description: string;
  url: string;
}): Schema => ({
  "@context": "https://schema.org",
  "@type": "Course",
  name: args.name,
  description: args.description,
  url: args.url,
  provider: {
    "@type": "EducationalOrganization",
    name: SITE_NAME_VI,
    url: getBaseUrl(),
  },
});
