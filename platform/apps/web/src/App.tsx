import { Routes, Route, NavLink } from 'react-router-dom';
import { APP_NAME } from '@kp-pakse/shared';

function Dashboard() {
  return (
    <div className="page">
      <h2>Dashboard</h2>
      <p>Overview of sales, inventory, and key KPIs.</p>
    </div>
  );
}

function POSPage() {
  return (
    <div className="page">
      <h2>POS</h2>
      <p>New point-of-sale interface will be built here.</p>
    </div>
  );
}

function InventoryPage() {
  return (
    <div className="page">
      <h2>Inventory</h2>
      <p>Stock, transfers, adjustments, and counts.</p>
    </div>
  );
}

function NotFound() {
  return <div className="page"><h2>404</h2><p>Page not found.</p></div>;
}

export default function App() {
  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">{APP_NAME}</div>
        <nav>
          <NavLink to="/" end>Dashboard</NavLink>
          <NavLink to="/pos">POS</NavLink>
          <NavLink to="/inventory">Inventory</NavLink>
          <NavLink to="/customers">Customers</NavLink>
          <NavLink to="/reports">Reports</NavLink>
          <NavLink to="/settings">Settings</NavLink>
        </nav>
      </aside>
      <main className="content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/pos" element={<POSPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/customers" element={<div className="page"><h2>Customers</h2></div>} />
          <Route path="/reports" element={<div className="page"><h2>Reports</h2></div>} />
          <Route path="/settings" element={<div className="page"><h2>Settings</h2></div>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}
