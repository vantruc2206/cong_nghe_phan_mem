from flask import Blueprint, request, jsonify, current_app
from datetime import datetime, timedelta, timezone
import jwt
from werkzeug.security import generate_password_hash, check_password_hash
from infrastructure.databases.postgres import session, SessionLocal
from infrastructure.models.app_nguoi_dung_model import NguoiDungModel
from infrastructure.models.app_vai_tro_model import VaiTroModel
from infrastructure.models.app_khach_hang_model import KhachHangModel
from infrastructure.models.app_dia_chi_model import DiaChiModel
from api.schemas.auth import (
    VaiTroRequestSchema, VaiTroResponseSchema,
    NguoiDungRequestSchema, NguoiDungResponseSchema,
    LoginUserRequestSchema, LoginUserResponseSchema
)

from typing import cast, Dict, Any

def _dump_dict(schema: Any, obj: Any) -> dict[str, Any]:
    res = schema.dump(obj)
    if isinstance(res, dict):
        return cast(dict[str, Any], res)
    return {}

def _get_or_create_khach_hang(user):

    """Finds or creates KhachHangModel corresponding to user email or user id"""
    if not user or not user.email:
        return None
    try:
        kh = session.query(KhachHangModel).filter(
            (KhachHangModel.email == user.email) | (KhachHangModel.ma_kh == user.ma_nguoi_dung)
        ).first()
        if not kh:
            name_parts = (user.ho_ten or 'Khách Hàng').split()
            ho = name_parts[0] if name_parts else 'Khách'
            ten = name_parts[-1] if len(name_parts) > 1 else 'Hàng'
            ten_dem = " ".join(name_parts[1:-1]) if len(name_parts) > 2 else None
            kh = KhachHangModel(
                ma_kh=user.ma_nguoi_dung,
                ho=ho,
                ten_dem=ten_dem,
                ten=ten,
                email=user.email,
                so_dien_thoai=user.so_dien_thoai
            )
            session.add(kh)
            session.commit()
            session.refresh(kh)
        return kh
    except Exception as e:
        session.rollback()
        try:
            return session.query(KhachHangModel).filter_by(email=user.email).first()
        except Exception:
            session.rollback()
            return None

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')

vai_tro_req = VaiTroRequestSchema()
vai_tro_res = VaiTroResponseSchema()
nguoi_dung_req = NguoiDungRequestSchema()
nguoi_dung_res = NguoiDungResponseSchema()
login_req = LoginUserRequestSchema()

@auth_bp.route('/roles', methods=['GET'])
def list_roles():
    """
    Get all roles
    ---
    get:
      summary: Get all system roles
      tags:
        - Authentication
      responses:
        200:
          description: List of roles
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/VaiTroResponse'
    """
    roles = session.query(VaiTroModel).all()
    return jsonify(vai_tro_res.dump(roles, many=True)), 200

@auth_bp.route('/roles', methods=['POST'])
def create_role():
    """
    Create a new role
    ---
    post:
      summary: Create a system role
      tags:
        - Authentication
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/VaiTroRequest'
      responses:
        201:
          description: Role created
        400:
          description: Invalid data or role exists
    """
    data = request.get_json()
    errors = vai_tro_req.validate(data)
    if errors:
        return jsonify(errors), 400
    
    existing = session.query(VaiTroModel).filter_by(ten_vai_tro=data['ten_vai_tro']).first()
    if existing:
        return jsonify({'error': 'Role already exists'}), 400
    
    role = VaiTroModel(ten_vai_tro=data['ten_vai_tro'])
    session.add(role)
    session.commit()
    session.refresh(role)
    return jsonify(vai_tro_res.dump(role)), 201

@auth_bp.route('/users', methods=['GET'])
def list_users():
    """
    Get all users
    ---
    get:
      summary: List all users
      tags:
        - Authentication
      responses:
        200:
          description: List of users
    """
    users = session.query(NguoiDungModel).all()
    roles = {str(r.ma_vai_tro): r.ten_vai_tro for r in session.query(VaiTroModel).all()}
    res = []
    for u in users:
        u_dict = _dump_dict(nguoi_dung_res, u)
        role_id = str(u.ma_vai_tro) if u.ma_vai_tro else ''
        role_name = u.vai_tro.ten_vai_tro if u.vai_tro else roles.get(role_id, 'Customer')
        u_dict['vai_tro'] = str(role_name)
        u_dict['created_at'] = str(u.ngay_tao) if u.ngay_tao else ''
        res.append(u_dict)
    return jsonify(res), 200

@auth_bp.route('/users', methods=['POST'])
def create_user():
    data = request.get_json() or {}
    email = (data.get('email') or '').strip()
    ho_ten = (data.get('ho_ten') or '').strip()
    mat_khau = data.get('mat_khau') or '123456'
    so_dien_thoai = data.get('so_dien_thoai', '')
    role_input = data.get('vai_tro') or 'dispatcher'

    if not email or not ho_ten:
        return jsonify({'error': 'Email và Họ tên là bắt buộc'}), 400

    existing = session.query(NguoiDungModel).filter(NguoiDungModel.email.ilike(email)).first()
    if existing:
        return jsonify({'error': 'Email này đã tồn tại trên hệ thống'}), 400

    # Match role
    s = role_input.lower().strip()
    target_role_name = 'Customer'
    if 'admin' in s:
        target_role_name = 'Admin'
    elif 'dispatch' in s:
        target_role_name = 'Dispatcher'
    elif 'operator' in s or 'station' in s:
        target_role_name = 'Station Operator'
    elif 'manager' in s or 'logistics' in s:
        target_role_name = 'Logistics Manager'

    role_obj = session.query(VaiTroModel).filter(VaiTroModel.ten_vai_tro.ilike(f'%{target_role_name}%')).first()
    if not role_obj:
        role_obj = session.query(VaiTroModel).first()

    hashed_pw = generate_password_hash(mat_khau)
    new_user = NguoiDungModel(
        ma_vai_tro=role_obj.ma_vai_tro if role_obj else None,
        ho_ten=ho_ten,
        email=email,
        so_dien_thoai=so_dien_thoai,
        mat_khau_hash=hashed_pw
    )
    session.add(new_user)
    session.commit()
    session.refresh(new_user)

    _get_or_create_khach_hang(new_user)

    user_dict = _dump_dict(nguoi_dung_res, new_user)
    user_dict['vai_tro'] = str(role_obj.ten_vai_tro) if role_obj else target_role_name
    user_dict['created_at'] = str(new_user.ngay_tao) if new_user.ngay_tao else ''
    return jsonify(user_dict), 201

@auth_bp.route('/users/<ma_nguoi_dung>', methods=['PUT'])
def update_user(ma_nguoi_dung):
    data = request.get_json() or {}
    user = session.query(NguoiDungModel).filter(NguoiDungModel.ma_nguoi_dung == ma_nguoi_dung).first()
    if not user:
        return jsonify({'error': 'Không tìm thấy người dùng'}), 404

    if 'ho_ten' in data and data['ho_ten']:
        user.ho_ten = data['ho_ten'].strip()

    if 'email' in data and data['email']:
        new_email = data['email'].strip()
        if new_email != user.email:
            existing = session.query(NguoiDungModel).filter(NguoiDungModel.email.ilike(new_email)).first()
            if existing:
                return jsonify({'error': 'Email này đã tồn tại trên hệ thống'}), 400
            user.email = new_email

    if 'so_dien_thoai' in data:
        user.so_dien_thoai = data['so_dien_thoai']

    if 'mat_khau' in data and data['mat_khau']:
        setattr(user, 'mat_khau_hash', generate_password_hash(data['mat_khau']))

    if 'vai_tro' in data and data['vai_tro']:
        s = data['vai_tro'].lower().strip()
        target_role_name = 'Customer'
        if 'admin' in s:
            target_role_name = 'Admin'
        elif 'dispatch' in s:
            target_role_name = 'Dispatcher'
        elif 'operator' in s or 'station' in s:
            target_role_name = 'Station Operator'
        elif 'manager' in s or 'logistics' in s:
            target_role_name = 'Logistics Manager'

        role_obj = session.query(VaiTroModel).filter(VaiTroModel.ten_vai_tro.ilike(f'%{target_role_name}%')).first()
        if role_obj:
            user.ma_vai_tro = role_obj.ma_vai_tro

    session.commit()
    session.refresh(user)

    user_dict = _dump_dict(nguoi_dung_res, user)
    role_obj = session.query(VaiTroModel).filter_by(ma_vai_tro=user.ma_vai_tro).first()
    user_dict['vai_tro'] = str(role_obj.ten_vai_tro) if role_obj else 'Customer'
    user_dict['created_at'] = str(user.ngay_tao) if user.ngay_tao else ''
    return jsonify(user_dict), 200

@auth_bp.route('/users/<ma_nguoi_dung>', methods=['DELETE'])
def delete_user(ma_nguoi_dung):
    user = session.query(NguoiDungModel).filter(NguoiDungModel.ma_nguoi_dung == ma_nguoi_dung).first()
    if not user:
        return jsonify({'error': 'Không tìm thấy người dùng'}), 404

    session.delete(user)
    session.commit()
    return jsonify({'message': 'Xóa tài khoản thành công'}), 200

@auth_bp.route('/signup', methods=['POST'])
def signup():
    """
    Register a new user
    ---
    post:
      summary: Register user
      tags:
        - Authentication
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/NguoiDungRequest'
      responses:
        201:
          description: User registered successfully
        400:
          description: Invalid data
    """
    data = request.get_json()
    errors = nguoi_dung_req.validate(data)
    if errors:
        return jsonify(errors), 400
    
    existing = session.query(NguoiDungModel).filter_by(email=data['email']).first()
    if existing:
        return jsonify({'error': 'Email is already registered'}), 400
        
    role = session.query(VaiTroModel).filter_by(ma_vai_tro=data['ma_vai_tro']).first()
    if not role:
        return jsonify({'error': 'Role not found'}), 400

    hashed_pw = generate_password_hash(data['mat_khau'])
    user = NguoiDungModel(
        ma_vai_tro=data['ma_vai_tro'],
        ho_ten=data['ho_ten'],
        email=data['email'],
        so_dien_thoai=data.get('so_dien_thoai'),
        mat_khau_hash=hashed_pw
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    kh = _get_or_create_khach_hang(user)
    res_data = _dump_dict(nguoi_dung_res, user)
    if kh:
        res_data['ma_khach_hang'] = str(kh.ma_kh)
    return jsonify(res_data), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    """
    User login
    ---
    post:
      summary: Authenticate user
      tags:
        - Authentication
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/LoginUserRequest'
      responses:
        200:
          description: Successful authentication
        401:
          description: Invalid credentials
    """
    data = request.get_json() or {}
    email = data.get('email', '').strip()
    password = data.get('password') or data.get('mat_khau')
    
    if not email or not password:
        return jsonify({'error': 'Email và Mật khẩu là bắt buộc'}), 400
    
    user = session.query(NguoiDungModel).filter(NguoiDungModel.email.ilike(email)).first()
    if not user or not check_password_hash(str(user.mat_khau_hash), password):
        return jsonify({'error': 'Invalid email or password'}), 401
    
    kh = _get_or_create_khach_hang(user)
    user_dict = _dump_dict(nguoi_dung_res, user)
    if user.vai_tro:
        user_dict['vai_tro'] = str(user.vai_tro.ten_vai_tro)
    else:
        role_obj = session.query(VaiTroModel).filter_by(ma_vai_tro=user.ma_vai_tro).first()
        if role_obj:
            user_dict['vai_tro'] = str(role_obj.ten_vai_tro)
        else:
            user_dict['vai_tro'] = 'Admin'
    if kh:
        user_dict['ma_khach_hang'] = str(kh.ma_kh)
        try:
            addr = session.query(DiaChiModel).filter_by(ma_kh=kh.ma_kh).first()
            if addr:
                user_dict['dia_chi'] = str(addr.dia_chi_cu_the)
        except Exception:
            pass

    payload = {
        'user_id': str(user.ma_nguoi_dung),
        'ma_khach_hang': str(kh.ma_kh) if kh else str(user.ma_nguoi_dung),
        'exp': datetime.now(timezone.utc) + timedelta(hours=2)
    }
    token = jwt.encode(payload, current_app.config.get('SECRET_KEY', 'default_secret_key'), algorithm='HS256')
    return jsonify({
        'user': user_dict,
        'token': token
    }), 200

@auth_bp.route('/logout', methods=['POST'])
def logout():
    """
    Log out user
    ---
    post:
      summary: Log out from the system
      tags:
        - Authentication
      responses:
        200:
          description: Logged out successfully
    """
    return jsonify({'message': 'Logged out successfully'}), 200

@auth_bp.route('/change-password', methods=['POST'])
def change_password():
    """
    Change user password
    """
    data = request.get_json()
    email = data.get('email')
    current_pw = data.get('current_password')
    new_pw = data.get('new_password')
    
    if not email or not current_pw or not new_pw:
        return jsonify({'error': 'Missing required fields'}), 400
        
    db_session = SessionLocal()
    try:
        user = db_session.query(NguoiDungModel).filter_by(email=email).first()
        if not user:
            return jsonify({'error': 'User not found'}), 404
            
        if not check_password_hash(str(user.mat_khau_hash), current_pw):
            return jsonify({'error': 'Mật khẩu hiện tại không chính xác'}), 401
            
        setattr(user, 'mat_khau_hash', generate_password_hash(new_pw))
        db_session.commit()
        return jsonify({'message': 'Cập nhật mật khẩu mới thành công.'}), 200
    except Exception as e:
        db_session.rollback()
        return jsonify({'error': f'Lỗi hệ thống CSDL: {str(e)}'}), 500
    finally:
        db_session.close()

@auth_bp.route('/profile', methods=['PUT'])
def update_profile():
    """
    Update user profile (Full Name, Phone Number, Email, Default Address)
    """
    data = request.get_json()
    current_email = data.get('email')
    new_email = data.get('new_email')
    ho_ten = data.get('ho_ten')
    so_dien_thoai = data.get('so_dien_thoai')
    dia_chi = data.get('dia_chi')
    
    if not current_email:
        return jsonify({'error': 'Email là bắt buộc'}), 400
        
    db_session = SessionLocal()
    try:
        user = db_session.query(NguoiDungModel).filter_by(email=current_email).first()
        if not user:
            return jsonify({'error': 'Không tìm thấy tài khoản người dùng'}), 404
            
        if new_email and new_email != current_email:
            existing = db_session.query(NguoiDungModel).filter_by(email=new_email).first()
            if existing:
                return jsonify({'error': 'Email mới đã tồn tại trên hệ thống'}), 400
            user.email = new_email.strip()

        if ho_ten:
            user.ho_ten = ho_ten.strip()
        if so_dien_thoai is not None:
            user.so_dien_thoai = so_dien_thoai.strip()
            
        # Synchronize KhachHangModel
        kh = db_session.query(KhachHangModel).filter(
            (KhachHangModel.email == current_email) | (KhachHangModel.ma_kh == user.ma_nguoi_dung)
        ).first()

        if kh:
            if new_email:
                kh.email = new_email.strip()
            if so_dien_thoai is not None:
                kh.so_dien_thoai = so_dien_thoai.strip()
            if ho_ten:
                parts = ho_ten.strip().split()
                setattr(kh, 'ho', parts[0] if parts else 'Khách')
                setattr(kh, 'ten', parts[-1] if len(parts) > 1 else 'Hàng')
                setattr(kh, 'ten_dem', " ".join(parts[1:-1]) if len(parts) > 2 else "")

        # Synchronize default delivery address in DiaChiModel
        res_address = None
        if kh and dia_chi is not None:
            clean_addr = dia_chi.strip()
            addr_obj = db_session.query(DiaChiModel).filter_by(ma_kh=kh.ma_kh).first()
            if addr_obj:
                addr_obj.dia_chi_cu_the = clean_addr
            else:
                addr_obj = DiaChiModel(
                    ma_kh=kh.ma_kh,
                    dia_chi_cu_the=clean_addr,
                    thanh_pho='TP. Hồ Chí Minh',
                    lat=10.8048584,
                    lng=106.7167612
                )
                db_session.add(addr_obj)
            res_address = clean_addr
        elif kh:
            addr_obj = db_session.query(DiaChiModel).filter_by(ma_kh=kh.ma_kh).first()
            if addr_obj:
                res_address = addr_obj.dia_chi_cu_the

        db_session.commit()
        res_data = _dump_dict(nguoi_dung_res, user)
        if kh:
            res_data['ma_khach_hang'] = str(kh.ma_kh)
        if res_address:
            res_data['dia_chi'] = str(res_address)

        return jsonify({
            'message': 'Cập nhật thông tin cá nhân thành công!',
            'user': res_data
        }), 200
    except Exception as e:
        db_session.rollback()
        return jsonify({'error': f'Lỗi hệ thống CSDL: {str(e)}'}), 500
    finally:
        db_session.close()