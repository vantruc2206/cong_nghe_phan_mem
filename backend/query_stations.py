import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))
from infrastructure.databases.postgres import session
from infrastructure.models.app_tram_ha_canh_model import TramHaCanhModel
from infrastructure.models.app_drone_model import DroneModel

print('STATIONS:')
for i, s in enumerate(session.query(TramHaCanhModel).all()):
    print(f'  [{i}] {s.ten_tram}: lat={s.lat}, lng={s.lng}')

print('\nDRONES:')
for i, d in enumerate(session.query(DroneModel).all()):
    print(f'  [{i}] {d.ma_drone}: status={d.trang_thai_drone} -> anchored to station[{i % 6}]')
