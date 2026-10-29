"""
FAUNA-X: Database Models Definition
Implements comprehensive schema for livestock health reporting, vision screening,
multimodal ML explainability, veterinary verification, laboratory records,
vaccination tracking, disease clustering, and outbreak alerts.
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime,
    ForeignKey, Text, JSON, Enum as SQLEnum
)
from sqlalchemy.orm import relationship
import enum

from backend.app.core.database import Base

class UserRole(str, enum.Enum):
    FARMER = "FARMER"
    VETERINARIAN = "VETERINARIAN"
    FIELD_OFFICER = "FIELD_OFFICER"
    DISTRICT_ADMIN = "DISTRICT_ADMIN"
    STATE_ADMIN = "STATE_ADMIN"
    NATIONAL_ADMIN = "NATIONAL_ADMIN"
    GOVERNMENT = "GOVERNMENT"
    ADMIN = "ADMIN"

class CaseStatus(str, enum.Enum):
    SUBMITTED = "SUBMITTED"
    AI_SCREENING = "AI_SCREENING"
    VETERINARY_REVIEW = "VETERINARY_REVIEW"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"
    LAB_PENDING = "LAB_PENDING"
    RESPONSE_ACTIVE = "RESPONSE_ACTIVE"
    FOLLOW_UP = "FOLLOW_UP"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"

class RiskTier(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(120), nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    phone = Column(String(20), nullable=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(SQLEnum(UserRole), default=UserRole.FARMER, nullable=False)
    district = Column(String(80), nullable=True)
    state = Column(String(80), nullable=True)
    village = Column(String(100), nullable=True)
    preferred_language = Column(String(10), default="en", nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    cases = relationship("Case", back_populates="farmer", foreign_keys="Case.farmer_id")
    verifications = relationship("VeterinaryVerification", back_populates="veterinarian")
    animals = relationship("Animal", back_populates="owner")

class Animal(Base):
    __tablename__ = "animals"

    id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    tag_number = Column(String(50), unique=True, nullable=True)
    species = Column(String(50), nullable=False, default="Cattle")
    breed = Column(String(80), nullable=True)
    age_months = Column(Integer, nullable=True)
    sex = Column(String(20), nullable=True)
    herd_size = Column(Integer, default=1)
    vaccination_history = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="animals")
    cases = relationship("Case", back_populates="animal")

class Case(Base):
    __tablename__ = "cases"

    id = Column(Integer, primary_key=True, index=True)
    case_number = Column(String(30), unique=True, index=True, nullable=False)
    farmer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    animal_id = Column(Integer, ForeignKey("animals.id"), nullable=True)
    
    species = Column(String(50), nullable=False, default="Cattle")
    breed = Column(String(80), nullable=True)
    age_months = Column(Integer, nullable=True)
    sex = Column(String(20), nullable=True)
    number_affected = Column(Integer, default=1)
    
    status = Column(SQLEnum(CaseStatus), default=CaseStatus.SUBMITTED, index=True, nullable=False)
    
    # Location (GPS & Administrative)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    village = Column(String(100), nullable=True)
    district = Column(String(80), index=True, nullable=True)
    state = Column(String(80), nullable=True)
    
    # Clinical signs & history
    temperature_c = Column(Float, nullable=True)
    appetite_status = Column(String(40), nullable=True)
    mobility_status = Column(String(40), nullable=True)
    duration_days = Column(Integer, default=3)
    audio_path = Column(String(255), nullable=True)
    voice_transcript = Column(Text, nullable=True)
    history_data = Column(JSON, nullable=True)
    
    # Risk & Triage
    ai_risk_score = Column(Float, default=0.0)
    ai_risk_tier = Column(String(30), default="LOW")
    ai_triage_priority = Column(String(30), default="ROUTINE")
    ai_confidence = Column(Float, default=0.0)
    
    primary_language = Column(String(10), default="en", nullable=False)
    assigned_officer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    offline_sync_status = Column(String(30), default="SYNCED")
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    farmer = relationship("User", back_populates="cases", foreign_keys=[farmer_id])
    assigned_officer = relationship("User", foreign_keys=[assigned_officer_id])
    animal = relationship("Animal", back_populates="cases")
    symptoms = relationship("CaseSymptom", back_populates="case", cascade="all, delete-orphan")
    images = relationship("CaseImage", back_populates="case", cascade="all, delete-orphan")
    ai_predictions = relationship("AIPrediction", back_populates="case", cascade="all, delete-orphan")
    verification = relationship("VeterinaryVerification", back_populates="case", uselist=False, cascade="all, delete-orphan")
    field_visits = relationship("FieldVisit", back_populates="case", cascade="all, delete-orphan")
    lab_records = relationship("LabRecord", back_populates="case", cascade="all, delete-orphan")
    translations = relationship("CaseTranslation", back_populates="case", cascade="all, delete-orphan")

    @property
    def location_name(self) -> str:
        if self.village and self.district:
            return f"{self.village}, {self.district}"
        return self.village or self.district or "Field Location"

    @property
    def notes(self) -> Optional[str]:
        return self.voice_transcript

class CaseSymptom(Base):
    __tablename__ = "case_symptoms"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=False)
    symptom_name = Column(String(100), nullable=False)
    severity = Column(String(30), default="Moderate")
    source = Column(String(30), default="FARMER_REPORT")
    notes = Column(Text, nullable=True)

    case = relationship("Case", back_populates="symptoms")

class CaseImage(Base):
    __tablename__ = "case_images"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=False)
    storage_path = Column(String(255), nullable=False)
    original_filename = Column(String(150), nullable=True)
    mime_type = Column(String(50), default="image/jpeg")
    size_bytes = Column(Integer, default=0)
    
    # Quality metrics
    quality_score = Column(Float, default=1.0)
    is_blurry = Column(Boolean, default=False)
    brightness_mean = Column(Float, default=128.0)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    case = relationship("Case", back_populates="images")
    ai_prediction = relationship("AIPrediction", back_populates="image", uselist=False)

class AIPrediction(Base):
    __tablename__ = "ai_predictions"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=False)
    image_id = Column(Integer, ForeignKey("case_images.id"), nullable=True)
    
    model_name = Column(String(100), default="FAUNA-X Multimodal Intelligence Suite")
    model_version = Column(String(30), default="1.0.0")
    task = Column(String(30), default="classification")
    
    prediction_class = Column(String(50), nullable=False)
    display_name = Column(String(100), nullable=False)
    confidence = Column(Float, nullable=False)
    percentage = Column(Float, nullable=False)
    is_low_confidence = Column(Boolean, default=False)
    status_text = Column(String(255), nullable=False)
    
    visual_indicators = Column(JSON, nullable=True)
    alternatives = Column(JSON, nullable=True)
    all_probabilities = Column(JSON, nullable=True)
    shap_factors = Column(JSON, nullable=True)
    
    requires_verification = Column(Boolean, default=True)
    validation_status = Column(String(60), default="PROTOTYPE_NOT_CLINICALLY_VALIDATED")
    clinical_disclaimer = Column(String(255), default="AI-assisted risk estimation. Requires qualified veterinary verification.")
    
    created_at = Column(DateTime, default=datetime.utcnow)

    case = relationship("Case", back_populates="ai_predictions")
    image = relationship("CaseImage", back_populates="ai_prediction")

class VeterinaryVerification(Base):
    __tablename__ = "veterinary_verifications"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"), unique=True, nullable=False)
    veterinarian_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    status = Column(String(30), nullable=False)  # VERIFIED, REJECTED, MORE_INFO_REQUESTED
    preliminary_diagnosis = Column(String(255), nullable=True)
    observed_symptoms = Column(JSON, nullable=True)
    clinical_findings = Column(Text, nullable=True)
    severity = Column(String(30), default="Moderate")
    
    sample_required = Column(Boolean, default=False)
    containment_required = Column(Boolean, default=False)
    vaccination_required = Column(Boolean, default=False)
    treatment_prescribed = Column(Text, nullable=True)
    
    follow_up_date = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    case = relationship("Case", back_populates="verification")
    veterinarian = relationship("User", back_populates="verifications")

class LabRecord(Base):
    __tablename__ = "lab_records"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=False)
    sample_id = Column(String(60), unique=True, nullable=False)
    sample_type = Column(String(60), nullable=False)  # Blood, Swab, Tissue, Milk
    collection_date = Column(DateTime, default=datetime.utcnow)
    lab_name = Column(String(120), nullable=False)
    test_method = Column(String(80), nullable=False)  # RT-PCR, ELISA, Microscopy
    status = Column(String(40), default="PROCESSING")  # IN_TRANSIT, PROCESSING, CONFIRMED_POSITIVE, CONFIRMED_NEGATIVE
    confirmed_pathogen = Column(String(120), nullable=True)
    result_date = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)

    case = relationship("Case", back_populates="lab_records")

class VaccinationRecord(Base):
    __tablename__ = "vaccination_records"

    id = Column(Integer, primary_key=True, index=True)
    animal_id = Column(Integer, ForeignKey("animals.id"), nullable=True)
    disease_name = Column(String(100), nullable=False)  # FMD, Lumpy Skin, HS, BQ
    vaccine_batch = Column(String(60), nullable=True)
    administered_date = Column(DateTime, default=datetime.utcnow)
    next_due_date = Column(DateTime, nullable=True)
    district = Column(String(80), nullable=True)
    state = Column(String(80), nullable=True)
    veterinarian_id = Column(Integer, ForeignKey("users.id"), nullable=True)

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    priority = Column(String(30), default="MEDIUM")  # LOW, MEDIUM, HIGH, CRITICAL
    district = Column(String(80), nullable=True)
    state = Column(String(80), nullable=True)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

class FieldVisit(Base):
    __tablename__ = "field_visits"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=False)
    veterinarian_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    field_officer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    scheduled_date = Column(DateTime, nullable=False)
    visit_status = Column(String(30), default="SCHEDULED")  # SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED
    notes = Column(Text, nullable=True)
    observations = Column(Text, nullable=True)
    outcome = Column(Text, nullable=True)
    containment_status = Column(String(50), default="NOT_REQUIRED")  # NOT_REQUIRED, ADVISED, STRICT_QUARANTINE, COMPLIANT
    sample_collected = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    case = relationship("Case", back_populates="field_visits")
    veterinarian = relationship("User", foreign_keys=[veterinarian_id])
    officer = relationship("User", foreign_keys=[field_officer_id])

class CaseTranslation(Base):
    __tablename__ = "case_translations"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=False)
    field_name = Column(String(50), nullable=False)  # 'symptoms', 'history', 'voice_transcript', 'treatment_prescribed', 'clinical_findings'
    source_language = Column(String(10), default="en")
    target_language = Column(String(10), nullable=False)
    original_text = Column(Text, nullable=False)
    translated_text = Column(Text, nullable=False)
    is_machine_translated = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    case = relationship("Case", back_populates="translations")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)
    action = Column(String(100), nullable=False)
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(String(50), nullable=True)
    details = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
