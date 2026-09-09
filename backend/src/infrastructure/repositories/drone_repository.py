from domain.models.idrone_repository import IDroneRepository
from typing import List, Optional
from infrastructure.databases.postgres import SessionLocal
from infrastructure.models.app_drone_model import DroneModel

class DroneRepository(IDroneRepository):
    def _ensure_session(self):
        if not hasattr(self, 'session') or self.session is None:
            self.session = SessionLocal()
        return self.session

    def get_all(self) -> List[DroneModel]:
        sess = self._ensure_session()
        try:
            return sess.query(DroneModel).all()
        except Exception:
            try:
                sess.rollback()
            except Exception:
                pass
            self.session = SessionLocal()
            return self.session.query(DroneModel).all()

    def get_by_id(self, ma_drone: str) -> Optional[DroneModel]:
        sess = self._ensure_session()
        try:
            return sess.query(DroneModel).filter(DroneModel.ma_drone == ma_drone).first()
        except Exception:
            try:
                sess.rollback()
            except Exception:
                pass
            self.session = SessionLocal()
            return self.session.query(DroneModel).filter(DroneModel.ma_drone == ma_drone).first()

    def create(self, drone: DroneModel) -> DroneModel:
        sess = self._ensure_session()
        try:
            sess.add(drone)
            sess.commit()
            sess.refresh(drone)
            return drone
        except Exception as e:
            try:
                sess.rollback()
            except Exception:
                pass
            self.session = SessionLocal()
            raise e

    def update(self) -> None:
        sess = self._ensure_session()
        try:
            sess.commit()
        except Exception as e:
            try:
                sess.rollback()
            except Exception:
                pass
            self.session = SessionLocal()
            raise e

    def delete(self, drone: DroneModel) -> None:
        sess = self._ensure_session()
        try:
            sess.delete(drone)
            sess.commit()
        except Exception as e:
            try:
                sess.rollback()
            except Exception:
                pass
            self.session = SessionLocal()
            raise e
