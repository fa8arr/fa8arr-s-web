# Zulfaqar Ahmed | Cybersecurity Student

Personal portfolio with a DMC5-style intro and a live progress tracker for my cybersecurity studies.

## Features
- Cinematic intro: muted video, Vergil theme, timed text, flash, shake and slash effects (skippable, plays once per session)
- Terminal card that types out my overall progress
- Music after the intro (Daft Punk, Veridis Quo) with play/pause and a volume slider that remembers your setting
- Animated background: drifting aurora, faint grid and a particle network that reacts to the cursor and pulses with the bass
- Contact links (Instagram, Discord with copy-to-clipboard)
- Progress rings calculated automatically from the topics I have finished
- Responsive, keyboard accessible, respects `prefers-reduced-motion`
- Plain HTML, CSS and JavaScript. No frameworks or build step.

## Project structure
| File | Purpose |
|---|---|
| `index.html` | Content: intro markup, cards, topics |
| `style.css` | Styling and animations |
| `script.js` | Intro timeline, progress maths, terminal typing |
| `videoplayback.mp4`, `vergil1.m4a` | Intro footage and music |
| `veridis-quo.mp3` | Background music after the intro |
| `python.jpg`, `networking.jpg`, `linux.jpg`, `dmc5.jpg` | Card pictures |

## Updating my progress
Add `class="done"` to a topic's `<li>` in `index.html`. The rings and the terminal score update on their own.

## Editing the intro
The text and timing live in the `beats` list at the top of the intro section in `script.js` (`t` = seconds into the song).
