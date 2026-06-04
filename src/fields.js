// The information Avi collects through natural conversation.
// No order is enforced — Avi asks whatever is most natural next.
// `key` must stay in sync with summary.js.
export const FIELDS = [
  // — Basics —
  { key: 'name',            about: 'their name or nickname' },
  { key: 'age',             about: 'their age in years' },
  { key: 'sex',             about: 'biological sex (male / female / other) — for calorie math' },
  { key: 'height',          about: 'current height with unit (e.g. "170 cm" or "5\'10\"")' },
  { key: 'weight',          about: 'current weight with unit (e.g. "75 kg" or "165 lbs")' },
  { key: 'profession',      about: 'what they do for work' },

  // — Goals —
  { key: 'fitnessGoals',    about: 'their main fitness / health goal' },
  { key: 'whyGoal',         about: 'why this goal matters to them (deeper motivation)' },
  { key: 'timeline',        about: 'the timeframe they want to achieve it in' },
  { key: 'bodyGoal',        about: 'the kind of body / look they are going for' },
  { key: 'previousAttempts',about: 'what they have tried before to reach this' },
  { key: 'biggestBarrier',  about: 'their single biggest obstacle' },
  { key: 'performanceGoals',about: 'any specific performance goals (run 5k, lift X) — optional' },
  { key: 'feelIfAchieve',   about: 'how they will feel when they achieve it' },
  { key: 'feelIfNot',       about: 'how they will feel if they do not' },
  { key: 'coachExp',        about: 'past experience working with a coach' },

  // — Diet & food —
  { key: 'dietType',        about: 'diet preference (veg / non-veg / eggetarian / vegan / jain)' },
  { key: 'currentDiet',     about: 'what they typically eat across a day' },
  { key: 'foodDislikes',    about: 'foods they dislike or avoid' },
  { key: 'cuisines',        about: 'cuisines they enjoy' },
  { key: 'foodWishlist',    about: 'foods they would love to see in their plan' },
  { key: 'sweetCravings',   about: 'whether they struggle with sweet cravings' },
  { key: 'goodEatingDay',   about: 'what a really good eating day looks like for them' },
  { key: 'badEatingDay',    about: 'what a really bad eating day looks like' },
  { key: 'foodScale',       about: 'whether they own a food weighing scale' },

  // — Lifestyle —
  { key: 'dailyRoutine',    about: 'their typical weekday (wake, meals, work, sleep)' },
  { key: 'weekend',         about: 'what a typical weekend looks like' },
  { key: 'cooking',         about: 'who cooks for them / how they manage meals' },
  { key: 'eatingOut',       about: 'how often they eat out or order in' },

  // — Health —
  { key: 'conditions',      about: 'medical conditions (diabetes, thyroid, PCOS, BP, cholesterol, fatty liver — or none)' },
  { key: 'allergies',       about: 'food allergies or intolerances' },
  { key: 'medications',     about: 'medications they take' },
  { key: 'digestiveIssues', about: 'digestive issues (bloating, acidity, constipation)' },
  { key: 'injuries',        about: 'injuries or physical limitations' },

  // — Habits —
  { key: 'smoking',         about: 'smoking habit (no / occasionally / regularly)' },
  { key: 'alcohol',         about: 'alcohol habit (no / occasionally / regularly)' },
  { key: 'supplements',     about: 'supplements they currently take' },
  { key: 'proteinHistory',  about: 'past use of protein supplements' },

  // — Sleep & stress —
  { key: 'sleepHours',      about: 'hours of sleep per night' },
  { key: 'sleepQuality',    about: 'sleep quality, rough 1-10' },
  { key: 'sleepRestless',   about: 'whether their sleep is restless' },
  { key: 'wakeRefreshed',   about: 'whether they wake up feeling refreshed' },
  { key: 'stressLevel',     about: 'daily stress level, rough 1-10' },
  { key: 'stressors',       about: 'their main sources of stress' },
  { key: 'meditates',       about: 'whether they meditate' },

  // — Fitness —
  { key: 'activeDays',      about: 'how many days a week they are physically active' },
  { key: 'trainingExp',     about: 'resistance-training experience (none / beginner / intermediate / advanced)' },
  { key: 'currentWorkouts', about: 'what their current workouts look like' },
  { key: 'otherActivities', about: 'other physical activities they enjoy' },
  { key: 'sittingHours',    about: 'hours a day they spend sitting' },
  { key: 'workoutLocation', about: 'where they prefer to work out (gym / home / both / outdoors)' },
  { key: 'stepsPerDay',     about: 'rough daily step count' },
  { key: 'smartwatch',      about: 'whether they use a smartwatch / fitness tracker' },

  // — Commitment —
  { key: 'trainingDays',    about: 'days a week they can realistically commit to training' },
  { key: 'reduceEatingOut', about: 'whether they are willing to cut back on eating out' },
  { key: 'reduceDrinking',  about: 'whether they are willing to cut back on drinking' },
  { key: 'foodsNotGiveUp',  about: 'foods they are NOT willing to give up' },
  { key: 'healthQuality',   about: 'how their current health affects their daily life' },
  { key: 'anythingElse',    about: 'anything else they want their coach to know' },
];

export const FIELD_KEYS = FIELDS.map(f => f.key);

export function remainingFields(profile, skipped = []) {
  return FIELDS.filter(f => !(f.key in profile) && !skipped.includes(f.key));
}
