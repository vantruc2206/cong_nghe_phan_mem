# PostgreSQL database connection management via SQLAlchemy
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from config import DevelopmentConfig
from infrastructure.databases.base import Base

DATABASE_URI = DevelopmentConfig.DATABASE_URI
engine = create_engine(DATABASE_URI)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
session = SessionLocal()

def init_postgres(app):
    with engine.connect() as conn:
        conn.execute(text("CREATE SCHEMA IF NOT EXISTS auth_app"))
        conn.execute(text("CREATE SCHEMA IF NOT EXISTS customer"))
        conn.execute(text("CREATE SCHEMA IF NOT EXISTS app"))
        conn.commit()
    Base.metadata.create_all(bind=engine)