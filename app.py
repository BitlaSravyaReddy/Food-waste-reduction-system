import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.preprocessing import LabelEncoder, MinMaxScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import xgboost as xgb
from datetime import datetime, timedelta
from collections import Counter, defaultdict
import holidays
import json
import warnings
from flask import Flask, render_template, jsonify, request, send_from_directory
warnings.filterwarnings('ignore')

app = Flask(__name__)

# Enhanced nutritional information with seasonal ingredients and health tags
NUTRITION_INFO = {
    'Sambar Rice': {
        'calories': 250, 'protein': 6, 'carbs': 45, 'fiber': 4,
        'vitamins': ['A', 'C', 'B6'],
        'minerals': ['Iron', 'Potassium'],
        'ingredients': ['rice', 'toor dal', 'tomato', 'carrot', 'drumstick'],
        'seasonal_ingredients': {
            'Summer': ['drumstick', 'tomato'],
            'Winter': ['carrot', 'spinach'],
            'Monsoon': ['onion', 'potato'],
            'Post-Monsoon': ['tomato', 'carrot']
        },
        'health_tags': ['protein-rich', 'fiber-rich', 'balanced-meal']
    },
    'Dosa': {
        'calories': 120, 'protein': 3, 'carbs': 20, 'fiber': 1,
        'vitamins': ['B12', 'D'],
        'minerals': ['Iron', 'Calcium'],
        'ingredients': ['rice', 'urad dal', 'fenugreek'],
        'seasonal_ingredients': {
            'Summer': ['coconut chutney'],
            'Winter': ['tomato chutney'],
            'Monsoon': ['mint chutney'],
            'Post-Monsoon': ['peanut chutney']
        },
        'health_tags': ['fermented', 'probiotic']
    },
    'Idli': {
        'calories': 80, 'protein': 2, 'carbs': 15, 'fiber': 1,
        'vitamins': ['B12', 'D'],
        'minerals': ['Iron', 'Calcium'],
        'ingredients': ['rice', 'urad dal', 'fenugreek'],
        'seasonal_ingredients': {
            'Summer': ['coconut chutney'],
            'Winter': ['tomato chutney'],
            'Monsoon': ['mint chutney'],
            'Post-Monsoon': ['peanut chutney']
        },
        'health_tags': ['fermented', 'probiotic', 'low-calorie']
    },
    'biryani': {
        'calories': 400, 'protein': 15, 'carbs': 50, 'fiber': 3,
        'vitamins': ['A', 'B12', 'D'],
        'minerals': ['Iron', 'Zinc'],
        'ingredients': ['rice', 'vegetables', 'spices'],
        'seasonal_ingredients': {
            'Summer': ['mint', 'cucumber raita'],
            'Winter': ['potato', 'cauliflower'],
            'Monsoon': ['mushroom'],
            'Post-Monsoon': ['green peas']
        },
        'health_tags': ['protein-rich', 'complete-meal']
    }
    # Add more meals with detailed information
}

# Default nutritional values for unknown meals
DEFAULT_NUTRITION = {
    'calories': 250, 'protein': 6, 'carbs': 40, 'fiber': 3,
    'vitamins': ['B12'],
    'minerals': ['Iron'],
    'ingredients': ['mixed'],
    'seasonal_ingredients': {},
    'health_tags': ['balanced']
}

class NutritionalOptimizer:
    def __init__(self):
        self.daily_targets = {
            'calories': {'min': 1800, 'max': 2200},
            'protein': {'min': 50, 'max': 70},
            'carbs': {'min': 225, 'max': 325},
            'fiber': {'min': 25, 'max': 35}
        }
        self.vitamin_weekly_targets = {
            'A': 2, 'B12': 3, 'C': 4, 'D': 2, 'B6': 3
        }
        self.mineral_weekly_targets = {
            'Iron': 3, 'Calcium': 4, 'Zinc': 2, 'Potassium': 3
        }
    
    def calculate_meal_score(self, meal, daily_nutrition, weekly_nutrition):
        """Calculate a meal's suitability score based on nutritional needs"""
        score = 1.0
        nutrition = NUTRITION_INFO.get(meal, DEFAULT_NUTRITION)
        
        # Check if meal would exceed daily maximums
        for nutrient in ['calories', 'protein', 'carbs', 'fiber']:
            current = daily_nutrition.get(nutrient, 0)
            target = self.daily_targets[nutrient]
            if current + nutrition[nutrient] > target['max']:
                score *= 0.5
            elif current < target['min'] and nutrition[nutrient] > 0:
                score *= 1.2
        
        # Check vitamin and mineral weekly targets
        for vitamin in nutrition['vitamins']:
            if weekly_nutrition.get(f'vitamin_{vitamin}', 0) < self.vitamin_weekly_targets.get(vitamin, 0):
                score *= 1.1
        
        for mineral in nutrition['minerals']:
            if weekly_nutrition.get(f'mineral_{mineral}', 0) < self.mineral_weekly_targets.get(mineral, 0):
                score *= 1.1
        
        return score

class MealVarietyOptimizer:
    def __init__(self):
        self.max_repeat_days = 3
        self.variety_categories = {
            'grain_based': ['Dosa', 'Idli', 'Rice'],
            'protein_rich': ['biryani', 'chole bhathure'],
            'fiber_rich': ['Sambar Rice', 'Vegetable Kurma']
        }
    
    def calculate_variety_score(self, meal, meal_history):
        """Calculate variety score based on recent meal history"""
        score = 1.0
        
        # Penalize recently consumed meals
        if meal in meal_history[:self.max_repeat_days]:
            score *= 0.6
        
        # Penalize meals from same category
        meal_category = None
        for category, meals in self.variety_categories.items():
            if meal in meals:
                meal_category = category
                break
        
        if meal_category:
            for hist_meal in meal_history[:self.max_repeat_days]:
                if hist_meal in self.variety_categories.get(meal_category, []):
                    score *= 0.8
        
        return score

class SeasonalityOptimizer:
    def __init__(self):
        self.seasonal_boost = 1.3
        self.offseason_penalty = 0.7
    
    def get_season_score(self, meal, date):
        """Calculate seasonal appropriateness score"""
        nutrition = NUTRITION_INFO.get(meal, DEFAULT_NUTRITION)
        season = self._get_indian_season(date)
        
        if season in nutrition.get('seasonal_ingredients', {}):
            return self.seasonal_boost
        return self.offseason_penalty
    
    def _get_indian_season(self, date):
        month = date.month
        if month in [12, 1, 2]:
            return 'Winter'
        elif month in [3, 4, 5]:
            return 'Summer'
        elif month in [6, 7, 8, 9]:
            return 'Monsoon'
        else:
            return 'Post-Monsoon'

class UserPreferences:
    def __init__(self):
        self.preferences = {
            'vegetarian': True,
            'spice_level': 'medium',
            'calories_target': 2000,
            'protein_target': 60,
            'preferred_meals': [],
            'avoided_meals': [],
            'allergies': [],
            'health_goals': [],
            'meal_size_preference': 'medium',
            'preferred_meal_times': {
                'breakfast': '08:00',
                'lunch': '13:00',
                'dinner': '20:00'
            }
        }
        self.health_goal_boosts = {
            'weight_loss': {'low-calorie': 1.3, 'fiber-rich': 1.2},
            'muscle_gain': {'protein-rich': 1.3, 'balanced-meal': 1.2},
            'diabetes_friendly': {'low-carb': 1.3, 'fiber-rich': 1.2},
            'heart_healthy': {'low-fat': 1.3, 'omega-rich': 1.2}
        }
    
    def update_preferences(self, **kwargs):
        """Update user preferences"""
        self.preferences.update(kwargs)
    
    def is_suitable_meal(self, meal):
        """Check if meal is suitable based on preferences"""
        nutrition = NUTRITION_INFO.get(meal, DEFAULT_NUTRITION)
        
        # Check allergies
        for allergen in self.preferences['allergies']:
            if allergen in nutrition['ingredients']:
                return False
        
        # Check avoided meals
        if meal in self.preferences['avoided_meals']:
            return False
        
        return True
    
    def get_meal_score(self, meal, daily_nutrition, time_of_day=None):
        """Score a meal based on user preferences and health goals"""
        if not self.is_suitable_meal(meal):
            return 0
        
        score = 1.0
        nutrition = NUTRITION_INFO.get(meal, DEFAULT_NUTRITION)
        
        # Preferred meals boost
        if meal in self.preferences['preferred_meals']:
            score *= 1.5
        
        # Health goals boost
        for goal in self.preferences['health_goals']:
            if goal in self.health_goal_boosts:
                for tag, boost in self.health_goal_boosts[goal].items():
                    if tag in nutrition['health_tags']:
                        score *= boost
        
        # Meal size preference
        if self.preferences['meal_size_preference'] == 'small' and nutrition['calories'] < 200:
            score *= 1.2
        elif self.preferences['meal_size_preference'] == 'large' and nutrition['calories'] > 400:
            score *= 1.2
        
        # Time of day preference
        if time_of_day:
            preferred_time = self.preferences['preferred_meal_times'].get(time_of_day)
            if preferred_time:
                current_time = datetime.now().strftime('%H:%M')
                if current_time == preferred_time:
                    score *= 1.2
        
        return score

class MealPredictionModel:
    def __init__(self, n_estimators=100):
        self.model = xgb.XGBClassifier(
            n_estimators=n_estimators,
            learning_rate=0.1,
            max_depth=6,
            random_state=42
        )
        self.label_encoder = LabelEncoder()
        self.scaler = MinMaxScaler()
        self.indian_holidays = holidays.India()
        self.known_meals = set()
        self.meal_combinations = defaultdict(Counter)
        self.user_prefs = UserPreferences()
        self.nutritional_optimizer = NutritionalOptimizer()
        self.variety_optimizer = MealVarietyOptimizer()
        self.seasonality_optimizer = SeasonalityOptimizer()
        
    def _get_meal_nutrition(self, meal):
        """Get nutritional information for a meal"""
        return NUTRITION_INFO.get(meal, DEFAULT_NUTRITION)
    
    def _calculate_daily_nutrition(self, meals):
        """Calculate total nutrition for a list of meals"""
        totals = {'calories': 0, 'protein': 0, 'carbs': 0, 'fiber': 0}
        for meal in meals:
            nutrition = self._get_meal_nutrition(meal)
            for key in totals:
                totals[key] += nutrition[key]
        return totals
    
    def _add_nutritional_features(self, df):
        """Add nutritional features to the DataFrame"""
        for nutrient in ['calories', 'protein', 'carbs', 'fiber']:
            df[f'meal_{nutrient}'] = df['Meal'].map(
                lambda x: self._get_meal_nutrition(x)[nutrient]
            )
            
            # Calculate running daily totals
            df[f'daily_{nutrient}'] = df.groupby(df['Date'].dt.date)[f'meal_{nutrient}'].cumsum()
            
            # Calculate percentage of daily target
            target = self.user_prefs.preferences.get(f'{nutrient}_target', 2000)
            df[f'{nutrient}_percent'] = df[f'daily_{nutrient}'] / target
    
    def _update_meal_combinations(self, df):
        """Update meal combination patterns"""
        for date, group in df.groupby(df['Date'].dt.date):
            meals = group['Meal'].tolist()
            for i in range(len(meals)-1):
                self.meal_combinations[meals[i]][meals[i+1]] += 1
    
    def prepare_features(self, df):
        """Prepare features with enhanced engineering"""
        df = df.copy()
        df['Date'] = pd.to_datetime(df['Date'])
        
        # Basic date features
        df['day_of_week'] = df['Date'].dt.dayofweek
        df['month'] = df['Date'].dt.month
        df['is_weekend'] = (df['day_of_week'] >= 5).astype(int)
        df['day_of_month'] = df['Date'].dt.day
        df['hour'] = df['Date'].dt.hour
        
        # Season and temperature
        df['season'] = df['Date'].apply(self.seasonality_optimizer._get_indian_season)
        df['temp_factor'] = self._approximate_temperature(df['Date'])
        
        # Holiday and special days
        df['is_holiday'] = df['Date'].apply(lambda x: x in self.indian_holidays).astype(int)
        df['days_to_next_holiday'] = df['Date'].apply(self._days_to_next_holiday)
        
        # Meal patterns
        meal_counts = df['Meal'].value_counts()
        df['meal_frequency'] = df['Meal'].map(meal_counts)
        df = self._add_previous_meals(df)
        
        # Nutritional features
        self._add_nutritional_features(df)
        self._add_health_tag_features(df)
        
        # Meal combination features
        df['next_meal_prob'] = 0.0
        if len(self.meal_combinations) > 0:
            df['next_meal_prob'] = df.apply(
                lambda row: self.meal_combinations[row['Meal']].most_common(1)[0][1]
                if row['Meal'] in self.meal_combinations and len(self.meal_combinations[row['Meal']]) > 0
                else 0,
                axis=1
            )
        
        # One-hot encode categorical variables
        df = pd.get_dummies(df, columns=['season'])
        
        return df
    
    def _add_health_tag_features(self, df):
        """Add features based on health tags"""
        for tag in ['protein-rich', 'fiber-rich', 'low-calorie', 'balanced-meal']:
            df[f'is_{tag}'] = df['Meal'].map(
                lambda x: tag in NUTRITION_INFO.get(x, DEFAULT_NUTRITION)['health_tags']
            ).astype(int)
    
    def _days_to_next_holiday(self, date):
        """Calculate days until next holiday"""
        next_holiday = min((d for d in self.indian_holidays if d > date), default=date)
        return (next_holiday - date).days
    
    def _approximate_temperature(self, dates):
        """Create approximate temperature factor based on date"""
        # Simplified temperature approximation using sine wave
        days = dates.dt.dayofyear
        temp_factor = np.sin(2 * np.pi * (days - 45) / 365)  # Peak in mid-June
        return temp_factor
    
    def _add_previous_meals(self, df):
        """Add features for previous meals"""
        df = df.copy()
        
        # Initialize previous meal columns
        for i in range(1, 4):
            df[f'prev_meal_{i}'] = df['Meal'].shift(i)
            
        # Fill NaN with most common meal instead of 'Unknown'
        most_common_meal = df['Meal'].mode()[0]
        prev_meal_cols = [f'prev_meal_{i}' for i in range(1, 4)]
        df[prev_meal_cols] = df[prev_meal_cols].fillna(most_common_meal)
        
        # Calculate meal variety
        df['unique_meals_last_3_days'] = df.apply(
            lambda row: len(set([row[f'prev_meal_{i}'] for i in range(1, 4)])),
            axis=1
        )
        
        return df
    
    def train(self, df):
        """Train the model with the given data"""
        # Store known meals and update combinations
        self.known_meals = set(df['Meal'].unique())
        self._update_meal_combinations(df)
        
        # Prepare features
        df = self.prepare_features(df)
        
        # Encode meals
        df['meal_encoded'] = self.label_encoder.fit_transform(df['Meal'])
        
        # Prepare feature matrix
        self.feature_cols = [
            'day_of_week', 'month', 'is_weekend', 'day_of_month',
            'is_holiday', 'meal_frequency', 'unique_meals_last_3_days',
            'temp_factor', 'calories_percent', 'protein_percent',
            'carbs_percent', 'fiber_percent', 'next_meal_prob'
        ] + [col for col in df.columns if col.startswith('season_')]
        
        # Add previous meals encoding
        for i in range(1, 4):
            prev_meal_encoded = self.label_encoder.transform(df[f'prev_meal_{i}'])
            df[f'prev_meal_{i}_encoded'] = prev_meal_encoded
            self.feature_cols.append(f'prev_meal_{i}_encoded')
        
        X = df[self.feature_cols].values
        y = df['meal_encoded'].values
        
        # Scale features
        X = self.scaler.fit_transform(X)
        
        # Split the data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        # Train the model
        self.model.fit(
            X_train, 
            y_train,
            eval_set=[(X_test, y_test)],
            verbose=False
        )
        
        # Make predictions on test set
        y_pred = self.model.predict(X_test)
        
        # Calculate accuracy
        accuracy = accuracy_score(y_test, y_pred)
        
        # Generate classification report
        report = classification_report(
            y_test, 
            y_pred, 
            target_names=self.label_encoder.classes_,
            zero_division=0
        )
        
        # Calculate feature importance
        feature_importance = pd.DataFrame({
            'feature': self.feature_cols,
            'importance': self.model.feature_importances_
        }).sort_values('importance', ascending=False)
        
        return {
            'accuracy': accuracy,
            'report': report,
            'test_size': len(y_test),
            'feature_importance': feature_importance
        }
    
    def predict_next_meal(self, date=None, previous_meals=None, daily_nutrition=None, weekly_nutrition=None, time_of_day=None):
        """Predict next meal with enhanced optimization"""
        if date is None:
            date = datetime.now()
            
        if previous_meals is None:
            previous_meals = [list(self.known_meals)[0]] * 3
            
        if daily_nutrition is None:
            daily_nutrition = {'calories': 0, 'protein': 0, 'carbs': 0, 'fiber': 0}
            
        if weekly_nutrition is None:
            weekly_nutrition = {}
        
        # Get base predictions from the model
        pred_df = self._prepare_prediction_data(date, previous_meals)
        base_probabilities = self.model.predict_proba(self._prepare_features(pred_df))
        
        # Calculate final scores with all optimizers
        final_scores = []
        for idx, base_prob in enumerate(base_probabilities[0]):
            meal = self.label_encoder.classes_[idx]
            
            # Skip unsuitable meals
            if not self.user_prefs.is_suitable_meal(meal):
                continue
            
            # Calculate various scores
            nutritional_score = self.nutritional_optimizer.calculate_meal_score(
                meal, daily_nutrition, weekly_nutrition
            )
            variety_score = self.variety_optimizer.calculate_variety_score(
                meal, previous_meals
            )
            seasonal_score = self.seasonality_optimizer.get_season_score(
                meal, date
            )
            preference_score = self.user_prefs.get_meal_score(
                meal, daily_nutrition, time_of_day
            )
            
            # Combine scores
            final_score = (
                base_prob * 0.4 +
                nutritional_score * 0.2 +
                variety_score * 0.2 +
                seasonal_score * 0.1 +
                preference_score * 0.1
            )
            
            final_scores.append((meal, final_score))
        
        # Sort by final score
        final_scores.sort(key=lambda x: x[1], reverse=True)
        
        # Return top 3 predictions with details
        predictions = []
        for meal, score in final_scores[:3]:
            nutrition = NUTRITION_INFO.get(meal, DEFAULT_NUTRITION)
            predictions.append({
                'meal': meal,
                'probability': score,
                'nutrition': nutrition,
                'seasonal_ingredients': nutrition['seasonal_ingredients'].get(
                    self.seasonality_optimizer._get_indian_season(date), []
                ),
                'health_tags': nutrition['health_tags']
            })
        
        return predictions

# Global model instance
model = None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/static/<path:path>')
def serve_static(path):
    return send_from_directory('static', path)

@app.route('/api/predict_meal')
def predict_meal():
    meal_time = request.args.get('meal_time', 'breakfast')
    date = datetime.now()
    
    # Get user preferences from the request
    user_prefs = request.args.get('preferences', {})
    if isinstance(user_prefs, str):
        user_prefs = json.loads(user_prefs)
    
    # Update model preferences
    if user_prefs:
        model.user_prefs.update_preferences(**user_prefs)
    
    # Get predictions
    predictions = model.predict_next_meal(
        date=date,
        time_of_day=meal_time
    )
    
    return jsonify(predictions)

@app.route('/api/update_preferences', methods=['POST'])
def update_preferences():
    preferences = request.json
    model.user_prefs.update_preferences(**preferences)
    return jsonify({"status": "success"})

@app.route('/api/seasonal_ingredients')
def get_seasonal_ingredients():
    current_date = datetime.now()
    season = model.seasonality_optimizer._get_indian_season(current_date)
    
    # Collect all seasonal ingredients for the current season
    seasonal_ingredients = set()
    for meal_info in NUTRITION_INFO.values():
        if season in meal_info.get('seasonal_ingredients', {}):
            seasonal_ingredients.update(meal_info['seasonal_ingredients'][season])
    
    return jsonify(list(seasonal_ingredients))

@app.route('/api/nutrition_stats')
def get_nutrition_stats():
    # Calculate daily averages and weekly totals
    daily_nutrition = {
        'calories': 0,
        'protein': 0,
        'carbs': 0,
        'fiber': 0
    }
    
    weekly_nutrition = defaultdict(int)
    
    # In a real application, you would fetch this from a database
    # For now, we'll return sample data
    return jsonify({
        'daily_averages': daily_nutrition,
        'weekly_totals': dict(weekly_nutrition)
    })

def initialize_model():
    global model
    model = MealPredictionModel()
    
    try:
        # Load training data
        df = pd.read_csv('meals.csv')
        df['Date'] = pd.to_datetime(df['Date'])
        
        # Train the model
        model.train(df)
        print("Model initialized successfully")
    except Exception as e:
        print(f"Error initializing model: {str(e)}")
        model = None

if __name__ == "__main__":
    initialize_model()
    app.run(debug=True)

# Additional utility functions for real data usage

def load_custom_data(file_path):
    """
    Load your custom meal data
    Expected format: CSV with columns ['date', 'meal']
    
    Args:
        file_path (str): Path to your meal data CSV file
        
    Returns:
        pd.DataFrame: Processed meal data
    """
    df = pd.read_csv(file_path)
    df['date'] = pd.to_datetime(df['date'])
    df['day_of_week'] = df['date'].dt.dayofweek
    df['month'] = df['date'].dt.month
    df['is_weekend'] = (df['date'].dt.dayofweek >= 5).astype(int)
    return df.sort_values('date')

def save_model(model, file_path):
    """
    Save trained model and preprocessors
    
    Args:
        model (MealPredictionModel): Trained model
        file_path (str): Path to save the model
    """
    import pickle
    
    model_data = {
        'model': model.model,
        'label_encoder': model.label_encoder,
        'scaler': model.scaler,
        'indian_holidays': model.indian_holidays
    }
    
    with open(file_path, 'wb') as f:
        pickle.dump(model_data, f)
    
    print(f"Model saved to {file_path}")

def load_model(file_path):
    """
    Load saved model and preprocessors
    
    Args:
        file_path (str): Path to the saved model
        
    Returns:
        MealPredictionModel: Loaded model
    """
    import pickle
    
    with open(file_path, 'rb') as f:
        model_data = pickle.load(f)
    
    model = MealPredictionModel()
    model.model = model_data['model']
    model.label_encoder = model_data['label_encoder']
    model.scaler = model_data['scaler']
    model.indian_holidays = model_data['indian_holidays']
    
    return model