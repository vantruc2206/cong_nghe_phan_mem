from flask import Blueprint, request, jsonify, current_app
from datetime import datetime, timedelta
import jwt
from werkzeug.security import generate_password_hash, check_password_hash
from infrastructure.databases.postgres import session
from infrastructure.models.app_nguoi_dung_model import NguoiDungModel
from infrastructure.models.app_vai_tro_model import VaiTroModel
from api.schemas.auth import (
    VaiTroRequestSchema, VaiTroResponseSchema,
    NguoiDungRequestSchema, NguoiDungResponseSchema,
    LoginUserRequestSchema, LoginUserResponseSchema
)

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
    return jsonify(nguoi_dung_res.dump(users, many=True)), 200

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
    return jsonify(nguoi_dung_res.dump(user)), 201

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
    data = request.get_json()
    errors = login_req.validate(data)
    if errors:
        return jsonify(errors), 400
    
    user = session.query(NguoiDungModel).filter_by(email=data['email']).first()
    if not user or not check_password_hash(user.mat_khau_hash, data['password']):
        return jsonify({'error': 'Invalid email or password'}), 401
    
    payload = {
        'user_id': str(user.ma_nguoi_dung),
        'exp': datetime.utcnow() + timedelta(hours=2)
    }
    token = jwt.encode(payload, current_app.config.get('SECRET_KEY', 'default_secret_key'), algorithm='HS256')
    return jsonify({
        'user': nguoi_dung_res.dump(user),
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