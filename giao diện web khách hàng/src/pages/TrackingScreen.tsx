import React, { useState, useEffect } from 'react';
import { Package, Activity, AlertCircle, Plane, CheckCircle, ArrowRight } from 'lucide-react';
import { fetchCustomerOrders, fetchDronesApi, fetchStationsApi, completeOrderApi } from '../api';
import { OrderItem, UserProfile, DroneItem, StationItem } from '../types';
import CustomerTrackingMap from '../components/CustomerTrackingMap';
import { ConfirmModal } from '../components/ConfirmModal';

interface TrackingScreenProps {
  user?: UserProfile | null;
  selectedOrderId?: string;
  onNavigate?: (screen: string, orderId?: string) => void;
  showToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

// Helper to match order with real DB drones or active in-flight drone
function findDroneForOrder(order: OrderItem | null, drones: DroneItem[]): DroneItem | null {
  if (!drones || drones.length === 0) return null;
  if (!order) return drones[0];

  // 1. Direct match by ma_drone, id, or ten_drone
  if (order.ma_drone) {
    const targetStr = String(order.ma_drone).toLowerCase();
    const matched = drones.find(d => {
      const dMa = String(d.ma_drone || '').toLowerCase();
      const dId = String(d.id || '').toLowerCase();
      const dTen = String(d.ten_drone || '').toLowerCase();
      return dMa === targetStr || dId === targetStr || dTen === targetStr || dTen.includes(targetStr) || dMa.includes(targetStr);
    });
    if (matched) return matched;
  }

  // 2. Filter active in_flight drones (e.g. Drone 6)
  const activeInFlight = drones.filter(d => {
    const s = String(d.trang_thai || '').toLowerCase();
    return s.includes('flight') || s.includes('giao') || s.includes('busy');
  });

  const pool = activeInFlight.length > 0 ? activeInFlight : drones;

  // 3. Assign deterministic drone per order ID so distinct orders display distinct drones
  let hash = 0;
  const key = String(order.ma_don_hang || order.ma_van_don || 'default');
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash) % pool.length;
  return pool[idx];
}

export const TrackingScreen: React.FC<TrackingScreenProps> = ({ user, selectedOrderId, onNavigate, showToast }) => {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [drones, setDrones] = useState<DroneItem[]>([]);
  const [stations, setStations] = useState<StationItem[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [targetOrderId, setTargetOrderId] = useState<string | null>(null);
  const isArrived = (status?: string) => {
    const s = (status || '').toLowerCase().trim();
    return s.includes('đã đến') || s.includes('da_den') || s.includes('arrived') || s.includes('đến');
  };

  const loadData = (overrideSelectedId?: string) => {
    setLoading(true);
    const custId = user?.email || user?.ma_khach_hang || user?.ma_nguoi_dung;
    Promise.all([
      fetchCustomerOrders(custId),
      fetchDronesApi(),
      fetchStationsApi(),
    ])
      .then(([oData, dData, sData]) => {
        setOrders(oData);
        setDrones(dData);
        setStations(sData);

        // Filter ONLY orders currently in-transit or arrived ("Đang giao" / "Đã đến")
        const inTransitList = oData.filter(o => {
          const s = (o.trang_thai || '').toLowerCase();
          return s === 'in_transit' || s.includes('giao') || s.includes('đến') || s.includes('arrived');
        });

        if (inTransitList.length > 0) {
          const targetId = overrideSelectedId ?? selectedOrder?.ma_don_hang ?? selectedOrderId;
          const matched = targetId ? inTransitList.find(o => o.ma_don_hang === targetId || o.ma_van_don === targetId) : inTransitList[0];
          setSelectedOrder(matched || inTransitList[0]);
        } else {
          setSelectedOrder(null);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [user, selectedOrderId]);

  // Filter in-transit / arrived orders ONLY
  const inTransitOrders = orders.filter(o => {
    const s = (o.trang_thai || '').toLowerCase();
    return s === 'in_transit' || s.includes('giao') || s.includes('đến') || s.includes('arrived');
  });

  const promptCompleteOrder = (orderId: string) => {
    setTargetOrderId(orderId);
    setConfirmModalOpen(true);
  };

  const handleConfirmComplete = async () => {
    if (!targetOrderId) return;
    setCompleting(true);
    try {
      await completeOrderApi(targetOrderId);
      if (showToast) showToast('Đơn hàng đã được xác nhận giao thành công!', 'success');
      setConfirmModalOpen(false);
      
      const remainingInTransit = inTransitOrders.filter(o => o.ma_don_hang !== targetOrderId);
      const nextOrder = remainingInTransit.length > 0 ? remainingInTransit[0] : null;
      setSelectedOrder(nextOrder);

      const completedId = targetOrderId;
      setTargetOrderId(null);
      loadData(nextOrder ? nextOrder.ma_don_hang : 'NONE');
    } catch (err: any) {
      if (showToast) showToast(err.message || 'Không thể cập nhật trạng thái đơn hàng', 'error');
    } finally {
      setCompleting(false);
    }
  };

  // Find assigned Drone for the selected order
  const assignedDrone = findDroneForOrder(selectedOrder, drones);
  
  // Find departure Station for the selected order
  const assignedStation = stations.find(s => s.ma_tram === selectedOrder?.ma_tram) || stations[0];

  const stationLat = (selectedOrder as any)?.tram_vi_do || (selectedOrder as any)?.tram_lat || assignedStation?.vi_do || (assignedStation as any)?.lat || 10.8048584;
  const stationLng = (selectedOrder as any)?.tram_kinh_do || (selectedOrder as any)?.tram_lng || assignedStation?.kinh_do || (assignedStation as any)?.lng || 106.7167612;

  const deliveryLat = (selectedOrder as any)?.vi_do || selectedOrder?.toa_do_giao?.lat || 10.804434;
  const deliveryLng = (selectedOrder as any)?.kinh_do || selectedOrder?.toa_do_giao?.lng || 106.717844;

  return (
    <div className="space-y-6 animate-fade-up">
      
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#00B14F] text-[10px] font-bold border border-emerald-200">
            <Activity className="w-3 h-3 animate-pulse" /> Live Telemetry Order Tracking
          </div>
          <h1 className="text-lg font-extrabold text-slate-900 mt-1">Theo Dõi Đơn Hàng Đang Giao</h1>
          <p className="text-[11px] text-slate-500">Giám sát vị trí Drone thực tế đang giao đơn hàng của bạn trên bản đồ</p>
        </div>

        {selectedOrder && (
          <div className="flex flex-wrap items-center gap-3 bg-white border border-slate-200 p-2.5 rounded-2xl shadow-sm">
            <span className="text-xs text-slate-500">Mã đơn:</span>
            <span className="text-sm font-extrabold text-[#00B14F]">{selectedOrder.ma_van_don || selectedOrder.ma_don_hang}</span>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
              isArrived(selectedOrder.trang_thai) ? 'bg-emerald-100 text-emerald-800 animate-pulse' : 'bg-blue-100 text-blue-800'
            }`}>
              {isArrived(selectedOrder.trang_thai) ? '🛸 Drone đã đến điểm giao!' : '🚁 Đang giao hàng'}
            </span>
            {isArrived(selectedOrder.trang_thai) ? (
              <button
                onClick={() => promptCompleteOrder(selectedOrder.ma_don_hang)}
                disabled={completing}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#00B14F] hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-md animate-pulse cursor-pointer disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                {completing ? 'Đang xử lý...' : 'Xác Nhận Đã Nhận Hàng'}
              </button>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-400 text-xs font-semibold cursor-not-allowed">
                🛸 Drone đang trên đường bay...
              </span>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400 animate-pulse">Đang kết nối tín hiệu vệ tinh GPS Drone...</div>
      ) : inTransitOrders.length === 0 ? (
        <div className="py-16 text-center space-y-4 bg-white border border-slate-200 rounded-3xl shadow-sm p-8 max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-[#00B14F] flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-extrabold text-slate-900">Không có đơn hàng nào đang trong quá trình vận chuyển</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Màn hình này chỉ dùng để theo dõi hành trình tự động của các đơn hàng có trạng thái <strong className="text-blue-600">"Đang giao"</strong> hoặc <strong className="text-emerald-600">"Đã đến"</strong>. Các đơn hàng chờ duyệt hoặc đã hoàn thành sẽ không hiển thị ở đây.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {onNavigate && (
              <>
                <button onClick={() => onNavigate('orders')} className="btn-secondary text-xs inline-flex items-center gap-1.5">
                  <Package className="w-4 h-4" /> Xem Tất Cả Đơn Hàng
                </button>
                <button onClick={() => onNavigate('create-order')} className="btn-primary text-xs inline-flex items-center gap-1.5">
                  + Tạo Đơn Hàng Mới <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Map & Telemetry Details */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between shadow-sm space-y-4">
            
            {/* Top Assigned Drone & Telemetry Bar */}
            <div className="flex flex-wrap items-center justify-between bg-slate-50 border border-slate-200 p-4 rounded-2xl gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#00B14F] flex items-center justify-center font-bold">
                  <Plane className="w-5 h-5 transform -rotate-45" />
                </div>
                <div>
                  <p className="text-xs font-extrabold text-slate-900">
                    {assignedDrone?.ten_drone || 'Drone Carrier X1'}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Model: {assignedDrone?.model || 'SkyCarrier X1'} • Pin: <strong className="text-emerald-600">{assignedDrone?.dung_luong_pin ?? 95}%</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6 text-center">
                <div>
                  <p className="text-[10px] text-slate-500 font-medium">Trạm Xuất Phát</p>
                  <p className="text-xs font-bold text-slate-800">{assignedStation?.ten_tram || 'Trạm UTH'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-medium">Trạng Thái Đơn</p>
                  <p className={`text-xs font-extrabold ${isArrived(selectedOrder?.trang_thai) ? 'text-emerald-600' : 'text-blue-600'}`}>
                    {isArrived(selectedOrder?.trang_thai) ? '🛸 Đã đến điểm giao!' : '🚁 Đang giao hàng'}
                  </p>
                </div>
              </div>
            </div>

            {/* Leaflet Real Interactive Map synchronized with Management Portal */}
            <div className="w-full relative rounded-2xl overflow-hidden border border-slate-200">
              <CustomerTrackingMap
                stations={stations}
                drones={drones}
                orders={inTransitOrders}
                selectedOrderId={selectedOrder?.ma_don_hang}
                selectedDroneId={selectedOrder?.ma_drone || assignedDrone?.ma_drone}
                onSelectDrone={(droneId) => {
                  const matchedOrder = inTransitOrders.find(o => o.ma_drone === droneId);
                  if (matchedOrder) setSelectedOrder(matchedOrder);
                }}
              />
            </div>

            {/* Order & Delivery Details Footer */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <span className="text-slate-500">📍 Điểm giao hàng: <strong className="text-slate-900">{selectedOrder?.dia_chi_giao}</strong></span>
                <span className="text-slate-500">📞 SĐT: <strong className="text-slate-800">{selectedOrder?.so_dien_thoai_nhan}</strong></span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 pt-2 border-t border-slate-200/60">
                <span>Trọng lượng hàng: <strong className="text-slate-700">{selectedOrder?.trong_luong || 1.5} kg</strong></span>
                <span>Drone phục vụ: <strong className="text-[#00B14F]">{assignedDrone?.ten_drone || 'Drone Auto-Assigned'}</strong></span>
                {isArrived(selectedOrder?.trang_thai) ? (
                  <button
                    onClick={() => selectedOrder && promptCompleteOrder(selectedOrder.ma_don_hang)}
                    disabled={completing}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-all disabled:opacity-50 inline-flex items-center gap-1 ml-auto shadow-sm cursor-pointer"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Xác Nhận Đã Nhận Hàng
                  </button>
                ) : (
                  <span className="px-3 py-1 rounded-lg bg-slate-200 text-slate-500 font-medium text-[11px] inline-flex items-center gap-1 ml-auto cursor-not-allowed">
                    🛸 Drone chưa đến điểm giao
                  </span>
                )}
              </div>
            </div>

          </div>

          {/* Right Sidebar: Customer's In-Transit Orders List */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Package className="w-4 h-4 text-[#00B14F]" /> Đơn Đang Giao ({inTransitOrders.length})
            </h2>
            <p className="text-xs text-slate-500">Danh sách các đơn hàng của bạn đang được Drone vận chuyển trên bầu trời</p>

            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
              {inTransitOrders.map((o) => {
                const isSelected = selectedOrder?.ma_don_hang === o.ma_don_hang;
                const droneForOrder = findDroneForOrder(o, drones);
                return (
                  <div
                    key={o.ma_don_hang}
                    onClick={() => setSelectedOrder(o)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                      isSelected
                        ? 'bg-emerald-50 border-[#00B14F] text-slate-900 shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-slate-900">
                        {o.ma_van_don || o.ma_don_hang}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                        Đang giao
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-slate-800 truncate">
                      {o.ten_hang_hoa || 'Hàng hóa giao bằng Drone'}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-200/60">
                      <span className="flex items-center gap-1 text-[#00B14F] font-bold">
                        <Plane className="w-3 h-3 transform -rotate-45" /> {droneForOrder?.ten_drone || 'Drone #1'}
                      </span>
                      <strong className="text-slate-800">{(o.phi_giao_hang || 35000).toLocaleString('vi-VN')}đ</strong>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* Custom Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModalOpen}
        title="Xác Nhận Đã Nhận Hàng"
        message="Bạn có chắc chắn đã nhận được kiện hàng từ Drone và muốn hoàn tất đơn hàng này?"
        confirmText="Xác Nhận Hoàn Tất"
        cancelText="Để Sau"
        type="success"
        loading={completing}
        onConfirm={handleConfirmComplete}
        onCancel={() => {
          setConfirmModalOpen(false);
          setTargetOrderId(null);
        }}
      />

    </div>
  );
};
