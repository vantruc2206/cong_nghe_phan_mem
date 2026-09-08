import sys, os
sys.path.insert(0, os.path.join(os.getcwd(), 'src'))
from infrastructure.databases.postgres import session
from infrastructure.models.app_tram_ha_canh_model import TramHaCanhModel
from infrastructure.models.app_drone_model import DroneModel

with open('dump_coords.txt', 'w', encoding='utf-8') as f:
    f.write('=== STATIONS ===\n')
    for s in session.query(TramHaCanhModel).all():
        f.write(f'{s.ten_tram} | lat={s.lat} | lng={s.lng} | addr={s.dia_chi_tram}\n')
    f.write('\n=== DRONES ===\n')
    for d in session.query(DroneModel).all():
        f.write(f'{d.ma_drone} | status={d.trang_thai_drone}\n')

print('DONE WROTE FILE')
