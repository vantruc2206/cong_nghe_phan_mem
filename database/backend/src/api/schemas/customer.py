from marshmallow import Schema, fields

class KhachHangRequestSchema(Schema):
    ten = fields.Str(required=True)
    ten_dem = fields.Str(required=False, allow_none=True)
    ho = fields.Str(required=True)
    gioi_tinh = fields.Str(required=False, allow_none=True)
    so_dien_thoai = fields.Str(required=False, allow_none=True)
    email = fields.Email(required=False, allow_none=True)
    ngay_sinh = fields.Date(required=False, allow_none=True)

class KhachHangResponseSchema(Schema):
    ma_kh = fields.UUID(required=True)
    ten = fields.Str(required=True)
    ten_dem = fields.Str(required=False, allow_none=True)
    ho = fields.Str(required=True)
    gioi_tinh = fields.Str(required=False, allow_none=True)
    so_dien_thoai = fields.Str(required=False, allow_none=True)
    email = fields.Email(required=False, allow_none=True)
    ngay_sinh = fields.Date(required=False, allow_none=True)
    created_at = fields.DateTime(required=True)
    updated_at = fields.DateTime(required=True)

class DiaChiRequestSchema(Schema):
    ma_kh = fields.UUID(required=True)
    dia_chi_cu_the = fields.Str(required=True)
    thanh_pho = fields.Str(required=True)
    lat = fields.Float(required=True)
    lng = fields.Float(required=True)

class DiaChiResponseSchema(Schema):
    ma_dia_chi = fields.UUID(required=True)
    ma_kh = fields.UUID(required=True)
    dia_chi_cu_the = fields.Str(required=True)
    thanh_pho = fields.Str(required=True)
    lat = fields.Float(required=True)
    lng = fields.Float(required=True)
    created_at = fields.DateTime(required=True)
    updated_at = fields.DateTime(required=True)
