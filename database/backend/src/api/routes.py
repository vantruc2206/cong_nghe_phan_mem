from api.controllers.auth_controller import auth_bp
from api.controllers.customer_controller import customer_bp
from api.controllers.chatbot_controller import chatbot_bp
from api.controllers.order_controller import order_bp
from api.controllers.drone_controller import drone_bp
from api.controllers.station_controller import station_bp
from api.controllers.delivery_controller import delivery_bp
from api.controllers.notification_controller import notification_bp

def register_routes(app):
    app.register_blueprint(auth_bp)
    app.register_blueprint(customer_bp)
    app.register_blueprint(chatbot_bp)
    app.register_blueprint(order_bp)
    app.register_blueprint(drone_bp)
    app.register_blueprint(station_bp)
    app.register_blueprint(delivery_bp)
    app.register_blueprint(notification_bp)