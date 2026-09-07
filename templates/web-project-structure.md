# Web project folder structure (React + Vite + Supabase)

Copy this layout when starting a new React + Supabase project.
Delete folders that do not apply — but think before you delete.

```
project-name/
  index.html              ← Vite entry point (do not move)
  vite.config.js          ← build and dev server config
  package.json            ← dependencies
  .gitignore
  .env.local              ← secrets (never committed — see below)
  README.md               ← what this app is, how to run it, required env vars
  CLAUDE.md               ← Claude session context (copy from templates/CLAUDE-web.md)
  ROADMAP.md              ← living document: future work, known issues, milestones

  src/
    main.jsx              ← entry point only; mounts App into the DOM
    App.jsx               ← root component; wires routing and context providers

    constants/
      index.js            ← all named values: timing defaults, limits, formats
                             (copy from snippets/constants.js)
      jobStatuses.js      ← job status state machine constants and labels

    context/
      SettingsContext.jsx ← re-exports SettingsProvider from hooks/useSettings.js
      AuthContext.jsx     ← React Context + Provider for Supabase auth state

    hooks/
      useSettings.js      ← settings store read/write (copy from snippets/useSettings.js)
      useFeatureFlags.js  ← feature flag + plan tier checks (copy from snippets/useFeatureFlags.js)
      useJobs.js          ← job data fetching and mutations
      useCustomers.js     ← customer data
      useQuote.js         ← quote builder logic
      useAuth.js          ← auth state and login/logout helpers

    components/
      jobs/               ← JobList, JobCard, JobDetail, StatusBadge
      quotes/             ← QuoteBuilder, TemplateSelector, LineItems, QuoteTotal
      customers/          ← CustomerProfile, AddressList, CommunicationLog
      photos/             ← PhotoCapture, PhotoGallery, PhotoUpload
      settings/           ← SettingsPanel, FeatureFlagToggles, PlanInfo
      shared/             ← Button, Input, Modal, LoadingSpinner, ErrorMessage, EmptyState

    lib/
      supabase.js         ← single Supabase client instance (import everywhere, never recreate)
      logger.js           ← unified debug + logging layer (copy from snippets/logger.js)
      formatters.js       ← currency, dates, phone numbers — pure functions only
      validators.js       ← input validation — pure functions only

    styles/
      globals.css         ← reset, base typography, global rules
      tokens.css          ← design tokens: colors, spacing, border radius, shadows

  schema/
    phase1-core.sql       ← database schema (run in Supabase SQL editor, not auto-applied)

  docs/
    decisions.md          ← architectural decisions with dates and reasons
```

---

## .gitignore minimums

Always ignore these:
```
node_modules/
dist/
.env
.env.local
.env.*.local
*.local
.DS_Store
```

---

## Required environment variables

Document these in README.md so any new session knows what is needed.
Never commit actual values — the `.env.local` file is gitignored.

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_TWILIO_ACCOUNT_SID=        (add when SMS is integrated)
VITE_TWILIO_AUTH_TOKEN=         (add when SMS is integrated)
VITE_STRIPE_PUBLISHABLE_KEY=    (add when payments are integrated)
```

---

## src/lib/supabase.js — always this exact pattern

One client. Imported everywhere. Never call `createClient` again in any other file.

```javascript
import { createClient } from '@supabase/supabase-js'

// Single shared instance — import { supabase } from '../lib/supabase' everywhere
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

---

## App.jsx — context provider wiring pattern

Wrap the entire app with providers in the correct order.
Settings depends on auth, so auth wraps settings.

```jsx
import { AuthProvider }     from './context/AuthContext'
import { SettingsProvider } from './hooks/useSettings'
import { RouterProvider }   from 'react-router-dom'
import { router }           from './router'

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <RouterProvider router={router} />
      </SettingsProvider>
    </AuthProvider>
  )
}
```
