from sqlalchemy import Column, String, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from infrastructure.databases.base import Base

class VaiTroModel(Base):
    __tablename__ = 'vai_tro'
    __table_args__ = {'schema': 'auth_app', 'extend_existing': True}

    ma_vai_tro = Column(UUID(as_uuid=True), primary_key=True, server_default=func.uuid_generate_v4())
    ten_vai_tro = Column(String(50), nullable=False, unique=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())
