# Global Hillview Society Portal — Module Reference

## File Structure

```
hillview-portal/
├── index.html                   ← Entry point — loads all modules in order
├── styles.css                   ← All CSS: variables, dark mode, animations
├── utils.js                     ← Shared config, API client, hooks, helpers
├── LoginScreen-Dashboard.js     ← LoginScreen + Dashboard components
├── DirectoryPage.js             ← Staff directory page + edit modal
├── NoticesPage.js               ← Notices page + view/add/edit modals
├── IssuesPage.js                ← Issues page + view/edit/add modals
├── TransactionsPage.js          ← Transactions page + view/add/edit modals
├── DocumentsPage-TenantsPage.js ← Documents page + Tenants page (with modals)
├── Chatbot-GenericTable.js      ← AI chatbot widget + GenericTable fallback
└── App.js                       ← ChangePasswordModal + App shell + Boot
```

## Module Responsibilities

| File | What it contains |
|---|---|
| `styles.css` | CSS custom properties (light/dark themes), base element styles, dark mode overrides, status badges, animations |
| `utils.js` | `GAS` URL config, `INR` formatter, tower/flat config, `formatDateDisplay`, `driveDirectLink`, `ExcelExport`, `showToast`, `fetchWithTimeout`, `getJSON`, `postPlain`, `api` client, `maybeUploadField`, `useDarkMode` hook, `ThemeToggle`, `ExportButton` |
| `LoginScreen-Dashboard.js` | `LoginScreen` (sign-in form), `Dashboard` (stat cards + recent notices/issues) |
| `DirectoryPage.js` | `DirectoryPage` (filterable table with dept stats), `DirectoryModal` (add/edit employee with photo upload) |
| `NoticesPage.js` | `NoticesPage` (searchable table), `NoticeViewModal`, `NoticeModal` (add/edit with attachment) |
| `IssuesPage.js` | `IssuesPage` (status-filtered table), `IssueViewModal`, `IssueModal` (admin edit), `AddIssueModal` (resident report with tower/flat auto-detect) |
| `TransactionsPage.js` | `TransactionsPage` (income/expense filter + summary cards), `TransactionViewModal`, `TransactionModal` (with Chart of Accounts category dropdown) |
| `DocumentsPage-TenantsPage.js` | `DocumentsPage` + modals, `TenantsPage` (police verification filter) + `TenantViewModal` + `TenantModal` |
| `Chatbot-GenericTable.js` | `Chatbot` (AI assistant with local fallback), `GenericTable` (generic read-only table for Voters, OpeningBalances, ChartOfAccounts) |
| `App.js` | `ChangePasswordModal`, `App` (header, sidebar, routing, chatbot toggle), `Boot` (CORS test → renders App) |

## Load Order (index.html)

Scripts must be loaded in this order as each file depends on globals defined by the previous one:

```
utils.js  →  LoginScreen-Dashboard.js  →  DirectoryPage.js  →  NoticesPage.js
→  IssuesPage.js  →  TransactionsPage.js  →  DocumentsPage-TenantsPage.js
→  Chatbot-GenericTable.js  →  App.js
```

## Key Global Symbols (from utils.js)

All components rely on these globals exposed by `utils.js`:

- `GAS` — backend URL string
- `INR` — Indian Rupee formatter
- `TOWERS`, `generateFlatNumbers()` — tower/flat config
- `formatDateDisplay()` — date formatting utility
- `driveDirectLink()` — Google Drive thumbnail URL helper
- `ExcelExport` — XLSX export utility
- `showToast()` — toast notification helper
- `api` — full API client (login, sessionInfo, list.*, upsertRow, createRow, changePassword)
- `maybeUploadField()` — base64 → Drive file upload
- `postPlain()` / `getJSON()` — HTTP helpers
- `useDarkMode()` — React hook for theme state
- `ThemeToggle` — theme toggle button component
- `ExportButton` — Excel export button component

## Adding a New Page

1. Create `MyPage.js` following the same pattern as other page modules.
2. Add `<script type="text/babel" src="MyPage.js"></script>` to `index.html` before `App.js`.
3. Add a nav item in `App.js` inside the `navItems` array.
4. Add a route condition in the `App` return JSX (the long chain of `view === ...` conditionals).
5. Add a data fetch in `api.list` (utils.js) and call it inside `refreshData()` in App.js.
