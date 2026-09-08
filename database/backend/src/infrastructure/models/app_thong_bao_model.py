from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from infrastructure.databases.base import Base

class ThongBaoModel(Base):
    __tablename__ = 'thong_bao'
    __table_args__ = {'schema': 'customer', 'extend_existing': True}

    ma_thong_bao = Column(UUID(as_uuid=True), primary_key=True, server_default=func.uuid_generate_v4())
    ma_kh = Column(UUID(as_uuid=True), ForeignKey('customer.khach_hang.ma_kh', ondelete='CASCADE'), nullable=False)
    ma_don_hang = Column(UUID(as_uuid=True), ForeignKey('app.don_hang.ma_don_hang', ondelete='SET NULL'), nullable=True)
    trang_thai = Column(String(20), nullable=False, server_default='Chưa đọc')
    thoi_gian_gui = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    noi_dung = Column(Text, nullable=False)

    khach_hang = relationship('KhachHangModel', backref='thong_bao')
    don_hang = relationship('DonHangModel', backref='thong_bao')
