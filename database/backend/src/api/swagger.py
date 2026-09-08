from apispec import APISpec
from apispec.ext.marshmallow import MarshmallowPlugin
from apispec_webframeworks.flask import FlaskPlugin

# Import all schemas
from api.schemas.auth import (
    VaiTroRequestSchema, VaiTroResponseSchema,
    NguoiDungRequestSchema, NguoiDungResponseSchema,
    LoginUserRequestSchema, LoginUserResponseSchema
)
from api.schemas.customer import (
    KhachHangRequestSchema, KhachHangResponseSchema,
    DiaChiRequestSchema, DiaChiResponseSchema
)
from api.schemas.chatbot import (
    TinNhanChatbotRequestSchema, TinNhanChatbotResponseSchema
)
from api.schemas.order import (
    DonHangRequestSchema, DonHangResponseSchema,
    GoiHangRequestSchema, GoiHangResponseSchema
)
from api.schemas.drone import (
    DroneRequestSchema, DroneResponseSchema
)
from api.schemas.station import (
    TramHaCanhRequestSchema, TramHaCanhResponseSchema
)
from api.schemas.delivery import (
    GiaoHangRequestSchema, GiaoHangResponseSchema,
    SuCoGiaoHangRequestSchema, SuCoGiaoHangResponseSchema
)
from api.schemas.notification import (
    ThongBaoRequestSchema, ThongBaoResponseSchema
)

spec = APISpec(
    title="Smart Drone Delivery API",
    version="1.0.0",
    openapi_version="3.0.2",
    plugins=[FlaskPlugin(), MarshmallowPlugin()],
)

# Register schemas
spec.components.schema("VaiTroRequest", schema=VaiTroRequestSchema)
spec.components.schema("VaiTroResponse", schema=VaiTroResponseSchema)
spec.components.schema("NguoiDungRequest", schema=NguoiDungRequestSchema)
spec.components.schema("NguoiDungResponse", schema=NguoiDungResponseSchema)
spec.components.schema("LoginUserRequest", schema=LoginUserRequestSchema)
spec.components.schema("LoginUserResponse", schema=LoginUserResponseSchema)

spec.components.schema("KhachHangRequest", schema=KhachHangRequestSchema)
spec.components.schema("KhachHangResponse", schema=KhachHangResponseSchema)
spec.components.schema("DiaChiRequest", schema=DiaChiRequestSchema)
spec.components.schema("DiaChiResponse", schema=DiaChiResponseSchema)

spec.components.schema("TinNhanChatbotRequest", schema=TinNhanChatbotRequestSchema)
spec.components.schema("TinNhanChatbotResponse", schema=TinNhanChatbotResponseSchema)

spec.components.schema("DonHangRequest", schema=DonHangRequestSchema)
spec.components.schema("DonHangResponse", schema=DonHangResponseSchema)
spec.components.schema("GoiHangRequest", schema=GoiHangRequestSchema)
spec.components.schema("GoiHangResponse", schema=GoiHangResponseSchema)

spec.components.schema("DroneRequest", schema=DroneRequestSchema)
spec.components.schema("DroneResponse", schema=DroneResponseSchema)

spec.components.schema("TramHaCanhRequest", schema=TramHaCanhRequestSchema)
spec.components.schema("TramHaCanhResponse", schema=TramHaCanhResponseSchema)

spec.components.schema("GiaoHangRequest", schema=GiaoHangRequestSchema)
spec.components.schema("GiaoHangResponse", schema=GiaoHangResponseSchema)
spec.components.schema("SuCoGiaoHangRequest", schema=SuCoGiaoHangRequestSchema)
spec.components.schema("SuCoGiaoHangResponse", schema=SuCoGiaoHangResponseSchema)

spec.components.schema("ThongBaoRequest", schema=ThongBaoRequestSchema)
spec.components.schema("ThongBaoResponse", schema=ThongBaoResponseSchema)