# ApexPOS — Frontend & Backend Full Implementation Plan

> Focused on application code only (no DevOps/Cloud).
> Stack: React 19 + Vite + Zustand · Node/Express · MongoDB · Socket.IO

## Legend
- ✅ Built & working  ⚠️ Partially built  ❌ Missing

## Module Status

| Module | Backend | Frontend |
|---|---|---|
| Authentication & Session | ⚠️ | ⚠️ |
| Dashboard & Analytics | ✅ | ⚠️ |
| Retail POS (Checkout) | ✅ | ⚠️ |
| Inventory Management | ⚠️ | ⚠️ |
| Sales History | ⚠️ | ⚠️ |
| Hospitality (Tables + KDS) | ⚠️ | ⚠️ |
| Repair Management | ✅ | ⚠️ |
| Delivery Tracking | ✅ | ⚠️ |
| Hire Purchase (HP) | ✅ | ⚠️ |
| Trade-In | ⚠️ | ⚠️ |
| Staff Management | ⚠️ | ⚠️ |
| Customer & Loyalty | ⚠️ | ⚠️ |
| Expenses | ✅ | ✅ |
| Reports | ⚠️ | ⚠️ |
| Notifications | ✅ | ✅ |
| Settings | ✅ | ⚠️ |
| Shift Management | ✅ | ❌ |
| Smart Inventory | ❌ | ⚠️ |
| Repair Liability | ⚠️ | ⚠️ |

---

## 1. Authentication & Session

### Backend Missing
- [ ] `POST /api/auth/refresh` — JWT refresh token
- [ ] `PATCH /api/auth/change-password` — self-service
- [ ] PIN lockout: 5 fails → lock 15 min (schema fields exist: `failed_pin_attempts`, `pin_locked_until`)
- [ ] Enforce lockout check in `pinLogin` controller

### Frontend Missing
- [ ] PIN numpad mode on `Login.tsx` (toggle email ↔ PIN)
- [ ] Auto-logout on 401 response (axios interceptor → clear store → redirect `/login`)
- [ ] Show current user name + role in sidebar header
- [ ] Shift open prompt immediately after mode selection

---

## 2. Dashboard & Analytics

### Backend Missing
- [ ] `getDashboardStats` — use `grandTotal` (not `totalAmount`) in revenue sums
- [ ] `GET /api/dashboard/top-products` — top 10 by qty sold this month

### Frontend Missing
- [ ] Wire all 3 API calls in `Dashboard.tsx` (replace all mock data)
- [ ] Recharts `<AreaChart>` for 7-day sales trend (data from `getSalesTrend`)
- [ ] Recharts `<PieChart>` for brand/category breakdown
- [ ] Low stock alert cards with names + stock counts
- [ ] Recent activity feed (sales, repairs, stock movements)
- [ ] Listen to `dashboardUpdate` socket → auto-refresh stats

---

## 3. Retail POS

### Backend Missing
- [ ] `branchId` from JWT token (not from request body)
- [ ] `POST /api/sales/:id/refund` — partial/full refund + stock `IN` movement
- [ ] `POST /api/sales/:id/void` — void sale (manager role only)

### Frontend Missing
- [ ] Barcode scan: hidden input field, Enter → search product by barcode
- [ ] Product search by name or barcode
- [ ] Cart: qty increment/decrement, remove item, clear all
- [ ] Payment modal: Cash / Card / LankaQR split payment + change calculator
- [ ] Customer lookup by phone → attach to sale for loyalty
- [ ] Loyalty discount field (deduct from customer points)
- [ ] Discount: flat amount or % toggle
- [ ] VAT + SSCL breakdown in cart before checkout
- [ ] Receipt print: `<ReceiptTemplate>` with `react-to-print`
- [ ] Receipt fields: business name, cashier, date/time, items, taxes, total, payment, change
- [ ] "Hold Sale" — save cart to `sessionStorage`, restore on return
- [ ] Weight-based item (kg input instead of integer qty)

---

## 4. Inventory Management

### Backend Missing
- [ ] `GET /api/products/:id` — single product
- [ ] `PUT /api/products/:id` — full update (name, price, minStock, category, barcode)
- [ ] `DELETE /api/products/:id` — soft delete (set `isActive: false`)
- [ ] `GET /api/products?search=&category=&lowStock=true` — filtered list
- [ ] `GET /api/stock-movements?productId=&from=&to=` — movement history

### Frontend — Inventory.tsx Missing
- [ ] Product table: search bar + filter by category + business type tabs
- [ ] Add/Edit product modal: all fields (name, price, costPrice, stock, minStock, barcode, brand, category)
- [ ] Inline stock adjustment (+/−) with reason input
- [ ] Low stock badge (red when `stock ≤ minStock`)
- [ ] Batch tab: add batch (batchNumber, expiryDate, quantity)
- [ ] Stock movement history drawer per product

### SmartInventory.tsx Missing
- [ ] Stock movement log table with IN/OUT/ADJUSTMENT type badges
- [ ] Reorder list: products where `stock ≤ minStock`
- [ ] Expiry warning list from `GET /api/products/check-expiries`

---

## 5. Sales History

### Backend Missing
- [ ] `GET /api/sales?from=&to=&cashier=&paymentStatus=` — date + filter params
- [ ] `GET /api/sales/:id` — single sale with all items

### Frontend Missing
- [ ] Date range picker filter
- [ ] Filter by cashier, payment method, status
- [ ] Sale detail modal: items, payments, VAT, SSCL, totals
- [ ] Re-print receipt from history
- [ ] Export to CSV

---

## 6. Hospitality Module

### Backend Missing
- [ ] `DELETE /api/hospitality/tables/:id`
- [ ] `PATCH /api/hospitality/orders/:id/item-status` — mark item Served/Cancelled
- [ ] `GET /api/hospitality/orders/history?from=&to=` — paid orders
- [ ] On `closeOrderAndBill` → deduct product stock + create a `Sale` record
- [ ] Socket emit `order:update` with full order object (not just string event)

### Frontend — TableManagement.tsx Missing
- [ ] Visual table grid: color-coded (green=Available, red=Occupied, amber=Bill Requested)
- [ ] Click table → order panel slides in: add menu items, send to KDS
- [ ] Add items to existing active order
- [ ] "Request Bill" button → status change + bill summary
- [ ] Table editor: add/remove/rename tables

### Frontend — KitchenDisplay.tsx Missing
- [ ] Listen to `kdsUpdate` socket → auto-refresh without page reload
- [ ] Active orders grouped by table, oldest first
- [ ] Item status toggles: Pending → Sent → Served
- [ ] KOT print button per order
- [ ] Audio chime on new order

### Frontend — TableTurnaround.tsx Missing
- [ ] Backend: aggregate avg time `Occupied → Available` per table
- [ ] Recharts `<BarChart>` of turnaround times per table

---

## 7. Repair Management

### Backend Missing
- [ ] `PATCH /api/repairs/:id/status` — status update + socket emit
- [ ] `GET /api/repairs?status=&from=&to=` — filtered list
- [ ] `technicianId` (Staff ref) field in schema + controller

### Frontend — RepairManagement.tsx Missing
- [ ] Status filter tabs: Pending / In Progress / Completed / Cancelled
- [ ] Assign technician dropdown (from staff API)
- [ ] Search by customer name, phone, IMEI
- [ ] Job detail modal with all fields

### Frontend — AddJob.tsx Missing
- [ ] Complete form: device model, IMEI, issue, estimated cost, technician
- [ ] Submit → `POST /api/repairs` → redirect to repair list
- [ ] Print job card / work order

### Frontend — RepairLiability.tsx Missing
- [ ] Canvas damage diagram (phone front/back) — click to mark damage points
- [ ] Customer signature pad (`react-signature-canvas`)
- [ ] Save → `POST /api/liability`
- [ ] Print/export PDF

---

## 8. Delivery Tracking

### Backend Missing
- [ ] `PATCH /api/deliveries/:id/status` with socket emit `delivery:update`
- [ ] `GET /api/deliveries?status=&from=&to=` — filtered
- [ ] Driver assignment: `driverId` field (Staff ref)

### Frontend Missing
- [ ] Status board columns: Pending / In Transit / Delivered / Cancelled
- [ ] Drag card to update status (or status dropdown on card)
- [ ] Create delivery modal: customer, address, items, driver
- [ ] Google Maps link from address
- [ ] Filter by driver, status, date

---

## 9. Hire Purchase (HP)

### Backend Missing
- [ ] `POST /api/hp/:id/pay` — mark installment paid, recalculate balance
- [ ] `GET /api/hp?status=&search=` — filter + search
- [ ] Overdue detection: return `isOverdue: true` on installments past due date

### Frontend Missing
- [ ] HP list with search by name/NIC
- [ ] Status badges: Active / Overdue / Completed
- [ ] Installment schedule table: due date, amount, paid toggle
- [ ] "Mark Paid" per installment → calls pay endpoint
- [ ] Outstanding balance prominently displayed
- [ ] Print HP agreement / schedule

---

## 10. Trade-In

### Backend Missing
- [ ] `PATCH /api/tradeins/:id/accept` — accept + generate store credit
- [ ] `PATCH /api/tradeins/:id/cancel`
- [ ] Valuation scoring logic based on condition

### Frontend Missing
- [ ] Device brand/model selector (searchable)
- [ ] Condition checklist (screen, battery, body) → auto-score
- [ ] Estimated value based on score
- [ ] Accept / Reject with notes
- [ ] Trade-in credit applies as discount on next POS sale

---

## 11. Staff Management

### Backend Missing (staffController.js created ✅)
- [ ] `GET /api/staff?search=` — search by name/email

### Frontend — StaffManagement.tsx Missing
- [ ] Staff table: name, role, branch, status, join date
- [ ] Add staff modal: all fields + password + PIN
- [ ] Edit staff details + role + salary
- [ ] Deactivate / Reactivate toggle
- [ ] Reset PIN button → prompt new 4-digit PIN
- [ ] Monthly payroll total card

---

## 12. Customer & Loyalty

### Backend (customerController.js created ✅)
- [ ] `GET /api/customers/:id/purchase-history` — customer's past sales
- [ ] Tier logic: Bronze (<5000 pts) / Silver (5k–20k) / Gold (20k+)

### Frontend — LoyaltyProgram.tsx Missing
- [ ] Customer search by phone at top
- [ ] Customer card: name, phone, points balance, tier badge
- [ ] Points history (purchases + redemptions)
- [ ] Manual adjustment (admin only)
- [ ] Tier progress bar
- [ ] Register new customer inline

---

## 13. Reports

### Backend Missing
- [ ] All endpoints: add `?from=&to=` date range filters
- [ ] `GET /api/reports/cashier-summary` — sales grouped by cashier
- [ ] `GET /api/reports/payment-methods` — totals by Cash/Card/QR
- [ ] Returns report implementation (currently returns `[]`)

### Frontend — Reports.tsx Missing
- [ ] Tab nav: Sales / Stock / Expenses / Tax / Salary / Repairs / HP Collection
- [ ] Date range picker on every tab
- [ ] Recharts chart per report type
- [ ] Export to PDF (`window.print()` on styled print view)
- [ ] Export to CSV (build CSV string → download)
- [ ] Tax summary: quarterly VAT + SSCL table for IRD filing

---

## 14. Settings

### Frontend — Settings.tsx Missing
- [ ] Wire all fields to `GET /api/settings` on load
- [ ] Save → `PUT /api/settings`
- [ ] VAT toggle + rate slider
- [ ] SSCL toggle + rate + retail ratio
- [ ] Business name + TIN number + currency
- [ ] Receipt header/footer custom text
- [ ] Paper width selector (58mm / 80mm)
- [ ] Language selector → `i18next.changeLanguage()`

---

## 15. Shift Management (Frontend — Entire Feature Missing)

- [ ] On login → `GET /api/shifts/current?cashierId=` → if no open shift, show modal
- [ ] "Open Shift" modal: enter opening float → `POST /api/shifts/open`
- [ ] Active shift indicator in sidebar (start time + float)
- [ ] "Close Shift" button → "Enter actual cash" modal → `POST /api/shifts/:id/close`
- [ ] Shift summary screen: expected vs actual, variance
- [ ] Shift history table (manager only)

---

## 16. Real-Time Sockets — Full Event Map

### Backend: emit these events
| Event | Trigger | Payload |
|---|---|---|
| `dashboardUpdate` | Every sale, stock change | `{}` |
| `notificationUpdate` | Low stock / expiry alert | `{}` |
| `kdsUpdate` | Order create/update | `{ orderId }` |
| `order:update` | Item status change | full order object |
| `delivery:update` | Delivery status change | `{ delivery }` |
| `sale:new` | Sale created | `{ branchId, total }` |
| `inventory:update` | Refill / adjustment | `{ productId, newStock }` |

### Frontend: subscribe in useStore.ts
```ts
socket.on('dashboardUpdate', () => fetchDashboardStats());
socket.on('notificationUpdate', () => fetchNotifications());
socket.on('kdsUpdate', () => fetchActiveOrders());
socket.on('order:update', (order) => updateOrderInState(order));
socket.on('inventory:update', ({ productId, newStock }) => updateProductStock(productId, newStock));
```

---

## 17. Global Frontend Architecture

### API Layer — create `client/src/api/`
- [ ] `axiosInstance.ts` — baseURL from `VITE_API_URL`, JWT header, 401 interceptor
- [ ] `authApi.ts`, `productsApi.ts`, `salesApi.ts`, `staffApi.ts`
- [ ] `customersApi.ts`, `reportsApi.ts`, `shiftsApi.ts`

### New Components — create `client/src/components/`
- [ ] `pos/ReceiptTemplate.tsx` — print-ready layout
- [ ] `pos/PaymentModal.tsx` — split payment entry + change calc
- [ ] `pos/CartPanel.tsx` — cart items + totals
- [ ] `common/ConfirmDialog.tsx` — destructive action confirm
- [ ] `common/Toast.tsx` — success/error notifications
- [ ] `common/LoadingSkeleton.tsx` — table loading states
- [ ] `common/DateRangePicker.tsx` — from/to date filter
- [ ] `shift/OpenShiftModal.tsx`
- [ ] `shift/CloseShiftModal.tsx`
- [ ] `shift/ShiftIndicator.tsx` — sidebar indicator

### Zustand Store Slices — add to `useStore.ts`
- [ ] `currentShift` — active shift data
- [ ] `customer` — POS selected customer
- [ ] `notifications` — unread count + list
- [ ] `settings` — global settings fetched on app load
- [ ] `socket` — single shared Socket.IO connection

### UI Polish
- [ ] Consistent loading skeletons on all data tables
- [ ] Empty state illustrations when no data
- [ ] Confirm dialog before delete/void/deactivate
- [ ] Keyboard shortcuts: F2=search, F8=POS, Esc=close modal
- [ ] Complete dark/light CSS variable system in `index.css`
- [ ] Persist theme in `localStorage`

---

## Recommended Implementation Order

| Week | Focus |
|---|---|
| 1 | Auth flow + Shift Management frontend |
| 2 | Retail POS — barcode, cart, payment modal, receipt print |
| 3 | Inventory — CRUD, stock movement, low stock UI |
| 4 | Hospitality — table grid, order panel, KDS real-time |
| 5 | Staff + Customer + Loyalty |
| 6 | Repairs + Delivery + HP + Trade-In |
| 7 | Reports (all types + export) + Settings |
| 8 | Real-time sockets, toasts, keyboard shortcuts, polish |

