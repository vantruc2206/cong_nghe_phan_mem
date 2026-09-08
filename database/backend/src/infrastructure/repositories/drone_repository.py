from domain.models.idrone_repository import IDroneRepository
from typing import List, Optional
from infrastructure.databases.postgres import session
from infrastructure.models.app_drone_model import DroneModel
from sqlalchemy.orm import Session

class DroneRepository(IDroneRepository):
    def __init__(self, session: Session = session):
        self.session = session

    def get_all(self) -> List[DroneModel]:
        return self.session.query(DroneModel).all()

    def get_by_id(self, ma_drone: str) -> Optional[DroneModel]:
        return self.session.query(DroneModel).filter_by(ma_drone=ma_drone).first()

    def create(self, drone: DroneModel) -> DroneModel:
        self.session.add(drone)
        self.session.commit()
        self.session.refresh(drone)
        return drone

    def update(self) -> None:
        self.session.commit()

    def delete(self, drone: DroneModel) -> None:
        self.session.delete(drone)
        self.session.commit()
