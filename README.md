# HOORIYA ARTS — POS & Store Management System

> **HOORIYA ARTS: complete MERN stack retail POS & store operations software**  
> Designed according to Software Requirements Specification (SRS) Version 1.0 for physical retail clothing stores.

---

## 🌟 Key Modules & Features

1. **Role-Based Access Control (RBAC)**:
   - **Super Admin / Owner**: Complete control over users, settings, finance, inventory, reports, audit logs, and backups.
   - **Manager**: Operations, products, purchases, stock receiving, customer balances, and reports.
   - **Cashier**: POS high-speed checkout, customer lookup, cash register shifts, invoices, and permitted returns.
   - **Store Keeper**: Variant catalog, warehouse receiving, stock adjustments, and movements.

2. **Clothing Variant Architecture**:
   - Clothing items managed at **Variant Level** (Size + Color combinations).
   - Independent SKU, Barcode, Cost Price, Sale Price, and Stock Quantity for each variant.
   - Prevents stock confusion across sizes (S, M, L, XL, XXL, 30, 32, 34, 36) and colors.

3. **High-Speed Point of Sale (POS)**:
   - Barcode scanner input and live keyword search.
   - Instant cart additions with out-of-stock guards.
   - Flat PKR or percentage discount calculation.
   - Multi-payment support: Cash, Credit/Debit Card, Bank Transfer, Easypaisa, JazzCash.
   - Change calculation and customer credit tracking.
   - Print-ready **80mm Thermal Receipt** and **A4 Sales Invoice** modal.

4. **Sales Returns & Exchanges**:
   - Fast lookup by invoice number.
   - Saleable vs Damaged disposition (Saleable restocks to inventory; Damaged is tracked separately).
   - Size/Color replacement exchange with automated price difference calculation.

5. **Cash Register & Shift Reconciliation**:
   - Shift opening with drawer cash float.
   - Live shift calculation: Opening Cash + Cash Sales - Cash Refunds - Cash Expenses = Expected Cash.
   - Shift closing with physical cash count and shortage/overage calculation.

6. **Procurement & Inventory Traceability**:
   - Supplier purchase orders with automatic stock increments.
   - Supplier ledger and balance payments.
   - Manual stock adjustments (+ / - / Set Exact) with mandatory audit reasons.
   - Complete historical log of all stock movements.
   - Low-stock and out-of-stock real-time alerts.

7. **Financials, Expenses, Profit & Loss and Trend Charts**:
   - Line charts on the Dashboard (sales, gross profit, expenses and bills over 7/14/30 days).
   - Reports page line charts for net sales, gross profit, expenses and net profit, daily or monthly, for any date range.
   - Operational expense tracking across 10 categories.
   - Comprehensive Profit & Loss statement:
     - Gross Sales − Customer Returns = **Net Sales**
     - Net Sales − Cost of Goods Sold (COGS) = **Gross Profit**
     - Gross Profit − Operating Expenses = **Net Profit**

8. **Audit Trail & System Backup**:
   - Security audit logging for logins, stock changes, voids, and price adjustments.
   - One-click full JSON database export and backup.

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js** (v18+)
- **MongoDB** (running locally on `mongodb://localhost:27017` or configured via `.env`)

### 1. Database Seeding (Pre-loaded with apparel, suppliers, customers & users)
```bash
cd server
npm run seed
```

### 2. Run the Backend Server
```bash
cd server
npm start
# Server runs on http://localhost:5000
```

### 3. Run the Frontend Client
```bash
cd client
npm run dev
# Frontend runs on http://localhost:3000
```

---

## 🔑 Default Login Credentials

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@hooriyaarts.com` | `admin123` | Full Access (Owner) |
| **Manager** | `manager@hooriyaarts.com` | `manager123` | Operations & Reports |
| **Cashier** | `cashier@hooriyaarts.com` | `cashier123` | POS Billing & Register |
| **Store Keeper** | `storekeeper@hooriyaarts.com` | `store123` | Inventory & Receiving |

*(The login page includes 1-click test login buttons for quick access to each role!)*
