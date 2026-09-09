# PostgreSQL database connection management via SQLAlchemy
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, scoped_session
from config import DevelopmentConfig
from infrastructure.databases.base import Base

from sqlalchemy.pool import QueuePool

DATABASE_URI = DevelopmentConfig.DATABASE_URI
engine = create_engine(
    DATABASE_URI,
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,
    pool_recycle=300,
    pool_timeout=15
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
session = scoped_session(SessionLocal)

def init_postgres(app):
    try:
        with engine.connect() as conn:
            conn.execute(text("CREATE SCHEMA IF NOT EXISTS auth_app"))
            conn.execute(text("CREATE SCHEMA IF NOT EXISTS customer"))
            conn.execute(text("CREATE SCHEMA IF NOT EXISTS app"))
            conn.commit()
            
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        print(f"[postgres init] Warning during schema creation: {e}")