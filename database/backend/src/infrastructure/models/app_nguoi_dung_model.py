from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from infrastructure.databases.base import Base

class NguoiDungModel(Base):
    __tablename__ = 'nguoi_dung'
    __table_args__ = {'schema': 'auth_app', 'extend_existing': True}

    ma_nguoi_dung = Column(UUID(as_uuid=True), primary_key=True, server_default=func.uuid_generate_v4())
    ma_vai_tro = Column(UUID(as_uuid=True), ForeignKey('auth_app.vai_tro.ma_vai_tro', ondelete='RESTRICT'), nullable=False)
    ho_ten = Column(String(150), nullable=False)
    email = Column(String(255), nullable=False, unique=True)
    so_dien_thoai = Column(String(20), nullable=True)
    mat_khau_hash = Column(Text, nullable=False)
    ngay_tao = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    vai_tro = relationship('VaiTroModel', backref='nguoi_dung')
