---
title: Triage Copilot
client: Northwind Health
year: 2026
role: Product design, AI engineering, evals
duration: 10 weeks
summary: A clinical intake assistant that drafts triage notes from patient messages — cutting nurse handling time while keeping a human firmly in the loop.
tags: [Agents, Product Design, Evals]
stack: [TypeScript, Next.js, Python, Claude, pgvector, Langfuse]
palette: [#ff6a3d, #7b5cff, #16c2a3]
pattern: orbs
glyph: Tc
featured: true
order: 1
metrics: [41%|less handling time per message, 0.94|agreement with senior nurses, 3 wks|to first clinical pilot]
---

## The problem

Northwind's nurse line receives thousands of portal messages a day. Each one has to be read, classified for urgency, and routed — and roughly a third need a structured triage note before a clinician can act. Nurses were spending most of their shift on paperwork rather than patients.

Previous attempts at automation had failed for the same reason: they tried to *replace* the nurse's judgement instead of *amplifying* it.

> [!pull] The model drafts. The nurse decides. That one sentence shaped every screen.

## What we built

A copilot that sits inside the existing nursing queue. For every incoming message it:

1. Extracts symptoms, duration, medications and red-flag indicators into a structured draft.
2. Suggests an urgency level **with the evidence that drove it**, highlighted inline in the patient's own words.
3. Proposes a routing destination, and flags anything it's unsure about rather than guessing.

Nurses accept, edit or reject each field with a single keystroke. Every correction feeds back into the evaluation set.

## Designing for uncertainty

The hardest design problem wasn't the happy path — it was what to show when the model *isn't* sure. We prototyped seven variations of confidence display and tested them with twelve nurses. Numerical scores were ignored or over-trusted. What worked was **showing the source text** behind each suggestion and an explicit "needs your eyes" state.

## Evals before launch

Before a single nurse saw it, we built a golden set of 1,200 de-identified messages labelled by three senior nurses. Every prompt change, model swap and retrieval tweak ran against it in CI. We tracked:

- Field-level extraction accuracy
- Urgency agreement (with a hard zero-tolerance gate on under-triage of red flags)
- p95 latency and cost per message

## Outcome

After an eight-week pilot across two clinics, handling time per message fell 41%, and nurse-reported satisfaction with the tool was 4.6 / 5. The eval suite now runs nightly and is owned by Northwind's own ML team.
