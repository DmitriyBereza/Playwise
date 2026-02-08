# Playwise

Playwise is a calm online kids games portal for ages 3+.

The main goal is to support:
- general development (attention, sequencing, fine-motor coordination)
- early computer skills (typing, clicking/tapping, simple UI interaction)

Design direction:
- soft pastel palette
- low-stimulation visuals
- simple, consistent UX

## Current Status

The project currently includes:
- a portal homepage
- a games catalog page
- one modular game: **Typing Balloons**

## Tech Stack

- Next.js 14 (App Router)
- React 18
- CSS Modules + global base styles

## Run Locally

```bash
npm install
npm run dev
```

Open:
- `http://localhost:3000` for the portal
- `http://localhost:3000/games/typing-balloons` for the current game

## Project Structure

```text
app/
  layout.js
  page.js                       # Playwise portal home
  portal.module.css             # Portal styling
  games/
    page.js                     # Catalog page
    typing-balloons/
      page.js                   # Route entry for game module

games/
  catalog.js                    # Metadata shown in portal/catalog
  README.md                     # Modular game notes
  typing-balloons/
    TypingBalloonsGame.js       # Game component
    typingBalloons.module.css   # Game-scoped styles

public/
  playwise-logo.svg             # Initial Playwise logo
```

## Modular Game Workflow

To add a new game:
1. Create a folder: `games/<new-game-slug>/`
2. Add game component + styles in that folder
3. Create route entry: `app/games/<new-game-slug>/page.js`
4. Register it in `games/catalog.js`
5. Verify with:

```bash
npm run build
```

This keeps each game isolated so AI agents (or developers) can work on one game without touching others.

## Product Direction

Playwise should remain:
- kid-safe and visually calm
- easy to understand with minimal text
- accessibility-aware (large controls, clear states, low cognitive load)
- progression-friendly (simple feedback, visible milestones, encouraging UX)
