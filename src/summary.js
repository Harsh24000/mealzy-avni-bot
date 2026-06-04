export function buildSummary(d) {
  const v = (val) => val || '—';
  return `*MEALZY ONBOARDING — PROFILE SUMMARY*

*1. About You*
Name: ${v(d.name)}
Age: ${v(d.age)}
Height: ${v(d.height)}
Weight: ${v(d.weight)}
Profession: ${v(d.profession)}
Sex: ${v(d.sex)}

*2. Diet & Food*
Diet type: ${v(d.dietType)}
Food dislikes: ${v(d.foodDislikes)}
Cuisines: ${v(d.cuisines)}

*3. Your Day*
Daily routine: ${v(d.dailyRoutine)}
Current diet: ${v(d.currentDiet)}
Weekend: ${v(d.weekend)}

*4. Health*
Conditions: ${v(d.conditions)}
Allergies: ${v(d.allergies)}
Medications: ${v(d.medications)}
Digestive issues: ${v(d.digestiveIssues)}
Injuries: ${v(d.injuries)}

*5. Supplements & Habits*
Supplements: ${v(d.supplements)}
Protein history: ${v(d.proteinHistory)}
Smoking: ${v(d.smoking)}
Alcohol: ${v(d.alcohol)}
Eating out: ${v(d.eatingOut)}

*6. Sleep & Stress*
Stress level: ${v(d.stressLevel)}/10
Sleep quality: ${v(d.sleepQuality)}/10
Restless sleep: ${v(d.sleepRestless)}
Wakes refreshed: ${v(d.wakeRefreshed)}
Meditates: ${v(d.meditates)}
Stressors: ${v(d.stressors)}

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
Owns food scale: ${v(d.foodScale)}
Food wishlist: ${v(d.foodWishlist)}
Sweet cravings: ${v(d.sweetCravings)}

*9. Your Goals*
Fitness goals: ${v(d.fitnessGoals)}
Body goal: ${v(d.bodyGoal)}
Timeline: ${v(d.timeline)}
Why: ${v(d.whyGoal)}
Previous attempts: ${v(d.previousAttempts)}
Coach experience: ${v(d.coachExp)}
Biggest barrier: ${v(d.biggestBarrier)}
Performance goals: ${v(d.performanceGoals)}
Health affects life: ${v(d.healthQuality)}
Feel if achieve: ${v(d.feelIfAchieve)}
Feel if don't: ${v(d.feelIfNot)}

*10. Commitment*
Training days/week: ${v(d.trainingDays)}
Reduce eating out: ${v(d.reduceEatingOut)}
Reduce drinking: ${v(d.reduceDrinking)}
Won't give up: ${v(d.foodsNotGiveUp)}
Extra notes: ${v(d.anythingElse)}

*11. Body Photos*
Front: ${d.photoFront ? 'Received' : '—'}
Back: ${d.photoBack ? 'Received' : '—'}
Left: ${d.photoLeft ? 'Received' : '—'}
Right: ${d.photoRight ? 'Received' : '—'}

*12. Daily Activity*
Smart watch: ${v(d.smartwatch)}
Steps/day: ${v(d.stepsPerDay)}
Sleep hours/night: ${v(d.sleepHours)}`;
}
