---
name: Baby tracker
description: develop a pwa to track the baby feeding, nursing and mom's activity
---

# User:
1. Mẹ: ghi chú thông tin lịch trình trong ngày của bé: bú sữa (sữa mẹ/sữa công thức), thay bỉm, ngủ

# Entity
## Mẹ
1. Ghi lại lượng nước/sữa đã uống
2. Khởi tạo sẵn 2 loại: 
- Nước
- sữa
3. Đơn vị đo: ml
4. Cách ghi số đo: minh họa bằng thang đo cho phép mẹ kéo để thay đổi con số ml
## Em bé
1. Ghi lại lượng sữa đã uống
2. Khởi tạo sẵn 2 loại: sữa mẹ / sữa công thức
3. đơn vị đo ml
4. Cách ghi số đo: minh họa bằng thang đo cho phép mẹ kéo để thay đổi con số ml
5. Ghi lại thời điểm thay bỉm

# Dashboard
1. Tổng hợp lượng mẹ uống trong ngày, chia thành 2 loại sữa và Nước
2. Tổng hợp lượng sữa em bé bú trong ngày, chia 2 loại sữa mẹ, sữa công thức
3. Tổng hợp lượng em bé bú theo từng ngày, trend trong 1 tuần

# Yêu cầu hệ thống
1. PWA để mẹ có thể mở bằng url trên chrome mobile
2. Timeline được chia thành các slot 30 min/slot
