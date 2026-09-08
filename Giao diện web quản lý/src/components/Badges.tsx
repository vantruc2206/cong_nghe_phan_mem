export const statusConfig: Record<string, { label: string; bg: string; color: string }> = {
  pending:      { label: 'Chờ duyệt',    bg: '#FFF7ED', color: '#C2410C' },
  'chờ duyệt':   { label: 'Chờ duyệt',    bg: '#FFF7ED', color: '#C2410C' },
  cho_duyet:    { label: 'Chờ duyệt',    bg: '#FFF7ED', color: '#C2410C' },
  
  approved:     { label: 'Đã duyệt',     bg: '#EFF6FF', color: '#1D4ED8' },
  'đã duyệt':    { label: 'Đã duyệt',     bg: '#EFF6FF', color: '#1D4ED8' },
  da_duyet:     { label: 'Đã duyệt',     bg: '#EFF6FF', color: '#1D4ED8' },

  delivering:   { label: 'Đang giao',    bg: '#EFF6FF', color: '#2563EB' },
  'đang giao':   { label: 'Đang giao',    bg: '#EFF6FF', color: '#2563EB' },
  dang_giao:    { label: 'Đang giao',    bg: '#EFF6FF', color: '#2563EB' },
  in_transit:   { label: 'Đang giao',    bg: '#EFF6FF', color: '#2563EB' },

  completed:    { label: 'Hoàn tất',     bg: '#F0FDF4', color: '#15803D' },
  'hoàn tất':    { label: 'Hoàn tất',     bg: '#F0FDF4', color: '#15803D' },
  hoan_tat:     { label: 'Hoàn tất',     bg: '#F0FDF4', color: '#15803D' },

  cancelled:    { label: 'Đã hủy',       bg: '#FEF2F2', color: '#B91C1C' },
  'đã hủy':      { label: 'Đã hủy',       bg: '#FEF2F2', color: '#B91C1C' },
  da_huy:       { label: 'Đã hủy',       bg: '#FEF2F2', color: '#B91C1C' },

  failed:       { label: 'Thất bại',     bg: '#FEF2F2', color: '#B91C1C' },
  'thất bại':    { label: 'Thất bại',     bg: '#FEF2F2', color: '#B91C1C' },

  rejected:     { label: 'Bị từ chối',   bg: '#FEF2F2', color: '#B91C1C' },
  'bị từ chối':  { label: 'Bị từ chối',   bg: '#FEF2F2', color: '#B91C1C' },
  bi_tu_choi:   { label: 'Bị từ chối',   bg: '#FEF2F2', color: '#B91C1C' },

  scheduled:    { label: 'Đã lên lịch',  bg: '#F3E8FF', color: '#7C3AED' },
  'đã lên lịch': { label: 'Đã lên lịch',  bg: '#F3E8FF', color: '#7C3AED' },
  da_len_lich:  { label: 'Đã lên lịch',  bg: '#F3E8FF', color: '#7C3AED' },

  available:    { label: 'Sẵn sàng',     bg: '#DCFCE7', color: '#15803D' },
  'sẵn sàng':   { label: 'Sẵn sàng',     bg: '#DCFCE7', color: '#15803D' },
  san_sang:     { label: 'Sẵn sàng',     bg: '#DCFCE7', color: '#15803D' },

  in_flight:    { label: 'Đang bay',     bg: '#EFF6FF', color: '#2563EB' },
  'đang bay':   { label: 'Đang bay',     bg: '#EFF6FF', color: '#2563EB' },
  dang_bay:     { label: 'Đang bay',     bg: '#EFF6FF', color: '#2563EB' },

  charging:     { label: 'Đang sạc',     bg: '#FEF3C7', color: '#D97706' },
  'đang sạc':   { label: 'Đang sạc',     bg: '#FEF3C7', color: '#D97706' },
  dang_sac:     { label: 'Đang sạc',     bg: '#FEF3C7', color: '#D97706' },

  maintenance:  { label: 'Bảo trì',      bg: '#FEF2F2', color: '#B91C1C' },
  'bảo trì':    { label: 'Bảo trì',      bg: '#FEF2F2', color: '#B91C1C' },
  bao_tri:      { label: 'Bảo trì',      bg: '#FEF2F2', color: '#B91C1C' },

  offline:      { label: 'Offline',      bg: '#F1F5F9', color: '#64748B' },
}

export const roleBadge: Record<string, { label: string; bg: string; color: string }> = {
  admin:               { label: 'Admin',             bg: '#EDE9FE', color: '#7C3AED' },
  dispatcher:          { label: 'Dispatcher',        bg: '#DBEAFE', color: '#1D4ED8' },
  operator:            { label: 'Operator',          bg: '#FEF3C7', color: '#D97706' },
  'station operator':  { label: 'Station Operator',  bg: '#FEF3C7', color: '#D97706' },
  manager:             { label: 'Manager',           bg: '#DCFCE7', color: '#16A34A' },
  'logistics manager': { label: 'Logistics Manager', bg: '#DCFCE7', color: '#16A34A' },
  customer:            { label: 'Khách hàng',        bg: '#F1F5F9', color: '#475569' },
}

export const actionBadge: Record<string, { bg: string; color: string }> = {
  'Duyệt đơn':      { bg: '#F0FDF4', color: '#15803D' },
  'Tạo tài khoản':  { bg: '#F0FDF4', color: '#15803D' },
  'Xác nhận nhận':  { bg: '#F0FDF4', color: '#15803D' },
  'Đăng nhập':      { bg: '#EFF6FF', color: '#1D4ED8' },
  'Lập lịch':       { bg: '#EFF6FF', color: '#1D4ED8' },
  'Từ chối đơn':    { bg: '#FEF2F2', color: '#B91C1C' },
  'Xóa':            { bg: '#FEF2F2', color: '#B91C1C' },
  'Sửa tài khoản':  { bg: '#FFF7ED', color: '#C2410C' },
  'Xuất báo cáo':   { bg: '#FFF7ED', color: '#C2410C' },
}

export function Badge({ status }: { status: string }) {
  const key = (status || '').toLowerCase().trim()
  const cfg = statusConfig[key] || { label: status || 'Chưa rõ', bg: '#f1f5f9', color: '#475569' }
  return (
    <span className="badge" style={{ background: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  )
}

export function RoleBadge({ role }: { role: string }) {
  const cfg = roleBadge[role] || { label: role, bg: '#f1f5f9', color: '#475569' }
  return (
    <span className="badge" style={{ background: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  )
}
