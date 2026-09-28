from telethon import TelegramClient
from telethon.sessions import StringSession
from telethon.tl.types import Chat, Channel, User, ChatForbidden, ChannelForbidden
from telethon.errors import (
    SessionPasswordNeededError,
    PhoneCodeInvalidError,
    PhoneCodeExpiredError,
    FloodWaitError,
    UserDeactivatedError
)
from fastapi import HTTPException
from app.config import settings

class TelethonManager:
    """Manages Telethon MTProto client sessions standard authorization flow safely."""

    @staticmethod
    def get_client(session_str: str = "") -> TelegramClient:
        api_id = settings.clean_api_id
        api_hash = settings.clean_api_hash

        if not api_id or not api_hash:
            raise HTTPException(
                status_code=500,
                detail="Telegram API credentials are missing or invalid on the server environment."
            )

        return TelegramClient(
            StringSession(session_str),
            api_id,
            api_hash
        )

    @staticmethod
    async def send_code(phone_number: str) -> str:
        client = TelethonManager.get_client()
        await client.connect()
        try:
            res = await client.send_code_request(phone_number)
            session_str = client.session.save()
            return res.phone_code_hash, session_str
        except FloodWaitError as e:
            raise HTTPException(status_code=429, detail=f"Telegram rate limit: Please wait {e.seconds} seconds before trying again.")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Telegram auth request failed: {str(e)}")
        finally:
            await client.disconnect()

    @staticmethod
    async def verify_code(phone_number: str, phone_code_hash: str, code: str, temp_session_str: str):
        client = TelethonManager.get_client(temp_session_str)
        await client.connect()
        try:
            user = await client.sign_in(phone=phone_number, code=code, phone_code_hash=phone_code_hash)
            final_session_str = client.session.save()
            return user, final_session_str, False
        except SessionPasswordNeededError:
            temp_session_str = client.session.save()
            return None, temp_session_str, True  # Needs 2FA password
        except PhoneCodeInvalidError:
            raise HTTPException(status_code=400, detail="Invalid verification code provided.")
        except PhoneCodeExpiredError:
            raise HTTPException(status_code=400, detail="Verification code has expired. Please request a new code.")
        except FloodWaitError as e:
            raise HTTPException(status_code=429, detail=f"Too many attempts. Please wait {e.seconds} seconds.")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Verification failed: {str(e)}")
        finally:
            await client.disconnect()

    @staticmethod
    async def verify_2fa(password: str, temp_session_str: str):
        client = TelethonManager.get_client(temp_session_str)
        await client.connect()
        try:
            user = await client.sign_in(password=password)
            final_session_str = client.session.save()
            return user, final_session_str
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"2FA Password verification failed: {str(e)}")
        finally:
            await client.disconnect()

    @staticmethod
    async def fetch_user_dialogs(session_str: str):
        client = TelethonManager.get_client(session_str)
        await client.connect()
        try:
            if not await client.is_user_authorized():
                raise HTTPException(status_code=401, detail="Telegram session is invalid or revoked.")

            me = await client.get_me()
            me_id = me.id if me else "Unknown"

            # Fetch ALL dialogs directly from Telegram API without limiting to 200
            dialogs = await client.get_dialogs(limit=None)
            total_dialogs = len(dialogs)

            groups = []
            count_groups = 0
            count_channels = 0
            count_excluded = 0

            for d in dialogs:
                try:
                    entity = getattr(d, "entity", None)
                    d_title = d.name or (getattr(entity, "title", None) if entity else "Untitled Group")

                    # Exclude 1-on-1 direct user/bot chats
                    if getattr(d, "is_user", False) or isinstance(entity, User):
                        count_excluded += 1
                        print(f"[GROUPS LOG] Excluded ID {d.id} ({d_title}) -> Reason: Private User Chat")
                        continue

                    # Exclude forbidden or deactivated chats where account lost access
                    if isinstance(entity, (ChatForbidden, ChannelForbidden)) or \
                       getattr(entity, "left", False) or \
                       getattr(entity, "kicked", False) or \
                       getattr(entity, "deactivated", False):
                        count_excluded += 1
                        print(f"[GROUPS LOG] Excluded ID {d.id} ({d_title}) -> Reason: Forbidden, left, or deactivated chat")
                        continue

                    is_grp = getattr(d, "is_group", False)
                    is_chn = getattr(d, "is_channel", False)
                    is_mega = getattr(entity, "megagroup", False) or getattr(entity, "gigagroup", False)

                    if is_grp or is_chn or isinstance(entity, (Chat, Channel)):
                        # Broadcast channels (is_chn and not is_grp and not megagroup) are 'channel'
                        # All other groups/supergroups/megagroups are 'group'
                        if is_chn and not is_grp and not is_mega:
                            group_type = "channel"
                            count_channels += 1
                        else:
                            group_type = "group"
                            count_groups += 1

                        username = getattr(entity, "username", None) if entity else None
                        participants_count = getattr(entity, "participants_count", None) if entity else None

                        groups.append({
                            "id": str(d.id),
                            "title": d_title,
                            "type": group_type,
                            "username": username,
                            "participants_count": participants_count
                        })
                    else:
                        count_excluded += 1
                        print(f"[GROUPS LOG] Excluded ID {d.id} ({d_title}) -> Reason: Non-group/non-channel entity")

                except Exception as item_err:
                    count_excluded += 1
                    print(f"[GROUPS FETCH WARNING] Skipping dialog item due to parse error: {item_err}")
                    continue

            print(
                f"[GROUPS FETCH SUMMARY] Telegram User ID: {me_id} | "
                f"Total Dialogs Fetched: {total_dialogs} | "
                f"Groups: {count_groups} | Channels: {count_channels} | "
                f"Excluded: {count_excluded} | Final Returned: {len(groups)}"
            )
            return groups
        except FloodWaitError as e:
            raise HTTPException(status_code=429, detail=f"Telegram flood wait active. Try again in {e.seconds} seconds.")
        except HTTPException:
            raise
        except Exception as e:
            print(f"[GROUPS FETCH ERROR] {e}")
            raise HTTPException(status_code=500, detail=f"Failed to fetch groups: {str(e)}")
        finally:
            await client.disconnect()

    @staticmethod
    async def fetch_group_members(session_str: str, group_id: str, limit: int = 100, offset: int = 0):
        client = TelethonManager.get_client(session_str)
        await client.connect()
        try:
            if not await client.is_user_authorized():
                raise HTTPException(status_code=401, detail="Telegram session is invalid or revoked.")

            entity_id = int(group_id) if (group_id.startswith("-") or group_id.isdigit()) else group_id

            try:
                entity = await client.get_entity(entity_id)
            except Exception as get_ent_err:
                print(f"[FETCH MEMBERS NOTICE] Could not resolve entity directly ({get_ent_err}). Populating dialog cache...")
                await client.get_dialogs(limit=None)
                entity = await client.get_entity(entity_id)

            title = getattr(entity, "title", "Group")

            # Telethon's iter_participants takes (entity, limit=...) and does NOT accept 'offset'.
            # We iterate up to (offset + limit) items and slice from offset onwards.
            max_to_fetch = offset + limit
            it = client.iter_participants(entity, limit=max_to_fetch)

            members = []
            idx = 0
            async for p in it:
                if idx >= offset:
                    members.append({
                        "id": str(p.id),
                        "first_name": getattr(p, "first_name", "") or "",
                        "last_name": getattr(p, "last_name", "") or "",
                        "username": getattr(p, "username", "") or "",
                        "phone": getattr(p, "phone", None),
                        "is_bot": getattr(p, "bot", False)
                    })
                idx += 1

            iter_total = getattr(it, "total", None)
            entity_count = getattr(entity, "participants_count", None)
            total_count = iter_total if iter_total is not None else (entity_count if entity_count is not None else (offset + len(members)))
            has_more = (offset + len(members)) < total_count

            return {
                "group_id": str(group_id),
                "group_title": title,
                "total_count": total_count,
                "members": members,
                "has_more": has_more
            }
        except FloodWaitError as e:
            raise HTTPException(status_code=429, detail=f"Telegram flood wait active. Try again in {e.seconds} seconds.")
        except HTTPException:
            raise
        except Exception as e:
            print(f"[FETCH MEMBERS ERROR] {e}")
            raise HTTPException(status_code=400, detail=f"Could not retrieve group members: {str(e)}")
        finally:
            await client.disconnect()

