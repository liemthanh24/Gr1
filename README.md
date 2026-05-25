# 🎵 TicketVN - Hệ thống Đặt vé Concert chịu tải cao

Hệ thống đặt vé concert được thiết kế chịu tải cao (High-Concurrency), sử dụng kiến trúc phân tán: **Frontend → API → Redis Queue → Worker → PostgreSQL**.

## 🏗 Kiến trúc

```
Frontend (Next.js 14)  →  API Server (Golang/Fiber)  →  Redis (Queue + Cache)  →  Worker (Golang)  →  PostgreSQL
```

### Luồng đặt vé bất đồng bộ
1. **API** nhận request → `DECR` Redis để kiểm tra tồn kho
2. Nếu còn vé → Tạo pending order → `LPUSH` vào Redis queue → Trả **202 Accepted**
3. **Worker** dùng `BRPOP` lấy message → Xử lý trong DB Transaction (lock seat, confirm order)
4. **Frontend** polling mỗi 2s để kiểm tra trạng thái

## 🛠 Tech Stack

| Component | Technology |
|-----------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Backend API | Golang 1.21+, Fiber (Fasthttp) |
| Worker | Golang (Background Process) |
| Database | PostgreSQL 15+ |
| Cache/Queue | Redis 7+ |
| Auth | JWT + bcrypt |

## 📁 Cấu trúc dự án

```
Gr1/
├── docker-compose.yml          # PostgreSQL + Redis + API + Worker
├── ticket-backend/
│   ├── cmd/
│   │   ├── api/main.go         # API Server entry point
│   │   └── worker/main.go      # Queue Worker entry point
│   ├── internal/
│   │   ├── config/             # Environment config
│   │   ├── database/           # PostgreSQL & Redis connections
│   │   ├── handlers/           # HTTP request handlers
│   │   ├── middleware/         # JWT auth middleware
│   │   ├── models/             # Data structs
│   │   ├── repository/         # Database queries
│   │   └── services/           # Business logic
│   ├── pkg/utils/              # JWT & password hashing
│   ├── migrations/             # SQL schema & seed data
│   └── Dockerfile
└── ticket-frontend/
    └── src/
        ├── app/                # Next.js pages
        ├── components/         # UI components
        ├── hooks/              # Custom hooks (polling)
        └── lib/                # API client
```

## 🚀 Cách chạy

### Option 1: Docker Compose (Recommended)

```bash
docker-compose up --build
```

Sẽ khởi chạy:
- PostgreSQL (port 5432) - tự động chạy migration & seed
- Redis (port 6379)
- API Server (port 3000)
- Worker (background)

Sau đó chạy frontend:
```bash
cd ticket-frontend
npm run dev
```
→ Mở http://localhost:3001

### Option 2: Chạy thủ công

**1. Cài đặt yêu cầu:**
- Go 1.21+
- Node.js 18+
- PostgreSQL 15+
- Redis 7+

**2. Setup Database:**
```bash
createdb ticket_db
psql ticket_db < ticket-backend/migrations/001_init.sql
```

**3. Chạy Backend:**
```bash
cd ticket-backend
cp .env.example .env  # Chỉnh sửa nếu cần
go run ./cmd/api       # Terminal 1: API Server
go run ./cmd/worker    # Terminal 2: Worker
```

**4. Chạy Frontend:**
```bash
cd ticket-frontend
npm install
npm run dev            # Terminal 3: http://localhost:3001
```

## 📡 API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/v1/auth/register` | ❌ | Đăng ký |
| `POST` | `/api/v1/auth/login` | ❌ | Đăng nhập → JWT |
| `GET` | `/api/v1/events` | ❌ | Danh sách sự kiện |
| `GET` | `/api/v1/events/:id` | ❌ | Chi tiết + seat map |
| `POST` | `/api/v1/tickets/book` | ✅ | Đặt vé (→ 202 Accepted) |
| `GET` | `/api/v1/orders` | ✅ | Lịch sử đơn hàng |
| `GET` | `/api/v1/orders/:id/status` | ✅ | Polling trạng thái |
| `GET` | `/health` | ❌ | Health check |

## 🎨 Giao diện

- **Dark theme** chủ đạo phong cách concert/entertainment
- **Glassmorphism** cards với backdrop blur
- **Gradient neon** (purple → cyan) cho accent colors
- **Animated seat map** với hover glow effects
- **Real-time status** indicators với pulse animations
- **Responsive** mobile-first design

## 📊 Seed Data

3 sự kiện mẫu đã có sẵn:
1. 🎤 **Sơn Tùng M-TP - Sky Tour 2026** (100 vé - 1,500,000đ)
2. 🎵 **BLACKPINK World Tour - Hà Nội** (200 vé - 2,500,000đ)
3. 🎸 **Đen Vâu - Acoustic Night** (50 vé - 800,000đ)