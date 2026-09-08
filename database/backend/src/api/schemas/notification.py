from marshmallow import Schema, fields

class ThongBaoRequestSchema(Schema):
    ma_kh = fields.UUID(required=True)
    ma_don_hang = fields.UUID(required=False, allow_none=True)
    trang_thai = fields.Str(required=False, load_default='Chưa đọc')
    noi_dung = fields.Str(required=True)

class ThongBaoResponseSchema(Schema):
    ma_thong_bao = fields.UUID(required=True)
    ma_kh = fields.UUID(required=True)
    ma_don_hang = fields.UUID(required=False, allow_none=True)
    trang_thai = fields.Str(required=True)
    thoi_gian_gui = fields.DateTime(required=True)
    noi_dung = fields.Str(required=True)
