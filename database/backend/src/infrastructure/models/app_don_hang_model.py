from sqlalchemy import Column, String, DateTime, ForeignKey, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from infrastructure.databases.base import Base

class DonHangModel(Base):
    __tablename__ = 'don_hang'
    __table_args__ = {'schema': 'app', 'extend_existing': True}

    ma_don_hang = Column(UUID(as_uuid=True), primary_key=True, server_default=func.uuid_generate_v4())
    ma_kh = Column(UUID(as_uuid=True), ForeignKey('customer.khach_hang.ma_kh', ondelete='RESTRICT'), nullable=False)
    ma_dia_chi = Column(UUID(as_uuid=True), ForeignKey('customer.dia_chi.ma_dia_chi', ondelete='RESTRICT'), nullable=False)
    trang_thai_don_hang = Column(String(30), nullable=False, server_default='Chờ duyệt')
    cach_thuc_thanh_toan = Column(String(50), nullable=True)
    tong_tien = Column(Numeric(15, 2), server_default='0')
    ngay_dat_hang = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    ngay_cap_nhat = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    khach_hang = relationship('KhachHangModel', backref='don_hang')
    dia_chi = relationship('DiaChiModel', backref='don_hang')
