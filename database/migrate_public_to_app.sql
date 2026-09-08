-- SQL Script: Chuyển toàn bộ 12 bảng từ schema 'public' sang schema 'app'
CREATE SCHEMA IF NOT EXISTS app;

ALTER TABLE IF EXISTS public.vai_tro SET SCHEMA app;

ALTER TABLE IF EXISTS public.nguoi_dung SET SCHEMA app;

ALTER TABLE IF EXISTS public.khach_hang SET SCHEMA app;

ALTER TABLE IF EXISTS public.dia_chi SET SCHEMA app;

ALTER TABLE IF EXISTS public.tin_nhan_chatbot SET SCHEMA app;

ALTER TABLE IF EXISTS public.don_hang SET SCHEMA app;

ALTER TABLE IF EXISTS public.tram_ha_canh SET SCHEMA app;

ALTER TABLE IF EXISTS public.goi_hang SET SCHEMA app;

ALTER TABLE IF EXISTS public.drone SET SCHEMA app;

ALTER TABLE IF EXISTS public.giao_hang SET SCHEMA app;

ALTER TABLE IF EXISTS public.su_co_giao_hang SET SCHEMA app;

ALTER TABLE IF EXISTS public.thong_bao SET SCHEMA app;