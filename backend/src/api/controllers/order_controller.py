from flask import Blueprint, request, jsonify
from infrastructure.repositories.order_repository import OrderRepository
from services.order_service import OrderService
from api.schemas.order import (
    DonHangRequestSchema, DonHangResponseSchema,
    GoiHangRequestSchema, GoiHangResponseSchema
)

from infrastructure.databases.postgres import session
from infrastructure.models.app_nguoi_dung_model import NguoiDungModel
from infrastructure.models.app_khach_hang_model import KhachHangModel
from infrastructure.models.app_goi_hang_model import GoiHangModel

order_bp = Blueprint('order', __name__, url_prefix='/orders')

order_repo = OrderRepository()
order_service = OrderService(order_repo)

order_req = DonHangRequestSchema()
order_res = DonHangResponseSchema()
package_req = GoiHangRequestSchema()
package_res = GoiHangResponseSchema()

def _format_order_response(o):
    cust_name = ''
    phone = ''
    if o.khach_hang:
        parts = [o.khach_hang.ho, o.khach_hang.ten_dem, o.khach_hang.ten]
        cust_name = " ".join([p for p in parts if p]).strip()
        phone = o.khach_hang.so_dien_thoai or ''

    addr = ''
    deliv_lat = None
    deliv_lng = None
    if o.dia_chi:
        addr = getattr(o.dia_chi, 'dia_chi_cu_the', None) or getattr(o.dia_chi, 'dia_chi_chi_tiet', None) or ''
        if not addr:
            parts = [getattr(o.dia_chi, 'so_nha', ''), getattr(o.dia_chi, 'ten_duong', ''), getattr(o.dia_chi, 'phuong_xa', ''), getattr(o.dia_chi, 'quan_huyen', '')]
            addr = ", ".join([p for p in parts if p]).strip()
        d_lat = getattr(o.dia_chi, 'lat', None) or getattr(o.dia_chi, 'vi_do', None)
        d_lng = getattr(o.dia_chi, 'lng', None) or getattr(o.dia_chi, 'kinh_do', None)
        if d_lat is not None: deliv_lat = float(d_lat)
        if d_lng is not None: deliv_lng = float(d_lng)

    weight = 0.0
    station_name = ''
    station_id = None
    station_lat = None
    station_lng = None
    if o.goi_hang and len(o.goi_hang) > 0:
        w_sum = sum(getattr(g, 'can_nang', 0) for g in o.goi_hang)
        weight = float(w_sum)
        first_pkg = o.goi_hang[0]
        if hasattr(first_pkg, 'tram_ha_canh') and first_pkg.tram_ha_canh and getattr(first_pkg, 'ma_tram', None) and o.trang_thai_don_hang != 'Chờ duyệt':
            st = first_pkg.tram_ha_canh
            station_name = getattr(st, 'ten_tram', '')
            station_id = str(getattr(st, 'ma_tram', ''))
            st_lat = getattr(st, 'lat', None) or getattr(st, 'vi_do', None)
            st_lng = getattr(st, 'lng', None) or getattr(st, 'kinh_do', None)
            if st_lat is not None: station_lat = float(st_lat)
            if st_lng is not None: station_lng = float(st_lng)

    assigned_drone_id = None
    rejection_reason = None
    delivery_status = None
    try:
        from infrastructure.databases.postgres import session as db_s
        from infrastructure.models.app_giao_hang_model import GiaoHangModel
        from infrastructure.models.app_su_co_giao_hang_model import SuCoGiaoHangModel
        gh_rec = db_s.query(GiaoHangModel).filter_by(ma_don_hang=o.ma_don_hang).first()
        if gh_rec:
            delivery_status = gh_rec.trang_thai_giao_hang
            if gh_rec.ma_drone:
                assigned_drone_id = str(gh_rec.ma_drone)
            incident = db_s.query(SuCoGiaoHangModel).filter_by(ma_giao_hang=gh_rec.ma_giao_hang).order_by(SuCoGiaoHangModel.created_at.desc()).first()
            if incident and incident.mo_ta_su_co:
                rejection_reason = incident.mo_ta_su_co
    except Exception:
        pass

    return {
        'ma_don_hang': str(o.ma_don_hang),
        'ma_van_don': str(o.ma_don_hang),
        'ma_drone': assigned_drone_id,
        'ma_kh': str(o.ma_kh),
        'ma_khach_hang': str(o.ma_kh),
        'ma_dia_chi': str(o.ma_dia_chi),
        'trang_thai_don_hang': o.trang_thai_don_hang,
        'trang_thai': o.trang_thai_don_hang,
        'trang_thai_giao_hang': delivery_status,
        'cach_thuc_thanh_toan': o.cach_thuc_thanh_toan or 'COD',
        'tong_tien': float(o.tong_tien) if o.tong_tien is not None else 0.0,
        'ngay_dat_hang': o.ngay_dat_hang.isoformat() if hasattr(o, 'ngay_dat_hang') and o.ngay_dat_hang else None,
        'ngay_cap_nhat': o.ngay_cap_nhat.isoformat() if hasattr(o, 'ngay_cap_nhat') and o.ngay_cap_nhat else None,
        'ten_khach_hang': cust_name,
        'ten_nguoi_nhan': cust_name,
        'so_dien_thoai_nhan': phone,
        'dia_chi_giao': addr,
        'vi_do': deliv_lat,
        'kinh_do': deliv_lng,
        'toa_do_giao': {'lat': deliv_lat, 'lng': deliv_lng} if (deliv_lat and deliv_lng) else None,
        'trong_luong': weight,
        'ma_tram': station_id,
        'ten_tram': station_name,
        'tram_vi_do': station_lat,
        'tram_kinh_do': station_lng,
        'tram_lat': station_lat,
        'tram_lng': station_lng,
        'ly_do_tu_choi': rejection_reason,
        'mo_ta_su_co': rejection_reason
    }

@order_bp.route('/', methods=['GET'])
def list_orders():
    """
    Get orders (supports filtering by ma_khach_hang, ma_kh, or email)
    """
    param = request.args.get('ma_khach_hang') or request.args.get('ma_kh') or request.args.get('email')
    orders = order_service.get_all_orders()
    
    if not param or str(param).strip().lower() in ['', 'undefined', 'null', 'none']:
        return jsonify([_format_order_response(o) for o in orders]), 200

    param_str = str(param).strip().lower()
    target_emails = set()
    if '@' in param_str:
        target_emails.add(param_str)

    target_kh_ids = set()
    if len(param_str) == 36 and '-' in param_str:
        target_kh_ids.add(param_str)

    # 1. Lookup NguoiDungModel
    try:
        if len(param_str) == 36 and '-' in param_str:
            user = session.query(NguoiDungModel).filter_by(ma_nguoi_dung=param_str).first()
        else:
            user = session.query(NguoiDungModel).filter(NguoiDungModel.email.ilike(param_str)).first()
        if user and user.email:
            target_emails.add(user.email.lower())
    except Exception:
        pass

    # 2. Lookup KhachHangModel
    try:
        filters = []
        if target_emails:
            filters.append(KhachHangModel.email.in_(list(target_emails)))
        if target_kh_ids:
            filters.append(KhachHangModel.ma_kh.in_(list(target_kh_ids)))
        if filters:
            from sqlalchemy import or_
            khs = session.query(KhachHangModel).filter(or_(*filters)).all()
            for k in khs:
                target_kh_ids.add(str(k.ma_kh).lower())
                if k.email:
                    target_emails.add(k.email.lower())
    except Exception:
        pass

    # 3. Match orders belonging strictly to target_kh_ids or target_emails
    matched_orders = []
    for o in orders:
        o_ma_kh = str(o.ma_kh).lower()
        o_email = (o.khach_hang.email.lower() if hasattr(o, 'khach_hang') and o.khach_hang and getattr(o.khach_hang, 'email', None) else '')
        if o_ma_kh in target_kh_ids or (o_email and o_email in target_emails):
            matched_orders.append(_format_order_response(o))

    return jsonify(matched_orders), 200

@order_bp.route('/<uuid:ma_don_hang>', methods=['GET'])
def get_order(ma_don_hang):
    """
    Get order by ID
    ---
    get:
      summary: Get order details
      tags:
        - Orders
      parameters:
        - name: ma_don_hang
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        200:
          description: Order details
        404:
          description: Order not found
    """
    order = order_service.get_order_by_id(str(ma_don_hang))
    if not order:
        return jsonify({'error': 'Order not found'}), 404
    return jsonify(_format_order_response(order)), 200


@order_bp.route('/', methods=['POST'])
def create_order():
    """
    Create a new order
    """
    data = request.get_json() or {}
    
    # Handle customer resolution & address/coordinates if ma_dia_chi is not provided directly
    ma_kh_input = data.get('ma_kh') or data.get('ma_khach_hang')
    kh_obj = None
    
    if ma_kh_input:
        # 1. Check KhachHangModel directly by ma_kh
        try:
            kh_obj = session.query(KhachHangModel).filter_by(ma_kh=ma_kh_input).first()
        except Exception:
            session.rollback()
            kh_obj = None

        # 2. Check NguoiDungModel by ma_nguoi_dung or email if not found in KhachHangModel
        if not kh_obj:
            try:
                from infrastructure.models.app_nguoi_dung_model import NguoiDungModel
                from api.controllers.auth_controller import _get_or_create_khach_hang
                user_obj = session.query(NguoiDungModel).filter(
                    (NguoiDungModel.ma_nguoi_dung == ma_kh_input) | (NguoiDungModel.email == ma_kh_input)
                ).first()
                if user_obj:
                    kh_obj = _get_or_create_khach_hang(user_obj)
            except Exception:
                session.rollback()
                kh_obj = None

    # 3. Fallback to first available customer if still not resolved
    if not kh_obj:
        try:
            kh_obj = session.query(KhachHangModel).first()
        except Exception:
            session.rollback()
            kh_obj = None

    if kh_obj:
        data['ma_kh'] = str(kh_obj.ma_kh)

    if not data.get('ma_dia_chi') and kh_obj:
        deliv_lat = data.get('vi_do') or data.get('lat') or (data.get('toa_do_giao') or {}).get('lat') or 10.804434
        deliv_lng = data.get('kinh_do') or data.get('lng') or (data.get('toa_do_giao') or {}).get('lng') or 106.717844
        addr_text = data.get('dia_chi_giao') or data.get('dia_chi') or 'TP. Hồ Chí Minh'
        
        try:
            from infrastructure.models.app_dia_chi_model import DiaChiModel
            new_addr = DiaChiModel(
                ma_kh=kh_obj.ma_kh,
                dia_chi_cu_the=addr_text,
                thanh_pho='TP. Hồ Chí Minh',
                lat=float(deliv_lat),
                lng=float(deliv_lng)
            )
            session.add(new_addr)
            session.commit()
            session.refresh(new_addr)
            data['ma_dia_chi'] = str(new_addr.ma_dia_chi)
        except Exception as e:
            session.rollback()
            print("Error auto-creating address for order:", e)

    # Validate schema if ma_dia_chi was successfully resolved
    errors = order_req.validate(data)
    if errors:
        return jsonify(errors), 400
        
    order = order_service.create_order(data)
    if not order:
        return jsonify({'error': 'Customer or Address not found'}), 404
        
    # Auto-create package for the order if weight / package info provided
    try:
        w = float(data.get('trong_luong') or 1.5)
        pkg_name = data.get('ten_hang_hoa') or 'Gói hàng tổng hợp'
        
        goi_hang = GoiHangModel(
            ma_don_hang=order.ma_don_hang,
            ma_tram=None,
            loai_hang_hoa=pkg_name,
            can_nang=w,
            gia_tri_uoc_tinh=float(data.get('tong_tien') or 35000)
        )
        session.add(goi_hang)
        session.commit()
    except Exception as e:
        print("Error auto-creating package:", e)

    return jsonify(_format_order_response(order)), 201

@order_bp.route('/<uuid:ma_don_hang>', methods=['PUT'])
def update_order(ma_don_hang):
    """
    Update order
    ---
    put:
      summary: Update order info
      tags:
        - Orders
      parameters:
        - name: ma_don_hang
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/DonHangRequest'
      responses:
        200:
          description: Order updated
        404:
          description: Order not found
    """
    data = request.get_json()
    errors = order_req.validate(data)
    if errors:
        return jsonify(errors), 400
        
    order = order_service.update_order(str(ma_don_hang), data)
    if not order:
        return jsonify({'error': 'Order not found, or not in pending state, or customer/address not found'}), 400
    return jsonify(order_res.dump(order)), 200

@order_bp.route('/<uuid:ma_don_hang>', methods=['DELETE'])
def delete_order(ma_don_hang):
    """
    Delete order
    ---
    delete:
      summary: Delete order
      tags:
        - Orders
      parameters:
        - name: ma_don_hang
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        204:
          description: Order deleted
        404:
          description: Order not found
    """
    order = order_service.delete_order(str(ma_don_hang))
    if not order:
        return jsonify({'error': 'Order not found, or cannot be canceled'}), 400
    return jsonify(order_res.dump(order)), 200

@order_bp.route('/<ma_don_hang>/complete', methods=['PUT', 'POST'])
def complete_order(ma_don_hang):
    """
    Mark order as completed (Hoàn thành)
    ---
    put:
      summary: Mark order as completed
      tags:
        - Orders
      parameters:
        - name: ma_don_hang
          in: path
          required: true
          schema:
            type: string
      responses:
        200:
          description: Order marked as completed
        404:
          description: Order not found
    """
    order = order_service.complete_order(str(ma_don_hang))
    if not order:
        return jsonify({'error': 'Order not found'}), 404
    return jsonify(_format_order_response(order)), 200



# Packages routes
@order_bp.route('/packages', methods=['GET'])
def list_packages():
    """
    List all packages
    ---
    get:
      summary: List packages
      tags:
        - Packages
      responses:
        200:
          description: List of packages
    """
    packages = order_service.get_all_packages()
    return jsonify(package_res.dump(packages, many=True)), 200

@order_bp.route('/<uuid:ma_don_hang>/packages', methods=['GET'])
def list_order_packages(ma_don_hang):
    """
    List packages for an order
    ---
    get:
      summary: List order specific packages
      tags:
        - Packages
      parameters:
        - name: ma_don_hang
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        200:
          description: Packages list
    """
    packages = order_service.get_packages_by_order_id(str(ma_don_hang))
    return jsonify(package_res.dump(packages, many=True)), 200

@order_bp.route('/packages', methods=['POST'])
def create_package():
    """
    Create a package
    ---
    post:
      summary: Create a package
      tags:
        - Packages
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/GoiHangRequest'
      responses:
        201:
          description: Package created
    """
    data = request.get_json()
    errors = package_req.validate(data)
    if errors:
        return jsonify(errors), 400
        
    result = order_service.create_package(data)
    if 'error' in result:
        return jsonify({'error': result['error']}), 400
        
    return jsonify(package_res.dump(result['package'])), 201

@order_bp.route('/packages/<uuid:ma_goi_hang>', methods=['PUT'])
def update_package(ma_goi_hang):
    """
    Update package
    ---
    put:
      summary: Update package details
      tags:
        - Packages
      parameters:
        - name: ma_goi_hang
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/GoiHangRequest'
      responses:
        200:
          description: Package updated
    """
    data = request.get_json()
    errors = package_req.validate(data)
    if errors:
        return jsonify(errors), 400
        
    result = order_service.update_package(str(ma_goi_hang), data)
    if 'error' in result:
        return jsonify({'error': result['error']}), 400
        
    return jsonify(package_res.dump(result['package'])), 200

@order_bp.route('/packages/<uuid:ma_goi_hang>', methods=['DELETE'])
def delete_package(ma_goi_hang):
    """
    Delete package
    ---
    delete:
      summary: Delete package
      tags:
        - Packages
      parameters:
        - name: ma_goi_hang
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        204:
          description: Package deleted
    """
    success = order_service.delete_package(str(ma_goi_hang))
    if not success:
        return jsonify({'error': 'Package not found'}), 404
    return '', 204

@order_bp.route('/<uuid:ma_don_hang>/approve', methods=['POST'])
def approve_order(ma_don_hang):
    """
    Approve order (UC-04)
    ---
    post:
      summary: Approve an order
      tags:
        - Orders
      parameters:
        - name: ma_don_hang
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        200:
          description: Order approved
        404:
          description: Order not found
        400:
          description: Order not in pending state
    """
    result = order_service.approve_order(str(ma_don_hang))
    if 'error' in result:
        status_code = 404 if "not found" in result['error'] else 400
        return jsonify({'error': result['error']}), status_code
    return jsonify(order_res.dump(result['order'])), 200

@order_bp.route('/<uuid:ma_don_hang>/reject', methods=['POST'])
def reject_order(ma_don_hang):
    """
    Reject order (UC-04)
    ---
    post:
      summary: Reject an order
      tags:
        - Orders
      parameters:
        - name: ma_don_hang
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                reason:
                  type: string
      responses:
        200:
          description: Order rejected
        404:
          description: Order not found
        400:
          description: Order not in pending state
    """
    data = request.get_json() or {}
    reason = data.get('reason', 'Không có lý do cụ thể')
    result = order_service.reject_order(str(ma_don_hang), reason)
    if 'error' in result:
        status_code = 404 if "not found" in result['error'] else 400
        return jsonify({'error': result['error']}), status_code
    return jsonify({
        'order': order_res.dump(result['order']),
        'reason': result['reason']
    }), 200

@order_bp.route('/<uuid:ma_don_hang>/schedule', methods=['POST'])
def schedule_order(ma_don_hang):
    """
    Schedule delivery for order (UC-05)
    ---
    post:
      summary: Schedule order delivery
      tags:
        - Orders
      parameters:
        - name: ma_don_hang
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                ma_drone:
                  type: string
                  format: uuid
                ma_nguoi_phu_trach:
                  type: string
                  format: uuid
                thoi_gian_giao:
                  type: string
                  format: date-time
      responses:
        200:
          description: Delivery scheduled
    """
    data = request.get_json() or {}
    result = order_service.schedule_order(str(ma_don_hang), data)
    if 'error' in result:
        status_code = 404 if "not found" in result['error'] else 400
        return jsonify({'error': result['error']}), status_code
        
    from api.schemas.delivery import GiaoHangResponseSchema
    delivery_resp_schema = GiaoHangResponseSchema()
    return jsonify({
        'order': order_res.dump(result['order']),
        'delivery': delivery_resp_schema.dump(result['delivery'])
    }), 200

@order_bp.route('/<ma_don_hang>/start-delivery', methods=['POST', 'OPTIONS'])
def start_delivery(ma_don_hang):
    """
    Start order delivery (Transition to 'Đang giao' & trigger simulation)
    """
    if request.method == 'OPTIONS':
        return '', 200
    try:
        result = order_service.start_delivery(str(ma_don_hang))
        if 'error' in result:
            status_code = 404 if "not found" in result['error'] else 400
            return jsonify({'error': result['error']}), status_code
        return jsonify({'message': 'Bắt đầu giao hàng thành công', 'order': _format_order_response(result['order'])}), 200
    except Exception as e:
        session.rollback()
        print("Error starting delivery:", e)
        return jsonify({'error': f'Lỗi khi kích hoạt bay: {str(e)}'}), 500


@order_bp.route('/<uuid:ma_don_hang>/eta', methods=['GET'])
def get_order_eta(ma_don_hang):
    """
    Estimate order delivery ETA (UC-10)
    ---
    get:
      summary: Get estimated delivery duration
      tags:
        - Orders
      parameters:
        - name: ma_don_hang
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        200:
          description: ETA calculation
    """
    result = order_service.get_order_eta(str(ma_don_hang))
    if 'error' in result:
        status_code = 404 if "not found" in result['error'] else 400
        return jsonify({'error': result['error']}), status_code
        
    return jsonify(result), 200
