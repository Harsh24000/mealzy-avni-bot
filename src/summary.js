export function buildSummary(d) {
  const v  = (val) => val || '—';
  const yn = (val) => val === 'Yes' ? 'Yes' : val === 'No' ? 'No' : (val || '—');

  return `*MEALZY ONBOARDING — CLIENT PROFILE*

*1. About You*
Name: ${v(d.name)}
Age: ${v(d.age)}
Sex: ${v(d.sex)}
Height: ${v(d.height)}
Weight: ${v(d.weight)}
Profession: ${v(d.profession)}

*2. Diet & Food*
Diet type: ${v(d.dietType)}
Food dislikes / avoids: ${v(d.foodDislikes)}
Cuisines enjoyed: ${v(d.cuisines)}

*3. Your Day*
Daily routine: ${v(d.dailyRoutine)}
Current diet: ${v(d.currentDiet)}
Weekends: ${v(d.weekend)}

*4. Health*
Medical conditions: ${v(d.conditions)}
Allergies / intolerances: ${v(d.allergies)}
Medications: ${v(d.medications)}
Digestive issues: ${v(d.digestiveIssues)}
Injuries / limitations: ${v(d.injuries)}

*5. Supplements & Habits*
Current supplements: ${v(d.supplements)}
Protein supplement history: ${v(d.proteinHistory)}
Smoking: ${v(d.smoking)}
Alcohol: ${v(d.alcohol)}
Eats out / orders in: ${v(d.eatingOut)}

*6. Sleep & Stress*
Stress level: ${v(d.stressLevel)}/10
Sleep quality: ${v(d.sleepQuality)}/10
Sleep restless: ${yn(d.sleepRestless)}
Wakes refreshed: ${yn(d.wakeRefreshed)}
Meditates: ${yn(d.meditates)}
Main stressors: ${v(d.stressors)}
Sleep hours/night: ${v(d.sleepHours)}

*7. Fitness*
Active days/week: ${v(d.activeDays)}
Training experience: ${v(d.trainingExp)}
Current workouts: ${v(d.currentWorkouts)}
Other activities: ${v(d.otherActivities)}
Sitting hours/day: ${v(d.sittingHours)}
Workout location: ${v(d.workoutLocation)}

*8. Food & Cooking*
Cooking situation: ${v(d.cooking)}
Good eating day: ${v(d.goodEatingDay)}
Bad eating day: ${v(d.badEatingDay)}
Owns food scale: ${yn(d.foodScale)}
Food wishlist: ${v(d.foodWishlist)}
Sweet cravings: ${v(d.sweetCravings)}

*9. Goals*
Fitness goals: ${v(d.fitnessGoals)}
Body goal: ${v(d.bodyGoal)}
Timeline: ${v(d.timeline)}
Why this goal: ${v(d.whyGoal)}
Previous attempts: ${v(d.previousAttempts)}
Coach experience: ${v(d.coachExp)}
Biggest barrier: ${v(d.biggestBarrier)}
Performance goals: ${v(d.performanceGoals)}
Health affects life: ${v(d.healthQuality)}
How they'll feel if achieve: ${v(d.feelIfAchieve)}
How they'll feel if don't: ${v(d.feelIfNot)}

*10. Commitment*
Training days/week: ${v(d.trainingDays)}
Willing to reduce eating out: ${yn(d.reduceEatingOut)}
Willing to reduce drinking: ${yn(d.reduceDrinking)}
Not willing to give up: ${v(d.foodsNotGiveUp)}
Extra notes for coach: ${v(d.anythingElse)}

*11. Body Photos*
Front: ${d.photoFront ? 'Received ✓' : '—'}
Back: ${d.photoBack  ? 'Received ✓' : '—'}
Left: ${d.photoLeft  ? 'Received ✓' : '—'}
Right: ${d.photoRight ? 'Received ✓' : '—'}

*12. Daily Activity*
Smart watch / tracker: ${yn(d.smartwatch)}
Steps/day: ${v(d.stepsPerDay)}`;
}
