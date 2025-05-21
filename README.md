# Isometric Multiplayer PeerJS Game

A brief description of the game: "A minimal decentralized isometric multiplayer game using TypeScript, Phaser, and PeerJS. Players can connect peer-to-peer, see each other move on an isometric map, and chat (chat feature to be added later, for now, just movement)."

## Features
-   Isometric view
-   Player movement (WASD/Arrow keys)
-   Player names
-   Peer-to-peer networking with PeerJS
-   Real-time synchronization of player positions and names
-   UI for connecting to peers and copying your Peer ID

## Tech Stack
-   TypeScript
-   Phaser 3
-   PeerJS
-   Webpack

## Getting Started

### Prerequisites
-   Node.js and npm (or yarn)

### Running Locally
1.  Clone the repository:
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm start 
    ```
    (Ensure `package.json` has a `start` script, e.g., `"start": "webpack serve --mode development --open"`)
4.  Open your browser and navigate to `http://localhost:8080` (or the port specified by webpack-dev-server).

### Playing the Game
1.  **Enter Your Name:** When the game loads, you'll be prompted to enter your name. Submit it to join the game world.
2.  **Share Your Peer ID:**
    *   Your unique Peer ID will be displayed on the screen (e.g., "My ID: XXXXX").
    *   Click the "Copy ID" button to copy it to your clipboard.
    *   Share this ID with a friend.
3.  **Connect to Another Player:**
    *   If a friend shares their Peer ID with you, paste it into the "Remote Peer ID" input field.
    *   Click "Connect".
4.  Once connected, you should see each other on the map and movements will be synchronized.

## Assets
- Placeholder assets from Kenney.nl ([Isometric Roads Old](https://kenney.nl/assets/isometric-roads-old), [Fantasy Characters Medieval](https://kenney.nl/assets/fantasy-characters-medieval)) are used.
- **Important:** The actual asset files are not included directly in this repository due to their size and licensing. The game currently uses placeholder *filenames*. To make the game visually work as intended, you would need to:
    1. Download the asset packs from the links above.
    2. Extract them.
    3. Place the correct `.png` files into the `public/assets/tiles/` and `public/assets/character/` directories, matching the filenames used in `src/game.ts` (`isometric_road_01.png`, `isometric_building_01.png`, `character_medieval_archer.png`).

## Deployment to GitHub Pages
This project includes a GitHub Action (`.github/workflows/deploy.yml`) that automatically builds and deploys the game to GitHub Pages.
1.  Push your code to the `main` branch of your GitHub repository.
2.  The action will build the project and deploy the contents of the `dist` folder to the `gh-pages` branch.
3.  Enable GitHub Pages for your repository, selecting the `gh-pages` branch as the source.
4.  Your game will be available at `https://<your-username>.github.io/<repository-name>/`.

## (Bonus) Future Enhancements / To-Do
-   Walking animations
-   Basic collision detection
-   Chat functionality
-   Improved UI/UX

---
*Remember to replace `<repository-url>` and `<repository-directory>` with actual values once the repo exists.*
*Verify the `start` script in `package.json`. If it's missing, add it: `"start": "webpack serve --mode development --open"`.*
