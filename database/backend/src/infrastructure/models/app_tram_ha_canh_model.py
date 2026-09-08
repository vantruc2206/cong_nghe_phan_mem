from sqlalchemy import Column, String, DateTime, Text, Float, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from infrastructure.databases.base import Base

class TramHaCanhModel(Base):
    __tablename__ = 'tram_ha_canh'
    __table_args__ = {'schema': 'app', 'extend_existing': True}

    ma_tram = Column(UUID(as_uuid=True), primary_key=True, server_default=func.uuid_generate_v4())
    ten_tram = Column(String(150), nullable=False)
    dia_chi_tram = Column(Text, nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    cong_suat_toi_da = Column(Integer, nullable=False, server_default='10')
    trang_thai_hoat_dong = Column(String(20), nullable=False, server_default='Đang hoạt động')
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())
