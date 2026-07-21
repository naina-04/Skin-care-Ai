import os
import torch
import torchvision.models as models
from fastapi import FastAPI, UploadFile, File
from PIL import Image
from torchvision import transforms
import io

app = FastAPI()

# Device configuration
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

# --- 1. Define Model Architectures ---

# Model 1: ResNet-50 (11 Classes)
try:
    model1 = models.resnet50()
    model1.fc = torch.nn.Linear(model1.fc.in_features, 11)
    model1.load_state_dict(torch.load('../models/model1.pth', map_location=device))
    model1 = model1.to(device)
    model1.eval()
    print("Successfully loaded model1.pth (ResNet-50, 11 classes)")
except Exception as e:
    print(f"Failed to load model1.pth: {e}")
    model1 = None

# Model 2: ResNet-34 (7 Classes)
try:
    model2 = models.resnet34()
    model2.fc = torch.nn.Linear(model2.fc.in_features, 7)
    model2.load_state_dict(torch.load('../models/skin_model2.pth', map_location=device))
    model2 = model2.to(device)
    model2.eval()
    print("Successfully loaded skin_model2.pth (ResNet-34, 7 classes)")
except Exception as e:
    print(f"Failed to load skin_model2.pth: {e}")
    model2 = None


# --- 2. Define Image Preprocessing ---
preprocess = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])

# --- 3. Define Class Names ---
MODEL1_CLASSES = [
    "Acne", "Pimples", "Blackheads", "Whiteheads", "Dark Spots", 
    "Pigmentation", "Hyperpigmentation", "Wrinkles", "Fine Lines", "Pores", "Rosacea"
]
MODEL2_CLASSES = [
    "Oiliness", "Dryness", "Redness", "Sensitivity", 
    "Sun Damage", "Melasma", "Eczema"
]

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if model1 is None and model2 is None:
        return {"error": "Models failed to load on server startup."}

    # Read image
    contents = await file.read()
    try:
        image = Image.open(io.BytesIO(contents)).convert("RGB")
    except Exception:
        return {"error": "Invalid image file."}

    # Preprocess
    input_tensor = preprocess(image)
    input_batch = input_tensor.unsqueeze(0).to(device)

    results = {}

    with torch.no_grad():
        if model1 is not None:
            output1 = model1(input_batch)
            prob1 = torch.nn.functional.softmax(output1[0], dim=0)
            conf1, idx1 = torch.max(prob1, 0)
            results["model1_prediction"] = {
                "class_index": idx1.item(),
                "class_name": MODEL1_CLASSES[idx1.item()],
                "confidence": conf1.item()
            }

        if model2 is not None:
            output2 = model2(input_batch)
            prob2 = torch.nn.functional.softmax(output2[0], dim=0)
            conf2, idx2 = torch.max(prob2, 0)
            results["model2_prediction"] = {
                "class_index": idx2.item(),
                "class_name": MODEL2_CLASSES[idx2.item()],
                "confidence": conf2.item()
            }

    return results

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
