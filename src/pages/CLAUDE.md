# React Pages

## Structure Pattern
```jsx
export default function XxxPage() {
  const { user, hasRole } = useAuth();
  const [data, setData] = useState([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const result = await window.api.getXxx();
    setData(result);
  };

  return (
    <div className="p-6">
      {/* Page content */}
      {showModal && <Modal onClose={() => setShowModal(false)} />}
    </div>
  );
}
```

## Pages
- `CashierPage` - POS transaction
- `ProductsPage` - Product CRUD + stock audit
- `TransactionsPage` - History + payment tracking
- `DebtManagementPage` - Piutang management
- `ReportsPage` - Sales & profit reports
- `SettingsPage` - App settings + receipt template
- `DashboardPage` - Stats overview
- `DatabasePage` - Backup, maintenance
- `UsersPage` - User management
- `LoginPage` - Authentication

## Role Protection
```jsx
// App.jsx
<Route element={<ProtectedRoute roles={['admin']} />}>
```
