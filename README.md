# ☕ Coffee Flavor Predictor

A web app that predicts coffee flavor scores using an ensemble ML model (XGBoost + Random Forest + Gradient Boosting). Dial in your brewing parameters, get a 1–10 score, and track your experiments over time.

## Features

- **Flavor Lab** — predict flavor scores from 9 brewing parameters (method, bean, roast, grind, temp, time, ratio, acidity pref, bitterness pref)
- **My Brews** — prediction history saved to localStorage with stats, filtering, sorting, and one-click parameter reuse
- **Brewing Tools** — brew timer with presets and notifications, plus a coffee-to-water ratio calculator
- **Premium dark UI** — gold/dark theme with animated score ring, glassmorphism cards, and responsive layout
- **Hot reload** — `POST /reload-model` to swap in a new model without restarting the server

## Quick Start

```bash
# Clone and enter the project
git clone https://github.com/Hrk84ya/Aroma-Lens.git
cd Aroma-Lens

# Create a virtual environment
python -m venv venv
source venv/bin/activate  # Windows: .\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the app
python app.py
```

Open `http://localhost:8000` in your browser.

## Retraining the Model

```bash
python retrain_model.py
```

This trains a new ensemble model with Optuna hyperparameter optimization and saves it to `models/`. The Flask app picks up the latest `.pkl` on startup, or you can hot-reload via:

```bash
curl -X POST http://localhost:8000/reload-model
```

## Programmatic Usage

```python
from improved_predict import CoffeeFlavorPredictor

predictor = CoffeeFlavorPredictor('models/coffee_flavor_model_20250816_101933.pkl')

result = predictor.predict({
    'Brewing_Method': 'Pour-over',
    'Bean_Type': 'Arabica',
    'Roast_Level': 'Medium',
    'Grind_Size': 'Medium',
    'Water_Temp_C': 92.0,
    'Brew_Time_sec': 210,
    'Coffee_Water_Ratio': 0.0625,
    'Acidity_Pref': 6.0,
    'Bitterness_Pref': 4.0
})

print(f"Score: {result['prediction']}/10")
print(f"Confidence: {result['confidence']:.0%}")
print(result['interpretation'])
```

## Project Structure

```
├── app.py                    # Flask app with routes and prediction endpoint
├── improved_model.py         # Model training, feature engineering, evaluation
├── improved_predict.py       # CoffeeFlavorPredictor class
├── retrain_model.py          # CLI script to retrain the model
├── synthetic_coffee_dataset.csv
├── requirements.txt
├── models/
│   └── coffee_flavor_model_*.pkl
├── templates/
│   ├── base.html             # Base layout (dark premium theme)
│   ├── index.html            # Flavor Lab (prediction form)
│   ├── my_brews.html         # Prediction history
│   └── brewing_tools.html    # Timer + calculator
└── static/
    ├── css/style.css
    ├── js/
    │   ├── main.js           # Form handling, score ring, localStorage save
    │   ├── my-brews.js       # History rendering, filtering, sorting
    │   └── brewing-tools.js  # Timer and calculator logic
    └── images/
        ├── logo.png
        └── favicon.svg
```

## Tech Stack

- **Backend**: Flask, scikit-learn, XGBoost, Optuna
- **Frontend**: Vanilla JS, CSS (no frameworks), Chart.js
- **ML**: VotingRegressor ensemble (XGBoost + RandomForest + GradientBoosting) with advanced feature engineering and SelectKBest feature selection

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SECRET_KEY` | `dev-key-for-coffee-app` | Flask secret key. Set this in production. |

## License

MIT — see [LICENSE](LICENSE).
