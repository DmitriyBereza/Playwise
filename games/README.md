# Playwise Games Structure

Each game lives in its own folder so it can be edited/tested independently.

- `games/catalog.js` - portal metadata and routes for game cards.
- `games/<game-name>/` - isolated game module.
- `app/games/<game-name>/page.js` - route entry for the game.

## Current game modules

- `games/typing-balloons/TypingBalloonsGame.js`
- `games/typing-balloons/typingBalloons.module.css`
