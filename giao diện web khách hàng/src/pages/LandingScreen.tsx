import React from 'react';

interface LandingScreenProps {
  onNavigate: (screen: string) => void;
}

const features = [
  { emoji: '⚡', title: 'Giao hàng siêu tốc', desc: 'Drone tự động bay thẳng đến trạm hạ cánh trong 15–30 phút.' },
  { emoji: '📍', title: 'Theo dõi thời gian thực', desc: 'Xem tọa độ GPS và hành trình bay của Drone trực tiếp.' },
  { emoji: '🛡️', title: 'Bảo mật & Linh hoạt', desc: 'Hủy hoặc sửa đơn miễn phí khi đơn còn ở trạng thái Chờ duyệt.' },
  { emoji: '🤖', title: 'AI Hỗ trợ 24/7', desc: 'Chatbot AI thông minh giải đáp mọi thắc mắc ngay lập tức.' },
];

const stats = [
  { value: '< 30 phút', label: 'Giao hàng trung bình' },
  { value: '≤ 5 kg', label: 'Tải trọng gói hàng' },
  { value: '99.9%', label: 'Chính xác hạ cánh' },
  { value: '24/7', label: 'Hỗ trợ tự động' },
];

export const LandingScreen: React.FC<LandingScreenProps> = ({ onNavigate }) => {
  return (
    <div style={{ minHeight: '100svh', background: 'white' }}>
      {/* ─── Hero ─── */}
      <div style={{
        background: 'linear-gradient(145deg, #00B14F 0%, #009140 60%, #007A33 100%)',
        padding: '48px 24px 80px',
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative circles */}
        <div style={{ position:'absolute', top:-60, right:-60, width:200, height:200, borderRadius:'50%', background:'rgba(255,255,255,0.08)' }} />
        <div style={{ position:'absolute', bottom:-40, left:-30, width:140, height:140, borderRadius:'50%', background:'rgba(255,255,255,0.06)' }} />

        <div style={{ position:'relative', zIndex:1, maxWidth:400, margin:'0 auto', textAlign:'center' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🚁</div>
          <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(255,255,255,0.15)', borderRadius:20, padding:'6px 14px', fontSize:12, fontWeight:600, marginBottom:16 }}>
            ⚡ Giao hàng thế hệ mới
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.25, marginBottom: 12 }}>
            Giao hàng tận tay<br/>bằng Drone thông minh
          </h1>
          <p style={{ fontSize: 14, opacity: 0.85, lineHeight: 1.6, marginBottom: 28 }}>
            Đặt đơn siêu tốc · Theo dõi GPS thời gian thực · Giao trong 30 phút
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button
              onClick={() => onNavigate('login')}
              style={{
                background: 'white', color: '#00B14F', border: 'none',
                borderRadius: 14, padding: '15px 24px', fontSize: 15, fontWeight: 800,
                cursor: 'pointer', boxShadow: '0 6px 20px rgba(0,0,0,0.2)',
              }}
            >
              🚀 Bắt đầu đặt hàng ngay
            </button>
            <button
              onClick={() => onNavigate('stations')}
              style={{
                background: 'rgba(255,255,255,0.15)', color: 'white',
                border: '1.5px solid rgba(255,255,255,0.35)',
                borderRadius: 14, padding: '13px 24px', fontSize: 14, fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              📍 Xem vị trí trạm hạ cánh
            </button>
          </div>
        </div>
      </div>

      {/* ─── Stats ─── */}
      <div style={{ background: '#F7F8FA', padding: '24px 16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, maxWidth: 400, margin: '0 auto' }}>
          {stats.map(s => (
            <div key={s.value} className="card" style={{ textAlign: 'center', padding: '16px 12px' }}>
              <p style={{ fontSize: 20, fontWeight: 800, color: '#00B14F', marginBottom: 4 }}>{s.value}</p>
              <p style={{ fontSize: 11, color: '#6B7280', fontWeight: 600 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Features ─── */}
      <div style={{ padding: '24px 16px 40px' }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#111827', textAlign: 'center', marginBottom: 20 }}>
          Tính năng nổi bật
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 400, margin: '0 auto' }}>
          {features.map(f => (
            <div key={f.title} className="card" style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{
                width: 46, height: 46, borderRadius: 12,
                background: '#F0F9F4', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 22, flexShrink: 0,
              }}>
                {f.emoji}
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: 15, color: '#111827', marginBottom: 4 }}>{f.title}</p>
                <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.5 }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── CTA Bottom ─── */}
      <div style={{ background: '#00B14F', padding: '32px 24px', textAlign: 'center' }}>
        <p style={{ color: 'white', fontSize: 18, fontWeight: 800, marginBottom: 16 }}>
          Sẵn sàng đặt đơn hàng đầu tiên?
        </p>
        <button
          onClick={() => onNavigate('login')}
          style={{
            background: 'white', color: '#00B14F', border: 'none',
            borderRadius: 14, padding: '14px 32px', fontSize: 15, fontWeight: 800,
            cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          }}
        >
          Đăng ký miễn phí →
        </button>
      </div>
    </div>
  );
};
