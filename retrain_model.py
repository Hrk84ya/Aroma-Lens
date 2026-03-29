import os
import sys
from pathlib import Path

# Add the current directory to Python path
sys.path.append(str(Path(__file__).parent))

# Import the training function from improved_model
from improved_model import main as train_model

def main():
    print("Starting model training...")
    
    try:
        # Train a new model — returns a dict with 'model', 'metrics', 'dataset_info'
        train_result = train_model()
        
        if train_result is None:
            print("\nError: Model training failed.")
            return 1
        
        # Print training metrics
        metrics = train_result.get('metrics', {})
        print(f"\nModel trained successfully!")
        print(f"  R² Score: {metrics.get('r2', 'N/A'):.4f}")
        print(f"  RMSE:     {metrics.get('rmse', 'N/A'):.4f}")
        print(f"  MAPE:     {metrics.get('mape', 'N/A'):.2f}%")
        
        # List saved models
        model_dir = 'models'
        if os.path.isdir(model_dir):
            model_files = sorted(
                [f for f in os.listdir(model_dir) if f.endswith('.pkl')],
                key=lambda x: os.path.getmtime(os.path.join(model_dir, x)),
                reverse=True
            )
            if model_files:
                latest = os.path.join(model_dir, model_files[0])
                print(f"\nLatest model: {latest}")
                print("You can now run the Flask application with the new model.")
            
    except Exception as e:
        print(f"\nError during model training: {str(e)}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
