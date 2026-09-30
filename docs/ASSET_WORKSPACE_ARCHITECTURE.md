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

Broker cash is the sum of that broker's `ledger_entries.amount` where `entry_type` is `cash_credit` or `cash_debit`. Cash-debit amounts are stored signed negative and cash-credit amounts signed positive. `account_registry.current_balance` is maintained as a compatibility/materialized projection by the existing lifecycle engine; the Stocks workspace does not use a separately editable balance as its live cash source. New broker accounts start at zero; opening cash is recorded as a deposit.

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
