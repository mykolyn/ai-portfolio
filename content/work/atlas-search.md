---
title: Atlas Search
client: Fieldnote
year: 2026
role: Retrieval engineering, interface design
duration: 8 weeks
summary: Semantic search across ten years of research interviews — answers with citations, in under a second.
tags: [Retrieval, Product Design]
stack: [Python, FastAPI, Postgres, pgvector, React, Cohere Rerank]
palette: [#2f6bff, #16c2a3, #c6f36b]
pattern: rings
glyph: A
featured: true
order: 2
metrics: [0.81|nDCG@10 (from 0.52), 780ms|p95 answer latency, 6×|weekly searches post-launch]
---

## The problem

Fieldnote's research team had 14,000 hours of interview transcripts and a search box that only matched keywords. Researchers knew the insight was *in there somewhere* — they just couldn't find it.

## Approach

We started with the evaluation, not the embedding model. Researchers wrote 300 real questions they'd asked in the past year, and we labelled which passages answered them. That gave us a benchmark to make every decision against.

From there, the retrieval stack came together quickly:

- **Hybrid retrieval** — BM25 plus dense embeddings, fused, then reranked.
- **Speaker-aware chunking** so a passage never splits mid-thought.
- **Grounded answers** that quote and link every source, or say "I couldn't find that."

> [!note] Swapping embedding models moved the needle by 4 points. Fixing chunking moved it by 19. Measure before you shop.

## Interface

Answers stream in with numbered citations; hovering a citation previews the exact transcript moment, and one click plays the audio from that timestamp. Researchers told us that last detail mattered more than any accuracy improvement — it's how they build trust in the result.

## Outcome

Search quality went from 0.52 to 0.81 nDCG@10, weekly searches grew six-fold, and "Atlas" became the first tab researchers open in the morning.
