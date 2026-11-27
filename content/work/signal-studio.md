---
title: Signal Studio
client: Side project
year: 2025
role: Solo — design & engineering
duration: Ongoing
summary: My open-source workbench for comparing prompts, models and retrieval settings side by side — with evals built in.
tags: [Evals, Open Source]
stack: [TypeScript, React, Vite, SQLite, Any LLM API]
palette: [#7b5cff, #ff6a3d, #ffd166]
pattern: orbs
glyph: S
order: 5
link: https://github.com/
metrics: [2.4k|GitHub stars, 60+|contributors]
---

## Why I built it

Every customer deployment started the same way: a spreadsheet of prompts, a folder of outputs, and a lot of squinting. Signal Studio is the tool I wanted — run any variation against a test set, diff the outputs, score them with rubrics or graders, and keep the history.

## What it does

- Matrix runs across prompts × models × parameters
- Side-by-side diffs with highlighted changes
- Pluggable graders: exact match, regex, model-graded rubrics, human review
- Cost and latency tracking on every run

It's MIT-licensed and used by teams who'd rather measure than guess.
