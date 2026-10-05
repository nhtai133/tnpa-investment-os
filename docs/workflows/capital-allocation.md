# v2.4 — Phân bổ vốn

1. Mở Phân bổ tài sản → Chính sách phân bổ vốn. Áp dụng mẫu nếu chưa có chính sách; chỉnh tên, mô tả, thứ tự và min/target/max. Tổng mục tiêu hoạt động cần 100%.
2. Trong Chưa phân loại, chọn nguồn vốn kinh tế. Nhập một mục đích 100% hoặc chia tỷ lệ. Phần chưa nhập còn lại là Chưa phân loại. Không phát sinh giao dịch, thu nhập hay P&L.
3. Đối chiếu tỷ lệ, biên, giá trị VND và thiếu/dư vốn. Chênh lệch = mục tiêu − hiện tại. Đây là đối chiếu chính sách, không đề xuất tài sản để mua/bán.
4. Mục tiêu tài chính như nghỉ hưu tách khỏi mục đích vốn; v2.4 chỉ cung cấp mô hình mục tiêu tối thiểu, chưa có kế hoạch mục tiêu nâng cao.
5. Stocks → Tài khoản & lưu trữ → Lưu trữ/Khôi phục. Tiền và vị thế vẫn tính trong gia sản. Khôi phục trước khi giao dịch tiếp.
6. Backup JSON v7 bao gồm chính sách, phân loại và trạng thái lưu trữ. Giữ nguyên các backup SQLite cũ; không nhập JSON cũ thiếu dữ liệu phân loại để thay thế DB mới.

Mẫu số là vốn ròng có thể đầu tư theo cờ dữ liệu hiện có. Nợ phân bổ theo tỷ trọng nguồn dương chỉ trong báo cáo; các tài sản không có cờ đầu tư được liệt kê riêng. Vốn ròng không dương hoặc cấu hình/phân loại chưa hoàn chỉnh: không chấm điểm sức khỏe phân bổ.

Mẫu chính sách là cấu hình tham khảo có thể sửa, không phải lời khuyên đầu tư. Không tự chuyển nhãn cũ thành phân loại mới.
