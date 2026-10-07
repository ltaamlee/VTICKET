Được, mình chuyển toàn bộ sang **tiếng Việt**, đồng thời giữ cấu trúc README mà bạn đã chốt cho **VTicket**. Mình cũng sẽ **không tự thêm Redux** hay các công nghệ bạn chưa xác nhận.

# VTicket

## 1. Tổng quan dự án

### 1.1. Tên dự án

**VTicket**

### 1.2. Mô tả dự án

**VTicket** là hệ thống quản lý sự kiện và phân phối vé điện tử, tích hợp diễn đàn trực tuyến dành cho từng sự kiện.

Hệ thống hỗ trợ toàn bộ quy trình từ quản lý sự kiện, tạo loại vé, thiết lập sơ đồ chỗ ngồi, đặt vé, thanh toán, phát hành vé điện tử, tạo mã QR đến kiểm tra vé và check-in tại sự kiện.

Bên cạnh việc bán vé chính thức, VTicket còn cung cấp **thị trường bán lại vé (Resale Marketplace)**, cho phép người sở hữu vé bán lại vé hợp lệ cho người dùng khác. Hệ thống đồng thời tích hợp **diễn đàn theo sự kiện**, nơi người dùng có thể đăng bài, bình luận, tương tác và báo cáo nội dung. Các chức năng chính này phù hợp với phạm vi chức năng được xác định trong tài liệu dự án.  

---

# 2. Mục tiêu chính

VTicket được xây dựng nhằm:

1. Xây dựng nền tảng quản lý sự kiện tập trung.
2. Hỗ trợ nhà tổ chức tạo và quản lý sự kiện.
3. Hỗ trợ phân phối vé điện tử trực tuyến.
4. Cho phép người dùng tìm kiếm và xem thông tin sự kiện.
5. Hỗ trợ mua vé và lựa chọn chỗ ngồi.
6. Hỗ trợ thanh toán trực tuyến.
7. Tự động phát hành vé điện tử sau khi thanh toán thành công.
8. Sử dụng mã QR để xác thực vé và check-in.
9. Quản lý vé của người dùng.
10. Hỗ trợ mua bán lại vé giữa người dùng.
11. Hỗ trợ chuyển quyền sở hữu vé khi giao dịch Resale thành công.
12. Xây dựng diễn đàn thảo luận gắn với từng sự kiện.
13. Cung cấp hệ thống thông báo.
14. Cung cấp thống kê cho Organizer.
15. Cung cấp chức năng quản trị và kiểm duyệt cho Admin.

---

# 3. Các tác nhân và vai trò

VTicket gồm 4 tác nhân chính:

```text
Guest
User
Organizer
Admin
```

## 3.1. Guest

Guest là người chưa đăng nhập vào hệ thống.

Guest có thể:

* Xem danh sách sự kiện.
* Tìm kiếm sự kiện.
* Lọc sự kiện.
* Xem thông tin chi tiết sự kiện.
* Xem các nội dung diễn đàn công khai.
* Đăng ký tài khoản.

Guest không được phép mua vé hoặc thực hiện các chức năng yêu cầu xác thực.

---

## 3.2. User

User là người dùng đã đăng ký và đăng nhập vào hệ thống.

User có thể:

* Đăng nhập/đăng xuất.
* Đổi mật khẩu.
* Quên mật khẩu và khôi phục tài khoản.
* Xem và cập nhật thông tin cá nhân.
* Tìm kiếm và xem sự kiện.
* Chọn loại vé.
* Chọn chỗ ngồi nếu sự kiện có sơ đồ chỗ ngồi.
* Đặt vé.
* Thanh toán.
* Xem lịch sử đơn hàng.
* Xem vé điện tử.
* Hiển thị mã QR.
* Check-in bằng vé.
* Bán lại vé hợp lệ.
* Mua vé từ Resale Marketplace.
* Đăng bài trong diễn đàn.
* Bình luận.
* Tương tác với bài viết.
* Báo cáo nội dung không phù hợp.
* Nhận thông báo.

Các chức năng này phù hợp với nhóm chức năng của User trong tài liệu dự án.

---

## 3.3. Organizer

Organizer là người chịu trách nhiệm tổ chức và quản lý sự kiện.

Organizer có thể:

* Đăng nhập/đăng xuất.
* Quản lý thông tin cá nhân.
* Tạo sự kiện.
* Xem sự kiện.
* Chỉnh sửa sự kiện.
* Hủy sự kiện.
* Quản lý Event Session.
* Quản lý loại vé.
* Thiết lập giá vé.
* Thiết lập số lượng vé.
* Thiết lập thời gian mở/bán vé.
* Thiết lập Seat Map.
* Tạo Zone.
* Tạo hàng ghế và ghế.
* Theo dõi đơn hàng.
* Theo dõi trạng thái thanh toán.
* Theo dõi tình trạng vé.
* Xem thống kê bán vé.
* Xem doanh thu.
* Xem thống kê check-in.

Organizer có quyền quản lý các sự kiện do mình tạo và các dữ liệu liên quan đến những sự kiện đó.  

---

## 3.4. Admin

Admin là người quản trị toàn bộ hệ thống.

Admin có thể:

* Quản lý tài khoản User.
* Tìm kiếm và xem thông tin User.
* Khóa tài khoản.
* Mở khóa tài khoản.
* Quản lý Organizer.
* Quản lý sự kiện.
* Kiểm tra thông tin sự kiện.
* Quản lý giao dịch.
* Quản lý nội dung diễn đàn.
* Xử lý nội dung bị báo cáo.
* Quản lý các thông tin ở cấp độ hệ thống.

Tài liệu hiện tại có quy định chức năng quản lý tài khoản User và quản trị hệ thống. 

---

# 4. Các chức năng chính

## 4.1. Xác thực và quản lý tài khoản

### Đăng ký

Người dùng có thể đăng ký tài khoản bằng email và mật khẩu.

Hệ thống kiểm tra thông tin đăng ký trước khi tạo tài khoản.

Nếu sử dụng OTP:

```text
Nhập thông tin đăng ký
        ↓
Kiểm tra thông tin
        ↓
Gửi OTP
        ↓
Xác thực OTP
        ↓
Tạo tài khoản
```

### Đăng nhập

Hệ thống kiểm tra:

* Email.
* Mật khẩu.
* Trạng thái tài khoản.
* Quyền của người dùng.

Tài khoản bị khóa không được phép đăng nhập. 

### Quên mật khẩu

```text
Quên mật khẩu
      ↓
Nhập email
      ↓
Gửi OTP
      ↓
Xác thực OTP
      ↓
Đặt mật khẩu mới
```

---

# 4.2. Quản lý sự kiện

**Event** là đối tượng trung tâm của hệ thống.

Một Event có thể bao gồm:

```text
Event
├── Tên sự kiện
├── Mô tả
├── Banner
├── Địa điểm
├── Danh mục
├── Organizer
├── Trạng thái
├── Thời gian bắt đầu
└── Thời gian kết thúc
```

Các chức năng chính:

* Tạo sự kiện.
* Xem sự kiện.
* Chỉnh sửa sự kiện.
* Hủy sự kiện.
* Quản lý trạng thái sự kiện.
* Tìm kiếm sự kiện.
* Lọc sự kiện.
* Xem chi tiết sự kiện.

Theo tài liệu, thông tin sự kiện bao gồm tên, mô tả, thời gian, địa điểm, danh mục, sức chứa, Organizer, loại vé, giá vé và trạng thái. 

---

# 4.3. Event Session

Một Event có thể có một hoặc nhiều **Event Session**.

Ví dụ:

```text
Sự kiện: Music Festival 2026

├── Session 1
│   ├── Bắt đầu: 18:00
│   └── Kết thúc: 20:00
│
└── Session 2
    ├── Bắt đầu: 21:00
    └── Kết thúc: 23:00
```

EventSession hiện tại trong class diagram gồm:

```text
EventSession
├── id
├── name
├── startAt
├── endAt
└── status
```

Việc tách Event và EventSession giúp hệ thống quản lý những sự kiện có nhiều phiên diễn ra tại các thời điểm khác nhau.

---

# 4.4. Seat Map / Zone / Seat

VTicket hỗ trợ sự kiện có sơ đồ chỗ ngồi.

Cấu trúc:

```text
Event Session
      ↓
   Seat Map
      ↓
     Zone
      ↓
     Seat
```

Ví dụ:

```text
Seat Map
├── VIP
│   ├── A01
│   ├── A02
│   └── A03
│
├── Khu A
│   ├── B01
│   ├── B02
│   └── B03
│
└── Khu B
    ├── C01
    ├── C02
    └── C03
```

Organizer có thể:

* Tạo Zone.
* Tạo hàng ghế.
* Tạo ghế.
* Thiết lập mã ghế.
* Thiết lập giá hoặc loại vé cho Zone.
* Lưu sơ đồ chỗ ngồi.

Hệ thống phải đảm bảo không tồn tại hai ghế có cùng định danh trong cùng một Seat Map. 

---

# 4.5. Ticket Type

**TicketType** đại diện cho một loại vé được bán trong sự kiện.

Ví dụ:

```text
VIP
Regular
Early Bird
Student
```

TicketType hiện tại có thể bao gồm:

```text
TicketType
├── id
├── name
├── price
├── capacity
├── soldQuantity
├── saleStartAt
├── saleEndAt
└── status
```

Organizer có thể:

* Tạo loại vé.
* Chỉnh sửa loại vé.
* Thiết lập giá.
* Thiết lập số lượng.
* Thiết lập thời gian bán.
* Xóa loại vé nếu chưa phát sinh giao dịch.

---

# 4.6. Đặt vé

Quy trình mua vé:

```text
Xem chi tiết sự kiện
        ↓
Chọn mua vé
        ↓
Chọn loại vé
        ↓
Chọn số lượng / chỗ ngồi
        ↓
Kiểm tra tình trạng vé
        ↓
Tạm giữ vé / ghế
        ↓
Tạo Order
        ↓
Thanh toán
```

Đối với sự kiện có chỗ ngồi, hệ thống phải kiểm tra ghế còn trống trước khi xác nhận lựa chọn.

Nếu ghế đã được người khác đặt hoặc tạm giữ, người dùng phải chọn ghế khác.

Tài liệu dự án có quy định việc tạm giữ vé/chỗ trong quá trình đặt vé nhằm tránh tình trạng hai người cùng mua một vé hoặc một ghế.

---

# 4.7. Thanh toán

Quy trình thanh toán:

```text
Tạo Order
    ↓
Chờ thanh toán
    ↓
Chọn phương thức thanh toán
    ↓
Cổng thanh toán
    ↓
Kết quả thanh toán
    ↓
Backend xác thực
    ↓
Thanh toán thành công
    ↓
Order = PAID
    ↓
Phát hành E-ticket
```

Nếu thanh toán thất bại:

```text
Thanh toán thất bại
        ↓
Thông báo
        ↓
Cho phép thanh toán lại
```

Nếu Order hết thời gian thanh toán:

```text
Order hết hạn
      ↓
Giải phóng vé/ghế
      ↓
Order = EXPIRED
```

Sau khi thanh toán thành công, hệ thống chuyển trạng thái Order và thực hiện phát hành vé điện tử, tạo QR.

**Lưu ý:** Cổng thanh toán cụ thể như MoMo, VNPay hay ZaloPay chưa nên ghi cố định vào README nếu bạn chưa quyết định.

---

# 4.8. Vé điện tử và QR Check-in

Sau khi thanh toán thành công, hệ thống tạo vé điện tử.

Vé có thể chứa:

```text
E-ticket
├── Mã vé
├── Sự kiện
├── Event Session
├── Loại vé
├── Chỗ ngồi / Zone
├── Người sở hữu
├── Order
├── QR Code
└── Trạng thái vé
```

Quy trình:

```text
Thanh toán thành công
        ↓
Tạo Ticket
        ↓
Tạo QR
        ↓
Hiển thị E-ticket
        ↓
Người dùng đến sự kiện
        ↓
Quét QR
        ↓
Kiểm tra tính hợp lệ
        ↓
Check-in
```

Khi check-in, hệ thống cần kiểm tra:

* Vé có tồn tại không.
* Vé có thuộc đúng sự kiện không.
* Vé còn hiệu lực không.
* Vé có thuộc người sở hữu hiện tại không.
* Vé đã check-in chưa.
* Vé có bị hủy hay hết hạn không.

Một vé đã check-in không được phép check-in lần thứ hai.

---

# 4.9. Resale Marketplace

VTicket có chức năng **bán lại vé**.

Người dùng có thể bán lại vé mà mình đang sở hữu nếu vé đáp ứng điều kiện.

### Đăng bán vé

```text
Vé của tôi
    ↓
Chọn vé
    ↓
Bán lại
    ↓
Kiểm tra quyền sở hữu
    ↓
Kiểm tra trạng thái vé
    ↓
Nhập giá bán lại
    ↓
Kiểm tra giá
    ↓
Tạo tin đăng Resale
```

Không được bán lại vé nếu:

* Vé đã được sử dụng.
* Vé đã check-in.
* Vé đã hết hạn.
* Người dùng không phải chủ sở hữu.
* Vé không đáp ứng điều kiện Resale.

Các điều kiện này được quy định trong Use Case Resale. 

### Mua vé Resale

```text
Resale Marketplace
        ↓
Chọn vé
        ↓
Kiểm tra tình trạng
        ↓
Khóa vé tạm thời
        ↓
Thanh toán
        ↓
Thanh toán thành công
        ↓
Chuyển quyền sở hữu
        ↓
Vô hiệu hóa QR cũ
        ↓
Tạo QR mới
```

Nếu giao dịch thành công, vé được chuyển sang người mua mới và QR cũ phải được vô hiệu hóa trước khi tạo QR mới. 

### Entity nên bổ sung

Class diagram hiện tại **chưa có** phần Resale. Vì vậy nên bổ sung:

```text
ResaleListing
├── id
├── ticketId
├── sellerId
├── price
├── status
├── createdAt
└── expiresAt
```

và:

```text
ResaleTransaction
├── id
├── listingId
├── sellerId
├── buyerId
├── amount
├── status
├── createdAt
└── completedAt
```

Nếu Escrow thực sự được cài thành một đối tượng nghiệp vụ riêng thì mới cân nhắc thêm class `Escrow`.

---

# 4.10. Diễn đàn sự kiện

Forum của VTicket là **diễn đàn gắn với sự kiện**, không phải một mạng xã hội độc lập.

Mô hình:

```text
Event
  ↓
Post
 ├── Comment
 ├── Reaction
 └── Report
```

User có thể:

* Xem bài viết.
* Tạo bài viết.
* Chỉnh sửa/xóa bài viết của mình theo quyền.
* Bình luận.
* Tương tác.
* Báo cáo nội dung.

Tài liệu xác định Forum là nơi người dùng trao đổi, thảo luận và chia sẻ thông tin liên quan đến sự kiện. 

### Post

Nên bổ sung quan hệ:

```text
Post
├── id
├── eventId
├── authorId
├── title
├── content
├── status
└── createdAt
```

### Comment

```text
Comment
├── id
├── postId
├── authorId
├── content
├── status
└── createdAt
```

### Reaction

```text
Reaction
├── id
├── postId
├── userId
├── type
└── createdAt
```

### Report

Vì hệ thống có chức năng báo cáo nội dung, nên class diagram nên bổ sung:

```text
Report
├── id
├── reporterId
├── targetType
├── targetId
├── reason
├── status
└── createdAt
```

---

# 4.11. Thông báo

Hệ thống có thể gửi thông báo cho User về những hoạt động quan trọng:

* Thanh toán thành công.
* Vé điện tử được phát hành.
* Giao dịch Resale thành công.
* Vé được chuyển quyền sở hữu.
* Cập nhật liên quan đến sự kiện.
* Nội dung diễn đàn bị xử lý.

Có thể bổ sung:

```text
Notification
├── id
├── userId
├── title
├── content
├── type
├── isRead
└── createdAt
```

Tài liệu hiện tại có chức năng nhận thông báo hệ thống đối với User.

---

# 4.12. Quản trị Admin

## Quản lý User

Admin có thể:

* Xem User.
* Tìm kiếm User.
* Xem thông tin User.
* Khóa tài khoản.
* Mở khóa tài khoản.

Tài liệu quy định tài khoản bị khóa sẽ không thể đăng nhập vào hệ thống. 

## Quản lý Organizer

Admin có thể quản lý thông tin Organizer và các quyền liên quan.

## Quản lý Event

Admin có thể:

* Xem Event.
* Kiểm tra Event.
* Quản lý trạng thái/hiển thị Event.
* Xử lý Event không phù hợp.

## Quản lý Forum

Admin có thể:

* Kiểm tra Post.
* Kiểm tra Comment.
* Xem Report.
* Xử lý nội dung vi phạm.

---

# 4.13. Thống kê Organizer

Organizer Dashboard cung cấp thống kê cho những Event mà Organizer quản lý.

Các thông tin chính:

* Tổng số vé đã bán.
* Số vé còn lại.
* Tổng doanh thu.
* Doanh thu theo loại vé.
* Số người đã check-in.
* Số người chưa check-in.
* Tỷ lệ lấp đầy.
* Thống kê theo khoảng thời gian.

Ví dụ:

```text
Tổng vé đã bán       850
Vé còn lại           150
Doanh thu            ...
Đã check-in          720
Chưa check-in        130
Tỷ lệ lấp đầy         85%
```

Các nhóm thống kê này đã được xác định trong tài liệu dự án. 

---

# 5. Các quy tắc nghiệp vụ

## 5.1. Tài khoản

* Email phải duy nhất.
* Mật khẩu không được lưu dưới dạng plaintext.
* Tài khoản bị khóa không được đăng nhập.
* User chỉ được chỉnh sửa thông tin của chính mình.
* Quyền truy cập được xác định dựa trên Role.

## 5.2. Event

* Organizer chỉ được quản lý Event của mình.
* Event phải có thông tin hợp lệ trước khi được công khai.
* Event bị hủy/ẩn không được tiếp tục bán vé.
* Trạng thái Event phải được kiểm tra trước khi tạo Order.

## 5.3. Ticket

* Ticket phải thuộc một Event/EventSession.
* Ticket phải thuộc một TicketType hợp lệ.
* Một ghế không được bán cho nhiều User cùng lúc.
* Vé đã check-in không được check-in lại.
* Vé đã check-in không được Resale.
* Vé hết hạn không được sử dụng.
* Vé bị hủy không được sử dụng.

## 5.4. Order

* Order thuộc về một User.
* Tổng tiền phải được tính và kiểm tra ở Backend.
* Front-end không được quyết định số tiền cuối cùng.
* Order chưa thanh toán có thể hết hạn.
* Khi Order hết hạn, vé/ghế đang giữ phải được giải phóng.
* Chỉ phát hành E-ticket sau khi thanh toán được xác thực thành công.

## 5.5. Resale

* Chỉ chủ sở hữu hiện tại mới được bán vé.
* Vé đã check-in không được bán.
* Vé hết hạn không được bán.
* Một vé không được bán cho hai người cùng lúc.
* Vé phải được khóa tạm thời trong quá trình mua Resale.
* Khi giao dịch thành công, QR cũ bị vô hiệu hóa.
* Người mua mới nhận QR mới.

---

# 6. Vòng đời của Ticket

Vòng đời chính:

```text
AVAILABLE
    ↓
RESERVED
    ↓
PAID
    ↓
ISSUED
    ↓
CHECKED_IN
```

Các trạng thái bổ sung:

```text
RESERVED → EXPIRED

PAID / ISSUED → CANCELLED

PAID / ISSUED → REFUNDED

ISSUED → RESALE
```

Với Resale:

```text
ISSUED
   ↓
RESALE
   ↓
SOLD
   ↓
CHUYỂN QUYỀN SỞ HỮU
   ↓
TẠO QR MỚI
```

---

# 7. Quy trình Order và Payment

```text
User
  ↓
Xem Event
  ↓
Chọn Ticket / Seat
  ↓
Kiểm tra còn vé
  ↓
Tạm giữ Ticket / Seat
  ↓
Tạo Order
  ↓
PENDING_PAYMENT
  ↓
Thanh toán
  ↓
Xác thực Payment
  ↓
PAID
  ↓
Tạo E-ticket
  ↓
Tạo QR
  ↓
Hiển thị vé
```

Nếu hết thời gian thanh toán:

```text
PENDING_PAYMENT
       ↓
Hết thời gian
       ↓
ORDER EXPIRED
       ↓
Giải phóng Ticket / Seat
```

Quy trình này dựa trên luồng đặt vé và thanh toán đã mô tả trong tài liệu.

---

# 8. Quy trình Resale

## Người bán

```text
Vé của tôi
    ↓
Chọn Ticket
    ↓
Kiểm tra quyền sở hữu
    ↓
Kiểm tra trạng thái
    ↓
Nhập giá
    ↓
Tạo Resale Listing
```

## Người mua

```text
Resale Marketplace
       ↓
Chọn Listing
       ↓
Kiểm tra Ticket
       ↓
Khóa Ticket
       ↓
Thanh toán
       ↓
Thanh toán thành công
       ↓
Chuyển quyền sở hữu
       ↓
Vô hiệu QR cũ
       ↓
Tạo QR mới
       ↓
Hoàn tất
```

---

# 9. Quy trình Forum

```text
User
  ↓
Event Forum
  ↓
Tạo Post
  ↓
Post
 ├── Comment
 ├── Reaction
 └── Report
```

Ví dụ:

```text
Event: Concert ABC

Post:
"Bao giờ bắt đầu mở cổng?"

    ├── Comment
    ├── Reaction
    └── Report
```

Admin có thể xử lý những nội dung bị báo cáo.

---

# 10. Kiến trúc hệ thống

VTicket sử dụng kiến trúc **MERN Stack**.

```text
┌──────────────────────────────────────┐
│              FRONT-END               │
│                                      │
│ ReactJS                              │
│ React Router                         │
│ Axios                                │
│ Tailwind CSS                         │
│                                      │
└────────────────┬─────────────────────┘
                 │
                 │ HTTP / REST API
                 ↓
┌──────────────────────────────────────┐
│               BACK-END               │
│                                      │
│ NodeJS + ExpressJS                   │
│                                      │
│ Authentication                       │
│ Authorization                        │
│ Business Logic                       │
│ REST API                             │
│                                      │
└────────────────┬─────────────────────┘
                 │
                 │ Mongoose
                 ↓
┌──────────────────────────────────────┐
│              DATABASE                │
│                                      │
│              MongoDB                 │
│                                      │
└──────────────────────────────────────┘
```

Luồng xử lý Request ở Backend:

```text
Client
   ↓
Route
   ↓
Middleware
   ↓
Controller
   ↓
Service
   ↓
Mongoose Model
   ↓
MongoDB
```

**Không đưa Redux vào kiến trúc hiện tại**, vì bạn chưa xác định sẽ sử dụng Redux. Khi code thực tế hoàn thiện thì mới quyết định có cần thư viện quản lý state riêng hay không.

---

# 11. Công nghệ sử dụng

## Front-end

### ReactJS

Dùng để xây dựng giao diện người dùng và các Component có khả năng tái sử dụng.

### React Router

Dùng để quản lý điều hướng giữa các trang.

Ví dụ:

```text
/events
/events/:id
/tickets
/orders
/resale
/forum
/organizer
/admin
```

### Axios

Dùng để gửi HTTP Request từ Front-end đến REST API của Backend.

### Tailwind CSS

Dùng để xây dựng giao diện và thiết kế responsive.

---

## Back-end

### NodeJS

Cung cấp môi trường chạy JavaScript phía máy chủ.

### ExpressJS

Dùng để xây dựng REST API, Routing, Middleware, Authentication và Authorization.

### Mongoose

Đóng vai trò ODM giữa NodeJS/ExpressJS và MongoDB.

---

## Database

### MongoDB

MongoDB được sử dụng để lưu trữ dữ liệu:

```text
User
Role
UserProfile
Category
Event
EventSession
SeatMap
Zone
Seat
TicketType
Ticket
Order
OrderItem
Payment
Post
Comment
Reaction
Report
Notification
ResaleListing
ResaleTransaction
```

---

## Quản lý State

**Chưa xác định.**

Hiện tại không nên ghi:

```text
Redux
Redux Toolkit
Redux-Saga
```

vào Technology Stack nếu project chưa sử dụng.

Có thể sử dụng các cơ chế có sẵn của React như:

```text
useState
useEffect
useContext
```

nếu đáp ứng đủ nhu cầu.

---

# 12. Database / Class Model

Class diagram hiện tại của bạn đã có:

```text
Role
User
UserProfile

Category
Event
EventSession

SeatMap
Zone
Seat

TicketType
Ticket
Order
OrderItem
Payment

Post
Comment
Reaction
```

Quan hệ tổng quát:

```text
Role
  │
  └── User
       │
       └── UserProfile


Category
   │
   └── Event
         │
         └── EventSession
                │
                └── SeatMap
                     │
                     └── Zone
                          │
                          └── Seat


Event
  │
  └── TicketType
         │
         └── Ticket


User
  │
  └── Order
        ├── OrderItem
        └── Payment


Event
  │
  └── Post
        ├── Comment
        └── Reaction
```

## Những phần nên bổ sung vào Class Diagram

So với các chức năng của VTicket, class diagram hiện tại nên cân nhắc bổ sung:

```text
Report
Notification

ResaleListing
ResaleTransaction
```

Ngoài ra cần làm rõ các quan hệ:

```text
Event 1 ───── 0..* Post

User 1 ────── 0..* Post

User 1 ────── 0..* Comment
Post 1 ────── 0..* Comment

User 1 ────── 0..* Reaction
Post 1 ────── 0..* Reaction

User 1 ────── 0..* Report

EventSession 1 ───── 0..* Ticket

Order 1 ───── 1..* OrderItem

Order 1 ───── 0..* Payment
```

**Lưu ý:** Đây là những quan hệ cần hoàn thiện dựa trên nghiệp vụ. Cardinality cuối cùng nên được đối chiếu với cách bạn thực sự thiết kế MongoDB/Mongoose.

---

# 13. Thiết kế API

API nên được tổ chức theo REST.

## Authentication

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/forgot-password
POST /api/auth/verify-otp
POST /api/auth/reset-password
```

## User

```text
GET  /api/users/me
PUT  /api/users/me
PUT  /api/users/me/password
```

## Event

```text
GET    /api/events
GET    /api/events/:id
POST   /api/events
PUT    /api/events/:id
DELETE /api/events/:id
```

## Event Session

```text
GET    /api/events/:eventId/sessions
POST   /api/events/:eventId/sessions
PUT    /api/sessions/:id
DELETE /api/sessions/:id
```

## Ticket Type

```text
GET    /api/events/:eventId/ticket-types
POST   /api/events/:eventId/ticket-types
PUT    /api/ticket-types/:id
DELETE /api/ticket-types/:id
```

## Seat Map

```text
GET  /api/events/:eventId/seat-map
POST /api/events/:eventId/seat-map
PUT  /api/seat-maps/:id
```

## Order

```text
POST /api/orders
GET  /api/orders
GET  /api/orders/:id
```

## Payment

```text
POST /api/payments
POST /api/payments/callback
GET  /api/payments/:id
```

## Ticket / Check-in

```text
GET  /api/tickets
GET  /api/tickets/:id
POST /api/check-in
```

## Resale

```text
GET    /api/resale
POST   /api/resale
PUT    /api/resale/:id
DELETE /api/resale/:id
POST   /api/resale/:id/purchase
```

## Forum

```text
GET    /api/events/:eventId/posts
POST   /api/events/:eventId/posts

GET    /api/posts/:id
PUT    /api/posts/:id
DELETE /api/posts/:id

POST   /api/posts/:id/comments
POST   /api/posts/:id/reactions
POST   /api/posts/:id/report
```

Đây là **định hướng API**, không phải danh sách endpoint bắt buộc. Khi code thực tế, endpoint phải được điều chỉnh theo cấu trúc Backend.

---

# 14. Bảo mật

## Authentication

Hệ thống cần xác thực người dùng trước khi truy cập các API yêu cầu đăng nhập.

## Authorization

Phân quyền dựa trên Role:

```text
Guest
 └── Chức năng công khai

User
 └── Chức năng cá nhân
     └── Mua vé / Vé / Resale / Forum

Organizer
 └── Quản lý Event của mình

Admin
 └── Quản lý toàn hệ thống
```

## Mật khẩu

Mật khẩu phải được mã hóa bằng thư viện phù hợp như:

```text
bcrypt / bcryptjs
```

Không lưu mật khẩu dạng plaintext.

## Kiểm tra quyền sở hữu

Ví dụ Organizer gửi:

```text
PUT /api/events/:id
```

Backend phải kiểm tra:

```text
Đã đăng nhập?
      ↓
Có phải Organizer?
      ↓
Event có thuộc Organizer này?
      ↓
Có → Cho phép cập nhật
Không → Từ chối
```

Nguyên tắc này cũng áp dụng với:

* Ticket.
* Order.
* Post.
* Comment.
* Resale Listing.

## Thanh toán

Không được tin tưởng hoàn toàn các giá trị do Front-end gửi lên như:

```text
price
totalAmount
paymentStatus
role
ticketStatus
```

Các giá trị quan trọng phải được Backend kiểm tra hoặc tính toán lại.

---

# 15. Cấu trúc Project

Cấu trúc đề xuất:

```text
VTicket/
│
├── frontend/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   ├── events/
│   │   │   ├── tickets/
│   │   │   ├── orders/
│   │   │   ├── resale/
│   │   │   ├── forum/
│   │   │   ├── organizer/
│   │   │   └── admin/
│   │   ├── layouts/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── package.json
│   └── .env
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── models/
│   │   ├── middlewares/
│   │   ├── validations/
│   │   ├── utils/
│   │   ├── integrations/
│   │   ├── app.js
│   │   └── server.js
│   │
│   ├── package.json
│   └── .env
│
└── README.md
```

Nếu project của bạn đã có cấu trúc khác thì **không cần ép project phải đổi theo cấu trúc này**. Đây chỉ là cấu trúc tham khảo.

---

# 16. Quy tắc phát triển

## Quy tắc chung

1. Không thêm thư viện nếu chưa thực sự cần thiết.
2. Không thêm Redux nếu project chưa cần.
3. Tách biệt Front-end và Back-end.
4. Business Logic phải nằm chủ yếu ở Backend.
5. API phải kiểm tra quyền truy cập.
6. Validate dữ liệu ở cả Front-end và Back-end.
7. Sử dụng Component có khả năng tái sử dụng.
8. Không lặp lại Business Logic ở nhiều nơi.
9. Không tin tưởng dữ liệu quan trọng từ Front-end.
10. Không sửa dữ liệu thuộc về User khác nếu không có quyền.

## Backend

Luồng xử lý ưu tiên:

```text
Route
 ↓
Middleware
 ↓
Controller
 ↓
Service
 ↓
Model
 ↓
MongoDB
```

### Controller

Chịu trách nhiệm:

* Nhận Request.
* Gọi Service.
* Trả Response.

### Service

Chịu trách nhiệm:

* Business Logic.
* Kiểm tra nghiệp vụ.
* Xử lý quy trình phức tạp.

### Model

Chịu trách nhiệm:

* Định nghĩa Schema.
* Tương tác với MongoDB.

---

# 17. Thứ tự ưu tiên triển khai

Nên triển khai theo thứ tự phụ thuộc nghiệp vụ:

### Giai đoạn 1 — Khởi tạo

```text
MERN
 ↓
Frontend
 ↓
Backend
 ↓
MongoDB
```

### Giai đoạn 2 — Authentication

```text
User
Role
UserProfile
Register
Login
Logout
Forgot Password
Authorization
```

### Giai đoạn 3 — Event

```text
Category
Event
EventSession
```

### Giai đoạn 4 — Seat

```text
SeatMap
Zone
Seat
```

### Giai đoạn 5 — Ticket

```text
TicketType
Ticket
```

### Giai đoạn 6 — Order

```text
Order
OrderItem
Reservation
```

### Giai đoạn 7 — Payment

```text
Payment
Payment Verification
Order Status
```

### Giai đoạn 8 — E-ticket

```text
E-ticket
QR
Check-in
```

### Giai đoạn 9 — Resale

```text
ResaleListing
ResaleTransaction
Ownership Transfer
QR Regeneration
```

### Giai đoạn 10 — Forum

```text
Post
Comment
Reaction
Report
```

### Giai đoạn 11 — Notification

```text
Notification
Read / Unread
```

### Giai đoạn 12 — Organizer Dashboard

```text
Ticket Statistics
Revenue
Check-in
Occupancy
```

### Giai đoạn 13 — Admin

```text
User Management
Organizer Management
Event Management
Forum Moderation
```

---

# 18. Prompt cho AI Coding Assistant

Có thể dùng phần dưới đây làm **prompt nền** khi yêu cầu AI hỗ trợ code cho VTicket.

---

## Bối cảnh dự án

Tôi đang phát triển **VTicket**, một hệ thống quản lý sự kiện và phân phối vé điện tử tích hợp diễn đàn trực tuyến.

Hệ thống có 4 tác nhân:

```text
Guest
User
Organizer
Admin
```

Các module chính:

```text
Authentication
Event Management
Event Session
Seat Map
Zone
Seat
Ticket Type
Ticket
Order
Order Item
Payment
E-ticket
QR Check-in
Resale Marketplace
Forum
Notification
Admin Management
Organizer Statistics
```

---

## Công nghệ

### Front-end

```text
ReactJS
React Router
Axios
Tailwind CSS
```

### Back-end

```text
NodeJS
ExpressJS
Mongoose
```

### Database

```text
MongoDB
```

### Quan trọng

**Chưa xác định sử dụng Redux.**

Không tự ý cài đặt hoặc sử dụng:

```text
Redux
Redux Toolkit
Redux-Saga
```

trừ khi:

* Tôi yêu cầu trực tiếp; hoặc
* Kiểm tra project hiện tại và thấy chúng đã được sử dụng.

---

## Kiến trúc

```text
ReactJS
   ↓
Axios
   ↓
REST API
   ↓
ExpressJS
   ↓
Middleware
   ↓
Controller
   ↓
Service
   ↓
Mongoose
   ↓
MongoDB
```

Không đưa Business Logic quan trọng vào Front-end.

---

## Các quy tắc nghiệp vụ quan trọng

### Ticket

```text
AVAILABLE
    ↓
RESERVED
    ↓
PAID
    ↓
ISSUED
    ↓
CHECKED_IN
```

Các trạng thái bổ sung có thể gồm:

```text
EXPIRED
CANCELLED
REFUNDED
RESALE
```

### Order

Order thuộc về một User và có thể chứa nhiều OrderItem.

Tổng tiền cuối cùng phải được tính/kiểm tra ở Backend.

### Payment

Chỉ khi thanh toán được xác thực thành công mới được phát hành E-ticket.

Không cho Front-end tự quyết định:

```text
paymentStatus = PAID
```

### Seat

Một Seat không được bán cho nhiều User cùng lúc.

Backend phải kiểm tra tình trạng Seat trước khi xác nhận.

### QR

QR phải được kiểm tra với dữ liệu Ticket trong Database.

Không chỉ dựa vào dữ liệu được mã hóa trong QR.

### Resale

Chỉ chủ sở hữu hiện tại mới được đăng bán Ticket.

Ticket đã check-in hoặc hết hạn không được Resale.

Khi Resale thành công:

```text
Chủ cũ
  ↓
Chuyển quyền sở hữu
  ↓
Chủ mới
  ↓
Vô hiệu QR cũ
  ↓
Tạo QR mới
```

---

## Quy trình khi viết code

Trước khi triển khai một chức năng:

1. Kiểm tra cấu trúc project hiện tại.
2. Kiểm tra Model liên quan.
3. Kiểm tra Route hiện tại.
4. Kiểm tra Controller.
5. Kiểm tra Service.
6. Kiểm tra Authentication/Authorization.
7. Xác định Business Rules.
8. Chỉ thay đổi những file cần thiết.
9. Kiểm tra cả trường hợp thành công và thất bại.

Khi trả lời một yêu cầu code mới, hãy trình bày:

```text
1. Mục đích chức năng
2. Quy tắc nghiệp vụ
3. Các file cần thay đổi
4. Thay đổi Database
5. Thay đổi API
6. Thay đổi Front-end
7. Yêu cầu Authorization
8. Các trường hợp cần kiểm thử
```

---

## Không được tự ý

* Thêm Redux.
* Thêm framework không cần thiết.
* Viết lại toàn bộ project.
* Thay đổi kiến trúc hiện tại nếu không cần.
* Lặp lại Business Logic.
* Tin tưởng giá tiền từ Front-end.
* Tin tưởng Role từ Front-end.
* Tin tưởng Payment Status từ Front-end.
* Cho User sửa dữ liệu của User khác.
* Cho Organizer sửa Event của Organizer khác.
* Cho vé đã check-in được Resale.
* Cho một vé check-in nhiều lần.
* Phát hành E-ticket trước khi thanh toán được xác thực.

Nếu yêu cầu chưa rõ, trước tiên hãy kiểm tra code và tài liệu hiện có. **Không tự suy đoán và thêm một nghiệp vụ mới nếu chưa được xác định.**

---

## Luồng tổng thể của VTicket

```text
                         ┌──────────────┐
                         │    GUEST     │
                         └──────┬───────┘
                                │
                         Xem / Tìm Event
                                │
                                ▼
                         ┌──────────────┐
                         │    EVENT     │
                         └──────┬───────┘
                                │
                          Đăng ký / Login
                                │
                                ▼
                         ┌──────────────┐
                         │     USER     │
                         └──────┬───────┘
                                │
                       Chọn Ticket / Seat
                                │
                                ▼
                         ┌──────────────┐
                         │    ORDER     │
                         └──────┬───────┘
                                │
                            PAYMENT
                                │
                                ▼
                         ┌──────────────┐
                         │   E-TICKET   │
                         │      + QR    │
                         └──────┬───────┘
                                │
                            CHECK-IN
                                │
                                ▼
                         ┌──────────────┐
                         │    EVENT     │
                         │  ATTENDANCE  │
                         └──────────────┘
```

Song song với đó:

```text
                ┌─────────────────────────┐
                │     RESALE MARKET       │
                │                         │
                │ Ticket của User         │
                │        ↓                │
                │ Resale Listing           │
                │        ↓                │
                │ Buyer                   │
                │        ↓                │
                │ Payment                 │
                │        ↓                │
                │ Chuyển quyền sở hữu     │
                │        ↓                │
                │ QR mới                  │
                └─────────────────────────┘
```

và:

```text
                ┌─────────────────────────┐
                │       EVENT FORUM       │
                │                         │
                │ Event                   │
                │   ↓                     │
                │ Post                    │
                │  ├── Comment            │
                │  ├── Reaction           │
                │  └── Report             │
                └─────────────────────────┘
```

**Điểm quan trọng nhất:** với tình trạng hiện tại của VTicket, README này nên được xem là **đặc tả dự án (Project Specification)** chứ chưa phải cam kết rằng tất cả chức năng đã được code. Những phần như `ResaleListing`, `ResaleTransaction`, `Notification`, `Report` là các phần nên bổ sung vào model nếu bạn thực sự triển khai chúng; còn **Redux hoàn toàn không cần đưa vào** khi chưa xác định sử dụng.
