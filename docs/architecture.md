# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

- Presentation tier decision: Keep route-specific rendering in the existing React pages and use the shared API client. Each page exposes accessible loading, error, empty, and populated states; the workout page requests suggestions for the seeded Mona account.
- Logic tier decision: Keep API behavior in explicit service functions and routes. Validate request shape, object IDs, and referenced records before writes, and return deliberate 4xx responses for invalid or unknown resources.
- Data tier decision: Enforce required fields and sensible numeric/date constraints in Mongoose schemas. Keep seed data idempotent and preserve unrelated records and existing membership reconciliation.
- Activity tracking approach: Accept `userId`, `teamId`, `type`, and positive `minutes`; require existing user/team records; store their references, calculate points as one point per minute, and set `occurredAt` on the server.
- Team management approach: Require a non-empty `name` and `mascot`, default `members` to an empty array, and validate submitted member IDs against existing users before storing them.
- Leaderboard approach: Sum activity points by team, include teams with no recorded points at zero, sort descending by total, and assign 1-based ranks.
- Workout suggestions approach: Find the requested user by email, prefer a focus supported by recent activity and otherwise use their fitness goal, and return matching workouts with a short explanation. Return 404 for an unknown email.

## Test plan

- `npm run test:data --prefix octofit-tracker/backend` checks model validation and safe, idempotent demo seeding. A failure indicates a schema or seed contract regression.
- `npm run test:api --prefix octofit-tracker/backend` checks request validation, persistence, leaderboard aggregation, and workout recommendations. A failure indicates an API/service contract regression.
- `npm test --prefix octofit-tracker/frontend` checks API-backed rendering and accessible loading, empty, and error states. A failure indicates a presentation or API-client integration regression.
- `npm run build --prefix octofit-tracker/backend` checks backend TypeScript types.
- `npm run build --prefix octofit-tracker/frontend` checks frontend TypeScript and the Vite production build.
- Baseline before implementation: data contracts had 4 failures; API contracts had 4 failures; frontend contracts had 15 failures. Both builds passed. Re-run all five commands after implementation and record the results here.
- Final verification: data contracts passed (5/5), API contracts passed (4/4), frontend contracts passed (15/15), and both backend and frontend builds passed.
