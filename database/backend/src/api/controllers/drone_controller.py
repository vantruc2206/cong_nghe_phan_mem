from flask import Blueprint, request, jsonify
from infrastructure.repositories.drone_repository import DroneRepository
from services.drone_service import DroneService
from api.schemas.drone import DroneRequestSchema, DroneResponseSchema

drone_bp = Blueprint('drone', __name__, url_prefix='/drones')

drone_repo = DroneRepository()
drone_service = DroneService(drone_repo)

req_schema = DroneRequestSchema()
res_schema = DroneResponseSchema()

@drone_bp.route('/', methods=['GET'])
def list_drones():
    """
    Get all drones
    ---
    get:
      summary: List all drones
      tags:
        - Drones
      responses:
        200:
          description: List of drones
    """
    drones = drone_service.get_all()
    return jsonify(res_schema.dump(drones, many=True)), 200

@drone_bp.route('/<uuid:ma_drone>', methods=['GET'])
def get_drone(ma_drone):
    """
    Get drone by ID
    ---
    get:
      summary: Get drone details
      tags:
        - Drones
      parameters:
        - name: ma_drone
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        200:
          description: Drone details
        404:
          description: Drone not found
    """
    drone = drone_service.get_by_id(str(ma_drone))
    if not drone:
        return jsonify({'error': 'Drone not found'}), 404
    return jsonify(res_schema.dump(drone)), 200

@drone_bp.route('/', methods=['POST'])
def create_drone():
    """
    Create a new drone
    ---
    post:
      summary: Register drone
      tags:
        - Drones
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/DroneRequest'
      responses:
        201:
          description: Drone registered
    """
    data = request.get_json()
    errors = req_schema.validate(data)
    if errors:
        return jsonify(errors), 400
        
    drone = drone_service.create(data)
    return jsonify(res_schema.dump(drone)), 201

@drone_bp.route('/<uuid:ma_drone>', methods=['PUT'])
def update_drone(ma_drone):
    """
    Update drone
    ---
    put:
      summary: Update drone details
      tags:
        - Drones
      parameters:
        - name: ma_drone
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
              $ref: '#/components/schemas/DroneRequest'
      responses:
        200:
          description: Drone updated
    """
    data = request.get_json()
    errors = req_schema.validate(data)
    if errors:
        return jsonify(errors), 400
        
    drone = drone_service.update(str(ma_drone), data)
    if not drone:
        return jsonify({'error': 'Drone not found'}), 404
    return jsonify(res_schema.dump(drone)), 200

@drone_bp.route('/<uuid:ma_drone>', methods=['DELETE'])
def delete_drone(ma_drone):
    """
    Delete drone
    ---
    delete:
      summary: Delete drone
      tags:
        - Drones
      parameters:
        - name: ma_drone
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        204:
          description: Drone deleted
    """
    success = drone_service.delete(str(ma_drone))
    if not success:
        return jsonify({'error': 'Drone not found'}), 404
    return '', 204
