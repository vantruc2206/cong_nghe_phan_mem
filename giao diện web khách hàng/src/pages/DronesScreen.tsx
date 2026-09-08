import React, { useEffect, useState } from 'react';
import { Plane, RefreshCw, AlertCircle, Battery } from 'lucide-react';
import { fetchDronesApi } from '../api';
import { DroneItem } from '../types';

export const DronesScreen: React.FC = () => {
  const [drones, setDrones] = useState<DroneItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDrones = async () => {
    setLoading(true);
    try {
      const data = await fetchDronesApi();
      setDrones(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDrones();
  }, []);

  return (
    <div className="space-y-6 animate-fade-up">
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Plane className="w-6 h-6 text-[#00B14F]" /> Đội Bay Drone Tự Động
          </h1>
          <p className="text-xs text-slate-500">Danh sách các thiết bị Drone giao hàng thông minh tải trọng 5.0 kg</p>
        </div>

        <button
          onClick={loadDrones}
          className="p-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-colors shadow-sm cursor-pointer"
          title="Làm mới dữ liệu"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400 animate-pulse">Đang tải danh sách Drone từ Server...</div>
      ) : drones.length === 0 ? (
        <div className="py-16 text-center space-y-3 bg-white border border-slate-200 rounded-3xl">
          <AlertCircle className="w-10 h-10 text-slate-400 mx-auto" />
          <p className="text-sm font-semibold text-slate-700">Chưa có thiết bị Drone trong hệ thống</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {drones.map((d) => (
            <div
              key={d.ma_drone}
              className="p-6 rounded-3xl bg-white border border-slate-200 hover:border-emerald-300 transition-all space-y-4 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-[#00B14F] flex items-center justify-center font-bold">
                    <Plane className="w-5 h-5 transform -rotate-45" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">{d.ten_drone}</h3>
                    <p className="text-[10px] text-slate-400">Model: {d.model || 'SkyCarrier X1'}</p>
                  </div>
                </div>

                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold badge-approved">
                  {d.trang_thai}
                </span>
              </div>

              <div className="space-y-2 text-xs border-t border-b border-slate-100 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Dung lượng Pin hiện tại:</span>
                  <span className="text-emerald-600 font-extrabold flex items-center gap-1">
                    <Battery className="w-4 h-4" /> {d.dung_luong_pin}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Tải trọng tối đa:</span>
                  <span className="text-[#00B14F] font-extrabold">{d.tai_trong_toi_da} kg</span>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 text-right">
                Trạm gán: <span className="text-slate-700 font-semibold">{d.ma_tram_hien_tai || 'Trạm Trung Tâm'}</span>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
