from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Float
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from infrastructure.databases.base import Base

class DiaChiModel(Base):
    __tablename__ = 'dia_chi'
    __table_args__ = {'schema': 'customer', 'extend_existing': True}

    ma_dia_chi = Column(UUID(as_uuid=True), primary_key=True, server_default=func.uuid_generate_v4())
    ma_kh = Column(UUID(as_uuid=True), ForeignKey('customer.khach_hang.ma_kh', ondelete='CASCADE'), nullable=False)
    dia_chi_cu_the = Column(Text, nullable=False)
    thanh_pho = Column(String(100), nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    khach_hang = relationship('KhachHangModel', backref='dia_chi')
