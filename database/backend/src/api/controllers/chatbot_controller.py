from flask import Blueprint, request, jsonify
from infrastructure.repositories.chatbot_repository import ChatbotRepository
from services.chatbot_service import ChatbotService
from api.schemas.chatbot import TinNhanChatbotRequestSchema, TinNhanChatbotResponseSchema

chatbot_bp = Blueprint('chatbot', __name__, url_prefix='/chatbot')

chatbot_repo = ChatbotRepository()
chatbot_service = ChatbotService(chatbot_repo)

req_schema = TinNhanChatbotRequestSchema()
res_schema = TinNhanChatbotResponseSchema()

@chatbot_bp.route('/', methods=['POST'])
def send_message():
    """
    Send chatbot message
    ---
    post:
      summary: Send message to chatbot
      tags:
        - Chatbot
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/TinNhanChatbotRequest'
      responses:
        201:
          description: Message sent and response returned
    """
    data = request.get_json()
    errors = req_schema.validate(data)
    if errors:
        return jsonify(errors), 400
        
    message = chatbot_service.send_message(data)
    if not message:
        return jsonify({'error': 'Customer not found'}), 404
        
    return jsonify(res_schema.dump(message)), 201

@chatbot_bp.route('/history/<uuid:ma_kh>', methods=['GET'])
def chatbot_history(ma_kh):
    """
    Get chatbot conversation history
    ---
    get:
      summary: Get customer chatbot logs
      tags:
        - Chatbot
      parameters:
        - name: ma_kh
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        200:
          description: List of conversations
    """
    history = chatbot_service.get_history_by_customer_id(str(ma_kh))
    return jsonify(res_schema.dump(history, many=True)), 200
