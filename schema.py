from pydantic import BaseModel, Field
from typing import Optional

class AboutYou(BaseModel):
    full_name: Optional[str] = Field(None, description="User's full name")
    age: Optional[int] = Field(None, description="User's age")
    current_height: Optional[str] = Field(None, description="User's current height with unit (e.g., 170 cm)")
    current_weight: Optional[str] = Field(None, description="User's current weight with unit (e.g., 70 kg)")
    profession: Optional[str] = Field(None, description="User's profession")
    biological_sex: Optional[str] = Field(None, description="User's biological sex (Male, Female, Other)")

class DietAndFood(BaseModel):
    dietary_preference: Optional[str] = Field(None, description="Non-Vegetarian, Vegetarian, Eggetarian, Vegan, Jain")
    foods_disliked: Optional[str] = Field(None, description="Foods they dislike or avoid")
    cuisines_enjoyed: Optional[str] = Field(None, description="Cuisines they enjoy")

class YourDay(BaseModel):
    daily_routine: Optional[str] = Field(None, description="Description of current daily routine")
    current_diet: Optional[str] = Field(None, description="Description of current diet")
    average_weekend: Optional[str] = Field(None, description="Description of average weekend")

class Health(BaseModel):
    conditions: Optional[str] = Field(None, description="Any health conditions like Diabetes, Thyroid, PCOS, Hypertension, etc.")
    allergies: Optional[str] = Field(None, description="Allergies or food intolerances")
    medication: Optional[str] = Field(None, description="Current medication")
    digestive_issues: Optional[str] = Field(None, description="Any digestive issues")
    injuries: Optional[str] = Field(None, description="Injuries or physical limitations")

class SupplementsAndHabits(BaseModel):
    supplements: Optional[str] = Field(None, description="Currently used supplements")
    protein_supplement: Optional[str] = Field(None, description="Have they used a protein supplement before?")
    smoking: Optional[str] = Field(None, description="Do they smoke? (No, Occasionally, Regularly)")
    alcohol: Optional[str] = Field(None, description="Do they drink alcohol? (No, Occasionally, Regularly)")
    eating_out: Optional[str] = Field(None, description="How often they eat out")

class SleepAndStress(BaseModel):
    stress_levels: Optional[int] = Field(None, description="Daily stress level rating 1-10")
    sleep_quality: Optional[int] = Field(None, description="Sleep quality rating 1-10")
    sleep_restless: Optional[str] = Field(None, description="Is sleep restless? (Yes/No)")
    wake_up_refreshed: Optional[str] = Field(None, description="Do they wake up feeling refreshed? (Yes/No)")
    meditate: Optional[str] = Field(None, description="Do they meditate? (Yes/No)")
    major_stressors: Optional[str] = Field(None, description="Major stressors in life")

class Fitness(BaseModel):
    active_days: Optional[int] = Field(None, description="Days a week physically active (0-7)")
    resistance_training_exp: Optional[str] = Field(None, description="Resistance training experience (None, Beginner, Intermediate, Advanced)")
    current_workouts: Optional[str] = Field(None, description="What current workouts look like")
    other_activities: Optional[str] = Field(None, description="Other activities enjoyed outside working out")
    hours_sitting: Optional[str] = Field(None, description="Hours spent sitting per day")
    workout_preference: Optional[str] = Field(None, description="Where they prefer to work out (Gym, Home, Both, Outdoors)")

class FoodAndCooking(BaseModel):
    who_cooks: Optional[str] = Field(None, description="Who cooks for them/how they manage meals")
    good_eating_day: Optional[str] = Field(None, description="Description of a really good eating day")
    bad_eating_day: Optional[str] = Field(None, description="Description of a really bad eating day")
    own_weighing_scale: Optional[str] = Field(None, description="Own a food weighing scale? (Yes/No)")
    food_wishlist: Optional[str] = Field(None, description="Foods they want in their plan")
    sweet_cravings: Optional[str] = Field(None, description="Struggle with sweet cravings?")

class YourGoals(BaseModel):
    fitness_goals: Optional[str] = Field(None, description="Fitness goals")
    target_body: Optional[str] = Field(None, description="Kind of body working toward")
    time_to_achieve: Optional[str] = Field(None, description="Time to achieve goal")
    why_achieve: Optional[str] = Field(None, description="Why they want to achieve this goal")
    tried_before: Optional[str] = Field(None, description="Tried achieving this goal before? Approach taken?")
    worked_with_coach: Optional[str] = Field(None, description="Worked with coach before? Experience?")
    biggest_barrier: Optional[str] = Field(None, description="Biggest barrier to achieving goal")
    performance_goals: Optional[str] = Field(None, description="Specific performance goals")
    health_status_impact: Optional[str] = Field(None, description="How current health status affects life")
    feel_if_achieve: Optional[str] = Field(None, description="How they will feel if they achieve goal")
    feel_if_dont_achieve: Optional[str] = Field(None, description="How they will feel if they don't achieve goal")

class Commitment(BaseModel):
    training_commitment: Optional[int] = Field(None, description="Days per week willing to commit to training")
    stop_eating_out: Optional[str] = Field(None, description="Willing to stop/reduce eating out? (Yes/No)")
    stop_drinking: Optional[str] = Field(None, description="Willing to stop/reduce drinking? (Yes/No)")
    untouchable_foods: Optional[str] = Field(None, description="Food groups not willing to give up")
    other_info: Optional[str] = Field(None, description="Anything else coach should know")

class DailyActivity(BaseModel):
    use_fitness_tracker: Optional[str] = Field(None, description="Use a smart watch or fitness tracker? (Yes/No)")
    steps_per_day: Optional[int] = Field(None, description="Steps walked per day")
    sleep_hours: Optional[int] = Field(None, description="Hours of sleep per night")

class UserProfile(BaseModel):
    about_you: AboutYou = Field(default_factory=AboutYou)
    diet_and_food: DietAndFood = Field(default_factory=DietAndFood)
    your_day: YourDay = Field(default_factory=YourDay)
    health: Health = Field(default_factory=Health)
    supplements_habits: SupplementsAndHabits = Field(default_factory=SupplementsAndHabits)
    sleep_stress: SleepAndStress = Field(default_factory=SleepAndStress)
    fitness: Fitness = Field(default_factory=Fitness)
    food_cooking: FoodAndCooking = Field(default_factory=FoodAndCooking)
    your_goals: YourGoals = Field(default_factory=YourGoals)
    commitment: Commitment = Field(default_factory=Commitment)
    daily_activity: DailyActivity = Field(default_factory=DailyActivity)
