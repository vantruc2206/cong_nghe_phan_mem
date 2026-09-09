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
            
            alter_statements = [
                "ALTER TABLE app.drone ADD COLUMN IF NOT EXISTS ten_drone VARCHAR(100);",
                "ALTER TABLE app.drone ADD COLUMN IF NOT EXISTS model VARCHAR(100);",
                "ALTER TABLE app.drone ADD COLUMN IF NOT EXISTS tai_trong_toi_da NUMERIC(5,2) DEFAULT 5.00;",
                "ALTER TABLE app.drone ADD COLUMN IF NOT EXISTS vi_do_hien_tai NUMERIC(10,7);",
                "ALTER TABLE app.drone ADD COLUMN IF NOT EXISTS kinh_do_hien_tai NUMERIC(10,7);",
                "ALTER TABLE app.drone ADD COLUMN IF NOT EXISTS ma_tram_hien_tai UUID;",
            ]
            for stmt in alter_statements:
                try:
                    conn.execute(text(stmt))
                except Exception as e:
                    print(f"[DB Auto-Migration] Warning executing {stmt}: {e}")
            conn.commit()

        Base.metadata.create_all(bind=self.engine)