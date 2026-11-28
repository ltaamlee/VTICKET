# Redis và worker gửi vé

Redis trong `BE/compose.yaml` dành cho phát triển cục bộ, chỉ mở cổng trên
`127.0.0.1` và giữ dữ liệu trong Docker volume. Không dùng cấu hình không mật
khẩu này cho môi trường production.

Sau khi cài và khởi động Docker Desktop, chạy trong thư mục `BE`:

```powershell
docker compose up -d
docker compose ps
npm run worker:email
```

Chạy API và worker ở hai tiến trình riêng. Trong `BE/.env`, cấu hình
`REDIS_URL=redis://127.0.0.1:6379`, `FRONTEND_URL`, `EMAIL_USER` và
`EMAIL_PASSWORD`; có thể đặt `EMAIL_HOST`, `EMAIL_PORT` và
`TICKET_EMAIL_CONCURRENCY` (mặc định 5). Không đưa thông tin đăng nhập vào Git.

Kiểm tra queue bằng `npm run queue:status`. Để thử lại lỗi có thể thử lại,
chạy `npm run queue:retry -- <orderId>` khi worker đang hoạt động. Trạng thái
`REVIEW_REQUIRED` cần đối soát thủ công trước khi quyết định gửi lại.
