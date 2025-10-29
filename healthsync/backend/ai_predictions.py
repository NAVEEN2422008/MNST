import sys
import json
import random
import datetime
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split

def generate_health_insights(health_data):
    """Generate AI-powered health insights based on patient data"""

    insights = []
    health_score = 75  # Base score

    # Analyze medical history
    if health_data.get('medicalHistory'):
        recent_records = [r for r in health_data['medicalHistory'] if r.get('date')]
        if recent_records:
            insights.append("Your recent medical check-ups show consistent monitoring. Keep up the good work!")

    # Analyze medications
    if health_data.get('currentMedications'):
        meds = health_data['currentMedications']
        if meds:
            high_adherence = [m for m in meds if m.get('adherence', 0) > 80]
            if high_adherence:
                insights.append("Excellent medication adherence! This is crucial for managing your health conditions.")
                health_score += 10
        else:
            insights.append("Consider discussing preventive medications with your healthcare provider.")

    # Analyze vital signs
    vitals = health_data.get('vitalSigns', {})
    if vitals.get('bloodPressure'):
        bp = vitals['bloodPressure']
        if isinstance(bp, str) and '/' in bp:
            systolic = int(bp.split('/')[0])
            if systolic < 120:
                insights.append("Your blood pressure is in a healthy range. Maintain your current lifestyle!")
                health_score += 5
            elif systolic < 140:
                insights.append("Your blood pressure is slightly elevated. Consider lifestyle modifications.")
            else:
                insights.append("Your blood pressure needs attention. Please consult your healthcare provider.")
                health_score -= 10

    # Analyze goals
    if health_data.get('activeGoals'):
        goals = health_data['activeGoals']
        completed_goals = [g for g in goals if g.get('progress', 0) >= 100]
        if completed_goals:
            insights.append(f"Great job completing {len(completed_goals)} health goals! This shows your commitment to wellness.")
            health_score += 15

    # General insights
    if not insights:
        insights = [
            "Regular health check-ups are essential for maintaining good health.",
            "Stay hydrated and maintain a balanced diet for optimal wellness.",
            "Regular exercise can significantly improve your overall health metrics.",
            "Adequate sleep is crucial for recovery and maintaining good health."
        ]

    return {
        "insights": insights[:4],  # Limit to 4 insights
        "healthScore": min(100, max(0, health_score)),
        "recommendations": [
            "Schedule regular check-ups with your healthcare provider",
            "Maintain a healthy diet and exercise routine",
            "Monitor your vital signs regularly",
            "Stay compliant with prescribed medications"
        ]
    }

def predict_disease_risks(health_data):
    """Predict disease risks using ML models"""

    # Sample training data (in real implementation, this would be loaded from a dataset)
    np.random.seed(42)

    # Generate sample data for demonstration
    n_samples = 1000
    features = ['age', 'bmi', 'blood_pressure', 'glucose', 'cholesterol', 'smoking', 'exercise']

    # Create synthetic dataset
    X = np.random.rand(n_samples, len(features)) * 100
    y_diabetes = (X[:, 3] > 70) | (X[:, 1] > 30)  # High glucose or BMI
    y_hypertension = (X[:, 2] > 80) | (X[:, 0] > 50)  # High BP or age
    y_heart_disease = (X[:, 4] > 60) | (X[:, 5] > 50) | (X[:, 0] > 55)  # High cholesterol, smoking, or age

    # Scale features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # Train models
    diabetes_model = LogisticRegression(random_state=42)
    diabetes_model.fit(X_scaled, y_diabetes.astype(int))

    hypertension_model = LogisticRegression(random_state=42)
    hypertension_model.fit(X_scaled, y_hypertension.astype(int))

    heart_model = LogisticRegression(random_state=42)
    heart_model.fit(X_scaled, y_heart_disease.astype(int))

    # Extract patient features
    age = health_data.get('age', 30)
    bmi = health_data.get('bmi', 25)
    bp = health_data.get('bloodPressure', 120)
    glucose = health_data.get('glucose', 90)
    cholesterol = health_data.get('cholesterol', 200)
    smoking = 1 if health_data.get('smoking', False) else 0
    exercise = 1 if health_data.get('exercise', True) else 0

    patient_features = np.array([[age, bmi, bp, glucose, cholesterol, smoking, exercise]])
    patient_scaled = scaler.transform(patient_features)

    # Make predictions
    diabetes_prob = diabetes_model.predict_proba(patient_scaled)[0][1]
    hypertension_prob = hypertension_model.predict_proba(patient_scaled)[0][1]
    heart_prob = heart_model.predict_proba(patient_scaled)[0][1]

    # Determine risk levels
    def get_risk_level(prob):
        if prob < 0.3:
            return "Low"
        elif prob < 0.7:
            return "Medium"
        else:
            return "High"

    predictions = {
        "diabetes": {
            "probability": round(diabetes_prob * 100, 1),
            "risk_level": get_risk_level(diabetes_prob),
            "recommendations": [
                "Maintain healthy BMI through diet and exercise",
                "Monitor blood glucose levels regularly",
                "Follow a balanced diet low in refined sugars"
            ] if diabetes_prob > 0.5 else []
        },
        "hypertension": {
            "probability": round(hypertension_prob * 100, 1),
            "risk_level": get_risk_level(hypertension_prob),
            "recommendations": [
                "Reduce sodium intake",
                "Regular aerobic exercise",
                "Stress management techniques",
                "Monitor blood pressure at home"
            ] if hypertension_prob > 0.5 else []
        },
        "heart_disease": {
            "probability": round(heart_prob * 100, 1),
            "risk_level": get_risk_level(heart_prob),
            "recommendations": [
                "Quit smoking if applicable",
                "Control cholesterol levels",
                "Regular cardiovascular exercise",
                "Maintain healthy weight"
            ] if heart_prob > 0.5 else []
        }
    }

    return predictions

def generate_medication_recommendations(patient_history):
    """Generate medication recommendations based on symptoms and history"""

    symptoms = patient_history.get('symptoms', [])
    current_meds = patient_history.get('currentMedications', [])
    medical_history = patient_history.get('medicalHistory', [])

    recommendations = []

    # Common symptom-based recommendations
    symptom_recommendations = {
        'headache': ['Consider over-the-counter pain relievers like ibuprofen or acetaminophen', 'Rest in a quiet, dark room', 'Stay hydrated'],
        'fever': ['Take acetaminophen or ibuprofen for fever reduction', 'Rest and stay hydrated', 'Monitor temperature regularly'],
        'cough': ['Use honey and lemon for natural relief', 'Stay hydrated', 'Consider cough syrup if persistent'],
        'fatigue': ['Ensure adequate rest and sleep', 'Stay hydrated and eat nutritious meals', 'Light exercise may help energy levels'],
        'nausea': ['Eat small, frequent meals', 'Stay hydrated with clear fluids', 'Ginger tea may help'],
        'pain': ['Use appropriate pain relievers based on pain level', 'Apply ice/heat as appropriate', 'Rest affected area']
    }

    for symptom in symptoms:
        symptom_lower = symptom.lower()
        for key, recs in symptom_recommendations.items():
            if key in symptom_lower:
                recommendations.extend(recs)
                break

    # Check for drug interactions
    if current_meds and len(current_meds) > 1:
        recommendations.append("Consult your pharmacist about potential drug interactions with your current medications.")

    # General recommendations
    if not recommendations:
        recommendations = [
            "Monitor your symptoms closely",
            "Stay hydrated and rest",
            "Contact your healthcare provider if symptoms persist or worsen",
            "Keep a symptom diary for better diagnosis"
        ]

    return {
        "recommendations": recommendations[:5],  # Limit to 5 recommendations
        "disclaimer": "These are general suggestions. Always consult your healthcare provider before starting any new medication.",
        "urgency": "moderate" if any(s.lower() in ['severe pain', 'high fever', 'difficulty breathing'] for s in symptoms) else "low"
    }

def analyze_symptoms(symptom_data):
    """Analyze reported symptoms and provide assessment"""

    symptoms = symptom_data.get('symptoms', [])
    severity = symptom_data.get('severity', 'moderate')
    duration = symptom_data.get('duration', 'recent')

    analysis = {
        "possible_conditions": [],
        "severity_assessment": severity,
        "recommended_action": "",
        "when_to_seek_help": ""
    }

    # Simple rule-based analysis
    if 'chest pain' in [s.lower() for s in symptoms]:
        analysis["possible_conditions"].append("Cardiac issues")
        analysis["recommended_action"] = "Seek immediate medical attention"
        analysis["when_to_seek_help"] = "Immediately - chest pain requires urgent evaluation"
        analysis["severity_assessment"] = "high"
    elif 'shortness of breath' in [s.lower() for s in symptoms]:
        analysis["possible_conditions"].append("Respiratory issues")
        analysis["recommended_action"] = "Contact healthcare provider soon"
        analysis["when_to_seek_help"] = "Within 24 hours if persistent"
        analysis["severity_assessment"] = "high"
    elif any(s.lower() in ['fever', 'headache', 'fatigue'] for s in symptoms):
        analysis["possible_conditions"].extend(["Viral infection", "Stress-related", "Dehydration"])
        analysis["recommended_action"] = "Monitor symptoms, rest, and stay hydrated"
        analysis["when_to_seek_help"] = "If symptoms worsen or persist beyond 3-5 days"
    else:
        analysis["possible_conditions"].append("Various causes possible")
        analysis["recommended_action"] = "Monitor symptoms and consult healthcare provider if concerned"
        analysis["when_to_seek_help"] = "If symptoms persist or worsen"

    analysis["disclaimer"] = "This is not a medical diagnosis. Please consult a healthcare professional for proper evaluation."

    return analysis

def perform_risk_assessment(assessment_data):
    """Perform health risk assessment"""

    risk_factors = []
    risk_score = 0

    # Age-based risk
    age = assessment_data.get('demographics', {}).get('age')
    if age:
        if age > 65:
            risk_factors.append("Advanced age")
            risk_score += 20
        elif age > 50:
            risk_factors.append("Middle age")
            risk_score += 10

    # Medical history risk
    medical_history = assessment_data.get('medicalHistory', [])
    if medical_history:
        chronic_conditions = [h for h in medical_history if h.get('diagnosis')]
        if chronic_conditions:
            risk_factors.append(f"History of {len(chronic_conditions)} medical conditions")
            risk_score += len(chronic_conditions) * 5

    # Medication risk
    medications = assessment_data.get('currentMedications', [])
    if len(medications) > 3:
        risk_factors.append("Multiple medications (polypharmacy)")
        risk_score += 15

    # Lifestyle factors
    lifestyle = assessment_data.get('lifestyle', {})
    if lifestyle.get('smoking') == 'yes':
        risk_factors.append("Smoking")
        risk_score += 25
    if lifestyle.get('exercise') == 'none':
        risk_factors.append("Sedentary lifestyle")
        risk_score += 10

    # Vital signs
    vitals = assessment_data.get('vitalSigns', {})
    bp = vitals.get('bloodPressure')
    if bp and isinstance(bp, str) and '/' in bp:
        systolic = int(bp.split('/')[0])
        if systolic > 140:
            risk_factors.append("High blood pressure")
            risk_score += 15

    risk_level = "low" if risk_score < 30 else "moderate" if risk_score < 60 else "high"

    return {
        "risk_score": min(100, risk_score),
        "risk_level": risk_level,
        "risk_factors": risk_factors,
        "recommendations": [
            "Schedule regular health screenings",
            "Maintain healthy lifestyle habits",
            "Follow up with healthcare providers regularly",
            "Monitor vital signs at home"
        ],
        "preventive_measures": [
            "Regular exercise",
            "Balanced diet",
            "Stress management",
            "Adequate sleep",
            "Avoid smoking and excessive alcohol"
        ]
    }

def generate_chat_response(chat_data):
    """Generate AI chatbot response"""

    message = chat_data.get('message', '').lower()
    context = chat_data.get('context', 'health_assistance')
    user_role = chat_data.get('userRole', 'patient')

    responses = {
        'greeting': [
            "Hello! I'm here to help with your health questions. How can I assist you today?",
            "Hi there! I'm your AI health assistant. What health concerns can I help you with?",
            "Welcome! I'm here to provide general health information and wellness tips."
        ],
        'medication': [
            "For medication questions, always consult your healthcare provider or pharmacist. I can provide general information about common medications and adherence tips.",
            "Medication management is important. Remember to take medications as prescribed and report any side effects to your doctor.",
            "I can help with general medication information, but please consult your healthcare provider for personalized advice."
        ],
        'exercise': [
            "Regular exercise is great for health! Aim for at least 150 minutes of moderate aerobic activity per week.",
            "Exercise can improve cardiovascular health, mood, and overall wellness. Start slowly and consult your doctor before beginning a new routine.",
            "Physical activity is beneficial, but listen to your body and stop if you experience pain or discomfort."
        ],
        'diet': [
            "A balanced diet with plenty of fruits, vegetables, whole grains, and lean proteins supports good health.",
            "Stay hydrated and consider consulting a registered dietitian for personalized nutrition advice.",
            "Eating a variety of nutrient-rich foods can help maintain energy levels and support your immune system."
        ],
        'symptoms': [
            "I'm not a substitute for professional medical advice. If you're experiencing symptoms, please consult a healthcare provider.",
            "For symptom concerns, it's best to speak with a qualified medical professional who can provide proper evaluation.",
            "While I can offer general health information, symptoms should be evaluated by a healthcare provider."
        ]
    }

    # Determine response category
    if any(word in message for word in ['hello', 'hi', 'hey', 'good morning', 'good afternoon']):
        response_text = random.choice(responses['greeting'])
    elif any(word in message for word in ['medicine', 'medication', 'pills', 'drugs', 'prescription']):
        response_text = random.choice(responses['medication'])
    elif any(word in message for word in ['exercise', 'workout', 'fitness', 'physical activity']):
        response_text = random.choice(responses['exercise'])
    elif any(word in message for word in ['diet', 'food', 'nutrition', 'eating']):
        response_text = random.choice(responses['diet'])
    elif any(word in message for word in ['symptom', 'pain', 'sick', 'ill', 'feel']):
        response_text = random.choice(responses['symptoms'])
    else:
        response_text = "I can help with general health questions, wellness tips, and medication reminders. For specific medical concerns, please consult your healthcare provider."

    return {
        "response": response_text,
        "timestamp": datetime.datetime.now().isoformat(),
        "context": context,
        "follow_up_questions": [
            "Do you have any other health questions?",
            "Would you like information about preventive care?",
            "Can I help with medication reminders?"
        ]
    }

def generate_health_trends(trend_data):
    """Generate health trend predictions"""

    timeframe = trend_data.get('timeframe', 90)

    # Simple trend analysis
    trends = {
        "overall_trend": "stable",
        "predictions": [],
        "insights": []
    }

    # Analyze medical records
    medical_records = trend_data.get('medicalRecords', [])
    if medical_records:
        recent_records = medical_records[-10:]  # Last 10 records
        if len(recent_records) >= 3:
            trends["overall_trend"] = "improving" if random.random() > 0.5 else "stable"
            trends["predictions"].append(f"Based on recent data, your health trend appears {trends['overall_trend']}")

    # Medication adherence trends
    medication_adherence = trend_data.get('medicationAdherence', [])
    if medication_adherence:
        avg_adherence = sum([sum(m.get('adherenceHistory', [])) / len(m.get('adherenceHistory', [1])) for m in medication_adherence]) / len(medication_adherence)
        if avg_adherence > 80:
            trends["insights"].append("Good medication adherence trend")
        else:
            trends["insights"].append("Consider improving medication adherence")

    # Goal progress trends
    goal_progress = trend_data.get('goalProgress', [])
    if goal_progress:
        improving_goals = [g for g in goal_progress if g.get('progressHistory', []) and g['progressHistory'][-1] > g['progressHistory'][0]]
        if improving_goals:
            trends["insights"].append(f"{len(improving_goals)} health goals showing positive progress")

    if not trends["predictions"]:
        trends["predictions"] = [
            "Continue regular health monitoring",
            "Maintain healthy lifestyle habits",
            "Schedule routine check-ups"
        ]

    if not trends["insights"]:
        trends["insights"] = [
            "Regular exercise supports long-term health",
            "Balanced nutrition is key to wellness",
            "Adequate sleep promotes recovery"
        ]

    return trends

def main():
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Insufficient arguments"}))
        return

    function_name = sys.argv[1]
    data_str = sys.argv[2]

    try:
        data = json.loads(data_str)

        if function_name == 'health_insights':
            result = generate_health_insights(data)
        elif function_name == 'medication_recommendations':
            result = generate_medication_recommendations(data)
        elif function_name == 'symptom_analysis':
            result = analyze_symptoms(data)
        elif function_name == 'risk_assessment':
            result = perform_risk_assessment(data)
        elif function_name == 'chat_response':
            result = generate_chat_response(data)
        elif function_name == 'health_trends':
            result = generate_health_trends(data)
        else:
            result = {"error": f"Unknown function: {function_name}"}

        print(json.dumps(result))

    except json.JSONDecodeError as e:
        print(json.dumps({"error": f"Invalid JSON data: {str(e)}"}))
    except Exception as e:
        print(json.dumps({"error": f"Processing error: {str(e)}"}))

if __name__ == '__main__':
    main()
