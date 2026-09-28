import sys
import asyncpg
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.config import settings
from app.models import Base

# Global engine and sessionmaker reference
engine = create_async_engine(settings.get_database_url, echo=False)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def init_db():
    """Initializes database engine. Attempts PostgreSQL first, falls back to SQLite seamlessly if Postgres credentials/service fail."""
    global engine, AsyncSessionLocal

    db_url = settings.get_database_url

    if db_url.startswith("postgresql"):
        user = settings.POSTGRES_USER
        password = settings.POSTGRES_PASSWORD
        host = settings.POSTGRES_HOST
        port = settings.POSTGRES_PORT
        target_db = settings.POSTGRES_DB

        postgres_ok = False

        if password:
            try:
                # 1. Try connecting to target postgres DB
                conn = await asyncpg.connect(
                    user=user,
                    password=password,
                    host=host,
                    port=port,
                    database=target_db
                )
                await conn.close()
                postgres_ok = True
            except asyncpg.InvalidCatalogNameError:
                # Database does not exist yet -> auto-create it
                try:
                    sys_conn = await asyncpg.connect(
                        user=user,
                        password=password,
                        host=host,
                        port=port,
                        database="postgres"
                    )
                    await sys_conn.execute(f'CREATE DATABASE "{target_db}"')
                    await sys_conn.close()
                    print(f"[DB INIT] Created PostgreSQL database '{target_db}' successfully.")
                    postgres_ok = True
                except Exception as e:
                    print(f"[DB INIT] Could not auto-create database '{target_db}': {e}")
            except asyncpg.InvalidPasswordError:
                print("\n" + "="*70)
                print("[DB NOTICE] PostgreSQL password authentication failed for user 'postgres'.")
                print("To use PostgreSQL, set your password in backend/.env:")
                print("    POSTGRES_PASSWORD=your_actual_postgres_password")
                print("[FALLBACK] Switching engine to SQLite for seamless local execution.")
                print("="*70 + "\n")
            except Exception as e:
                print(f"[DB NOTICE] PostgreSQL connection note: {e}")

        if not postgres_ok:
            fallback_url = "sqlite+aiosqlite:///./telegram_exporter.db"
            engine = create_async_engine(fallback_url, echo=False)
            AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
            print("[DB INIT] Using local SQLite database (telegram_exporter.db).")

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
