from marshmallow import Schema, fields, validate

class DonHangRequestSchema(Schema):
    ma_kh = fields.UUID(required=True)
    ma_dia_chi = fields.UUID(required=True)
    trang_thai_don_hang = fields.Str(required=False, load_default='Chờ duyệt')
    cach_thuc_thanh_toan = fields.Str(required=False, allow_none=True)
    tong_tien = fields.Float(required=False)

class DonHangResponseSchema(Schema):
    ma_don_hang = fields.UUID(required=True)
    ma_kh = fields.UUID(required=True)
    ma_dia_chi = fields.UUID(required=True)
    trang_thai_don_hang = fields.Str(required=True)
    cach_thuc_thanh_toan = fields.Str(required=False, allow_none=True)
    tong_tien = fields.Float(required=True)
    ngay_dat_hang = fields.DateTime(required=True)
    ngay_cap_nhat = fields.DateTime(required=True)

class GoiHangRequestSchema(Schema):
    ma_don_hang = fields.UUID(required=True)
    ma_tram = fields.UUID(required=False, allow_none=True)
    loai_hang_hoa = fields.Str(required=True)
    can_nang = fields.Float(required=True, validate=validate.Range(min=0.01, max=5.0))
    kich_co = fields.Str(required=False, allow_none=True)
    gia_tri_uoc_tinh = fields.Float(required=False)

class GoiHangResponseSchema(Schema):
    ma_goi_hang = fields.UUID(required=True)
    ma_don_hang = fields.UUID(required=True)
    ma_tram = fields.UUID(required=False, allow_none=True)
    loai_hang_hoa = fields.Str(required=True)
    can_nang = fields.Float(required=True)
    kich_co = fields.Str(required=False, allow_none=True)
    gia_tri_uoc_tinh = fields.Float(required=True)
    created_at = fields.DateTime(required=True)
    updated_at = fields.DateTime(required=True)
