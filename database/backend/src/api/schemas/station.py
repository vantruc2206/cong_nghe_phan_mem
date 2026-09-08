from marshmallow import Schema, fields

class TramHaCanhRequestSchema(Schema):
    ten_tram = fields.Str(required=True)
    dia_chi_tram = fields.Str(required=True)
    lat = fields.Float(required=True)
    lng = fields.Float(required=True)
    cong_suat_toi_da = fields.Int(required=False, load_default=10)
    trang_thai_hoat_dong = fields.Str(required=False, load_default='Đang hoạt động')

class TramHaCanhResponseSchema(Schema):
    ma_tram = fields.UUID(required=True)
    ten_tram = fields.Str(required=True)
    dia_chi_tram = fields.Str(required=True)
    lat = fields.Float(required=True)
    lng = fields.Float(required=True)
    cong_suat_toi_da = fields.Int(required=True)
    trang_thai_hoat_dong = fields.Str(required=True)
    created_at = fields.DateTime(required=True)
    updated_at = fields.DateTime(required=True)
