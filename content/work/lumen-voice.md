---
title: Lumen Voice
client: Lumen Learning
year: 2025
role: Prototype, interaction design, audio pipeline
duration: 6 weeks
summary: A real-time voice tutor for language learners that listens, corrects gently, and knows when to stay quiet.
tags: [Prototyping, Product Design]
stack: [WebRTC, TypeScript, Python, Whisper, Realtime APIs]
palette: [#ffb38a, #ff4f8b, #7b5cff]
pattern: dots
glyph: Lv
featured: true
order: 4
metrics: [320ms|median voice response, 2.3×|speaking time per session, 87%|week-two retention in pilot]
---

## The brief

Lumen wanted to know whether a voice-first tutor could get shy learners speaking more. I had six weeks to find out with real students.

## Turn-taking is the product

Latency gets the headlines, but the real challenge was *turn-taking*: knowing whether a learner has finished their sentence or is searching for a word. I tuned end-of-speech detection per proficiency level — beginners get far more patience.

Corrections are deferred to natural pauses and phrased as recasts ("Ah, you *went* to the market — what did you buy?") rather than interruptions.

## Outcome

In a four-week pilot with 140 students, speaking time per session more than doubled, and 87% were still using it in week two. Lumen is now building it into their core product.
