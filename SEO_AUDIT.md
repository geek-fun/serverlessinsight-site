# SEO and AI-search discovery review

Reviewed on 2026-10-27. Scope: the bilingual marketing/documentation source, generated static HTML, public production HTTP responses, and current first-party search guidance. GEO here means discoverability and accurate citation in generative search answers. Search Console, Bing Webmaster Tools, analytics, and production field-performance data were not available in this review; this is not a traffic, ranking, or citation-growth measurement.

## Findings and changes

| Priority | Finding | Action in this change |
| --- | --- | --- |
| P1 | Home titles repeated the product name and tagline; documentation inherited the long site tagline. | Keep the approved homepage title and use one concise brand suffix on other pages. |
| P1 | Locale-level description tags suppressed page-specific descriptions in generated HTML. Documentation, pricing, and legal pages shared generic summaries. | Remove the global override and render the authored description for each of the 26 public pages. Search, Open Graph, and Twitter summaries agree. |
| P1 | Pages had no structured identity or document hierarchy. | Add home Organization/WebSite/open-source project identity, page identity, and breadcrumb JSON-LD. All facts come from existing public product content. No invented offers, reviews, ratings, or customer results. |
| P2 | HTML language alternates omitted translated legal pages, although the existing sitemap already paired them. | Include reciprocal English, Chinese, and default alternates for all 13 translated page pairs. Existing canonical `.html` URLs remain stable. |
| P2 | The contributor helper appeared in the sitemap; the explicit 404 page was missing noindex. | Keep utility/error/legacy-helper pages crawlable for noindex processing, exclude them from the sitemap, and omit their canonical/entity claims. Honor authored indexing and snippet restrictions. |
| P2 | Pricing descriptions embedded mutable plan prices and allowances. | Describe plans, AMR, and billing intent without hard-coded numbers in metadata. The visible pricing page retains its existing data source and calculations. |
| P2 | The documentation hub opened with a generic welcome sentence. | Add a concise product definition, real configuration/CLI terminology, and direct setup/reference links in both languages. |
| P2 | FAQ and application-example links pointed to nonexistent generated heading IDs. | Correct the jump links and validate every link/fragment on all indexable pages in CI. |
| P2 | Global keyword lists repeated broad product phrases across every page. | Remove that boilerplate and use specific page titles, summaries, and visible content instead. |

The generated site has 26 indexable canonical URLs. Tests verify their descriptions, language, title/social parity, canonical/alternate targets, JSON-LD, sitemap coverage, and internal links including fragments. Error/contributor/legacy helper pages are tested separately. JSON-LD serialization escapes script-breaking characters. This is automated syntax/content-parity validation, not a Google rich-result approval.

## Public production observations

These checks describe the deployed site before this SEO change is released, not the local build's rollout status.

- The public robots file and XML sitemap returned HTTP 200. Robots already permits general crawling; changing it is not the primary discovery problem found here.
- The English documentation URL returned HTTP 200 and the generic locale description, confirming the description problem also exists in production.
- The tested apex-host English homepage returned HTTP 200 without redirecting to the preferred `www` host. Existing canonical links point to `www`. Consider a permanent host redirect at the hosting/edge layer after checking all route/query behavior; no hosting configuration was changed here.
- A deliberately nonexistent English URL returned HTTP 404, which is appropriate. Its raw response contained the Chinese homepage fallback rather than a useful error document. Improve that fallback separately for users; do not replace the correct 404 status with a homepage redirect.
- A built-file link crawl checked 1,425 internal link occurrences, including same-page fragments. After correcting FAQ/example anchors, the remaining four broken occurrences were language-switch links on two unpaired, non-indexable helper pages. Both layers are fixed now: the build strips locale-picker anchors to a nonexistent translated counterpart from the served HTML, and the layout hides the picker (`data-si-translations="off"`, covering client-only routes such as the 404 view). A regression test walks every built page for missing routes and fragments. If such a helper is ever promoted to translated content, register it in `LOCALIZED_PAGES` and the picker returns automatically.

## Content work with the highest remaining value

### 1. Replace unverified proof with evidence

The existing case-study pages describe numeric outcomes such as 60% infrastructure savings, 99.99% availability, and sub-50ms latency without a linked measurement method, workload, date, or customer source. This review cannot verify those results. The page metadata now describes application examples rather than asserting measured customer success; the underlying case-study body remains unchanged pending an editorial evidence review.

For each example, choose a defensible form:

- A reproducible tutorial: published version, provider/region, prerequisites, configuration, commands, expected results, limitations, and links to the relevant reference.
- A measured case study: attributable source or anonymization rationale, architecture, workload, baseline, measurement window, methodology, and observed outcomes.

If a number cannot be substantiated, remove it and describe the scenario without claiming a measured benefit. Avoid adding those numbers to structured data or promotional snippets.

### 2. Build crawlable provider and task guides

The provider selector is useful for readers, but its state is not a separate, shareable provider guide URL. The reference contains provider-specific content in server-rendered HTML, while the default visible state shows one provider. Distinct, useful guides would create clearer entry points for specific tasks instead of asking one long reference to answer every query.

Candidate intents below are hypotheses, not measured search-volume estimates:

| Intent | Existing destination | Next useful content |
| --- | --- | --- |
| What is ServerlessInsight / serverless IaC? | Introduction and homepage | Concise definition, CLI/platform distinction, deployment ownership, and honest limitations. |
| Deploy an Alibaba Cloud function using YAML | Getting started and reference | Reproducible function + HTTP entry tutorial with prerequisites and cleanup. |
| Manage Tencent Cloud serverless resources with IaC | Provider sections in reference | Dedicated SCF/COS guide with the documented HTTP-trigger model and supported commands. |
| Deploy Volcengine functions and storage | Provider sections in reference | Dedicated guide with version-specific support and explicit resource/command limits. |
| Preview serverless deployment changes | CLI and deployment section | A concrete state-change example: configuration before/after, plan output, review, and apply. |
| How are managed serverless resources billed? | Pricing | A worked AMR example linked to stage eligibility, counting rules, included allowance, and separate provider charges. |

Publish matching English/Chinese guides only when each contains useful, verified material. Keep one canonical URL per intent, link it from the docs hub/provider section, and cross-link setup, reference, CLI, and pricing where relevant. Verify support against the published CLI version before promoting provider capabilities. Do not generate many near-duplicate provider/keyword pages.

### 3. Make important answers easy to cite

Use a direct answer near the relevant heading, then a runnable example, constraints, and source/reference links. Keep product identity and the distinction between the open-source CLI and platform plans consistent. Preserve meaningful HTML text, tables, headings, and links without requiring authentication or JavaScript interaction to obtain the core explanation.

The implementation deliberately avoids fabricated FAQ eligibility, reviews, ratings, prices, or claims of universal cloud parity. An `llms.txt` file or special AI schema is not treated as a ranking requirement. Google documents that its AI search features use the same underlying eligibility and SEO fundamentals and do not require a new AI-specific file or schema. [Google's AI search guidance](https://developers.google.com/search/docs/appearance/ai-features)

## Measurement and release checklist

1. Review and release the code changes. They are not deployed by this audit. The repository's deployment workflow is version-gated; a PR merge alone does not establish that production contains the changes.
2. Inspect deployed page source for the new title, unique description, canonical, alternates, and JSON-LD. Check both languages and verify representative URLs in Google's URL Inspection and Rich Results tools.
3. Submit the updated sitemap using the existing Search Console/Baidu verification setup and Bing Webmaster Tools where the owner has access. Track indexed canonical pages, crawl errors, non-brand impressions/clicks, landing-page engagement, and locale/country differences. Existing verification tags were preserved; no account settings or indexing submissions were changed here.
4. Establish a dated baseline before attributing changes to this work. Compare equivalent periods and separate branded queries from task/provider queries. Do not infer that a lack of search results in an ad hoc query proves a page is unindexed.
5. Where available, use Bing Webmaster Tools AI Performance to inspect cited URLs, grounding intents/topics, and citation trends. These are first-party observations, not a universal AI-ranking score. [Bing's AI visibility reporting](https://blogs.bing.com/search/2026/6/New-AI-Visibility-Insights-in-Bing-Webmaster-Tools-Intents-Topics-Citation-Share-Compare/)
6. Measure real-user LCP, INP, and CLS through Search Console/field data before commissioning performance changes. No Core Web Vitals score or frame-rate claim was established in this review.
7. Review content and provider claims when product behavior changes. Keep an editorial review date only when someone actually checks the page; do not mass-refresh dates to imply new evidence.

## Implementation maintenance

- Page-specific titles/descriptions live in each Markdown page's frontmatter.
- `docs/.vitepress/seo.mjs` centralizes canonical paths, language pairs, structured data, and indexing rules. Add translated pages to `LOCALIZED_PAGES` and keep both destinations real. The same set drives two protections for untranslated pages: the layout hides the locale picker, and the build strips anchors to the missing counterpart.
- New indexable pages must satisfy the generated-HTML tests in `tests/seo.test.mjs`.
- Build and tests remain explicit separate commands: `npm run docs:build`, then `npm test`.

## Primary guidance consulted

- [Google: title links](https://developers.google.com/search/docs/appearance/title-link)
- [Google: snippets and meta descriptions](https://developers.google.com/search/docs/appearance/snippet)
- [Google: localized versions and hreflang](https://developers.google.com/search/docs/specialty/international/localized-versions)
- [Google: organization structured data](https://developers.google.com/search/docs/appearance/structured-data/organization)
- [Google: breadcrumb structured data](https://developers.google.com/search/docs/appearance/structured-data/breadcrumb)
- [Google: AI features and website eligibility](https://developers.google.com/search/docs/appearance/ai-features)
- [Bing: AI Performance reporting](https://blogs.bing.com/webmaster/2026/2/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview/)
