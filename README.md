# FocusFlow ⚡

FocusFlow is a modern productivity app that combines task management, quick note capture, habit streaks, and achievement gamification in a single React + Supabase experience.

It is designed for speed-first daily use:
- capture quickly
- prioritize clearly
- track consistency
- keep everything synced per user with Supabase Row Level Security (RLS)

---

## What you get

### Task management
- Inbox / Today / Upcoming / Completed views
- Project-based task organization
- Priority levels (`low`, `medium`, `high`)
- Due dates and relative date display
- Tags and featured tasks
- Subtasks with progress tracking
- Inline add flow + full detail editor modal

### Notes and idea capture
- Dedicated **Ideas & Notes** view
- Quick note creation from task boards
- Edit/delete note cards inline

### Habits and streaks
- Create habits with emoji + custom color
- Daily check-ins
- 35-day visual timeline per habit
- Current streak + best streak + monthly completion stats

### Achievements (gamification)
- 13 built-in achievements (tasks, streaks, projects, notes, completion goals)
- Auto-progress and unlock celebration modal

### Universal AI input
- `Ctrl/Cmd + K` focuses the universal input
- Natural language parsing via Gemini (optional)
- If Gemini key is missing, the app gracefully falls back to basic task creation

### UX polish
- Dark mode + system preference detection
- Toast notifications
- Responsive mobile navigation
- Smooth motion transitions

---

## Tech stack

- **Frontend:** React 19, TypeScript, Vite 6
- **Styling:** Tailwind CSS v4
- **Animation:** Motion
- **Icons:** Lucide React
- **Backend/Auth/Data:** Supabase (`@supabase/supabase-js`)
- **AI parsing:** Google Gemini (`@google/genai`, optional)
- **Containerization:** Docker (Node 20 Alpine)

---

## Architecture at a glance

- `src/App.tsx` handles:
   - auth state
   - global app state
   - CRUD orchestration
   - achievement evaluation
- `src/lib/storage.ts` is the persistence layer for tasks/projects/notes/habits/achievements.
- `src/lib/supabase.ts` initializes the Supabase client and throws early if required env vars are missing.
- `src/lib/gemini.ts` handles natural-language parsing with a built-in fallback when AI is unavailable.
- Supabase schema and RLS policies are defined in `supabase-schema.sql`.

---

## Prerequisites

- Node.js 20+
- npm 10+
- A Supabase project
- (Optional) Gemini API key for AI parsing

---

## Environment variables

Create a `.env` file in the project root.

| Variable | Required | Purpose |
|---|---|---|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anon/public key |
| `VITE_GEMINI_API_KEY` | No | Enables AI parsing in universal input |
| `APP_URL` | No | Optional app host URL metadata |

Example:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GEMINI_API_KEY=your-gemini-key
APP_URL=http://localhost:3000
```

> Note: Supabase vars are mandatory. If they are missing, app startup will fail with a clear error from `src/lib/supabase.ts`.

---

## Local setup

1. Install dependencies:
    ```bash
    npm install
    ```
2. Create `.env` and add the variables above.
3. Open `supabase-schema.sql`, then run it in Supabase SQL Editor.
4. Start the app:
    ```bash
    npm run dev
    ```
5. Open `http://localhost:3000` and register/log in.

---

## Database bootstrap (Supabase)

The provided SQL creates and secures:
- `tasks`
- `projects`
- `notes`
- `habits`
- `achievements`

It also enables RLS and applies per-user policies so each user can only access their own data.

---

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start Vite dev server on `0.0.0.0:3000` |
| `npm run build` | Production build |
| `npm run preview` | Preview built app |
| `npm run lint` | Type-check via `tsc --noEmit` |
| `npm run clean` | Remove `dist` folder (`rm -rf dist`) |

---

## Docker

The Docker image:
- installs dependencies
- builds the Vite app
- serves with `vite preview` on port `3000`

The current `Dockerfile` expects these build args:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

---

## CI/CD (GitHub Actions)

Workflow file: `.github/workflows/main.yml`

On each push to `main`, it:
1. Builds a Docker image
2. Pushes to GHCR (`ghcr.io/<owner>/todo`)
3. Deploys over SSH to a server

Required repository secrets:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SERVER_HOST`
- `SERVER_USER`
- `SSH_PRIVATE_KEY`
- `SERVER_PORT` (optional; defaults to `22`)

Runtime defaults in workflow:
- container name: `todo`
- container port: `3000`
- host port: `80`

---

## Keyboard shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl/Cmd + K` | Focus universal input |
| `Esc` | Close active modal/input in many flows |
| `Ctrl/Cmd + Enter` | Save note in note editors |

---

## Project structure

```text
src/
   components/
      AddTaskInline.tsx
      HabitTracker.tsx
      Sidebar.tsx
      TaskBoard.tsx
      TaskDetail.tsx
      Toast.tsx
      UniversalInput.tsx
   lib/
      achievements.ts
      gemini.ts
      storage.ts
      supabase.ts
      utils.ts
   App.tsx
   types.ts
```

---

## Troubleshooting

### “Missing Supabase environment variables” error
Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env`, then restart the dev server.

### Universal input isn’t doing AI parsing
Set `VITE_GEMINI_API_KEY`. Without it, FocusFlow intentionally falls back to non-AI parsing.

### Auth works but data doesn’t load
Ensure `supabase-schema.sql` was executed and RLS policies were created successfully.

### Docker deploy comes up but app is blank
Verify build-time Supabase env vars are provided in CI secrets and image build args.

---

## License

Apache-2.0
