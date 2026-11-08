# File: backend/main.py

from fastapi import FastAPI, UploadFile, File, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import cv2
import numpy as np
import pytesseract
import re
import time
from datetime import datetime
from pydantic import BaseModel

from database import SessionLocal, engine, Base, VehicleOfInterest, Check, AuditLog

Base.metadata.create_all(bind=engine)
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
app = FastAPI(title="Vigilant Vehicle Support System API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.on_event("startup")
def seed_database():
    db = SessionLocal()
    if db.query(VehicleOfInterest).count() == 0:
        vehicles = [
            VehicleOfInterest(plate_number="AAX 1001", make="Toyota", model="Hilux", colour="White", year=2018),
            VehicleOfInterest(plate_number="LND 2002", make="Nissan", model="Note", colour="Silver", year=2016),
            VehicleOfInterest(plate_number="BAX 3003", make="Honda", model="Fit", colour="Blue", year=2015),
        ]
        db.add_all(vehicles)
        db.commit()
    db.close()

def normalize_plate(text):
    return re.sub(r'[^A-Z0-9]', '', text.upper())

@app.post("/api/scan")
async def scan_image(file: UploadFile = File(...), db: Session = Depends(get_db)):
    start_time = time.time()
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img is None:
        return {"success": False, "message": "Invalid image file."}

    # --- OpenCV & OCR ---
    img = cv2.resize(img, None, fx=3, fy=3, interpolation=cv2.INTER_CUBIC)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    custom_config = r'--oem 3 --psm 8 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    raw_text = pytesseract.image_to_string(thresh, config=custom_config)
    cleaned_plate = re.sub(r'[^A-Z0-9]', '', raw_text.upper())

    if len(cleaned_plate) < 3:
        cleaned_plate = "UNKNOWN"

    processing_time_ms = int((time.time() - start_time) * 1000)

    # --- Database Matching ---
    matched_vehicle = None
    all_vehicles = db.query(VehicleOfInterest).all()
    
    for v in all_vehicles:
        db_plate = normalize_plate(v.plate_number)
        
        # 1. Exact Match
        if db_plate == cleaned_plate:
            matched_vehicle = v
            break
            
        # 2. Partial Match (e.g., AI read "1001" but DB has "AAX1001")
        if len(cleaned_plate) >= 4 and db_plate.endswith(cleaned_plate):
            matched_vehicle = v
            break

    result_status = "possible_match" if matched_vehicle else "no_match"

    # Save to DB
    new_check = Check(
        detected_plate=cleaned_plate,
        confidence=0.85 if cleaned_plate != "UNKNOWN" else 0.0,
        result=result_status,
        response_ms=processing_time_ms
    )
    db.add(new_check)
    
    log = AuditLog(username="operator", action="SCAN", details=f"Scanned plate: {cleaned_plate}")
    db.add(log)
    db.commit()

    matched_data = None
    if matched_vehicle:
        matched_data = {
            "plate": matched_vehicle.plate_number,
            "make": matched_vehicle.make,
            "model": matched_vehicle.model,
            "colour": matched_vehicle.colour,
            "year": matched_vehicle.year,
        }

    return {
        "success": True,
        "data": {
            "checkId": f"check-{new_check.id}",
            "detectedPlate": cleaned_plate,
            "ocrConfidence": 0.85 if cleaned_plate != "UNKNOWN" else 0.0,
            "processingTimeMs": processing_time_ms,
            "status": result_status,
            "matchedVehicle": matched_data,
            "isSimulated": True
        },
        "message": "Scan completed."
    }

class ReviewRequest(BaseModel):
    checkId: str
    plate: str
    decision: str
    notes: str = ""
    username: str = "operator"

@app.post("/api/review")
async def review_match(req: ReviewRequest, db: Session = Depends(get_db)):
    action_map = {
        "confirm": "MATCH_CONFIRMED",
        "false_alert": "MATCH_FALSE_ALERT",
        "review_later": "MATCH_REVIEW_LATER"
    }
    action = action_map.get(req.decision, "REVIEWED")
    details = f"Plate {req.plate}. Decision: {req.decision}. Note: {req.notes}"

    log = AuditLog(username=req.username, action=action, details=details)
    db.add(log)
    db.commit()

    return {"success": True, "message": "Review recorded in database."}

@app.get("/api/audit-logs")
async def get_logs(db: Session = Depends(get_db)):
    logs = db.query(AuditLog).order_by(AuditLog.id.desc()).all()
    data = []
    for log in logs:
        data.append({
            "id": str(log.id),
            "timestamp": log.created_at.isoformat() if log.created_at else datetime.now().isoformat(),
            "username": log.username,
            "action": log.action,
            "target": log.details.split('.')[0] if log.details else "-", 
            "notes": log.details,
            "isSimulated": True
        })
    return {"success": True, "data": data, "message": "Logs loaded."}
