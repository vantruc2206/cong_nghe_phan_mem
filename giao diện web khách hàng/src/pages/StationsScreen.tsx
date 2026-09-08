import React, { useEffect, useState } from 'react';
import { MapPin, RefreshCw, AlertCircle } from 'lucide-react';
import { fetchStationsApi } from '../api';
import { StationItem } from '../types';

export const StationsScreen: React.FC = () => {
  const [stations, setStations] = useState<StationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadStations = async () => {
    setLoading(true);
    try {
      const data = await fetchStationsApi();
      setStations(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStations();
  }, []);

  return (
    <div className="space-y-6 animate-fade-up">
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <MapPin className="w-6 h-6 text-[#00B14F]" /> Mạng Lưới Trạm Hạ Cánh Drone
          </h1>
          <p className="text-xs text-slate-500">Danh sách các điểm sạc, trung chuyển và trạm hạ cánh được kết nối từ Cơ sở dữ liệu</p>
        </div>

        <button
          onClick={loadStations}
          className="p-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-colors shadow-sm cursor-pointer"
          title="Làm mới dữ liệu"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400 animate-pulse">Đang tải danh sách Trạm từ Server...</div>
      ) : stations.length === 0 ? (
        <div className="py-16 text-center space-y-3 bg-white border border-slate-200 rounded-3xl">
          <AlertCircle className="w-10 h-10 text-slate-400 mx-auto" />
          <p className="text-sm font-semibold text-slate-700">Chưa có thông tin trạm hạ cánh trong hệ thống</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stations.map((st) => (
            <div
              key={st.ma_tram}
              className="p-6 rounded-3xl bg-white border border-slate-200 hover:border-emerald-300 transition-all space-y-4 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-[#00B14F] flex items-center justify-center font-bold">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">{st.ten_tram}</h3>
                    <p className="text-[10px] text-slate-400">Mã trạm: {st.ma_tram}</p>
                  </div>
                </div>

                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                  st.trang_thai === 'ACTIVE' ? 'badge-approved' : 'badge-failed'
                }`}>
                  {st.trang_thai}
                </span>
              </div>

              <div className="space-y-2 text-xs border-t border-b border-slate-100 py-3">
                <p className="text-slate-500">Địa chỉ: <span className="text-slate-800 font-semibold">{st.dia_chi}</span></p>
                <p className="text-slate-500">
                  Tọa độ GPS: <span className="text-[#00B14F] font-mono font-bold">{st.vi_do.toFixed(4)}° N, {st.kinh_do.toFixed(4)}° E</span>
                </p>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-500">Số Drone đỗ hiện tại:</span>
                <span className="font-extrabold text-[#00B14F]">{st.so_drone_hien_tai} / {st.suc_chua} Drone</span>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
