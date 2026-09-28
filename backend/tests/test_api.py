import os
# Override DATABASE_URL for unit tests to use isolated in-memory SQLite database
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///:memory:"
os.environ["SECRET_KEY"] = "testsecretkey123456789"
os.environ["ENCRYPTION_SECRET"] = "u6LhG5p-aBf7YQ2n_X9sV8kZ1mP3wE5rT7yU0iO4pK8="

import pytest
from unittest.mock import patch, AsyncMock
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database import init_db

@pytest.fixture(autouse=True)
async def setup_test_db():
    await init_db()

@pytest.mark.asyncio
async def test_root_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "online"

@pytest.mark.asyncio
async def test_auth_start_endpoint():
    with patch("app.telegram_service.TelethonManager.send_code", new_callable=AsyncMock) as mock_send:
        mock_send.return_value = ("hash_12345", "temp_session_string")
        
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            response = await ac.post("/auth/telegram/start", json={"phone_number": "+1234567890"})
        
        assert response.status_code == 200
        data = response.json()
        assert data["phone_number"] == "+1234567890"
        assert data["phone_code_hash"] == "hash_12345"

@pytest.mark.asyncio
async def test_unauthorized_groups_access():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/groups")
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_fetch_user_dialogs_classification():
    from app.telegram_service import TelethonManager
    from unittest.mock import MagicMock
    from telethon.tl.types import Chat, Channel, User, ChatForbidden

    mock_client = MagicMock()
    mock_client.connect = AsyncMock()
    mock_client.disconnect = AsyncMock()
    mock_client.is_user_authorized = AsyncMock(return_value=True)

    mock_me = MagicMock()
    mock_me.id = 999888777
    mock_client.get_me = AsyncMock(return_value=mock_me)

    # 1. Normal Group
    d1 = MagicMock()
    d1.id = -100111
    d1.name = "My Normal Group"
    d1.is_group = True
    d1.is_channel = False
    d1.is_user = False
    e1 = MagicMock(spec=Chat)
    e1.username = None
    e1.participants_count = 45
    d1.entity = e1

    # 2. Supergroup / Megagroup
    d2 = MagicMock()
    d2.id = -100222
    d2.name = "My Supergroup"
    d2.is_group = True
    d2.is_channel = True
    d2.is_user = False
    e2 = MagicMock(spec=Channel)
    e2.username = "supergrp"
    e2.participants_count = 1500
    e2.megagroup = True
    e2.gigagroup = False
    d2.entity = e2

    # 3. Broadcast Channel
    d3 = MagicMock()
    d3.id = -100333
    d3.name = "My News Channel"
    d3.is_group = False
    d3.is_channel = True
    d3.is_user = False
    e3 = MagicMock(spec=Channel)
    e3.username = "newschannel"
    e3.participants_count = 5000
    e3.megagroup = False
    e3.gigagroup = False
    d3.entity = e3

    # 4. User 1-on-1 Chat (should be excluded)
    d4 = MagicMock()
    d4.id = 4444
    d4.name = "John Doe"
    d4.is_group = False
    d4.is_channel = False
    d4.is_user = True
    d4.entity = MagicMock(spec=User)

    # 5. Forbidden Chat (should be excluded)
    d5 = MagicMock()
    d5.id = -100555
    d5.name = "Forbidden Group"
    d5.is_group = True
    d5.is_channel = False
    d5.is_user = False
    d5.entity = MagicMock(spec=ChatForbidden)

    mock_client.get_dialogs = AsyncMock(return_value=[d1, d2, d3, d4, d5])

    with patch("app.telegram_service.TelethonManager.get_client", return_value=mock_client):
        groups = await TelethonManager.fetch_user_dialogs("fake_session_string")

    assert len(groups) == 3
    assert groups[0]["id"] == "-100111"
    assert groups[0]["type"] == "group"
    assert groups[1]["id"] == "-100222"
    assert groups[1]["type"] == "group"
    assert groups[2]["id"] == "-100333"
    assert groups[2]["type"] == "channel"

@pytest.mark.asyncio
async def test_fetch_group_members_pagination():
    from app.telegram_service import TelethonManager
    from unittest.mock import MagicMock

    mock_client = MagicMock()
    mock_client.connect = AsyncMock()
    mock_client.disconnect = AsyncMock()
    mock_client.is_user_authorized = AsyncMock(return_value=True)

    mock_entity = MagicMock()
    mock_entity.title = "Test Group"
    mock_entity.participants_count = 5
    mock_client.get_entity = AsyncMock(return_value=mock_entity)

    # Mock async iterator returned by iter_participants
    p1 = MagicMock(id=1, first_name="Alice", last_name="Smith", username="alice", bot=False)
    p2 = MagicMock(id=2, first_name="Bob", last_name="Jones", username="bob", bot=False)
    p3 = MagicMock(id=3, first_name="Charlie", last_name="", username="", bot=True)

    class MockAsyncIter:
        def __init__(self, items, total):
            self.items = items
            self.total = total
        def __aiter__(self):
            self._iter = iter(self.items)
            return self
        async def __anext__(self):
            try:
                return next(self._iter)
            except StopIteration:
                raise StopAsyncIteration

    mock_client.iter_participants.return_value = MockAsyncIter([p1, p2, p3], total=5)

    with patch("app.telegram_service.TelethonManager.get_client", return_value=mock_client):
        res = await TelethonManager.fetch_group_members("fake_session", "-100123456", limit=2, offset=1)

    assert res["group_id"] == "-100123456"
    assert res["group_title"] == "Test Group"
    assert res["total_count"] == 5
    assert len(res["members"]) == 2
    assert res["members"][0]["id"] == "2"
    assert res["members"][0]["first_name"] == "Bob"
    assert res["members"][1]["id"] == "3"
    assert res["members"][1]["is_bot"] is True
    assert res["has_more"] is True


