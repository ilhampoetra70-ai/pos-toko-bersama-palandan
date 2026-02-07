# React Components

## Naming
- PascalCase: `PaymentModal.jsx`, `ProductCard.jsx`
- Suffix by type: `*Modal`, `*Card`, `*Chart`

## Props Pattern
```jsx
export default function ComponentName({ data, onAction, onClose }) {
  // Stateless or self-contained
  // Communicate up via callbacks
}
```

## Modal Structure
```jsx
<div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
    {/* Header, Body, Footer */}
  </div>
</div>
```

## Key Components
- `PaymentModal` - Payment flow + status selection
- `Cart` - Shopping cart display
- `BarcodeScanner` - Camera barcode reader
- `Sidebar` - Navigation menu
- `Layout` - Page wrapper with sidebar

## Charts (recharts)
Located in `charts/` subfolder. All use ResponsiveContainer.
