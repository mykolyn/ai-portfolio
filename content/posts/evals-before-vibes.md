---
title: Evals before vibes
date: 2026-11-04
summary: Why every AI project we take on starts with a spreadsheet of 50 examples — and how that spreadsheet quietly becomes the most valuable asset in the codebase.
tags: [Evals, Process]
---

Every AI project has a moment, usually in week one, where someone pastes an impressive output into Slack and the room gets excited. It's a great moment. It's also where most projects start to go wrong.

A single great output tells you the system *can* work. It tells you nothing about whether it *does* work, how often, or for whom.

## Start with fifty examples

Before we write a prompt, we write a test set. Not a thousand examples — fifty is plenty to start. Real inputs, from real users or the closest thing you have, each with a note on what a good answer looks like.

This is unglamorous work and it pays for itself almost immediately:

- It forces the team to agree on what "good" means before arguing about how to get there.
- It surfaces the weird edge cases on day one instead of in production.
- It turns every later decision — which model, which prompt, which retrieval strategy — into a measurement instead of a debate.

> [!pull] A great demo tells you a system can work. An eval tells you whether it does.

## Grade the boring way first

It's tempting to reach for a model-graded rubric immediately. Often you don't need to. Exact match, regex, JSON schema validation and simple heuristics catch a surprising share of failures, and they're fast, cheap and deterministic.

```python
def grade(output, expected):
    checks = {
        "valid_json": is_valid_json(output),
        "has_urgency": output.get("urgency") in {"low", "medium", "high"},
        "no_under_triage": not (expected["urgency"] == "high" and output["urgency"] != "high"),
    }
    return all(checks.values()), checks
```

Reserve model-graded evals for the genuinely subjective parts — tone, helpfulness, faithfulness to sources — and calibrate them against human labels before you trust them.

## Make it part of CI

An eval suite that someone runs manually "before a big change" will be run twice and then forgotten. Put it in CI. Fail the build on regressions in the metrics that matter. Post a summary to the pull request.

Once it's automated, something nice happens: people start *adding* to it. Every bug report becomes a new test case. Six months later, the eval set is the single best description of what your product is supposed to do.

## What we'd tell you on day one

If you only take one thing from this: write down fifty examples before you write a prompt. Everything else gets easier from there.
