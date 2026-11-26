---
title: Designing interfaces for things that are sometimes wrong
date: 2026-09-18
summary: Confidence scores don't work. Here's what we've seen work instead, across a dozen AI products and a lot of user testing.
tags: [Design, UX]
---

Traditional software is deterministic: the same click produces the same result. AI features break that contract, and most interfaces haven't caught up. They present probabilistic output with the same visual certainty as a bank balance.

Over the last few years we've tested a lot of ways to communicate uncertainty. Here's what we've learned.

## Percentages are mostly noise

The instinct is to show a confidence score: *87% sure*. In testing, users either ignore it entirely or over-trust it. Very few people have a calibrated sense of what 87% means — and model confidence often isn't calibrated either.

## Show your sources

What works far better is showing *why*. Highlight the passage that supports an answer. Link the record a suggestion came from. Quote the user's own words back when extracting from them.

> [!pull] People don't trust confidence. They trust evidence they can check in two seconds.

Evidence lets users calibrate trust on their own terms, case by case — and it makes errors cheap to spot.

## Design the "I'm not sure" state

Most products only design the happy path. The most important state in an AI interface is the one where the system *knows* it might be wrong. Give it a distinct, calm visual treatment and a clear next action. A system that says "I'm not sure — can you check this?" earns far more trust than one that's confidently wrong 5% of the time.

## Make correction effortless

If users can fix a mistake with one keystroke, mistakes become minor. If fixing requires retyping everything, every error feels like a betrayal. Inline editing, accept/reject per field and easy regeneration aren't nice-to-haves — they're the safety net that makes the whole thing usable.

## Stream, but keep the layout still

Streaming makes systems feel fast, but text that reflows as it arrives is exhausting to read. Reserve space, stream into stable containers, and avoid layout shift. It's a small detail that users feel even if they can't name it.
