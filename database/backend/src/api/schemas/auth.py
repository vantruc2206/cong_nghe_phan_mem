from marshmallow import Schema, fields

class VaiTroRequestSchema(Schema):
    ten_vai_tro = fields.Str(required=True)

class VaiTroResponseSchema(Schema):
    ma_vai_tro = fields.UUID(required=True)
    ten_vai_tro = fields.Str(required=True)
    created_at = fields.DateTime(required=True)
    updated_at = fields.DateTime(required=True)

class NguoiDungRequestSchema(Schema):
    ma_vai_tro = fields.UUID(required=True)
    ho_ten = fields.Str(required=True)
    email = fields.Email(required=True)
    so_dien_thoai = fields.Str(required=False, allow_none=True)
    mat_khau = fields.Str(required=True)

class NguoiDungResponseSchema(Schema):
    ma_nguoi_dung = fields.UUID(required=True)
    ma_vai_tro = fields.UUID(required=True)
    ho_ten = fields.Str(required=True)
    email = fields.Email(required=True)
    so_dien_thoai = fields.Str(required=False, allow_none=True)
    ngay_tao = fields.DateTime(required=True)
    updated_at = fields.DateTime(required=True)

class LoginUserRequestSchema(Schema):
    email = fields.Email(required=True)
    password = fields.Str(required=True)

class LoginUserResponseSchema(Schema):
    user = fields.Nested(NguoiDungResponseSchema, required=True)
    token = fields.Str(required=True)