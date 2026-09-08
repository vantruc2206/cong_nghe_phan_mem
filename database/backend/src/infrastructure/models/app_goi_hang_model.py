from sqlalchemy import Column, String, DateTime, ForeignKey, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from infrastructure.databases.base import Base

class GoiHangModel(Base):
    __tablename__ = 'goi_hang'
    __table_args__ = {'schema': 'app', 'extend_existing': True}

    ma_goi_hang = Column(UUID(as_uuid=True), primary_key=True, server_default=func.uuid_generate_v4())
    ma_don_hang = Column(UUID(as_uuid=True), ForeignKey('app.don_hang.ma_don_hang', ondelete='CASCADE'), nullable=False)
    ma_tram = Column(UUID(as_uuid=True), ForeignKey('app.tram_ha_canh.ma_tram', ondelete='SET NULL'), nullable=True)
    loai_hang_hoa = Column(String(100), nullable=False)
    can_nang = Column(Numeric(8, 2), nullable=False)
    kich_co = Column(String(50), nullable=True)
    gia_tri_uoc_tinh = Column(Numeric(15, 2), server_default='0')
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    don_hang = relationship('DonHangModel', backref='goi_hang')
    tram_ha_canh = relationship('TramHaCanhModel', backref='goi_hang')
