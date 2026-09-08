from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from infrastructure.databases.base import Base

class SuCoGiaoHangModel(Base):
    __tablename__ = 'su_co_giao_hang'
    __table_args__ = {'schema': 'app', 'extend_existing': True}

    ma_van_de = Column(UUID(as_uuid=True), primary_key=True, server_default=func.uuid_generate_v4())
    ma_tram = Column(UUID(as_uuid=True), ForeignKey('app.tram_ha_canh.ma_tram', ondelete='SET NULL'), nullable=True)
    ma_giao_hang = Column(UUID(as_uuid=True), ForeignKey('app.giao_hang.ma_giao_hang', ondelete='CASCADE'), nullable=False)
    thoi_gian_xay_ra = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    mo_ta_su_co = Column(Text, nullable=False)
    muc_do_nghiem_trong = Column(String(20), nullable=False, server_default='Trung bình')
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    tram_ha_canh = relationship('TramHaCanhModel', backref='su_co_giao_hang')
    giao_hang = relationship('GiaoHangModel', backref='su_co_giao_hang')
