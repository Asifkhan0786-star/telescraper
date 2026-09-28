import csv
import io
from fastapi import APIRouter, Depends, HTTPException, Response, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.schemas import GroupListResponse, MemberListResponse
from app.database import get_db
from app.models import TelegramAccount, ExportHistory
from app.security import get_current_user_id, decrypt_session
from app.telegram_service import TelethonManager

router = APIRouter(prefix="/groups", tags=["groups"])

async def get_user_session_str(user_id: int, db: AsyncSession) -> str:
    query = select(TelegramAccount).where(TelegramAccount.user_id == user_id)
    result = await db.execute(query)
    acc = result.scalars().first()

    if not acc or not acc.encrypted_session:
        raise HTTPException(status_code=401, detail="Telegram account not connected or session expired.")

    session_str = decrypt_session(acc.encrypted_session)
    if not session_str:
        raise HTTPException(status_code=401, detail="Invalid session storage. Please reconnect.")

    return session_str

@router.get("", response_model=GroupListResponse)
async def list_groups(
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    session_str = await get_user_session_str(user_id, db)
    groups = await TelethonManager.fetch_user_dialogs(session_str)
    return GroupListResponse(groups=groups)

@router.get("/{group_id}/members", response_model=MemberListResponse)
async def get_group_members(
    group_id: str,
    limit: int = Query(default=100, ge=1, le=1000),
    offset: int = Query(default=0, ge=0),
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    session_str = await get_user_session_str(user_id, db)
    result = await TelethonManager.fetch_group_members(
        session_str=session_str,
        group_id=group_id,
        limit=limit,
        offset=offset
    )
    return result

@router.get("/{group_id}/export")
async def export_group_members_csv(
    group_id: str,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    session_str = await get_user_session_str(user_id, db)

    # Fetch all accessible members (up to max reasonable limit e.g. 5000 for standard export)
    result = await TelethonManager.fetch_group_members(
        session_str=session_str,
        group_id=group_id,
        limit=5000,
        offset=0
    )

    members = result.get("members", [])
    group_title = result.get("group_title", "Telegram Group")

    # Record in ExportHistory DB table
    export_rec = ExportHistory(
        user_id=user_id,
        group_id=group_id,
        group_title=group_title,
        member_count=len(members)
    )
    db.add(export_rec)
    await db.commit()

    # Generate CSV response strictly containing fields available via Telegram API
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Telegram ID", "First Name", "Last Name", "Username", "Is Bot"])

    for m in members:
        writer.writerow([
            m.get("id", ""),
            m.get("first_name", ""),
            m.get("last_name", ""),
            m.get("username", ""),
            "Yes" if m.get("is_bot") else "No"
        ])

    csv_data = output.getvalue()
    filename = f"telegram_members_{group_id}.csv"

    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )
