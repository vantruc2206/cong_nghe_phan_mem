from infrastructure.databases.factory_database import FactoryDatabase
from infrastructure.databases.base import Base

def init_db(app):
    # Khởi tạo kết nối PostgreSQL thông qua FactoryDatabase
    FactoryDatabase.get_database('POSTGRES').init_database(app)