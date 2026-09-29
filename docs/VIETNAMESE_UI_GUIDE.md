# Vietnamese UI guide

The user-facing application language is Vietnamese. Source identifiers, API routes, schema/table/column names, enum values, and internal domain terminology remain English and stable.

## Translation architecture

UI copy is centralized in `src/i18n/vi.ts`; `src/i18n/index.ts` exports `t(domain, key)` and `tr(englishCopy)`. Prefer domain-scoped `t()` for new UI. `tr()` supports existing components during incremental localization. Do not add a heavy i18n dependency for the Vietnamese-only requirement. A future English catalog can implement the same domain/key interface without renaming internal identifiers.

## Preferred terminology

| English concept | Vietnamese UI |
|---|---|
| Dashboard | Tổng quan |
| TNPA Wealth OS | TNPA Wealth OS |
| Personal Family Office | Quản lý gia sản cá nhân |
| Holdings / Assets | Tài sản |
| Transactions | Giao dịch |
| Accounts | Tài khoản |
| Portfolio Buckets | Phân bổ mục tiêu |
| Rebalancing | Tái cân bằng |
| Wealth Calendar | Lịch tài sản |
| Performance | Hiệu suất |
| Research | Nghiên cứu |
| Opportunities | Cơ hội đầu tư |
| Watchlist | Danh sách theo dõi |
| Decisions | Quyết định đầu tư |
| Journal | Nhật ký |
| Stocks | Cổ phiếu |
| Crypto | Tiền mã hóa |
| Real Estate | Bất động sản |
| Gold | Vàng |
| Banking & Savings | Ngân hàng & Tiết kiệm |
| Funds & ETFs | Quỹ & ETF |
| Private Loans | Khoản cho vay |
| Settings | Cài đặt |
| Health | Trạng thái hệ thống |

## Writing conventions

Use natural, concise Vietnamese for labels, forms, empty states, confirmations, status and errors. Preserve ticker symbols, currency codes, institution names, and established abbreviations (ETF, P/E, USD, VND) where users expect them. Explain technical/security concepts in Vietnamese. Never translate stored values, route paths, SQL identifiers, or API contracts. Treat translations as display copy only.

Development displays the persistent warning `DEVELOPMENT — DỮ LIỆU THỬ NGHIỆM`; production must not display it. Production branding is TNPA Wealth OS with subtitle “Quản lý gia sản cá nhân”.
