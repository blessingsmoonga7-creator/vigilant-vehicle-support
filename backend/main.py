# File: backend/main.py

from fastapi import FastAPI, UploadFile, File, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import cv2
import numpy as np
import pytesseract
import re
import time
import os
import uuid
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

# Ensure uploads folder exists
os.makedirs("uploads", exist_ok=True)

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

class VehicleCreate(BaseModel):
    plate: str
    make: str
    model: str
    colour: str
    year: int

@app.post("/api/watchlist")
async def add_vehicle(vehicle: VehicleCreate, db: Session = Depends(get_db)):
    existing = db.query(VehicleOfInterest).filter(VehicleOfInterest.plate_number == vehicle.plate).first()
    if existing:
        raise HTTPException(status_code=400, detail="Vehicle with this plate already exists.")
    new_vehicle = VehicleOfInterest(plate_number=vehicle.plate, make=vehicle.make, model=vehicle.model, colour=vehicle.colour, year=vehicle.year)
    db.add(new_vehicle)
    db.commit()
    db.add(AuditLog(username="admin", action="ADD_VEHICLE", details=f"Added vehicle: {vehicle.plate}"))
    db.commit()
    return {"success": True, "message": "Vehicle added successfully."}

@app.get("/api/watchlist")
async def get_watchlist(db: Session = Depends(get_db)):
    vehicles = db.query(VehicleOfInterest).all()
    return {"success": True, "data": [{"id": v.id, "plate": v.plate_number, "make": v.make, "model": v.model, "colour": v.colour, "year": v.year, "status": v.status, "isSimulated": True} for v in vehicles]}

@app.post("/api/scan")
async def scan_image(file: UploadFile = File(...), db: Session = Depends(get_db)):
    start_time = time.time()
    
    # 1. Save the image file to disk
    file_extension = os.path.splitext(file.filename)[1] or ".jpg"
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join("uploads", unique_filename)
    
    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())

    # 2. Read the image for OpenCV
    img = cv2.imread(file_path)
    if img is None:
        return {"success": False, "message": "Invalid image file."}

    # --- AI PIPELINE ---
    target_width = 600
    ratio = target_width / float(img.shape[1])
    dim = (target_width, int(img.shape[0] * ratio))
    resized = cv2.resize(img, dim, interpolation=cv2.INTER_AREA)
    gray = cv2.cvtColor(resized, cv2.COLOR_BGR2GRAY)
    gray = cv2.bilateralFilter(gray, 11, 17, 17)
    edged = cv2.Canny(gray, 30, 200)
    contours, _ = cv2.findContours(edged.copy(), cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    contours = sorted(contours, key=cv2.contourArea, reverse=True)[:10]
    plate_contour = None
    for c in contours:
        peri = cv2.arcLength(c, True)
        approx = cv2.approxPolyDP(c, 0.018 * peri, True)
        if len(approx) == 4:
            plate_contour = approx
            break

    plate_crop = gray[cv2.boundingRect(plate_contour)[1]:cv2.boundingRect(plate_contour)[1]+cv2.boundingRect(plate_contour)[3], cv2.boundingRect(plate_contour)[0]:cv2.boundingRect(plate_contour)[0]+cv2.boundingRect(plate_contour)[2]] if plate_contour is not None else gray
    _, thresh = cv2.threshold(plate_crop, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    thresh = cv2.resize(thresh, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
    custom_config = r'--oem 3 --psm 7 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    raw_text = pytesseract.image_to_string(thresh, config=custom_config)
    cleaned_plate = re.sub(r'[^A-Z0-9]', '', raw_text.upper())
    if len(cleaned_plate) < 3:
        cleaned_plate = "UNKNOWN"

    processing_time_ms = int((time.time() - start_time) * 1000)

    matched_vehicle = None
    for v in db.query(VehicleOfInterest).all():
        db_plate = normalize_plate(v.plate_number)
        if db_plate == cleaned_plate or (len(cleaned_plate) >= 3 and db_plate.endswith(cleaned_plate)):
            matched_vehicle = v
            break

    result_status = "possible_match" if matched_vehicle else "no_match"
    
    # Save check result including the image filename
    new_check = Check(
        detected_plate=cleaned_plate, 
        confidence=0.85 if cleaned_plate != "UNKNOWN" else 0.0, 
        result=result_status, 
        response_ms=processing_time_ms,
    )
    db.add(new_check)
    db.add(AuditLog(username="operator", action="SCAN", details=f"Scanned plate: {cleaned_plate}"))
    db.commit()

    matched_data = {"plate": matched_vehicle.plate_number, "make": matched_vehicle.make, "model": matched_vehicle.model, "colour": matched_vehicle.colour, "year": matched_vehicle.year} if matched_vehicle else None

    return {
        "success": True,
        "data": {
            "checkId": f"check-{new_check.id}",
            "detectedPlate": cleaned_plate,
            "ocrConfidence": 0.85 if cleaned_plate != "UNKNOWN" else 0.0,
            "processingTimeMs": processing_time_ms,
            "status": result_status,
            "matchedVehicle": matched_data,
            "imageUrl": f"http://127.0.0.1:8000/api/image/{unique_filename}", # NEW: URL for the image
            "isSimulated": True
        },
        "message": "Scan completed."
    }

# NEW ENDPOINT: Serve the uploaded image
@app.get("/api/image/{filename}")
async def get_image(filename: str):
    file_path = os.path.join("uploads", filename)
    if os.path.exists(file_path):
        return FileResponse(file_path)
    raise HTTPException(status_code=404, detail="Image not found")

class ReviewRequest(BaseModel):
    checkId: str
    plate: str
    decision: str
    notes: str = ""
    username: str = "operator"

@app.post("/api/review")
async def review_match(req: ReviewRequest, db: Session = Depends(get_db)):
    action_map = {"confirm": "MATCH_CONFIRMED", "false_alert": "MATCH_FALSE_ALERT", "review_later": "MATCH_REVIEW_LATER"}
    action = action_map.get(req.decision, "REVIEWED")
    details = f"Plate {req.plate}. Decision: {req.decision}. Note: {req.notes}"
    db.add(AuditLog(username=req.username, action=action, details=details))
    db.commit()
    return {"success": True, "message": "Review recorded."}

@app.get("/api/audit-logs")
async def get_logs(db: Session = Depends(get_db)):
    logs = db.query(AuditLog).order_by(AuditLog.id.desc()).all()
    return {"success": True, "data": [{"id": str(log.id), "timestamp": log.created_at.isoformat() if log.created_at else datetime.now().isoformat(), "username": log.username, "action": log.action, "target": log.details.split('.')[0] if log.details else "-", "notes": log.details, "isSimulated": True} for log in logs], "message": "Logs loaded."}
