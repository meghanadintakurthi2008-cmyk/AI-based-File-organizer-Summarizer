import datetime
from sqlalchemy import Column, String, Integer, Float, Text, JSON, DateTime, ForeignKey
from .database import Base

class FileRecord(Base):
    __tablename__ = "file_records"

    id = Column(String(64), primary_key=True, index=True)
    filename = Column(String(255), nullable=False, index=True)
    original_path = Column(String(512), nullable=True)
    current_path = Column(String(512), nullable=True)
    size_bytes = Column(Integer, default=0)
    size_display = Column(String(32), default="0 KB")
    format = Column(String(16), nullable=False) # PDF, DOCX, IMG, SHEET, TXT
    ext = Column(String(16), nullable=False)
    ingestion_method = Column(String(64), nullable=False) # "Full Text NLP", "OCR Extracted", "Metadata Only Fallback"
    predicted_category = Column(String(128), nullable=False, index=True)
    category_theme = Column(String(32), default="indigo")
    recommended_folder = Column(String(255), nullable=False, index=True)
    confidence = Column(Float, nullable=False) # e.g. 94.2
    confidence_reason = Column(Text, nullable=True)
    alternative_suggestions = Column(JSON, default=list) # [{folder, confidence, reason}]
    top_tokens = Column(JSON, default=list) # [{term, weight}]
    excerpt = Column(Text, nullable=True)
    status = Column(String(32), default="pending", index=True) # pending, approved, dismissed, reassigned
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    processed_at = Column(DateTime, default=datetime.datetime.utcnow)


class FolderNode(Base):
    __tablename__ = "folder_nodes"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(128), nullable=False)
    path = Column(String(255), unique=True, nullable=False, index=True)
    parent_path = Column(String(255), nullable=True, index=True)
    file_count = Column(Integer, default=0)
    is_open = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class ClusterSuggestion(Base):
    __tablename__ = "cluster_suggestions"

    id = Column(String(64), primary_key=True, index=True)
    topic_name = Column(String(128), nullable=False)
    suggested_folder = Column(String(255), nullable=False)
    detected_count = Column(Integer, default=0)
    confidence = Column(Float, default=85.0)
    top_keywords = Column(JSON, default=list) # ["verilog", "asic", "timing"]
    description = Column(Text, nullable=True)
    sample_files = Column(JSON, default=list)
    status = Column(String(32), default="active") # active, materialized, dismissed
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class MetricSnapshot(Base):
    __tablename__ = "metric_snapshots"

    id = Column(Integer, primary_key=True, autoincrement=True)
    total_analyzed = Column(Integer, default=1248)
    categorization_confidence = Column(Float, default=94.2)
    auto_sorted_today = Column(Integer, default=342)
    unreadable_flagged = Column(Integer, default=18)
    trend_week = Column(String(32), default="+14.8%")
    target_rate = Column(String(32), default="85.5% automated")
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)
