"""FastAPI router for Evidence Upload, Extraction Confirmation, and Fraud Detection."""

import json
import secrets
from pathlib import Path
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, File, Form, Header, HTTPException, UploadFile, status
from pydantic import BaseModel

from backend.database import UPLOAD_DIR, get_db_connection
from backend.routers.auth import get_authenticated_user_id
from backend.services.evidence_service import ALLOWED_MIMES, MAX_FILE_SIZE, EvidenceService

router = APIRouter(prefix="/api/evidence", tags=["Evidence & Verification"])


class ConfirmExtractionRequest(BaseModel):
    evidence_id: int
    confirmed_quantity: float
    confirmed_unit: str
    activity_id: Optional[int] = None
    user_notes: Optional[str] = None


@router.post("/upload", summary="Upload supporting bill/receipt with SHA-256 duplicate detection")
async def upload_evidence(
    file: UploadFile = File(...),
    document_type: str = Form("electricity_bill"),
    activity_id: Optional[int] = Form(None),
    authorization: Optional[str] = Header(None),
):
    uid = get_authenticated_user_id(authorization) or 1

    if file.content_type not in ALLOWED_MIMES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported format. Allowed: {', '.join(ALLOWED_MIMES.keys())}",
        )

    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File size exceeds maximum limit of 10MB.")

    # Compute SHA-256 file hash
    file_hash = EvidenceService.calculate_sha256(file_bytes)

    # Save to uploads/evidence/ with safe random token filename
    ext = ALLOWED_MIMES.get(file.content_type, ".jpg")
    safe_name = f"{secrets.token_hex(12)}{ext}"
    saved_path = UPLOAD_DIR / safe_name
    with open(saved_path, "wb") as f:
        f.write(file_bytes)

    # AI-assisted / pattern extraction
    extraction = EvidenceService.extract_document_info(file_bytes, file.filename or "bill.jpg", document_type)

    # Fraud & Duplicate Check
    is_flagged, flag_reason = EvidenceService.inspect_fraud_and_duplicates(
        file_hash=file_hash,
        user_id=uid,
        document_type=document_type,
        extracted_consumer_id=extraction.get("consumer_id"),
        billing_period=extraction.get("billing_start", "")[:7],
        quantity=extraction.get("extracted_quantity"),
    )

    initial_status = "awaiting_confirmation" if not is_flagged else "under_review"

    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO evidence_documents (
                user_id, activity_id, file_path, original_filename,
                file_hash_sha256, mime_type, file_size_bytes, document_type,
                issuer_name, consumer_id, billing_start, billing_end,
                extracted_quantity, extracted_unit, extracted_amount_inr,
                extraction_json, extraction_confidence, verification_status,
                is_flagged, flag_reason
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                uid,
                activity_id,
                str(saved_path),
                file.filename or "evidence.jpg",
                file_hash,
                file.content_type,
                len(file_bytes),
                document_type,
                extraction.get("issuer_name"),
                extraction.get("consumer_id"),
                extraction.get("billing_start"),
                extraction.get("billing_end"),
                extraction.get("extracted_quantity"),
                extraction.get("extracted_unit"),
                extraction.get("extracted_amount_inr"),
                json.dumps(extraction),
                extraction.get("confidence", 0.9),
                initial_status,
                1 if is_flagged else 0,
                flag_reason,
            ),
        )
        evidence_id = cursor.lastrowid

        # Record initial event
        cursor.execute(
            """
            INSERT INTO verification_events (
                evidence_id, activity_id, previous_status, new_status, actor_type, reason
            ) VALUES (?, ?, ?, ?, ?, ?)
            """,
            (evidence_id, activity_id, "evidence_uploaded", initial_status, "system_rule", flag_reason or "Document extracted successfully"),
        )
        conn.commit()

    return {
        "evidence_id": evidence_id,
        "original_filename": file.filename,
        "document_type": document_type,
        "extraction": extraction,
        "is_flagged": is_flagged,
        "flag_reason": flag_reason,
        "verification_status": initial_status,
        "message": "Document parsed. Please confirm the extracted details below to verify.",
    }


@router.post("/confirm", summary="User confirms extracted values -> mark verified and award Carbon Coins")
def confirm_extraction(req: ConfirmExtractionRequest, authorization: Optional[str] = Header(None)):
    uid = get_authenticated_user_id(authorization) or 1

    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id, activity_id, is_flagged, document_type, extracted_quantity, extracted_unit FROM evidence_documents WHERE id = ? AND user_id = ?",
            (req.evidence_id, uid),
        )
        doc = cursor.fetchone()
        if not doc:
            raise HTTPException(status_code=404, detail="Evidence document not found.")

        act_id = req.activity_id or doc["activity_id"]

        # If flagged, remains under review, otherwise verified
        new_status = "under_review" if doc["is_flagged"] else "verified"

        cursor.execute(
            """
            UPDATE evidence_documents
            SET verification_status = ?, extracted_quantity = ?, extracted_unit = ?, activity_id = ?
            WHERE id = ?
            """,
            (new_status, req.confirmed_quantity, req.confirmed_unit, act_id, req.evidence_id),
        )

        # Update activity_record if linked
        if act_id:
            cursor.execute(
                """
                UPDATE activity_records
                SET is_verified = ?, evidence_status = ?, quantity = ?, unit = ?
                WHERE id = ?
                """,
                (1 if new_status == "verified" else 0, new_status, req.confirmed_quantity, req.confirmed_unit, act_id),
            )

        # Award 25 Carbon Coins for submitting verified evidence!
        if new_status == "verified":
            cursor.execute(
                """
                INSERT INTO coin_transactions (
                    user_id, account_type, target_id, amount, transaction_type, reason, balance_after, reference_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    uid,
                    "individual",
                    uid,
                    25,
                    "earned_verification",
                    f"Verified {doc['document_type']} evidence upload",
                    0,  # Will sum dynamically
                    f"ev_{req.evidence_id}",
                ),
            )

        conn.commit()

    return {
        "status": "success",
        "evidence_id": req.evidence_id,
        "verification_status": new_status,
        "coins_awarded": 25 if new_status == "verified" else 0,
        "message": "Evidence verified! Carbon Coins awarded to your account." if new_status == "verified" else "Evidence flagged for auditor review.",
    }


@router.get("/", summary="List evidence documents for authenticated user")
def list_evidence(authorization: Optional[str] = Header(None)):
    uid = get_authenticated_user_id(authorization) or 1
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT id, activity_id, original_filename, document_type,
                   issuer_name, consumer_id, billing_start, billing_end,
                   extracted_quantity, extracted_unit, extracted_amount_inr,
                   extraction_confidence, verification_status, is_flagged, flag_reason, created_at
            FROM evidence_documents
            WHERE user_id = ?
            ORDER BY id DESC
            """,
            (uid,),
        )
        return [dict(r) for r in cursor.fetchall()]
