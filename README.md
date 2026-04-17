# FocusFlow

FocusFlow is a real-time, gamified productivity platform that seamlessly combines task management, habit tracking, and minimalist fast-capture into a unified experience. Everything is synced securely to the cloud and stored in real-time.

## Features

- **Task Management**: Create tasks, set priorities, group by project folders, and attach sub-tasks.
- **Habit Tracking**: Define daily habits with emojis, track custom streaks, and visualize up to 35-days of progress per habit using an interactive heat map.
- **Gamified Achievements**: Automatically unlock 13 curated achievements as you reach app milestones (e.g. crossing 100 tasks, maintaining a 30-day streak).
- **Universal Fast Capture**: "Cmd+K" to instantly add a task or quick note anywhere in the app without interrupting your flow. 
- **Dark Mode First**: Clean UI built natively with TailwindCSS featuring dynamic gradients and smooth motion blur.
- **Custom Profiles**: Select custom job types (Developer, Student, Designer) during dynamic registration to personalize the experience.
- **Supabase Cloud Sync**: Email Authentication & PostgreSQL data persistence securely stored in the cloud under user Row Level Security.

## Tech Stack

- **Frontend framework:** React 19 + TypeScript + Vite
- **Styling:** Tailwind CSS v4 + Motion for animations
- **Icons:** Lucide React
- **Backend & Auth:** Supabase (Auth & PostgreSQL)

## Setup and Running

1. Clone the repository
2. Run `npm install`
3. Create a `.env` file in the root using `.env.example` as a template, adding your Supabase API details. Example:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
4. Find the `supabase-schema.sql` file in the root, copy the contents, and run it in the Supabase Dashboard SQL Editor to set up the DB schemas and Security Policies.
5. Create an account via the local login screen to begin!
6. Run the local dev server: `npm run dev` 

## License

Apache 2.0
