"""FastAPI router for NLP text parsing."""

from fastapi import APIRouter, HTTPException, status

from backend.schemas import ParseRequest, ParseResponse
from backend.services.parse_service import ParseService

router = APIRouter(prefix="/api/parse", tags=["NLP Parse"])
parse_service = ParseService()


@router.post(
    "/",
    response_model=ParseResponse,
    summary="Parse free-text into structured carbon-relevant activities",
)
async def parse_text(request: ParseRequest) -> ParseResponse:
    if not request.text or not request.text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Text must not be empty",
        )
    return parse_service.parse(request)


@router.get("/health")
def parse_health():
    return {
        "status": "healthy",
        "engine": "claude-with-multilingual-fallback",
        "languages": ["en", "hi", "ta", "te"],
    }
