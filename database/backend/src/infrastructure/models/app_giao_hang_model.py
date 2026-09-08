from sqlalchemy import Column, String, DateTime, ForeignKey, Float
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from infrastructure.databases.base import Base

class GiaoHangModel(Base):
    __tablename__ = 'giao_hang'
    __table_args__ = {'schema': 'app', 'extend_existing': True}

    ma_giao_hang = Column(UUID(as_uuid=True), primary_key=True, server_default=func.uuid_generate_v4())
    ma_don_hang = Column(UUID(as_uuid=True), ForeignKey('app.don_hang.ma_don_hang', ondelete='CASCADE'), nullable=False)
    ma_drone = Column(UUID(as_uuid=True), ForeignKey('app.drone.ma_drone', ondelete='SET NULL'), nullable=True)
    ma_nguoi_phu_trach = Column(UUID(as_uuid=True), ForeignKey('auth_app.nguoi_dung.ma_nguoi_dung', ondelete='SET NULL'), nullable=True)
    trang_thai_giao_hang = Column(String(30), nullable=False, server_default='Chờ xử lý')
    vi_tri_hien_tai_lat = Column(Float, nullable=True)
    vi_tri_hien_tai_lng = Column(Float, nullable=True)
    thoi_gian_giao = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    don_hang = relationship('DonHangModel', backref='giao_hang')
    drone = relationship('DroneModel', backref='giao_hang')
    nguoi_phu_trach = relationship('NguoiDungModel', backref='giao_hang')
