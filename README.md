# Arachnid: Neon City — Screen-Locked Streaks & Stable Swing Pass v1.7

A playable original third-person superhero prototype built with Three.js and TypeScript. This release fixes the off-center speed streaks and removes the largest performance regressions introduced by the v1.5 visual upgrade, with special attention to a 2019 Intel MacBook Air with 8 GB RAM.

## Play on a Mac

1. Extract the entire ZIP to a normal folder, such as your Desktop.
2. Open the extracted `spider-city-game` folder.
3. Double-click **`START_GAME.command`**.
4. Keep the Terminal window open while playing.
5. The game opens at `http://127.0.0.1:5173`.

Do not open `index.html` directly.

### If macOS blocks the launcher

Control-click `START_GAME.command`, choose **Open**, then choose **Open** again. If macOS says the file is not executable, open Terminal in the game folder and run:

```bash
chmod +x START_GAME.command
./START_GAME.command
```

## Controls

- **WASD** — movement
- **Mouse** — camera
- **Shift** — sprint, faster wall climb, or swing boost
- **Space** — jump; hold in the air to attach a web
- **E on the ground** — point-launch toward a facade or upper-building anchor
- **E in the air** — web zip
- **Face a wall + W** — attach and climb from street level
- **W / S while attached** — climb up or down
- **A / D while attached** — crawl sideways
- **Space while attached** — leap away; continue holding to transition into a web
- **Q** — dodge
- **Left mouse** — light attack
- **Right mouse** — heavy attack
- **F** — web strike
- **H** — spend focus to heal
- **V** — switch camera distance
- **N** — day/night
- **K** — emergency camera reset
- **Esc** — pause

## v1.7 changes

### Streaks locked to the visible hero

The streak vanishing point is now based on the hero's projected chest position, not the viewport center and not the animated body's facing direction. Camera look-ahead can place the hero off-center, and the streaks will follow that on-screen position while remaining independent of the character rig.

### Stable airborne web movement

Swinging now uses small physics substeps and a single rope constraint solve per substep. Facade collision no longer pushes the player outward only for the web to pull them back inward on the next frame.

The visible character is also separated from the translation-only physics root. Airborne poses use smoothed velocity and body-local lean, removing the twitchy pose changes caused by raw rope corrections.

## Intel MacBook Air 2019 settings

The game automatically chooses **INTEL MAC** mode on Intel Macs and other constrained devices. Confirm the preset in Settings after launch.

For the first test:

1. Keep Day Mode enabled.
2. Close heavy browser tabs.
3. Plug the MacBook into power.
4. Watch the bottom-right `FPS · draw calls · render scale` display.
5. Swing through downtown for two or three minutes so the adaptive scaler can settle.

A stable 35–40 FPS is the intended result on this hardware. The render scale may settle near 50–68% during dense downtown swinging.

## Runtime loading

On first launch with Node.js, the server downloads and caches the Three.js runtime in `vendor/`. The browser also has jsDelivr and UNPKG fallbacks. Internet access can therefore be required on the first launch.

## Development

No package installation is required to play the precompiled build.

```bash
npm run compile
npm run build
npm run dev
```

## Source layout

- `src/` — editable TypeScript and CSS
- `src/game/TraversalEffects.ts` — hero-projected, screen-locked velocity effects
- `src/player/Player.ts` — traversal, animation, and procedural hero
- `src/world/City.ts` — districts, buildings, traffic, pedestrians, bridges, and collision
- `web/js/` — compiled local-runtime modules
- `web/js-jsdelivr/` and `web/js-unpkg/` — CDN fallback modules
- `server.mjs` — zero-dependency local server and Three.js runtime cache
- `START_GAME.command` — macOS launcher

## Asset policy

The hero, enemies, buildings, bridge geometry, vehicles, textures, interface, traversal effects, and mission markers are generated from project code. No Marvel, Sony, Insomniac, Spider-Man, ripped-game, film-frame, or paid assets are included.
