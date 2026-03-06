# Quotes Integration Spec

## Summary
Populate `data/quotes.csv` with curated quotes from *As a Man Thinketh*, tag them by domain, surface them in the vision doc and on the hub alongside the daily mantra.

## Decisions Locked

1. **Source**: 9 quotes from James Allen's *As a Man Thinketh* (transcript in repo root)
2. **CSV schema**: `id,text,author,source,domain,added` (add `domain` column)
3. **Vision doc**: One anchor quote per domain where a natural fit exists. Sits above the domain goals. Not all domains need a quote.
4. **Hub mantra pairing**: Show a quote below the weekly/daily mantra in dimmer text
5. **Rotation**: Deterministic daily rotation (date-based hash mod N, filtered by domain)
6. **Domain fallback**: If no quote matches the mantra's domain, show any quote
7. **No-mantra fallback**: Show a quote of the day (any domain)

## Domain Mapping

| id | Quote (abbreviated) | Domain |
|----|---------------------|--------|
| 1 | "A man is literally what he thinks..." | personal_growth |
| 2 | "Men do not attract what they want, but what they are." | personal_growth |
| 3 | "Circumstance does not make the man, it reveals him." | mental |
| 4 | "As he thinks, so he is; as he continues to think, so he remains." | addiction |
| 5 | "Act is the blossom of thought, and joy and suffering are its fruits." | mental |
| 6 | "Thought crystallizes into habit, and habit solidifies into circumstance." | addiction |
| 7 | "Until thought is linked with purpose there is no intelligent accomplishment." | career |
| 8 | "The will to do springs from the knowledge that we can do." | career |
| 9 | "The greatest achievement was at first a dream. The oak sleeps in the acorn." | personal_growth |

## Changes

| File | Change |
|------|--------|
| `data/quotes.csv` | Update header, add 9 quotes |
| `app/app/lib/csv.ts` | Update QUOTES_HEADER constant |
| `docs/vision.md` | Add anchor quotes to relevant domains |
| `app/app/api/hub/route.ts` | Import readQuotes, compute daily quote, include in response |
| `app/app/page.tsx` | Render quote below mantra section |

## Acceptance Criteria

- [ ] `data/quotes.csv` has 9 rows with domain tags
- [ ] Hub shows a quote that rotates daily
- [ ] Quote matches mantra domain when possible
- [ ] Vision doc has quotes anchoring addiction, mental, career, personal_growth
- [ ] `npm run build` passes
