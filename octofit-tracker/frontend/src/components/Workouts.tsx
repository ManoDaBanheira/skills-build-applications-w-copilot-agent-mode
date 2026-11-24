import { getJson } from '../api/client.js';
import { ApiResourcePage } from './ApiResourcePage.js';

type Workout = {
  _id?: string;
  title: string;
  focus?: string;
  minutes?: number;
  difficulty?: string;
  reason?: string;
};
type WorkoutResponse = { suggestions: Workout[] };

const loadSuggestions = async () => (
  await getJson<WorkoutResponse>(`/api/workouts/suggestions/${encodeURIComponent('mona@example.com')}`)
).suggestions;

export default function Workouts() {
  return (
    <ApiResourcePage
      title="Workout suggestions"
      description="Recommend workouts from activity patterns."
      emptyMessage="No workout suggestions available."
      load={loadSuggestions}
      getKey={(workout, index) => workout._id ?? `${workout.title}-${index}`}
      renderItem={(workout) => (
        <>
          {workout.title}
          {workout.focus && ` — ${workout.focus}`}
          {workout.minutes !== undefined && ` — ${workout.minutes} minutes`}
          {workout.difficulty && ` — ${workout.difficulty}`}
          {workout.reason && <p className="mb-0">{workout.reason}</p>}
        </>
      )}
    />
  );
}
