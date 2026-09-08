from flask import Blueprint, request, jsonify
from infrastructure.repositories.order_repository import OrderRepository
from services.order_service import OrderService
from api.schemas.order import (
    DonHangRequestSchema, DonHangResponseSchema,
    GoiHangRequestSchema, GoiHangResponseSchema
)

order_bp = Blueprint('order', __name__, url_prefix='/orders')

order_repo = OrderRepository()
order_service = OrderService(order_repo)

order_req = DonHangRequestSchema()
order_res = DonHangResponseSchema()
package_req = GoiHangRequestSchema()
package_res = GoiHangResponseSchema()

@order_bp.route('/', methods=['GET'])
def list_orders():
    """
    Get all orders
    ---
    get:
      summary: List all orders
      tags:
        - Orders
      responses:
        200:
          description: List of orders
    """
    orders = order_service.get_all_orders()
    return jsonify(order_res.dump(orders, many=True)), 200

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
    return jsonify(order_res.dump(order)), 200

@order_bp.route('/', methods=['POST'])
def create_order():
    """
    Create a new order
    ---
    post:
      summary: Create customer order
      tags:
        - Orders
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/DonHangRequest'
      responses:
        201:
          description: Order created
    """
    data = request.get_json()
    errors = order_req.validate(data)
    if errors:
        return jsonify(errors), 400
        
    order = order_service.create_order(data)
    if not order:
        return jsonify({'error': 'Customer or Address not found'}), 404
    return jsonify(order_res.dump(order)), 201

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
