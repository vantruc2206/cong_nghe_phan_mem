from flask import Blueprint, request, jsonify
from infrastructure.repositories.station_repository import StationRepository
from services.station_service import StationService
from api.schemas.station import TramHaCanhRequestSchema, TramHaCanhResponseSchema

station_bp = Blueprint('station', __name__, url_prefix='/stations')

station_repo = StationRepository()
station_service = StationService(station_repo)

req_schema = TramHaCanhRequestSchema()
res_schema = TramHaCanhResponseSchema()

@station_bp.route('/', methods=['GET'])
def list_stations():
    """
    Get all landing stations
    ---
    get:
      summary: List all stations
      tags:
        - Landing Stations
      responses:
        200:
          description: List of stations
    """
    stations = station_service.get_all()
    return jsonify(res_schema.dump(stations, many=True)), 200

@station_bp.route('/<uuid:ma_tram>', methods=['GET'])
def get_station(ma_tram):
    """
    Get station by ID
    ---
    get:
      summary: Get station details
      tags:
        - Landing Stations
      parameters:
        - name: ma_tram
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        200:
          description: Station details
    """
    station = station_service.get_by_id(str(ma_tram))
    if not station:
        return jsonify({'error': 'Station not found'}), 404
    return jsonify(res_schema.dump(station)), 200

@station_bp.route('/', methods=['POST'])
def create_station():
    """
    Create landing station
    ---
    post:
      summary: Create a station
      tags:
        - Landing Stations
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/TramHaCanhRequest'
      responses:
        201:
          description: Station created
    """
    data = request.get_json()
    errors = req_schema.validate(data)
    if errors:
        return jsonify(errors), 400
        
    station = station_service.create(data)
    return jsonify(res_schema.dump(station)), 201

@station_bp.route('/<uuid:ma_tram>', methods=['PUT'])
def update_station(ma_tram):
    """
    Update landing station
    ---
    put:
      summary: Update station details
      tags:
        - Landing Stations
      parameters:
        - name: ma_tram
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
              $ref: '#/components/schemas/TramHaCanhRequest'
      responses:
        200:
          description: Station updated
    """
    data = request.get_json()
    errors = req_schema.validate(data)
    if errors:
        return jsonify(errors), 400
        
    station = station_service.update(str(ma_tram), data)
    if not station:
        return jsonify({'error': 'Station not found'}), 404
    return jsonify(res_schema.dump(station)), 200

@station_bp.route('/<uuid:ma_tram>', methods=['DELETE'])
def delete_station(ma_tram):
    """
    Delete landing station
    ---
    delete:
      summary: Delete station
      tags:
        - Landing Stations
      parameters:
        - name: ma_tram
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        204:
          description: Station deleted
    """
    success = station_service.delete(str(ma_tram))
    if not success:
        return jsonify({'error': 'Station not found'}), 404
    return '', 204

@station_bp.route('/packages/<uuid:ma_don_hang>/receive', methods=['POST'])
def receive_package(ma_don_hang):
    """
    Station receive package (UC-07)
    ---
    post:
      summary: Confirm station received package
      tags:
        - Landing Stations
      parameters:
        - name: ma_don_hang
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        200:
          description: Package checked in
    """
    result = station_service.receive_package(str(ma_don_hang))
    if not result:
        return jsonify({'error': 'Order not found'}), 404
    if 'error' in result:
        return jsonify({'error': result['error']}), 400
        
    return jsonify({
        'message': 'Kiện hàng đã nhận tại trạm thành công',
        'trang_thai_don_hang': result['trang_thai_don_hang']
    }), 200

@station_bp.route('/deliveries/<uuid:ma_giao_hang>/dispatch', methods=['POST'])
def dispatch_delivery(ma_giao_hang):
    """
    Station dispatch drone delivery (UC-07)
    ---
    post:
      summary: Confirm drone takeoff / departure from station
      tags:
        - Landing Stations
      parameters:
        - name: ma_giao_hang
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        200:
          description: Drone dispatched
    """
    result = station_service.dispatch_delivery(str(ma_giao_hang))
    if not result:
        return jsonify({'error': 'Delivery not found'}), 404
        
    return jsonify({
        'message': 'Drone cất cánh xuất bến tại trạm thành công',
        'trang_thai_giao_hang': result['trang_thai_giao_hang']
    }), 200
