from flask import Blueprint, request, jsonify
from infrastructure.repositories.customer_repository import CustomerRepository
from services.customer_service import CustomerService
from api.schemas.customer import (
    KhachHangRequestSchema, KhachHangResponseSchema,
    DiaChiRequestSchema, DiaChiResponseSchema
)

customer_bp = Blueprint('customer', __name__, url_prefix='/customers')

customer_repo = CustomerRepository()
customer_service = CustomerService(customer_repo)

kh_req = KhachHangRequestSchema()
kh_res = KhachHangResponseSchema()
dc_req = DiaChiRequestSchema()
dc_res = DiaChiResponseSchema()

@customer_bp.route('/', methods=['GET'])
def list_customers():
    """
    Get all customers
    ---
    get:
      summary: List all customers
      tags:
        - Customers
      responses:
        200:
          description: List of customers
    """
    customers = customer_service.get_all_customers()
    return jsonify(kh_res.dump(customers, many=True)), 200

@customer_bp.route('/<uuid:ma_kh>', methods=['GET'])
def get_customer(ma_kh):
    """
    Get customer by ID
    ---
    get:
      summary: Get customer detail
      tags:
        - Customers
      parameters:
        - name: ma_kh
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        200:
          description: Customer details
        404:
          description: Customer not found
    """
    customer = customer_service.get_customer_by_id(str(ma_kh))
    if not customer:
        return jsonify({'error': 'Customer not found'}), 404
    return jsonify(kh_res.dump(customer)), 200

@customer_bp.route('/', methods=['POST'])
def create_customer():
    """
    Create a new customer
    ---
    post:
      summary: Create customer profile
      tags:
        - Customers
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/KhachHangRequest'
      responses:
        201:
          description: Customer created
    """
    data = request.get_json()
    errors = kh_req.validate(data)
    if errors:
        return jsonify(errors), 400
    
    customer = customer_service.create_customer(data)
    return jsonify(kh_res.dump(customer)), 201

@customer_bp.route('/<uuid:ma_kh>', methods=['PUT'])
def update_customer(ma_kh):
    """
    Update a customer
    ---
    put:
      summary: Update customer profile
      tags:
        - Customers
      parameters:
        - name: ma_kh
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
              $ref: '#/components/schemas/KhachHangRequest'
      responses:
        200:
          description: Customer updated
        404:
          description: Customer not found
    """
    data = request.get_json()
    errors = kh_req.validate(data)
    if errors:
        return jsonify(errors), 400
        
    customer = customer_service.update_customer(str(ma_kh), data)
    if not customer:
        return jsonify({'error': 'Customer not found'}), 404
    return jsonify(kh_res.dump(customer)), 200

@customer_bp.route('/<uuid:ma_kh>', methods=['DELETE'])
def delete_customer(ma_kh):
    """
    Delete a customer
    ---
    delete:
      summary: Delete customer profile
      tags:
        - Customers
      parameters:
        - name: ma_kh
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        204:
          description: Customer deleted
        404:
          description: Customer not found
    """
    success = customer_service.delete_customer(str(ma_kh))
    if not success:
        return jsonify({'error': 'Customer not found'}), 404
    return '', 204

# Address Routes
@customer_bp.route('/addresses', methods=['GET'])
def list_addresses():
    """
    Get all addresses
    ---
    get:
      summary: List all addresses
      tags:
        - Customer Addresses
      responses:
        200:
          description: List of addresses
    """
    addresses = customer_service.get_all_addresses()
    return jsonify(dc_res.dump(addresses, many=True)), 200

@customer_bp.route('/<uuid:ma_kh>/addresses', methods=['GET'])
def list_customer_addresses(ma_kh):
    """
    Get addresses of a customer
    ---
    get:
      summary: List customer specific addresses
      tags:
        - Customer Addresses
      parameters:
        - name: ma_kh
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        200:
          description: List of customer addresses
      """
    addresses = customer_service.get_addresses_by_customer_id(str(ma_kh))
    return jsonify(dc_res.dump(addresses, many=True)), 200

@customer_bp.route('/addresses', methods=['POST'])
def create_address():
    """
    Create a customer address
    ---
    post:
      summary: Create delivery address
      tags:
        - Customer Addresses
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/DiaChiRequest'
      responses:
        201:
          description: Address created
    """
    data = request.get_json()
    errors = dc_req.validate(data)
    if errors:
        return jsonify(errors), 400
        
    address = customer_service.create_address(data)
    if not address:
        return jsonify({'error': 'Customer not found'}), 404
        
    return jsonify(dc_res.dump(address)), 201

@customer_bp.route('/addresses/<uuid:ma_dia_chi>', methods=['PUT'])
def update_address(ma_dia_chi):
    """
    Update address
    ---
    put:
      summary: Update delivery address
      tags:
        - Customer Addresses
      parameters:
        - name: ma_dia_chi
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
              $ref: '#/components/schemas/DiaChiRequest'
      responses:
        200:
          description: Address updated
        404:
          description: Address not found
    """
    data = request.get_json()
    errors = dc_req.validate(data)
    if errors:
        return jsonify(errors), 400
        
    address = customer_service.update_address(str(ma_dia_chi), data)
    if not address:
        return jsonify({'error': 'Address not found'}), 404
        
    return jsonify(dc_res.dump(address)), 200

@customer_bp.route('/addresses/<uuid:ma_dia_chi>', methods=['DELETE'])
def delete_address(ma_dia_chi):
    """
    Delete address
    ---
    delete:
      summary: Delete delivery address
      tags:
        - Customer Addresses
      parameters:
        - name: ma_dia_chi
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        204:
          description: Address deleted
        404:
          description: Address not found
    """
    success = customer_service.delete_address(str(ma_dia_chi))
    if not success:
        return jsonify({'error': 'Address not found'}), 404
    return '', 204
