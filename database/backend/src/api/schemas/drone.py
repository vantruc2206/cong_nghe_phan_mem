from marshmallow import Schema, fields

class DroneRequestSchema(Schema):
    trang_thai_drone = fields.Str(required=False, load_default='Sẵn sàng')
    cong_suat_pin = fields.Int(required=False, load_default=100)
    ngay_bao_tri_gan_nhat = fields.DateTime(required=False, allow_none=True)

class DroneResponseSchema(Schema):
    ma_drone = fields.UUID(required=True)
    trang_thai_drone = fields.Str(required=True)
    cong_suat_pin = fields.Int(required=True)
    ngay_bao_tri_gan_nhat = fields.DateTime(required=False, allow_none=True)
    created_at = fields.DateTime(required=True)
    updated_at = fields.DateTime(required=True)
