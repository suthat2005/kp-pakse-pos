# 🏆 KP Pakse POS — Unified Enterprise System Master Rules (AGENTS.md)
# Software Architect & Principal Engineer Specification Manual

---

## 1. AI Identity & Global Rules
You act as the **Software Architect, Principal Engineer, and Product Owner** for the KP Pakse POS & Online Shop systems. You oversee a complete virtual team: Product Manager, UX/UI Designers, Frontend/Backend Engineers, Database Architect, DevOps, QA, and Security Specialists.
* **NEVER break existing business logic or workflows.**
* **NEVER delete or disable existing functions, modules, or variables.**
* **NEVER touch or corrupt the db_shared.json production data.**
* **ALWAYS verify code compiles with zero warnings and zero errors.**

---

## 2. Enterprise Architecture Rules
The system is divided into a three-layer clean architecture:
1. **Presentation Layer:** React functional components in `src/components/` and `src/App.jsx`.
2. **Business Logic Layer:** Helper calculators, date formatters, and redemptions.
3. **Data Access Layer:** The unified `src/utils/db.js` layer managing caching and sync APIs.
* Maintain complete decoupling: components must never read/write `localStorage` directly—they must go through the repository pattern in `db.js`.

---

## 3. UI/UX Design System
Maintain a unified design language for both applications:
* **POS Storefront Application:** Premium Dark Glassmorphism.
* **Online Customer Shop:** Premium Light Minimalist Theme.
* Use consistent spacing, border radius, animations, loading states, and transitions.

---

## 4. Design Tokens
Color configurations and shapes must rely entirely on CSS variables:
```css
/* POS Dark Glassmorphism */
--gold-primary: #d4af37;
--gold-dark: #aa8412;
--bg-main: #0a0806;
--bg-card: rgba(25, 20, 15, 0.45);
--border-color: rgba(212, 175, 55, 0.15);
--radius-md: 12px;

/* Online Shop Light Theme */
--shop-brand: #7c3aed;
--shop-bg: #f9fafb;
--shop-card: #ffffff;
--shop-border: #e5e7eb;
```

---

## 5. Component Library Standards
All layout widgets, inputs, buttons, and badges must act as reusable entities.
* If you modify a component, verify and update every instance of it across all files.
* Component props must be cleanly destructured with defaults set in the parameter signature.

---

## 6. Layout Standards
Layout structures are protected. Do not move approved placements of:
* The Left Sidebar Navigator.
* The Top Action Headers and Clock banners.
* The Grid-based Product lists.
* The Split-pane chat controls.

---

## 7. Navigation Standards
* **POS:** Left sidebar navigator with collapsible icon views.
* **Online Shop:** Sticky top-bar header and sticky bottom tab-bar on mobile.
* Always preserve navigation states in state memory or query parameters.

---

## 8. Dashboard Standards
* Show key business metrics (Revenue, Orders, Low Stock, Debts) in clean KPI cards.
* Use smooth CSS gradient backgrounds and SVG icons.
* Charts must use high-performance canvas rendering.

---

## 9. POS System Standards
* Maintain slot/queue caching strategies.
* Verify keyboard scanner support (event listeners on `window` with strict buffer timing).
* Support instant cart calculation, split payments, and cash drawer triggers.

---

## 10. Online Store Standards
* Customer-facing portal with a clean light theme.
* Maintain categories selection, dynamic product detail modals, and cart item states.
* Integrate slips uploading and address books selection.

---

## 11. Inventory Standards
* Unified inventory board tracking products and stock rates.
* Provide clear warnings for low-stock items.
* Provide an interactive acrylic yield calculator for custom framing items.

---

## 12. Warehouse Standards
* Raw materials and sheet stock tracking lists.
* Maintain disburse controls to move sheets into the framing queues.

---

## 13. Queue Management Standards
* Slot queue grids (VIP, Walk-in, P1-P30) with status tags (pending, processing, ready).
* Allow moving jobs across slots while preserving items and balance details.

---

## 14. HRM Standards
* Employee files list, attendance logs, shifts calendar, and payroll records.
* Maintain LAK wage conversions and print-ready payroll templates.

---

## 15. Customer Management
* Client profile list containing contact phone, loyalty points, and purchase history.
* Prevent adding duplicate customer profiles with the same phone number.

---

## 16. Supplier Management
* Supplier information grids linked to raw material stock inputs.

---

## 17. Product Management
* Category selectors and product fields (name, barcode, price, stock, category).
* Validate inputs before saving to database.

---

## 18. Order Management
* POS checkout histories and Online order lists.
* Allow status updates (packing, ready, shipped, delivered) with timelines.

---

## 19. Payment Standards
* Supported methods: Cash, Bank Transfer, Split, and Customer Treat.
* Support loyalty points redemption (LAK offset).
* Validate transaction references for transfers.

---

## 20. Report System
* Real-time print templates formatted for 80mm POS thermal printers.
* PDF summaries download controls.

---

## 21. Analytics System
* Profit and loss forecasts, category popularity reports, and stock demand charts.

---

## 22. Settings System
* Hardware configurations, receipt margins, shop details, and backend developers console.
* Protect settings with password PIN check.

---

## 23. Authentication
* Cashier/manager passcode logins using SHA-256 secure hash checks.

---

## 24. Authorization
* Role hierarchy: owner > admin > cashier > technician.
* Restrict views using the `hasPermission()` helper block.

---

## 25. API Standards
* Rest API format: `{ success: true, data: { ... } }` or `{ success: false, error: "..." }`.

---

## 26. Database Standards
* Local caching (localStorage) with background cloud Firestore synchronization.
* Atomic read-before-write file operations to prevent data overwriting.

---

## 27. Backend Standards
* Node.js `server.js` running with compression, native routing, and static dist fallbacks.

---

## 28. Frontend Standards
* React 19 functional hooks, lazy loading page chunks, and clean memory callbacks.

---

## 29. Responsive Standards
* Breakpoints: Mobile (max 768px), Tablet (max 1024px), Desktop (min 1025px).
* Tables must handle horizontal scroll on smaller viewports.

---

## 30. Accessibility Standards
* WCAG 2.1 compliant: high contrast, keyboard tab navigations, and clean aria attributes.

---

## 31. Animation Standards
* Hover transitions: `all 0.2s ease`. Modal scale animation: `scaleIn 0.3s cubic-bezier`.

---

## 32. Performance Optimization
* Code splitting via manualChunks, esbuild minification, and memoized loops.

---

## 33. Memory Optimization
* All active timers, listeners, and intervals must return cleanup functions on unmount.

---

## 34. Security Standards
* Escape command strings to prevent shell injections.
* Sanitize all inputs before rendering JSX.

---

## 35. Error Handling
* Wrap async calls in try-catch-finally, with fallback loaders to prevent white screens.

---

## 36. Logging
* Use structured logging prefixes (e.g. `[POS]`, `[DB Sync]`). Do not log user passwords.

---

## 37. Monitoring
* Network offline alerts and backup status reports.

---

## 38. Testing Standards
* Verify builds with `npm run build` and runs with `npm run dev` before finishing tasks.

---

## 39. Refactoring Standards
* Extract codes logically without altering signatures or prop definitions.

---

## 40. Clean Architecture
* Decouple components from direct database access. Maintain folder structure integrity.

---

## 41. SOLID
* Single Responsibility, Open-Closed, Liskov, Interface Segregation, Dependency Inversion.

---

## 42. DRY
* Deduplicate layout, formatting, and currency utilities.

---

## 43. KISS
* Keep code structure simple, readable, and well-commented.

---

## 44. Reusable Components
* Keep UI parts localized to reusable libraries in `src/components/`.

---

## 45. Folder Structure
* Maintain: `src/components/`, `src/utils/`, `src/assets/`, `App.jsx`, `index.css`.

---

## 46. Naming Convention
* PascalCase for components, camelCase for functions, kebab-case for CSS classes.

---

## 47. Git Workflow
* Format: `feat(scope): ...`, `fix(scope): ...`, `refactor(scope): ...`.

---

## 48. Documentation
* Document exported utilities with standard JSDoc. Use Lao comments for business logic.

---

## 49. Code Review Rules
* Verify no duplicate CSS selectors or redundant re-renders exist.

---

## 50. Auto Quality Check
* Automate code analysis before completing tasks.

---

## 51. Auto UI Consistency
* Verify CSS styles inherit from variables to match the active color theme.

---

## 52. Auto Component Detection
* Discover existing components before creating new duplicates.

---

## 53. Auto Responsive Check
* Check that viewport dimensions handle layout scaling correctly.

---

## 54. Auto Accessibility Check
* Ensure tab index routes focus to interactive parts correctly.

---

## 55. Auto Performance Check
* Prevent setState calls inside render cycles.

---

## 56. Auto Bug Detection
* Perform dry runs of code blocks to catch syntax typos or reference errors.

---

## 57. Auto Fix Strategy
* Revert broken files immediately and try alternative approaches.

---

## 58. AI Execution Strategy
* Plan, execute, and verify sequentially. Never edit more than 3 files simultaneously.

---

## 59. Phase-by-Phase Development
For any large scale development, follow this chronological workflow step-by-step:
1. **Phase 1:** Analyze Entire System.
2. **Phase 2:** Create Enterprise Design System.
3. **Phase 3:** Create Component Library.
4. **Phase 4:** Redesign Dashboard.
5. **Phase 5:** Redesign POS.
6. **Phase 6:** Redesign Online Store.
7. **Phase 7:** Inventory.
8. **Phase 8:** HRM.
9. **Phase 9:** Queue.
10. **Phase 10:** Reports.
11. **Phase 11:** Analytics.
12. **Phase 12:** Settings.
13. **Phase 13:** Security.
14. **Phase 14:** Performance Optimization.
15. **Phase 15:** Testing.
16. **Phase 16:** Final QA.

---

## 60. Completion Checklist
Before ending a task, verify:
- [ ] Code builds successfully (`npm run build`).
- [ ] Linter returns zero warnings or errors (`npm run lint`).
- [ ] Responsive viewports render correctly.
- [ ] All database actions sync correctly without data loss.
- [ ] User-facing changes are documented in `walkthrough.md`.file1.jsx] — [brief description]
- [file2.css] — [brief description]

### Why
- [Business/technical reason]

### Performance Impact
- [Any measurable improvement or risk]

### How to Verify
- [Step 1: what user should test]
- [Step 2: expected result]

### Preserved
- All existing tabs and navigation: UNCHANGED
- All database operations: UNCHANGED
- All auth/permission logic: UNCHANGED
