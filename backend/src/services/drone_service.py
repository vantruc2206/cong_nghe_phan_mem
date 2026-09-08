import uuid
from domain.models.idrone_repository import IDroneRepository
from infrastructure.models.app_drone_model import DroneModel
from typing import List, Optional

def _parse_uuid(val):
    if not val:
        return None
    if isinstance(val, uuid.UUID):
        return val
    try:
        return uuid.UUID(str(val))
    except Exception:
        return None

class DroneService:
    def __init__(self, repository: IDroneRepository):
        self.repository = repository

    def get_all(self) -> List[DroneModel]:
        return self.repository.get_all()

    def get_by_id(self, ma_drone: str) -> Optional[DroneModel]:
        return self.repository.get_by_id(ma_drone)

    def create(self, data: dict) -> DroneModel:
        drone = DroneModel(
            ten_drone=data.get('ten_drone'),
            model=data.get('model'),
            tai_trong_toi_da=data.get('tai_trong_toi_da', 5.0),
            trang_thai_drone=data.get('trang_thai') or data.get('trang_thai_drone', 'Sẵn sàng'),
            cong_suat_pin=data.get('dung_luong_pin') or data.get('cong_suat_pin', 100),
            vi_do_hien_tai=data.get('vi_do_hien_tai'),
            kinh_do_hien_tai=data.get('kinh_do_hien_tai'),
            ma_tram_hien_tai=_parse_uuid(data.get('ma_tram_hien_tai')),
            ngay_bao_tri_gan_nhat=data.get('ngay_bao_tri_gan_nhat'),
        )
        return self.repository.create(drone)

    def update(self, ma_drone: str, data: dict) -> Optional[DroneModel]:
        drone = self.repository.get_by_id(ma_drone)
        if not drone:
            return None

        if 'ten_drone' in data:
            drone.ten_drone = data['ten_drone']
        if 'model' in data:
            drone.model = data['model']
        if 'tai_trong_toi_da' in data:
            drone.tai_trong_toi_da = data['tai_trong_toi_da']
        if 'trang_thai' in data:
            drone.trang_thai_drone = data['trang_thai']
        if 'trang_thai_drone' in data:
            drone.trang_thai_drone = data['trang_thai_drone']
        if 'dung_luong_pin' in data:
            drone.cong_suat_pin = data['dung_luong_pin']
        if 'cong_suat_pin' in data:
            drone.cong_suat_pin = data['cong_suat_pin']
        if 'vi_do_hien_tai' in data:
            drone.vi_do_hien_tai = data['vi_do_hien_tai']
        if 'kinh_do_hien_tai' in data:
            drone.kinh_do_hien_tai = data['kinh_do_hien_tai']
        if 'ma_tram_hien_tai' in data:
            drone.ma_tram_hien_tai = _parse_uuid(data['ma_tram_hien_tai'])
        if 'ngay_bao_tri_gan_nhat' in data:
            drone.ngay_bao_tri_gan_nhat = data['ngay_bao_tri_gan_nhat']

        self.repository.update()
        return drone

    def delete(self, ma_drone: str) -> bool:
        drone = self.repository.get_by_id(ma_drone)
        if not drone:
            return False
        self.repository.delete(drone)
        return True
