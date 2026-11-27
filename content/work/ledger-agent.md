---
title: Ledger Agent
client: Brightwater Finance
year: 2025
role: Agent architecture, evals, product strategy
duration: 12 weeks
summary: An agent that reconciles messy invoices against bank feeds, explains its reasoning, and asks before it acts.
tags: [Agents, Evals, Strategy]
stack: [TypeScript, Temporal, Claude, Postgres, OpenTelemetry]
palette: [#c6f36b, #16c2a3, #2f6bff]
pattern: lines
glyph: L
featured: true
order: 3
metrics: [72%|of matches fully automated, 0|unapproved write actions, 9 hrs|saved per accountant / week]
---

## The problem

Month-end close at Brightwater meant days of matching invoices to transactions by hand: partial payments, typos in vendor names, currencies, credit notes. Rules-based tools caught the easy 40%; humans did the rest.

## Agent, with guardrails

I designed an agent with a deliberately narrow set of tools — read the ledger, read bank feeds, search vendor records, **propose** a match. Writing to the books always requires a human approval, enforced in the tool layer rather than the prompt.

Each proposed match carries a short, plain-English rationale: *"Amount matches after a 2% early-payment discount; vendor name differs by a suffix (Ltd vs Limited)."*

## Durable by design

Reconciliation runs are long and flaky APIs are a fact of life, so the agent runs as a durable Temporal workflow. Every step is traced, replayable, and resumable — which made debugging production issues an afternoon rather than a week.

## Outcome

72% of matches are now proposed with high enough confidence that accountants approve them in bulk. Close takes two days instead of five, and in nine months of production use, the agent has never written to the ledger without approval.
