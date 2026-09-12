# Hand Racer

Build a working React.js racing game controlled ONLY by webcam hand movement.

First, request camera permission and show a live webcam preview. Detect whether a hand is visible. Display “Show your hand to start”. The game must NOT start until a hand is successfully detected.

Once detected, show a “Hand Detected — Ready” state and allow the game to start. Track the hand’s horizontal movement in real time using MediaPipe Hands. Moving hand left steers the car left; moving right steers right; center keeps it straight.

Use smooth tracking, dead-zone, and sensitivity controls for stable steering. If the hand disappears, pause the game automatically and show “Hand not detected”.

Create a simple polished 2D endless racing game with scrolling road, player car, obstacles, collision, score, and restart. No keyboard controls, no backend, no paid AI APIs. Ensure the webcam tracking is actually connected to car movement and works in the browser.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/8e9bcc61-e9a0-499f-8eda-01382fc15805).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
