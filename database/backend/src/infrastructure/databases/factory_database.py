from infrastructure.databases.abstract_database import AbstractDatabase
from infrastructure.databases.database_mssql import DatabaseMSSQL
from infrastructure.databases.database_postgres import DatabasePostgres

class FactoryDatabase:
    @staticmethod
    def get_database(database_type: str) -> AbstractDatabase:
        db_type = database_type.upper()
        if db_type == 'MSSQL':
            return DatabaseMSSQL()
        if db_type in ('POSTGRES', 'POSTGREE', 'POSTGRESQL'):
            return DatabasePostgres()
        raise ValueError(f"Unsupported database type: {database_type}")