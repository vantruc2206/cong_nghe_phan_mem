from flask import Blueprint, request, jsonify
from infrastructure.repositories.delivery_repository import DeliveryRepository
from services.delivery_service import DeliveryService
from api.schemas.delivery import (
    GiaoHangRequestSchema, GiaoHangResponseSchema,
    SuCoGiaoHangRequestSchema, SuCoGiaoHangResponseSchema
)

delivery_bp = Blueprint('delivery', __name__, url_prefix='/deliveries')

delivery_repo = DeliveryRepository()
delivery_service = DeliveryService(delivery_repo)

delivery_req = GiaoHangRequestSchema()
delivery_res = GiaoHangResponseSchema()
incident_req = SuCoGiaoHangRequestSchema()
incident_res = SuCoGiaoHangResponseSchema()

@delivery_bp.route('/', methods=['GET'])
def list_deliveries():
    """
    Get all deliveries
    ---
    get:
      summary: List all deliveries
      tags:
        - Deliveries
      responses:
        200:
          description: List of deliveries
    """
    deliveries = delivery_service.get_all_deliveries()
    return jsonify(delivery_res.dump(deliveries, many=True)), 200

@delivery_bp.route('/<uuid:ma_giao_hang>', methods=['GET'])
def get_delivery(ma_giao_hang):
    """
    Get delivery by ID
    ---
    get:
      summary: Get delivery trip details
      tags:
        - Deliveries
      parameters:
        - name: ma_giao_hang
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        200:
          description: Delivery details
    """
    delivery = delivery_service.get_delivery_by_id(str(ma_giao_hang))
    if not delivery:
        return jsonify({'error': 'Delivery not found'}), 404
    return jsonify(delivery_res.dump(delivery)), 200

@delivery_bp.route('/', methods=['POST'])
def create_delivery():
    """
    Create delivery trip
    ---
    post:
      summary: Schedule or start delivery trip
      tags:
        - Deliveries
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/GiaoHangRequest'
      responses:
        201:
          description: Delivery trip created
    """
    data = request.get_json()
    errors = delivery_req.validate(data)
    if errors:
        return jsonify(errors), 400
        
    delivery = delivery_service.create_delivery(data)
    if not delivery:
        return jsonify({'error': 'Order, Drone, or User not found'}), 404
    return jsonify(delivery_res.dump(delivery)), 201

@delivery_bp.route('/<uuid:ma_giao_hang>', methods=['PUT'])
def update_delivery(ma_giao_hang):
    """
    Update delivery details
    ---
    put:
      summary: Update delivery details/status
      tags:
        - Deliveries
      parameters:
        - name: ma_giao_hang
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
              $ref: '#/components/schemas/GiaoHangRequest'
      responses:
        200:
          description: Delivery updated
    """
    data = request.get_json()
    errors = delivery_req.validate(data)
    if errors:
        return jsonify(errors), 400
        
    delivery = delivery_service.update_delivery(str(ma_giao_hang), data)
    if not delivery:
        return jsonify({'error': 'Delivery, Order, Drone, or User not found'}), 404
    return jsonify(delivery_res.dump(delivery)), 200

@delivery_bp.route('/<uuid:ma_giao_hang>', methods=['DELETE'])
def delete_delivery(ma_giao_hang):
    """
    Delete delivery trip
    ---
    delete:
      summary: Delete delivery trip
      tags:
        - Deliveries
      parameters:
        - name: ma_giao_hang
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        204:
          description: Delivery deleted
    """
    success = delivery_service.delete_delivery(str(ma_giao_hang))
    if not success:
        return jsonify({'error': 'Delivery not found'}), 404
    return '', 204

# Incidents routes
@delivery_bp.route('/incidents', methods=['GET'])
def list_incidents():
    """
    Get all incidents
    ---
    get:
      summary: List all incidents
      tags:
        - Delivery Incidents
      responses:
        200:
          description: List of incidents
    """
    incidents = delivery_service.get_all_incidents()
    return jsonify(incident_res.dump(incidents, many=True)), 200

@delivery_bp.route('/<uuid:ma_giao_hang>/incidents', methods=['GET'])
def list_delivery_incidents(ma_giao_hang):
    """
    Get incidents for a delivery
    ---
    get:
      summary: List trip specific incidents
      tags:
        - Delivery Incidents
      parameters:
        - name: ma_giao_hang
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        200:
          description: Incidents list
    """
    incidents = delivery_service.get_incidents_by_delivery_id(str(ma_giao_hang))
    return jsonify(incident_res.dump(incidents, many=True)), 200

@delivery_bp.route('/incidents', methods=['POST'])
def report_incident():
    """
    Report delivery incident
    ---
    post:
      summary: Create delivery incident report
      tags:
        - Delivery Incidents
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/SuCoGiaoHangRequest'
      responses:
        201:
          description: Incident reported
    """
    data = request.get_json()
    errors = incident_req.validate(data)
    if errors:
        return jsonify(errors), 400
        
    incident = delivery_service.create_incident(data)
    if not incident:
        return jsonify({'error': 'Delivery or Station not found'}), 404
    return jsonify(incident_res.dump(incident)), 201

@delivery_bp.route('/incidents/<uuid:ma_van_de>', methods=['DELETE'])
def delete_incident(ma_van_de):
    """
    Delete incident report
    ---
    delete:
      summary: Delete incident report
      tags:
        - Delivery Incidents
      parameters:
        - name: ma_van_de
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        204:
          description: Incident report deleted
    """
    success = delivery_service.delete_incident(str(ma_van_de))
    if not success:
        return jsonify({'error': 'Incident not found'}), 404
    return '', 204

@delivery_bp.route('/<uuid:ma_giao_hang>/fail', methods=['POST'])
def fail_delivery(ma_giao_hang):
    """
    Mark delivery as failed (UC-06)
    ---
    post:
      summary: Mark a delivery trip as failed
      tags:
        - Deliveries
      parameters:
        - name: ma_giao_hang
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        200:
          description: Delivery failed
    """
    delivery = delivery_service.fail_delivery(str(ma_giao_hang))
    if not delivery:
        return jsonify({'error': 'Delivery not found'}), 404
        
    return jsonify({
        'message': 'Đã ghi nhận giao hàng thất bại',
        'delivery': delivery_res.dump(delivery)
    }), 200

@delivery_bp.route('/<uuid:ma_giao_hang>/retry', methods=['POST'])
def retry_delivery(ma_giao_hang):
    """
    Schedule retry for a failed delivery (UC-06)
    ---
    post:
      summary: Retry a failed delivery trip
      tags:
        - Deliveries
      parameters:
        - name: ma_giao_hang
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        200:
          description: Delivery retried
    """
    result = delivery_service.retry_delivery(str(ma_giao_hang))
    if not result:
        return jsonify({'error': 'Delivery not found'}), 404
        
    return jsonify({
        'message': 'Đã lên lịch giao lại thành công',
        'old_delivery': delivery_res.dump(result['old_delivery']),
        'new_delivery': delivery_res.dump(result['new_delivery'])
    }), 200

@delivery_bp.route('/<uuid:ma_giao_hang>/complete', methods=['POST'])
def complete_delivery(ma_giao_hang):
    """
    Confirm delivery successful (UC-09)
    ---
    post:
      summary: Confirm delivery successful
      tags:
        - Deliveries
      parameters:
        - name: ma_giao_hang
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        200:
          description: Delivery successful
    """
    delivery = delivery_service.complete_delivery(str(ma_giao_hang))
    if not delivery:
        return jsonify({'error': 'Delivery not found'}), 404
        
    return jsonify({
        'message': 'Xác nhận giao hàng thành công',
        'delivery': delivery_res.dump(delivery)
    }), 200
