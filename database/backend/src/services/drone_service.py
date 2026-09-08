from domain.models.idrone_repository import IDroneRepository
from infrastructure.models.app_drone_model import DroneModel
from typing import List, Optional

class DroneService:
    def __init__(self, repository: IDroneRepository):
        self.repository = repository

    def get_all(self) -> List[DroneModel]:
        return self.repository.get_all()

    def get_by_id(self, ma_drone: str) -> Optional[DroneModel]:
        return self.repository.get_by_id(ma_drone)

    def create(self, data: dict) -> DroneModel:
        drone = DroneModel(
            trang_thai_drone=data.get('trang_thai_drone', 'Sẵn sàng'),
            cong_suat_pin=data.get('cong_suat_pin', 100),
            ngay_bao_tri_gan_nhat=data.get('ngay_bao_tri_gan_nhat')
        )
        return self.repository.create(drone)

    def update(self, ma_drone: str, data: dict) -> Optional[DroneModel]:
        drone = self.repository.get_by_id(ma_drone)
        if not drone:
            return None
        
        drone.trang_thai_drone = data.get('trang_thai_drone', drone.trang_thai_drone)
        drone.cong_suat_pin = data.get('cong_suat_pin', drone.cong_suat_pin)
        drone.ngay_bao_tri_gan_nhat = data.get('ngay_bao_tri_gan_nhat', drone.ngay_bao_tri_gan_nhat)
        
        self.repository.update()
        return drone

    def delete(self, ma_drone: str) -> bool:
        drone = self.repository.get_by_id(ma_drone)
        if not drone:
            return False
        self.repository.delete(drone)
        return True
