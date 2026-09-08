import sys, os
sys.path.insert(0, os.path.join(os.getcwd(), 'src'))
from infrastructure.databases.postgres import session
from infrastructure.models.app_drone_model import DroneModel

drones = session.query(DroneModel).all()
print(f'Current drone count in DB: {len(drones)}')

if len(drones) < 6:
    d5 = DroneModel(trang_thai_drone='Sẵn sàng', cong_suat_pin=100)
    d6 = DroneModel(trang_thai_drone='Sẵn sàng', cong_suat_pin=100)
    session.add(d5)
    session.add(d6)
    session.commit()
    print(f'Added 2 new drones: {d5.ma_drone}, {d6.ma_drone}')

print('ALL DRONES IN DB NOW:')
for i, d in enumerate(session.query(DroneModel).all()):
    print(f'  [{i}] {d.ma_drone} | status={d.trang_thai_drone}')
