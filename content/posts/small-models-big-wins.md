---
title: When a small model beats a big one
date: 2026-07-02
summary: A field report on routing, distillation and the surprising number of tasks where the cheapest model is also the best one.
tags: [Engineering, Cost]
---

On a recent project, we cut inference cost by 83% and *improved* quality. Not by being clever with prompts — by noticing that most of the traffic didn't need a frontier model at all.

## Look at the distribution

When we logged a week of production traffic and clustered it, about 70% of requests were simple: classification, short extraction, reformatting. The remaining 30% were genuinely hard multi-step reasoning tasks.

Sending all of it to the largest model was like hiring a senior architect to label boxes.

## Route by difficulty

We introduced a lightweight router: a small, fast model decides whether a request is simple or complex, with a conservative bias toward escalating when unsure.

| Tier | Share of traffic | Relative cost | Quality vs. baseline |
| --- | --- | --- | --- |
| Small model | 68% | 0.04× | +1.2 pts |
| Large model | 32% | 1× | ±0 |

The small model actually scored slightly *higher* on its slice — it was less prone to over-elaborating simple answers.

## The caveat

None of this works without evals. You can only route confidently if you can measure quality per tier and catch regressions when you change the router. Build the measurement first; the savings follow.
