from marshmallow import Schema, fields

class GiaoHangRequestSchema(Schema):
    ma_don_hang = fields.UUID(required=True)
    ma_drone = fields.UUID(required=False, allow_none=True)
    ma_nguoi_phu_trach = fields.UUID(required=False, allow_none=True)
    trang_thai_giao_hang = fields.Str(required=False, load_default='Chờ xử lý')
    vi_tri_hien_tai_lat = fields.Float(required=False, allow_none=True)
    vi_tri_hien_tai_lng = fields.Float(required=False, allow_none=True)
    thoi_gian_giao = fields.DateTime(required=False, allow_none=True)

class GiaoHangResponseSchema(Schema):
    ma_giao_hang = fields.UUID(required=True)
    ma_don_hang = fields.UUID(required=True)
    ma_drone = fields.UUID(required=False, allow_none=True)
    ma_nguoi_phu_trach = fields.UUID(required=False, allow_none=True)
    trang_thai_giao_hang = fields.Str(required=True)
    vi_tri_hien_tai_lat = fields.Float(required=False, allow_none=True)
    vi_tri_hien_tai_lng = fields.Float(required=False, allow_none=True)
    thoi_gian_giao = fields.DateTime(required=False, allow_none=True)
    created_at = fields.DateTime(required=True)
    updated_at = fields.DateTime(required=True)

class SuCoGiaoHangRequestSchema(Schema):
    ma_tram = fields.UUID(required=False, allow_none=True)
    ma_giao_hang = fields.UUID(required=True)
    mo_ta_su_co = fields.Str(required=True)
    muc_do_nghiem_trong = fields.Str(required=False, load_default='Trung bình')

class SuCoGiaoHangResponseSchema(Schema):
    ma_van_de = fields.UUID(required=True)
    ma_tram = fields.UUID(required=False, allow_none=True)
    ma_giao_hang = fields.UUID(required=True)
    thoi_gian_xay_ra = fields.DateTime(required=True)
    mo_ta_su_co = fields.Str(required=True)
    muc_do_nghiem_trong = fields.Str(required=True)
    created_at = fields.DateTime(required=True)
