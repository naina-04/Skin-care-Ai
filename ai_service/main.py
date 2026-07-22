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

# Model 1: EfficientNet B3 (29 Classes)
try:
    model1 = models.efficientnet_b3()
    model1.classifier[1] = torch.nn.Linear(model1.classifier[1].in_features, 29)
    data1 = torch.load('../models/efficientnet_b3_skin_best.pth', map_location=device)
    model1.load_state_dict(data1['model'])
    model1 = model1.to(device)
    model1.eval()
    print("Successfully loaded EfficientNet-B3 (29 classes)")
except Exception as e:
    print(f"Failed to load EfficientNet-B3: {e}")
    model1 = None

# Model 2: EfficientNet V2 S (29 Classes)
try:
    model2 = models.efficientnet_v2_s()
    model2.classifier[1] = torch.nn.Linear(model2.classifier[1].in_features, 29)
    data2 = torch.load('../models/efficientnetv2_s_skin_best.pth', map_location=device)
    model2.load_state_dict(data2['model'])
    model2 = model2.to(device)
    model2.eval()
    print("Successfully loaded EfficientNet-V2-S (29 classes)")
except Exception as e:
    print(f"Failed to load EfficientNet-V2-S: {e}")
    model2 = None

# Model 3: ConvNeXt Scripted (22 Classes)
try:
    model3 = torch.jit.load('../models/skin ai/skinconvnext_scripted.pt', map_location=device)
    model3 = model3.to(device)
    model3.eval()
    print("Successfully loaded ConvNeXt TorchScript (22 classes)")
except Exception as e:
    print(f"Failed to load ConvNeXt: {e}")
    model3 = None


# --- 2. Define Image Preprocessing ---
preprocess = transforms.Compose([
    transforms.Resize(300),
    transforms.CenterCrop(300),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])

# For ConvNeXt, often 224x224 is used, but 300 should work as ConvNeXt is fully convolutional up to the pool.
preprocess_convnext = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])

# --- 3. Define Class Names ---
CLASSES_EFFICIENTNET = [
    'ACK', 'Acne and Rosacea', 'Actinic Keratosis Basal Cell Carcinoma and other Malignant Lesions', 
    'Atopic Dermatitis', 'BCC', 'Bullous Disease', 'Cellulitis Impetigo and other Bacterial Infections', 
    'Eczema', 'Exanthems and Drug Eruptions', 'Hair Loss Alopecia and other Hair Diseases', 
    'Herpes HPV and other STDs', 'Light Diseases and Disorders of Pigmentation', 
    'Lupus and other Connective Tissue diseases', 'MEL', 'Melanoma Skin Cancer Nevi and Moles', 
    'NEV', 'Nail Fungus and other Nail Disease', 'Poison Ivy and other Contact Dermatitis', 
    'Psoriasis Lichen Planus and related diseases', 'SCC', 'SEK', 
    'Scabies Lyme Disease and other Infestations and Bites', 'Seborrheic Keratoses and other Benign Tumors', 
    'Systemic Disease', 'Tinea Ringworm Candidiasis and other Fungal Infections', 'Urticaria Hives', 
    'Vascular Tumors', 'Vasculitis', 'Warts Molluscum and other Viral Infections'
]

CLASSES_CONVNEXT = [
    'Acne', 'Actinic Keratosis', 'Benign Tumors', 'Bullous', 'Candidiasis', 
    'Drug Eruption', 'Eczema', 'Infestations/Bites', 'Lichen', 'Lupus', 
    'Moles', 'Psoriasis', 'Rosacea', 'Seborrheic Keratoses', 'Skin Cancer', 
    'Sun/Sunlight Damage', 'Tinea', 'Unknown/Normal', 'Vascular Tumors', 
    'Vasculitis', 'Vitiligo', 'Warts'
]

@app.get("/health")
def health_check():
    return {"status": "ok", "models_loaded": {"model1": model1 is not None, "model2": model2 is not None, "model3": model3 is not None}}

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if not (model1 or model2 or model3):
        return {"error": "All models failed to load on server startup."}

    # Read image
    contents = await file.read()
    try:
        image = Image.open(io.BytesIO(contents)).convert("RGB")
    except Exception:
        return {"error": "Invalid image file."}

    # Preprocess
    input_batch = preprocess(image).unsqueeze(0).to(device)
    input_batch_convnext = preprocess_convnext(image).unsqueeze(0).to(device)

    results = {}
    best_overall_prediction = None
    highest_confidence = -1

    with torch.no_grad():
        probs_efficientnet = []
        
        # --- EfficientNet B3 ---
        if model1 is not None:
            output1 = model1(input_batch)
            prob1 = torch.nn.functional.softmax(output1[0], dim=0)
            conf1, idx1 = torch.max(prob1, 0)
            results["model1_prediction"] = {
                "class_index": idx1.item(),
                "class_name": CLASSES_EFFICIENTNET[idx1.item()],
                "confidence": conf1.item()
            }
            probs_efficientnet.append(prob1)
            if conf1.item() > highest_confidence:
                highest_confidence = conf1.item()
                best_overall_prediction = results["model1_prediction"]

        # --- EfficientNet V2-S ---
        if model2 is not None:
            output2 = model2(input_batch)
            prob2 = torch.nn.functional.softmax(output2[0], dim=0)
            conf2, idx2 = torch.max(prob2, 0)
            results["model2_prediction"] = {
                "class_index": idx2.item(),
                "class_name": CLASSES_EFFICIENTNET[idx2.item()],
                "confidence": conf2.item()
            }
            probs_efficientnet.append(prob2)
            if conf2.item() > highest_confidence:
                highest_confidence = conf2.item()
                best_overall_prediction = results["model2_prediction"]
            
        # --- EfficientNet Ensemble ---
        if len(probs_efficientnet) > 0:
            avg_probs = torch.stack(probs_efficientnet).mean(dim=0)
            ensemble_conf, ensemble_idx = torch.max(avg_probs, 0)
            results["efficientnet_ensemble"] = {
                "class_index": ensemble_idx.item(),
                "class_name": CLASSES_EFFICIENTNET[ensemble_idx.item()],
                "confidence": ensemble_conf.item()
            }

        # --- ConvNeXt ---
        if model3 is not None:
            output3 = model3(input_batch_convnext)
            prob3 = torch.nn.functional.softmax(output3[0], dim=0)
            conf3, idx3 = torch.max(prob3, 0)
            results["model3_prediction"] = {
                "class_index": idx3.item(),
                "class_name": CLASSES_CONVNEXT[idx3.item()],
                "confidence": conf3.item()
            }
            if conf3.item() > highest_confidence:
                highest_confidence = conf3.item()
                best_overall_prediction = results["model3_prediction"]

        # --- Global Triple-Ensemble Best ---
        results["ensemble_best"] = best_overall_prediction

    return results

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
