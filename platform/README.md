# KP Pakse POS — Complete Rebuild V2

ระบบ POS + Online Shop + Inventory + HRM + Analytics รุ่นสร้างใหม่ทั้งหมด ตาม **Master Rebuild Specification V2** (76 sections / ~600 requirements)

## วิสัยทัศน์

สร้างแพลตฟอร์มธุรกิจแบบ Enterprise สำหรับร้าน KP Pakse:
- ฟังก์ชันเดิมครบ 100% + ฟังก์ชันใหม่เพิ่มขึ้น
- UI/UX, โครงสร้าง, Database ใหม่ทั้งหมด
- เร็ว เสถียร ปลอดภัย รองรับอนาคต

## Technology Stack

- **Monorepo:** npm workspaces
- **Frontend:** React 19 + Vite 8 + TypeScript + TailwindCSS + React Router
- **Backend:** Node.js + Fastify 5 + TypeScript + Prisma
- **Database:** SQLite (dev) / PostgreSQL (prod) ผ่าน Prisma ORM
- **Validation:** Zod
- **Auth:** JWT + bcrypt + role/permission engine
- **Events:** in-memory event emitter (upgrade เป็น Redis ได้ในอนาคต)
- **Cache:** in-memory LRU (upgrade เป็น Redis ได้)
- **Testing:** Vitest + Playwright

## โครงสร้างโฟลเดอร์

```
platform/
├── README.md
├── package.json
├── apps/
│   ├── api/                 # Fastify backend + Prisma
│   └── web/                 # React + Vite frontend
├── packages/
│   └── shared/              # TypeScript types, constants, utilities
└── docs/
    └── ARCHITECTURE.md      # รายละเอียด architecture
```

## คำสั่งหลัก

```bash
# ติดตั้ง dependencies
npm install

# รัน development (api + web พร้อมกัน)
npm run dev

# สร้าง Prisma client หลังแก้ schema
npm run db:generate

# รัน migration
npm run db:migrate

# build ทั้งระบบ
npm run build

# ทดสอบ
npm test
```

## Migration จากระบบเก่า

- ข้อมูลเดิมอยู่ใน `../db_shared.json`
- สคริปต์ migration จะ map legacy entities → normalized schema ใหม่
- เก็บ `legacyId` ทุกแถวเพื่อ trace กลับไปหาข้อมูลเดิมได้

## Phase Plan

1. **Phase 1 — Foundation:** architecture, schema, backend API skeleton, frontend skeleton
2. **Phase 2 — Auth & Permission:** JWT login, role/permission engine, audit log
3. **Phase 3 — Core POS:** cart, payment, receipt, refund, daily closing
4. **Phase 4 — Product & Inventory:** catalog, stock, transfer, adjustment, lot/serial
5. **Phase 5 — Customer & CRM:** profile, points, deposit, credit, loyalty
6. **Phase 6 — Purchase & Supplier:** PO, receive, cost, supplier report
7. **Phase 7 — Online Store:** shop, cart, checkout, order tracking
8. **Phase 8 — HRM & Payroll:** attendance, shift, payroll, commission
9. **Phase 9 — Reports & BI:** sales, inventory, profit, dashboard
10. **Phase 10 — AI & Automation:** forecasting, smart notification, rule engine
11. **Phase 11 — Security & DevOps:** 2FA, backup, monitoring, deployment
