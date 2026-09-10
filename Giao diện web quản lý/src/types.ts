export type Screen =
  | 'login'
  | 'dashboard'
  | 'orders'
  | 'order-detail'
  | 'scheduling'
  | 'failed'
  | 'station-ops'
  | 'tracking'
  | 'drones'
  | 'stations'
  | 'reports'
  | 'ai-eta'
  | 'users'
  | 'activity-log'

export type Role = 'admin' | 'dispatcher' | 'operator' | 'manager'

export interface Toast {
  msg: string
  type: 'success' | 'error' | 'info'
}
