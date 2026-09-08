from sqlalchemy import Column, String, DateTime, Date
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from infrastructure.databases.base import Base

class KhachHangModel(Base):
    __tablename__ = 'khach_hang'
    __table_args__ = {'schema': 'customer', 'extend_existing': True}

    ma_kh = Column(UUID(as_uuid=True), primary_key=True, server_default=func.uuid_generate_v4())
    ten = Column(String(50), nullable=False)
    ten_dem = Column(String(50), nullable=True)
    ho = Column(String(50), nullable=False)
    gioi_tinh = Column(String(10), nullable=True)
    so_dien_thoai = Column(String(20), nullable=True)
    email = Column(String(255), nullable=True, unique=True)
    ngay_sinh = Column(Date, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())
