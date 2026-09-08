from marshmallow import Schema, fields

class DroneRequestSchema(Schema):
    ten_drone            = fields.Str(required=False, allow_none=True)
    model                = fields.Str(required=False, allow_none=True)
    tai_trong_toi_da     = fields.Float(required=False, allow_none=True, load_default=5.0)
    trang_thai_drone     = fields.Str(required=False, load_default='Sẵn sàng')
    trang_thai           = fields.Str(required=False, load_default='Sẵn sàng')  # alias from FE
    cong_suat_pin        = fields.Int(required=False, load_default=100)
    dung_luong_pin       = fields.Int(required=False, load_default=100)          # alias from FE
    vi_do_hien_tai       = fields.Float(required=False, allow_none=True)
    kinh_do_hien_tai     = fields.Float(required=False, allow_none=True)
    ma_tram_hien_tai     = fields.UUID(required=False, allow_none=True)
    ngay_bao_tri_gan_nhat = fields.DateTime(required=False, allow_none=True)

class DroneResponseSchema(Schema):
    ma_drone             = fields.UUID(required=True)
    ten_drone            = fields.Str(allow_none=True)
    model                = fields.Str(allow_none=True)
    tai_trong_toi_da     = fields.Float(allow_none=True)
    trang_thai_drone     = fields.Str()
    # Aliases for FE compatibility
    trang_thai           = fields.Method('get_trang_thai')
    dung_luong_pin       = fields.Method('get_pin')
    cong_suat_pin        = fields.Int()
    vi_do_hien_tai       = fields.Float(allow_none=True)
    kinh_do_hien_tai     = fields.Float(allow_none=True)
    ma_tram_hien_tai     = fields.UUID(allow_none=True)
    ngay_bao_tri_gan_nhat = fields.DateTime(allow_none=True)
    created_at           = fields.DateTime()
    updated_at           = fields.DateTime()

    def get_trang_thai(self, obj):
        return getattr(obj, 'trang_thai_drone', None)

    def get_pin(self, obj):
        return getattr(obj, 'cong_suat_pin', 100)
