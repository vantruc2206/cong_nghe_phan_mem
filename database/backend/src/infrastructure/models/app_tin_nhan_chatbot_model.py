from sqlalchemy import Column, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from infrastructure.databases.base import Base

class TinNhanChatbotModel(Base):
    __tablename__ = 'tin_nhan_chatbot'
    __table_args__ = {'schema': 'customer', 'extend_existing': True}

    ma_tin_nhan = Column(UUID(as_uuid=True), primary_key=True, server_default=func.uuid_generate_v4())
    ma_kh = Column(UUID(as_uuid=True), ForeignKey('customer.khach_hang.ma_kh', ondelete='CASCADE'), nullable=False)
    noi_dung = Column(Text, nullable=False)
    phan_hoi = Column(Text, nullable=True)
    thoi_gian = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    khach_hang = relationship('KhachHangModel', backref='tin_nhan_chatbot')
