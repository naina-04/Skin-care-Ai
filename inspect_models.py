import torch
import sys

def inspect_model(path):
    try:
        print(f"Loading {path}...")
        model = torch.load(path, map_location=torch.device('cpu'))
        
        if isinstance(model, dict):
            print("Model is a state_dict.")
            # Print keys to get an idea of the architecture (e.g., 'resnet', 'efficientnet', etc.)
            keys = list(model.keys())
            print(f"Number of layers: {len(keys)}")
            print("First 10 keys:")
            for k in keys[:10]:
                print(f"  {k}")
            
            # Try to guess output classes from the last layer
            last_key = keys[-1]
            if 'bias' in last_key or 'weight' in last_key:
                print(f"Last layer shape ({last_key}): {model[last_key].shape}")
        else:
            print("Model is a full saved model object.")
            print("Type:", type(model))
            print(model)
            
    except Exception as e:
        print(f"Error loading {path}: {e}")
    print("-" * 40)

if __name__ == "__main__":
    inspect_model("models/model1.pth")
    inspect_model("models/skin_model2.pth")
