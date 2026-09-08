from flask import Blueprint, request, jsonify
from infrastructure.repositories.notification_repository import NotificationRepository
from services.notification_service import NotificationService
from api.schemas.notification import ThongBaoRequestSchema, ThongBaoResponseSchema

notification_bp = Blueprint('notification', __name__, url_prefix='/notifications')

notification_repo = NotificationRepository()
notification_service = NotificationService(notification_repo)

req_schema = ThongBaoRequestSchema()
res_schema = ThongBaoResponseSchema()

@notification_bp.route('/', methods=['GET'])
def list_notifications():
    """
    Get all notifications
    ---
    get:
      summary: List all notifications
      tags:
        - Notifications
      responses:
        200:
          description: List of notifications
    """
    notifications = notification_service.get_all()
    return jsonify(res_schema.dump(notifications, many=True)), 200

@notification_bp.route('/customer/<uuid:ma_kh>', methods=['GET'])
def list_customer_notifications(ma_kh):
    """
    Get customer notifications
    ---
    get:
      summary: List customer specific notifications
      tags:
        - Notifications
      parameters:
        - name: ma_kh
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        200:
          description: List of notifications
    """
    notifications = notification_service.get_by_customer_id(str(ma_kh))
    return jsonify(res_schema.dump(notifications, many=True)), 200

@notification_bp.route('/', methods=['POST'])
def create_notification():
    """
    Create notification
    ---
    post:
      summary: Send a notification to customer
      tags:
        - Notifications
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ThongBaoRequest'
      responses:
        201:
          description: Notification created
    """
    data = request.get_json()
    errors = req_schema.validate(data)
    if errors:
        return jsonify(errors), 400
        
    notification = notification_service.create(data)
    if not notification:
        return jsonify({'error': 'Customer or Order not found'}), 404
        
    return jsonify(res_schema.dump(notification)), 201

@notification_bp.route('/<uuid:ma_thong_bao>/read', methods=['PUT'])
def mark_read(ma_thong_bao):
    """
    Mark notification as read
    ---
    put:
      summary: Set notification status to read
      tags:
        - Notifications
      parameters:
        - name: ma_thong_bao
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        200:
          description: Marked as read
    """
    notification = notification_service.mark_read(str(ma_thong_bao))
    if not notification:
        return jsonify({'error': 'Notification not found'}), 404
        
    return jsonify(res_schema.dump(notification)), 200

@notification_bp.route('/<uuid:ma_thong_bao>', methods=['DELETE'])
def delete_notification(ma_thong_bao):
    """
    Delete notification
    ---
    delete:
      summary: Delete notification
      tags:
        - Notifications
      parameters:
        - name: ma_thong_bao
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        204:
          description: Notification deleted
    """
    success = notification_service.delete(str(ma_thong_bao))
    if not success:
        return jsonify({'error': 'Notification not found'}), 404
    return '', 204
