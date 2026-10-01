# Asset Workspace Architecture

Asset workspaces are user-facing views over the existing asset, account, lifecycle, transaction, ledger, and custody-position records. Each workspace should organize activity around the asset class while reusing those shared accounting primitives. A workspace must not create its own balance or P&L engine.

## Shared primitives

- `account_registry` identifies brokers, exchanges, wallets, and other execution or custody accounts.
- `transactions` stores dated domain activity and the involved cash, execution, and custody accounts.
- `ledger_entries` stores signed cash and asset movements plus separately classified fee, tax, and realized-P&L audit entries.
- `asset_custody_positions` stores quantity and remaining cost basis by asset and custody account.
- `assets` stores the instrument identity, manual current valuation, total open quantity, and archive state.
- `createLifecycleTransaction` applies a transaction atomically to the account balance projection, custody position, asset aggregate, and ledger.

## STOCKS REFERENCE IMPLEMENTATION

The Stocks workspace is the first end-to-end asset-class workspace. It records broker accounts and all routine cash/trading activity in the stock workspace; its account selector and history filters avoid requiring the generic Accounts, Holdings, or Transactions screens for normal stock use.

### Source of truth

Broker cash is the sum of that broker's `ledger_entries.amount` where `entry_type` is `cash_credit` or `cash_debit`. Cash-debit amounts are stored signed negative and cash-credit amounts signed positive. `account_registry.current_balance` is maintained as a compatibility/materialized projection by the existing lifecycle engine; the Stocks workspace does not use a separately editable balance as its live cash source. New broker accounts start at zero; existing cash is recorded as an opening balance, while cash added after cutover uses a deposit.

Open shares and remaining acquisition cost are authoritative in `asset_custody_positions`, per stock instrument and broker. The `assets` quantity and value summarize the instrument across custodians. A ticker's current per-share market price is `assets.current_value / assets.quantity` while quantity is positive.

Older manually entered stock assets that have no custody-position rows remain visible as unassigned holdings and remain included in market-value/cost summaries. They do not fabricate a broker cash movement or become sellable through a broker until recorded in the lifecycle.

### Cash accounting

- Deposit: create a transaction and positive cash-credit ledger entry.
- Withdrawal: create a transaction and negative cash-debit ledger entry.
- Buy: debit gross purchase value plus fees and applicable tax; create the custody position for the shares acquired.
- Sell: credit gross sale proceeds less fees and tax; reduce the custody position.
- Dividend: credit the net amount received. Record gross dividend and withholding tax separately on the transaction and in the audit ledger.
- Standalone fee: debit broker cash and add a fee-classified audit entry.

Fee and tax audit entries are deliberately excluded from the cash-balance sum. The corresponding cash-debit or net cash-credit already includes them, so fees and withholding cannot be counted twice.

### Position accounting and cost basis

Buy quantity is added to the broker's position. Acquisition cost is gross purchase value plus buy fees and applicable purchase tax. Adding that amount to existing cost and dividing by total quantity produces the weighted-average cost.

On sale, the engine removes the sold quantity's pro-rata share of the broker position's remaining cost basis. Fees and sale tax reduce net proceeds and realized P&L. Selling beyond the broker's open quantity is rejected. When aggregate quantity across all brokers reaches zero, the instrument is archived; its transaction history remains intact.

### Realized and unrealized P&L

- Realized P&L per sale = gross proceeds − sale fees − sale tax − cost basis removed.
- Unrealized P&L = current market value of open positions − their remaining cost basis.
- A manual price update changes the instrument's market value only. It does not write cash, transactions, dividends, fees, or realized P&L.
- Dividend income is reported separately from trading P&L. The workspace reports gross dividend income; net cash is gross less withholding tax.

### Valuation and aggregation

Market value is calculated from the manually entered per-share price and open quantity. The workspace total is stock market value plus ledger-derived broker cash. Historical purchase values are not added to current market value, and no cash balance is added twice. VND and USD remain stored in their transaction/account currencies; workspace totals are converted to VND for the Vietnamese-facing summary, while each broker and position displays its own currency.

### Reusable preparation for Crypto, Gold, and Funds

The reusable units are account/custody association, the lifecycle transaction service, signed cash ledger movements, weighted cost basis, realized-P&L calculation, manual valuation, archive-on-full-exit behavior, and domain-scoped history. Future workspaces should provide small domain adapters and views over these shared units. This sprint does not generalize Real Estate into share/lot accounting or implement the other workspaces.

## Development boundary

All development and synthetic accounting tests use the local DEVELOPMENT environment and temporary test databases. This document and the source changes do not require access to production data or a production deployment.

## Wealth cutover and Banking source of truth

`app_settings.wealth_tracking_start_date` is the owner-configured **Ngày bắt đầu theo dõi gia sản**. It marks the date from which the owner records the assets and balances already held. It is a reporting/cutover convention, not an accounting event: opening wealth does not create income, deposit income, investment profit, or realized P&L. Opening bank cash is entered as the current balance of a `bank_accounts` row; existing term deposits are entered directly as `bank_savings_deposits` rows. No pre-cutover transfer history is required.

### Bank liquid cash and savings principal

Bank account balance and savings deposit principal are separate current balances. For example, VCB liquid cash of 200,000,000 VND plus an existing deposit principal of 1,000,000,000 VND contributes 1,200,000,000 VND to current bank wealth. A deposit's optional `bank_account_id` identifies its institution/account relationship only; it does not move or add the principal to the linked liquid balance. When entering an account balance, the owner must exclude amounts entered separately as savings deposits. Global Net Worth sums each account balance and each active deposit principal once.

Expected interest is informational and is never included in current Net Worth before recognized. Deposit projections use simple interest on actual calendar days divided by 365, with no compounding. If exact dates are absent, the term-month estimate uses months × 365 / 12 days. At-maturity payout adds projected interest to expected maturity value; periodic payout shows principal as maturity value because interest is paid separately. These figures are estimates and do not model bank-specific day-count, tax, or compounding conventions. Opening bank balances and deposit records create no income ledger entries.

## CRYPTO REFERENCE IMPLEMENTATION

The Crypto workspace reuses the shared lifecycle transaction service, signed cash ledger, custody positions, weighted-average cost basis, manual asset valuation, and archive-on-full-exit behavior. `account_registry.custody_type` distinguishes `EXCHANGE`, `HOT_WALLET`, and `COLD_WALLET`; all remain the same account/custody entities used by the shared engine.

### Stablecoin and cash-equivalent source of truth

For each Crypto custody source, its selected reporting currency is USD, USDT, or USDC. Deposit, withdrawal, trade settlement, and cash fees are signed `cash_credit` / `cash_debit` entries in that source's ledger. Crypto workspace cash equals the sum of those entries. USDT and USDC are treated at 1:1 USD for reporting in this local-only version; the denomination is retained on the account and its transactions.

Stablecoin cash-equivalent balances are not also created as `assets` or `asset_custody_positions`. Token creation rejects USDT and USDC for this reason. The cash ledger is the one source of truth, so each unit is counted once. A custody source uses one reporting/settlement denomination at a time; cross-currency settlement and depeg valuation are not modeled.

### Economic positions and custody

An instrument is represented by one `assets` row per symbol and reporting currency. Its `asset_custody_positions` rows represent where the units are held. The combined quantity and carrying basis across active custody rows form the economic position. Workspace totals sum each custody quantity once and do not add the instrument's aggregate quantity a second time. Manual token prices set aggregate `assets.current_value`; they do not create cash or realized income.

### Crypto purchase and sale accounting

- Deposit adds a stablecoin cash-equivalent ledger credit. Withdrawal and standalone fee add ledger debits.
- Buy debits cash by quantity × execution price plus fee; the acquired custody position's cost basis includes both gross purchase value and fee. New units are added to the existing custody cost and produce weighted-average cost.
- Sell removes the source custody's pro-rata remaining cost basis, credits gross proceeds less fee, and records realized P&L as gross proceeds less fee and cost removed. Selling more units than held at that custody is rejected.
- Unrealized P&L is current manually valued open Crypto assets less remaining custody-position cost basis. Realized trade P&L is separate from price movement.
- When the economic quantity reaches zero after sales, the instrument is archived by the lifecycle engine; its records and transaction history remain.

### Existing wealth initialization

`opening_position` records an asset already owned when tracking begins. It changes custody quantity and initial carrying basis, but creates no purchase, deposit, cash movement, income, or realized P&L. The owner can enter average acquisition price, total cost basis, or mark basis unknown. An optional manual market price sets valuation independently from acquisition basis. `opening_balance` establishes a custody account's initial stablecoin cash-equivalent balance through a cash-credit ledger entry; it is not income. Opening rows remain visible in Crypto activity history.

Unknown cost basis is represented explicitly on the custody position (`cost_basis_known = false`); the internal numeric basis placeholder is not presented as zero or as profit. Market value still contributes to net worth, while average cost, unrealized P&L, and aggregate unrealized P&L are shown as unknown whenever an open position has unknown basis. Selling from an unknown-basis lot records proceeds and quantity but leaves realized P&L unknown rather than inventing a zero-cost gain. Cost-basis completeness follows the units through custody transfers. Later buys and sales continue through the shared lifecycle engine.

If the owner later learns the basis, a `basis_adjustment` audit entry supplies the total basis for that custody position and marks it known. This entry changes no quantity, cash balance, income, realized P&L, market value, or net worth. Future sales then use the supplied basis. It cannot be entered through the generic transaction form.

Opening entries are initial history, not regular transactions. The workspace exposes a correction form only while that opening is the sole activity for the asset at that custody source. It updates the opening transaction, its position and ledger entry atomically. Once a buy, sell, transfer, or other linked activity exists, correction is rejected so downstream history cannot be silently rewritten; the owner must record a separately auditable adjustment instead. A second opening row for a nonzero custody position is also rejected.

The primitive is domain-neutral: other asset workspaces can use the same opening-position and opening-balance concepts without modeling old acquisitions as newly executed trades. Stablecoin opening balances remain account cash equivalents and are never represented as duplicate token assets.

## STOCKS OPENING WEALTH

At the wealth cutover date, the owner can initialize broker cash and existing shares inside `/stocks` without recreating historical deposits or BUY orders. `opening_balance` adds the existing broker cash once to the broker cash ledger and materialized `account_registry.current_balance`. It is not a deposit transaction, income, or realized P&L. Later deposits, withdrawals, trades, dividends, and fees continue through the approved Stocks lifecycle ledger.

An `opening_position` is tied to the existing broker account and the single stock instrument row. Its `asset_custody_positions` row is the source of truth for shares at that broker; the instrument's `assets` quantity, cost, and market value are aggregate projections across broker custody rows. The owner may enter average acquisition price, total cost basis, or unknown basis. Unknown basis remains explicitly unknown for average cost and unrealized P&L, while the manually valued market value still contributes to Net Worth. Supplying a previously unknown basis creates an auditable `basis_adjustment` entry that changes no shares, cash, market value, or Net Worth.

The same ticker at ACBS and VPBankS remains one economic position in `assets` and two custody positions in `asset_custody_positions`. Each broker view shows its own shares and account cash; economic stock value sums the broker custody quantities once. Global Net Worth uses broker cash plus the aggregate current market value of each stock instrument exactly once. It does not add historical cost basis or opening entries as income.

Opening stock positions become the starting inventory for future transactions. BUY increases the broker custody quantity and weighted-average basis using the existing lifecycle engine; SELL removes pro-rata basis and calculates realized P&L from that combined carrying basis. Opening corrections can rewrite the original opening entry only while it is the sole activity for that stock at that broker. After a dependent buy, sell, or other linked transaction exists, the correction is rejected so history cannot be silently changed.

## PHYSICAL GOLD OPENING WEALTH

Physical gold already owned by the household is initialized as one `assets` row with `asset_class = gold` and an `opening_date` defaulted from the wealth tracking start date. Purity, form, item count, weight and unit, storage location, ownership label, and optional acquisition date are stored in typed columns. Ownership text is descriptive only; it never excludes household gold from Net Worth.

The current estimate is the single valuation source: either a manually entered total VND estimate or weight multiplied by a manually entered price per the selected weight unit. `assets.current_value` stores that resulting total. Known total basis or average basis per matching weight unit is stored in `assets.cost_basis`; unknown basis uses `cost_basis_known = false`. Current estimated value contributes once to Net Worth. Cost basis is never added to current value, and unknown basis produces unknown P&L rather than treating market value as profit. This is a direct opening record and creates no income, realized P&L, or cash ledger activity.

## REAL ESTATE OPENING WEALTH

The MVP represents the owner's existing land as one `assets` row with `asset_class = real_estate`, typed land dimensions/location/legal fields, and an opening date defaulted from the tracking cutover. The purchase price and acquisition costs represent **whole-property economics**. Their sum is the whole-property cost basis. The manually entered total estimate or area × estimated price per square meter is stored as the whole-property current value. No rental, mortgage, or construction accounting is implied.

`ownership_percentage` is applied exactly once by global portfolio aggregation to both current value and basis: household attributable value = whole-property current value × ownership percentage; attributable basis = whole-property basis × ownership percentage. Unrealized gain/loss is the difference between those attributed amounts. The property workspace displays whole-property figures and household-attributable figures separately. Unknown basis still contributes attributable current value to Net Worth while P&L remains unknown. The opening land row creates no historical cash transaction or income.

## PERSONAL WEALTH MVP GLOBAL AGGREGATION

The dashboard's Vietnamese VND balance sheet derives every domain from the existing canonical sources:

- **Banking:** active liquid `bank_accounts` balances, unlinked independent bank-account registry balances where applicable, and active `bank_savings_deposits.principal`. Expected interest and expected maturity value are informational only and do not enter current assets or Net Worth.
- **Stocks:** active broker registry cash plus each stock instrument's aggregate current market value. Broker custody slices are not added as separate generic assets.
- **Crypto:** exchange/wallet registry stablecoin cash equivalents plus each economic crypto instrument's aggregate current market value. Custody slices and transfers do not create extra wealth.
- **Gold:** one current estimated value per active physical-gold asset.
- **Real Estate:** whole-property current estimate multiplied once by the ownership percentage.
- **Liabilities:** active credit-card used balances, credit-facility balances, and negative account balances are liabilities, separate from assets.

The balance-sheet identity is total assets − liabilities = Net Worth. Domain values and balance-sheet totals use the configured local USD/VND conversion rate and display in VND. Existing FX conversion rejects unsupported currencies and invalid rates instead of silently assuming a rate; no external FX service is called. Opening bank cash, deposits, Stocks, Crypto, gold, and land describe wealth at the tracking cutover and are not income or realized investment return.

### Custody transfers and network fees

A transfer moves the requested quantity from the source custody and credits the destination with quantity sent less any network fee. The same weighted-average carrying cost per unit moves with the quantity received. The fee units are removed from the aggregate instrument quantity and carrying basis and recorded as a `fee` ledger entry at their carrying cost. The transaction has no realized P&L and is not modeled as a sale or repurchase. Without a fee, total Crypto quantity, valuation, and net worth are unchanged; with a network fee, only the fee units leave the portfolio.

### Anti-double-counting contract

1. Stablecoin cash equivalents exist in the signed account ledger, never as duplicate Crypto holdings.
2. Token market value is computed from custody quantities; the aggregate asset value is a valuation reference, not an additional position to sum.
3. A transfer subtracts from source custody and adds only the net amount to destination custody. It creates neither cash nor income.
4. A price edit changes market value only. Fees are included once in cash or token quantity movement and excluded from duplicate cash/P&L balances.
5. Global wealth aggregation receives Crypto token value from the one aggregate asset and stablecoin value from the account balance projection maintained by the same cash ledger lifecycle. It does not consume Crypto workspace totals as an additional asset.

Crypto market prices and activity are manual. This workspace makes no blockchain, wallet, exchange, or price-provider requests.
