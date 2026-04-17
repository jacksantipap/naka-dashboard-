# Naka Beauty Group — Dashboard

## วิธี Deploy บน Vercel

### ขั้นตอน

1. Upload ไฟล์ทั้งหมดใน folder นี้ขึ้น GitHub repo
2. ไปที่ vercel.com → Import repo นั้น
3. เพิ่ม Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL` = https://gstkzsazcwxihhrhtkjn.supabase.co
   - `NEXT_PUBLIC_SUPABASE_KEY` = sb_publishable_hYfjkP-E9vU0waQbY4_oGA_45_nUiMU
4. กด Deploy

### โครงสร้างไฟล์

```
naka-dashboard/
├── src/app/
│   ├── layout.js
│   ├── page.js
│   ├── supabase.js
│   └── dashboard/
│       └── page.js    ← Dashboard หลัก
├── package.json
├── next.config.js
├── vercel.json
└── .gitignore
```
