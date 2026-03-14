# Draw & Guess

Draw & Guess is a Firebase-powered real-time multiplayer web game inspired by Skribbl. Players create a room, join with a 6-character code, take turns drawing on a synced HTML5 canvas, and race to guess the word through Firestore-backed chat.

## Stack

- Next.js pages router
- React + TypeScript
- TailwindCSS
- Firebase Authentication with anonymous sign-in
- Cloud Firestore realtime listeners
- HTML5 Canvas stroke sync

## Features

- Create and join rooms with 6-character codes
- Lobby for 3-4 players with ready states and host-only game start
- 5-round match flow with rotating drawers
- Drawer gets 3 random word options
- Live chat guesses with automatic scoring
- Real-time canvas with brush size, color picker, eraser, and clear board
- Leaderboard, round recap, emoji reactions, hint reveals, and reconnect-friendly anonymous auth

## Project Structure

```text
components/
firebase/
game/
hooks/
pages/
styles/
utils/
```

## Firebase Setup

1. Create a Firebase project.
2. Enable Firestore in production mode.
3. Enable `Authentication -> Sign-in method -> Anonymous`.
4. Copy `.env.example` to `.env.local` and fill in your Firebase web app credentials.
5. Deploy Firestore rules:

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Start the Next.js app:

```bash
npm run dev
```

3. Open `http://localhost:3000`.

## Firestore Data Model

```text
rooms/{code}
rooms/{code}/players/{uid}
rooms/{code}/private/{uid}
rooms/{code}/turns/{turnId}
rooms/{code}/turns/{turnId}/messages/{messageId}
rooms/{code}/turns/{turnId}/strokes/{strokeId}
```

## Game Flow

1. Host creates a room and shares the code.
2. Players join, mark ready, and the host starts the match.
3. The host chooses a drawer order and creates the first turn.
4. The drawer receives 3 word choices and selects one.
5. Firestore listeners sync strokes and chat in real time.
6. Correct guesses are scored, hints reveal over time, and the host advances rounds automatically.
7. After 5 rounds, the winner and full leaderboard are shown.

## Scoring

- First correct guess: 100
- Second correct guess: 70
- Third correct guess or later fallback: 40
- Drawer bonus after the first correct guess: 50

## Security Notes

- Players can only edit their own player doc, guesses, and reactions.
- The current drawer can only drive drawing-related room updates.
- The host controls game start, scoring, round progression, and room reset.
- For production anti-cheat hardening, moving score evaluation and timers into Cloud Functions is the next upgrade.

## Deployment

### Vercel

1. Import the repository into Vercel or run `vercel` from the project root.
2. Add every `NEXT_PUBLIC_FIREBASE_*` variable in Vercel Project Settings and scope them to the environments you need, usually `Development`, `Preview`, and `Production`.
3. Deploy with a git push, `vercel`, or `vercel --prod`.
4. If you use the Vercel CLI locally, you can pull the same variables into `.env.local` with `vercel env pull`.

### Firebase Hosting

1. Install Firebase CLI 12.1.0 or later and run `firebase login`.
2. Enable framework-aware Hosting with `firebase experiments:enable webframeworks`.
3. Run `firebase init hosting`, answer `yes` to using a web framework, and choose `Next.js`.
4. Add the same `NEXT_PUBLIC_FIREBASE_*` variables locally before building.
5. Deploy with `firebase deploy`.

Firebase documents this Next.js Hosting flow as an early public preview and recommends Firebase App Hosting for full-stack Next.js apps. This project is client-rendered, so the framework-aware Hosting path is still a workable option when you specifically want Firebase Hosting.
