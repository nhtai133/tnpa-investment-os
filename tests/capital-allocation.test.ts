import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createClient } from '@libsql/client/sqlite3';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from '../src/db/schema';
import { initializeSchema } from '../src/db/initialize';
import { buildPortfolioSummary } from '../src/lib/portfolio-model';
import { computeCapitalAllocation, policyState, validateAssignments, validatePolicy } from '../src/lib/capital-allocation';
import { saveCapitalAssignments, savePurpose, resetPolicyTemplate, setBrokerArchived, visibleBrokers } from '../src/lib/capital-store';
import { readBackup, restoreBackup } from '../src/lib/backup';
const now = '2026-01-01T00:00:00Z';
async function fixture(old = false) {
 const dir=mkdtempSync(join(tmpdir(),'tnpa-v24-fixture-'));const client=createClient({url:'file:'+join(dir,'fixture.db')});
 if(old) { const sql=execFileSync('git',['show','v2.3-personal-wealth-mvp:src/db/migrations/0001_baseline.sql'],{encoding:'utf8'});await client.executeMultiple(sql);await client.execute('ALTER TABLE account_registry ADD COLUMN bank_account_id INTEGER REFERENCES bank_accounts(id)');await client.execute('ALTER TABLE assets ADD COLUMN cash_source_type TEXT');await client.execute('ALTER TABLE assets ADD COLUMN cash_source_id INTEGER'); }
 else await initializeSchema(client);
 const database=drizzle(client,{schema});
 return {client,database,close(){client.close();rmSync(dir,{recursive:true,force:true});}};
}
async function portfolio(database: ReturnType<typeof drizzle<typeof schema>>) {
 const [legacyAssets,accounts,deposits,creditCards,creditFacilities,registry]=await Promise.all([database.select().from(schema.assets),database.select().from(schema.bankAccounts),database.select().from(schema.bankSavingsDeposits),database.select().from(schema.bankCreditCards),database.select().from(schema.bankCreditFacilities),database.select().from(schema.accountRegistry)]);
 return buildPortfolioSummary({usdVndRate:25000,legacyAssets,accounts,deposits,creditCards,creditFacilities,registry});
}
async function addAsset(database: ReturnType<typeof drizzle<typeof schema>>, name:string,cls: schema.AssetClass,value:number) {
 return (await database.insert(schema.assets).values({name,asset_class:cls,purpose:'wealth_compounder',current_value:value,currency:'VND',quantity:10,cost_basis:value,created_at:now,updated_at:now}).returning())[0];
}
test('policy bounds, target sum and inactive behavior',async()=>{
 const f=await fixture();try {const p=await f.database.select().from(schema.capitalPurposes);assert.equal(policyState(p).complete,true);
 for(const patch of [{min_percent:-1},{max_percent:101},{target_percent:NaN},{min_percent:50},{target_percent:101}]) assert.throws(()=>validatePolicy({...p[0],...patch}));
 assert.equal(policyState(p.map((x,i)=>i?x:{...x,is_active:false})).complete,false);
 assert.throws(()=>validateAssignments([{purpose_id:p[0].id,allocation_percent:101}],p));assert.throws(()=>validateAssignments([{purpose_id:p[0].id,allocation_percent:50},{purpose_id:p[0].id,allocation_percent:50}],p));
 assert.throws(()=>validateAssignments([{purpose_id:p[0].id,allocation_percent:10}],p.map(x=>({...x,is_active:false}))));
 }finally{f.close();}
});
test('VAR A/B/C and coverage: canonical sources, 12B total, split, partial, no economic mutation',async()=>{
 const f=await fixture();try {
 const d=f.database;const [bank]=await d.insert(schema.bankAccounts).values({bank_name:'Synthetic Bank',account_name:'Fixture liquid',balance:2e9,currency:'VND',created_at:now,updated_at:now}).returning();
 const [deposit]=await d.insert(schema.bankSavingsDeposits).values({deposit_name:'Synthetic deposit',principal:3.5e9,created_at:now,updated_at:now}).returning();
 const [broker]=await d.insert(schema.accountRegistry).values({name:'Synthetic broker',type:'broker_account',currency:'VND',current_balance:0.2e9,created_at:now,updated_at:now}).returning();
 await d.insert(schema.accountRegistry).values({name:'Synthetic stablecoin cash',type:'crypto_exchange',currency:'VND',current_balance:0.5e9,created_at:now,updated_at:now});
 await d.insert(schema.accountRegistry).values({name:'Linked duplicate view',type:'bank_account',bank_account_id:bank.id,current_balance:2e9,created_at:now,updated_at:now});
 const stock=await addAsset(d,'Synthetic stock','stock',0.8e9);const crypto=await addAsset(d,'Synthetic crypto','crypto',2.5e9);await addAsset(d,'Synthetic gold','gold',0.5e9);await addAsset(d,'Synthetic land 100sqm','real_estate',2e9);
 await d.insert(schema.assetCustodyPositions).values([{asset_id:stock.id,custody_account_id:broker.id,quantity:4,cost_basis:4,updated_at:now},{asset_id:stock.id,custody_account_id:broker.id,quantity:6,cost_basis:6,updated_at:now},{asset_id:crypto.id,custody_account_id:broker.id,quantity:10,cost_basis:10,updated_at:now}]);
 const before=await readBackup(f.client);const initial=await portfolio(d);assert.equal(initial.totalNetWorth*25000,12e9);const purposes=await d.select().from(schema.capitalPurposes);
 for(const source of initial.assets) await saveCapitalAssignments(source.id,purposes.map(p=>({purpose_id:p.id,allocation_percent:p.target_percent})),d);
 let report=computeCapitalAllocation(await portfolio(d),purposes,await d.select().from(schema.capitalAllocations));assert.equal(report.unassigned,0);assert.equal(report.allocationScore,25);
 [1.2e9,3.6e9,4.2e9,1.2e9,1.2e9,.6e9].forEach((v,i)=>assert.ok(Math.abs(report.rows[i].currentValue-v)<1));assert.ok(Math.abs(report.rows.reduce((s,r)=>s+r.currentPercent,0)-100)<1e-7);
 await saveCapitalAssignments(`asset:${stock.id}`,[{purpose_id:purposes[0].id,allocation_percent:75}],d);
 report=computeCapitalAllocation(await portfolio(d),purposes,await d.select().from(schema.capitalAllocations));assert.equal(report.unassigned,.2e9);assert.equal(report.allocationScore,null);
 await saveCapitalAssignments(`savings-deposit:${deposit.id}`,[{purpose_id:purposes[0].id,allocation_percent:60},{purpose_id:purposes[1].id,allocation_percent:40}],d);
 await assert.rejects(saveCapitalAssignments(`savings-deposit:${deposit.id}`,[{purpose_id:purposes[0].id,allocation_percent:60},{purpose_id:purposes[1].id,allocation_percent:41}],d));
 await saveCapitalAssignments(`asset:${stock.id}`,[],d);const after=await readBackup(f.client);
 for(const name of ['assets','bank_accounts','bank_savings_deposits','account_registry','transactions','ledger_entries','asset_custody_positions']) assert.deepEqual(after[name],before[name]);
 assert.equal((await portfolio(d)).totalNetWorth,initial.totalNetWorth);
 // Funds/loans use the same canonical assets rather than a shadow portfolio.
 await addAsset(d,'Synthetic ETF','funds',100);await addAsset(d,'Synthetic receivable','private_loan',200);assert.equal(Math.round((await portfolio(d)).totalNetWorth*25000),12e9+300);
 }finally{f.close();}
});
test('VAR D: archive/restore preserves broker cash, holdings, history and Net Worth',async()=>{
 const f=await fixture();try {const d=f.database;const [broker]=await d.insert(schema.accountRegistry).values({name:'Synthetic archive broker',type:'broker_account',current_balance:100,created_at:now,updated_at:now}).returning();const asset=await addAsset(d,'Synthetic archive stock','stock',1000);await d.insert(schema.assetCustodyPositions).values({asset_id:asset.id,custody_account_id:broker.id,quantity:10,cost_basis:1000,updated_at:now});
 await d.insert(schema.transactions).values({type:'opening_position',asset_id:asset.id,custody_account_id:broker.id,amount:0,transaction_date:'2026-01-01',created_at:now,updated_at:now});
 const before=await readBackup(f.client);const value=(await portfolio(d)).totalNetWorth;
 await setBrokerArchived(broker.id,true,d);let brokers=await d.select().from(schema.accountRegistry);assert.equal(visibleBrokers(brokers).length,0);assert.equal(visibleBrokers(brokers,true).length,1);assert.equal((await portfolio(d)).totalNetWorth,value);
 await setBrokerArchived(broker.id,false,d);brokers=await d.select().from(schema.accountRegistry);assert.equal(visibleBrokers(brokers).length,1);assert.equal((await portfolio(d)).totalNetWorth,value);const after=await readBackup(f.client);for(const name of ['assets','transactions','asset_custody_positions','ledger_entries'])assert.deepEqual(after[name],before[name]);
 }finally{f.close();}
});
test('VAR E: actual v2.3 schema additive migration, no guessed classification, idempotent',async()=>{
 const f=await fixture(true);try {
 await f.client.execute({sql:'INSERT INTO assets(name,asset_class,purpose,current_value,currency,created_at,updated_at) VALUES (?,?,?,?,?,?,?)',args:['Synthetic migration asset','gold','store_of_value',123000,'VND',now,now]});
 const oldRows=(await f.client.execute('SELECT * FROM assets')).rows;await initializeSchema(f.client);await initializeSchema(f.client);
 assert.deepEqual((await f.client.execute('SELECT * FROM assets')).rows,oldRows);const p=await portfolio(f.database);assert.equal(p.totalNetWorth*25000,123000);assert.equal((await f.database.select().from(schema.capitalAllocations)).length,0);assert.equal((await f.database.select().from(schema.capitalPurposes)).length,0);assert.equal(computeCapitalAllocation(p,[],[]).unassigned,123000);assert.equal((await f.client.execute('PRAGMA integrity_check')).rows[0].integrity_check,'ok');
 }finally{f.close();}
});
test('policy archive/reset and v7 backup roundtrip retain classification; debts reconcile and bands do not punish target drift',async()=>{
 const f=await fixture();try {const d=f.database;const asset=await addAsset(d,'Synthetic debt-backed gold','gold',1000);await d.insert(schema.bankCreditCards).values({bank_name:'Synthetic',card_name:'Fixture',current_used:200,created_at:now,updated_at:now});const purposes=await d.select().from(schema.capitalPurposes);
 await saveCapitalAssignments(`asset:${asset.id}`,purposes.map(p=>({purpose_id:p.id,allocation_percent:p.target_percent})),d);let report=computeCapitalAllocation(await portfolio(d),purposes,await d.select().from(schema.capitalAllocations));assert.equal(report.denominator,800);assert.equal(report.rows.reduce((s,r)=>s+r.currentValue,0),800);assert.equal(report.allocationScore,25);
 await savePurpose(purposes[0].id,{...purposes[0],is_active:false},d);report=computeCapitalAllocation(await portfolio(d),await d.select().from(schema.capitalPurposes),await d.select().from(schema.capitalAllocations));assert.equal(report.allocationScore,null);assert.equal(report.rows[0].status,'inactive');await resetPolicyTemplate(d);
 const snapshot=await readBackup(f.client);await restoreBackup(f.client,snapshot,'REPLACE LOCAL DATA',()=>'/synthetic/backup');const restored=await readBackup(f.client);assert.deepEqual(restored.capital_allocations,snapshot.capital_allocations);assert.deepEqual(restored.capital_purposes,snapshot.capital_purposes);
 const drift=purposes.map((p,i)=>({...p,target_percent:p.target_percent+(i===0?1:i===1?-1:0)}));report=computeCapitalAllocation(await portfolio(d),drift,await d.select().from(schema.capitalAllocations));assert.equal(report.allocationScore,25);assert.equal(report.rows[0].gapPercent,1);assert.equal(report.rows[0].gapValue,8);
 }finally{f.close();}
});
test('non-positive wealth suppresses allocation score; excluded assets are explicit; corrupted backup is rejected',async()=>{
 const f=await fixture();try {const d=f.database;await addAsset(d,'Synthetic zero net','gold',100);await d.insert(schema.bankCreditCards).values({bank_name:'Synthetic',card_name:'Debt fixture',current_used:100,created_at:now,updated_at:now});await d.insert(schema.assets).values({name:'Synthetic excluded home',asset_class:'real_estate',purpose:'strategic_asset',current_value:500,currency:'VND',include_in_investment_net_worth:false,created_at:now,updated_at:now});
 const report=computeCapitalAllocation(await portfolio(d),await d.select().from(schema.capitalPurposes),[]);assert.equal(report.denominator,0);assert.equal(report.allocationScore,null);assert.equal(report.nonPositive,true);assert.equal(report.excluded.length,1);assert.equal(report.unassignedPercent,0);
 const snapshot=await readBackup(f.client);const corrupted={...snapshot,capital_allocations:[{id:1,source_type:'asset',source_id:99999,purpose_id:1,allocation_percent:150,note:null,created_at:now,updated_at:now}]};await assert.rejects(restoreBackup(f.client,corrupted,'REPLACE LOCAL DATA',()=>'/synthetic/backup'));assert.deepEqual((await readBackup(f.client)).assets,snapshot.assets);
 }finally{f.close();}
});
