from flask import Blueprint, jsonify
from infrastructure.databases.postgres import session
from infrastructure.models.app_don_hang_model import DonHangModel
from infrastructure.models.app_giao_hang_model import GiaoHangModel
from infrastructure.models.app_drone_model import DroneModel
from infrastructure.models.app_tram_ha_canh_model import TramHaCanhModel
from sqlalchemy import func, cast, Date
from datetime import datetime, timedelta, timezone

report_bp = Blueprint('report', __name__, url_prefix='/reports')


@report_bp.route('/summary', methods=['GET'])
def get_summary():
    """
    Get dashboard/report summary
    ---
    get:
      summary: Get overall statistics summary
      tags:
        - Reports
      responses:
        200:
          description: Statistics summary
    """
    # Tổng số đơn hàng theo trạng thái
    order_stats = (
        session.query(
            DonHangModel.trang_thai_don_hang,
            func.count(DonHangModel.ma_don_hang)
        )
        .group_by(DonHangModel.trang_thai_don_hang)
        .all()
    )
    order_by_status = {str(row[0]): int(row[1]) for row in order_stats}

    # Tổng số giao hàng theo trạng thái
    delivery_stats = (
        session.query(
            GiaoHangModel.trang_thai_giao_hang,
            func.count(GiaoHangModel.ma_giao_hang)
        )
        .group_by(GiaoHangModel.trang_thai_giao_hang)
        .all()
    )
    delivery_by_status = {str(row[0]): int(row[1]) for row in delivery_stats}

    # Đơn hàng theo ngày trong 7 ngày gần nhất
    seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
    daily_orders = (
        session.query(
            cast(DonHangModel.ngay_dat_hang, Date).label('date'),
            func.count(DonHangModel.ma_don_hang)
        )
        .filter(DonHangModel.ngay_dat_hang >= seven_days_ago)
        .group_by(cast(DonHangModel.ngay_dat_hang, Date))
        .order_by(cast(DonHangModel.ngay_dat_hang, Date))
        .all()
    )
    weekly_data = [
        {'date': str(row[0]), 'count': int(row[1])}
        for row in daily_orders
    ]

    # Thống kê drone
    total_drones = int(session.query(func.count(DroneModel.ma_drone)).scalar() or 0)
    active_drones = int(
        session.query(func.count(DroneModel.ma_drone))
        .filter(DroneModel.trang_thai_drone.in_(['Sẵn sàng', 'Đang giao']))
        .scalar() or 0
    )

    # Thống kê trạm
    total_stations = int(session.query(func.count(TramHaCanhModel.ma_tram)).scalar() or 0)

    total_orders = sum(order_by_status.values())


    completed = delivery_by_status.get('Hoàn thành', 0)
    failed = delivery_by_status.get('Thất bại', 0)
    in_progress = delivery_by_status.get('Đang giao', 0)

    return jsonify({
        'total_orders': total_orders,
        'order_by_status': order_by_status,
        'delivery_by_status': delivery_by_status,
        'weekly_data': weekly_data,
        'drones': {
            'total': total_drones,
            'active': active_drones,
        },
        'stations': {
            'total': total_stations,
        },
        'delivery_stats': {
            'completed': completed,
            'failed': failed,
            'in_progress': in_progress,
        }
    }), 200
