from sqlalchemy import Column, String, DateTime, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from infrastructure.databases.base import Base

class DroneModel(Base):
    __tablename__ = 'drone'
    __table_args__ = {'schema': 'app', 'extend_existing': True}

    ma_drone = Column(UUID(as_uuid=True), primary_key=True, server_default=func.uuid_generate_v4())
    trang_thai_drone = Column(String(30), nullable=False, server_default='Sẵn sàng')
    cong_suat_pin = Column(Integer, nullable=False, server_default='100')
    ngay_bao_tri_gan_nhat = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())
