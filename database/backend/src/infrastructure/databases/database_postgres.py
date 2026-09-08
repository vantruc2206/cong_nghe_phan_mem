from sqlalchemy import text
from infrastructure.databases.abstract_database import AbstractDatabase
from infrastructure.databases.base import Base

class DatabasePostgres(AbstractDatabase):
    def __init__(self):
        super().__init__()
        
    def init_database(self, app):
        with self.engine.connect() as conn:
            conn.execute(text("CREATE SCHEMA IF NOT EXISTS auth_app"))
            conn.execute(text("CREATE SCHEMA IF NOT EXISTS customer"))
            conn.execute(text("CREATE SCHEMA IF NOT EXISTS app"))
            conn.commit()
        Base.metadata.create_all(bind=self.engine)