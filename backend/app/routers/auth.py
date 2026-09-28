from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.schemas import (
    StartAuthRequest,
    StartAuthResponse,
    VerifyAuthRequest,
    TwoFactorAuthRequest,
    AuthStatusResponse
)
from app.database import get_db
from app.models import User, TelegramAccount
from app.security import (
    encrypt_session,
    decrypt_session,
    create_access_token,
    get_current_user_id
)
from app.telegram_service import TelethonManager

router = APIRouter(prefix="/auth", tags=["auth"])

# Temporary in-memory cache for ongoing auth sessions (keyed by phone_number)
# Strictly contains temporary string sessions during OTP verification; deleted immediately after success
TEMP_AUTH_SESSIONS = {}

@router.post("/telegram/start", response_model=StartAuthResponse)
async def start_telegram_auth(payload: StartAuthRequest):
    phone = payload.phone_number.strip()
    if not phone:
        raise HTTPException(status_code=400, detail="Phone number is required.")

    phone_code_hash, temp_session = await TelethonManager.send_code(phone)
    TEMP_AUTH_SESSIONS[phone] = temp_session

    return StartAuthResponse(
        phone_number=phone,
        phone_code_hash=phone_code_hash,
        message="Verification code sent via Telegram."
    )

@router.post("/telegram/verify")
async def verify_telegram_code(payload: VerifyAuthRequest, db: AsyncSession = Depends(get_db)):
    phone = payload.phone_number.strip()
    temp_session = TEMP_AUTH_SESSIONS.get(phone, "")
    
    if not temp_session:
        # Fallback if in-memory session was purged or restarted
        temp_session = ""

    tg_user, final_session_str, requires_2fa = await TelethonManager.verify_code(
        phone_number=phone,
        phone_code_hash=payload.phone_code_hash,
        code=payload.code.strip(),
        temp_session_str=temp_session
    )

    if requires_2fa:
        # Save temp session for 2fa step
        TEMP_AUTH_SESSIONS[phone] = final_session_str
        return {
            "requires_2fa": True,
            "message": "Two-factor authentication password required."
        }

    # Clean up temp session from memory
    TEMP_AUTH_SESSIONS.pop(phone, None)

    # Save to database securely
    encrypted_session = encrypt_session(final_session_str)
    
    # Check if Telegram account already exists
    tg_id_str = str(tg_user.id) if tg_user else ""
    username_str = getattr(tg_user, "username", "") or f"user_{phone[-4:]}"
    first_name_str = getattr(tg_user, "first_name", "") or ""
    last_name_str = getattr(tg_user, "last_name", "") or ""

    # Find or create user
    query = select(TelegramAccount).where(TelegramAccount.phone_number == phone)
    result = await db.execute(query)
    existing_acc = result.scalars().first()

    if existing_acc:
        existing_acc.encrypted_session = encrypted_session
        existing_acc.telegram_id = tg_id_str
        existing_acc.first_name = first_name_str
        existing_acc.last_name = last_name_str
        existing_acc.username = username_str
        user_id = existing_acc.user_id
    else:
        # Create user record
        db_user = User(username=username_str or f"tg_{phone[-4:]}")
        db.add(db_user)
        await db.flush()

        new_acc = TelegramAccount(
            user_id=db_user.id,
            telegram_id=tg_id_str,
            phone_number=phone,
            first_name=first_name_str,
            last_name=last_name_str,
            username=username_str,
            encrypted_session=encrypted_session
        )
        db.add(new_acc)
        user_id = db_user.id

    await db.commit()

    token = create_access_token(data={"sub": str(user_id)})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": user_id,
        "username": username_str,
        "telegram_id": tg_id_str
    }

@router.post("/telegram/2fa")
async def verify_telegram_2fa(payload: TwoFactorAuthRequest, db: AsyncSession = Depends(get_db)):
    phone = payload.phone_number.strip()
    temp_session = TEMP_AUTH_SESSIONS.get(phone, "")
    
    if not temp_session:
        raise HTTPException(status_code=400, detail="Authentication session expired. Please restart login.")

    tg_user, final_session_str = await TelethonManager.verify_2fa(
        password=payload.password.strip(),
        temp_session_str=temp_session
    )

    TEMP_AUTH_SESSIONS.pop(phone, None)

    encrypted_session = encrypt_session(final_session_str)
    tg_id_str = str(tg_user.id) if tg_user else ""
    username_str = getattr(tg_user, "username", "") or f"user_{phone[-4:]}"
    first_name_str = getattr(tg_user, "first_name", "") or ""
    last_name_str = getattr(tg_user, "last_name", "") or ""

    query = select(TelegramAccount).where(TelegramAccount.phone_number == phone)
    result = await db.execute(query)
    existing_acc = result.scalars().first()

    if existing_acc:
        existing_acc.encrypted_session = encrypted_session
        existing_acc.telegram_id = tg_id_str
        existing_acc.first_name = first_name_str
        existing_acc.last_name = last_name_str
        existing_acc.username = username_str
        user_id = existing_acc.user_id
    else:
        db_user = User(username=username_str or f"tg_{phone[-4:]}")
        db.add(db_user)
        await db.flush()

        new_acc = TelegramAccount(
            user_id=db_user.id,
            telegram_id=tg_id_str,
            phone_number=phone,
            first_name=first_name_str,
            last_name=last_name_str,
            username=username_str,
            encrypted_session=encrypted_session
        )
        db.add(new_acc)
        user_id = db_user.id

    await db.commit()

    token = create_access_token(data={"sub": str(user_id)})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": user_id,
        "username": username_str,
        "telegram_id": tg_id_str
    }

@router.get("/me", response_model=AuthStatusResponse)
async def get_current_user_status(
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    query = select(TelegramAccount).where(TelegramAccount.user_id == user_id)
    result = await db.execute(query)
    acc = result.scalars().first()

    if not acc or not acc.encrypted_session:
        return AuthStatusResponse(is_authenticated=False)

    return AuthStatusResponse(
        is_authenticated=True,
        user_id=acc.user_id,
        username=acc.username,
        telegram_id=acc.telegram_id,
        phone_number=acc.phone_number
    )

@router.post("/logout")
async def logout(
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    # Completely revoke and purge the stored session string from DB
    query = select(TelegramAccount).where(TelegramAccount.user_id == user_id)
    result = await db.execute(query)
    acc = result.scalars().first()

    if acc:
        await db.delete(acc)
        await db.commit()

    return {"message": "Successfully disconnected Telegram account and revoked session."}
