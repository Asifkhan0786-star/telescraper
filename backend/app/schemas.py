from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

# Auth Schemas
class StartAuthRequest(BaseModel):
    phone_number: str

class StartAuthResponse(BaseModel):
    phone_number: str
    phone_code_hash: str
    message: str

class VerifyAuthRequest(BaseModel):
    phone_number: str
    phone_code_hash: str
    code: str

class TwoFactorAuthRequest(BaseModel):
    phone_number: str
    password: str

class AuthStatusResponse(BaseModel):
    is_authenticated: bool
    user_id: Optional[int] = None
    username: Optional[str] = None
    telegram_id: Optional[str] = None
    phone_number: Optional[str] = None

# Telegram Group Schemas
class TelegramGroup(BaseModel):
    id: str
    title: str
    type: str  # group, supergroup, channel
    username: Optional[str] = None
    participants_count: Optional[int] = None

class GroupListResponse(BaseModel):
    groups: List[TelegramGroup]

# Telegram Member Schemas
class GroupMember(BaseModel):
    id: str
    first_name: Optional[str] = ""
    last_name: Optional[str] = ""
    username: Optional[str] = ""
    phone: Optional[str] = None
    is_bot: bool = False

class MemberListResponse(BaseModel):
    group_id: str
    group_title: str
    total_count: int
    members: List[GroupMember]
    has_more: bool = False

# Export History Schema
class ExportRecord(BaseModel):
    id: int
    group_id: str
    group_title: str
    member_count: int
    exported_at: datetime

    model_config = ConfigDict(from_attributes=True)
