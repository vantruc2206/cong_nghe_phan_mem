from marshmallow import Schema, fields

class TinNhanChatbotRequestSchema(Schema):
    ma_kh = fields.UUID(required=True)
    noi_dung = fields.Str(required=True)
    phan_hoi = fields.Str(required=False, allow_none=True)

class TinNhanChatbotResponseSchema(Schema):
    ma_tin_nhan = fields.UUID(required=True)
    ma_kh = fields.UUID(required=True)
    noi_dung = fields.Str(required=True)
    phan_hoi = fields.Str(required=False, allow_none=True)
    thoi_gian = fields.DateTime(required=True)
