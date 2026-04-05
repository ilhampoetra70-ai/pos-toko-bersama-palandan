# UI Components Architecture Cache
*Generated for POS App*

This document serves as a comprehensive map of all UI components, their props, and relative purposes in the application to optimize AI reasoning overhead.


## Directory: `src/components`

### File: `AddPaymentModal.tsx`
- **<AddPaymentModal />** (Props: `{ transaction, onClose, onPaymentAdded }: AddPaymentModalProps`)
  - *Interfaces/Types:* 
    - `AddPaymentModalProps` { transaction: { id: number; invoice_number: string; customer_name?: string; remaining_balance: number; [key: string]: any; }

### File: `BarcodePreviewModal.tsx`
- **<BarcodePreviewModal />** (Props: `{ product, onClose }: BarcodePreviewModalProps`)
  - *Interfaces/Types:* 
    - `BarcodePreviewModalProps` { product: Product; onClose: () => void; }

### File: `BarcodeScanner.tsx`
- **<BarcodeScanner />** (Props: `{ onDetected, onClose }: BarcodeScannerProps`)
  - *Interfaces/Types:* 
    - `BarcodeScannerProps` { onDetected: (code: string) => void; onClose: () => void; }

### File: `BatchBarcodeModal.tsx`
- **<BatchBarcodeModal />** (Props: `{ products, onClose }: BatchBarcodeModalProps`)
  - *Interfaces/Types:* 
    - `BatchBarcodeModalProps` { products: Product[]; onClose: () => void; }

### File: `Cart.tsx`
- **<Cart />** (Props: `{ items, onUpdateQty, onRemove, onUpdateDiscount, lastAddedId }: CartProps`)
  - *Interfaces/Types:* 
    - `CartItem` { product_id: number; product_name: string; price: number; cost: number; quantity: number; discount: number; subtotal: number; unit: string; max_stock: number; }
    - `CartProps` { items: CartItem[]; onUpdateQty: (index: number, qty: number) => void; onRemove: (index: number) => void; onUpdateDiscount: (index: number, disc: number) => void; lastAddedId?: number | null; }

### File: `ExcelManager.tsx`
- **<ExcelManager />** (Props: `{ onClose }: ExcelManagerProps`)
  - *Interfaces/Types:* 
    - `ExcelManagerProps` { onClose: () => void; }
    - `ImportPreview` { fileName: string; newProducts: any[]; needBarcode: any[]; existingProducts: { name: string; reason: string }

### File: `Layout.tsx`
- **<Layout />** (Props: `*No props or implicit*`)

### File: `PaymentModal.tsx`
- **<PaymentModal />** (Props: `{ total, onConfirm, onClose, customerName, customerAddress }: PaymentModalProps`)
  - *Interfaces/Types:* 
    - `PaymentModalProps` { total: number; onConfirm: (data: any) => void; onClose: () => void; customerName?: string; customerAddress?: string; }

### File: `PlainReportPreviewModal.tsx`
- **<PlainReportPreviewModal />** (Props: `{ text, onClose, onPrint, onSave }: PlainReportPreviewModalProps`)
  - *Interfaces/Types:* 
    - `PlainReportPreviewModalProps` { text: string; onClose: () => void; onPrint?: () => void; onSave?: () => void; }

### File: `PrintConfigModal.tsx`
- **<PrintConfigModal />** (Props: `{    onClose,    onExportPdf,    onPrintText,    onSaveText,    getReportHtml,    getReportText,    includeStockTrail,    onToggleStockTrail}: PrintConfigModalProps`)
  - *Interfaces/Types:* 
    - `PrinterInfo` { name: string; }
    - `PrintConfigModalProps` { onClose: () => void; onExportPdf: () => Promise<boolean>; onPrintText: (printerName: string) => void; onSaveText: () => void; getReportHtml?: () => string | null; getReportText?: () => string | null; includeStockTrail: boolean; onToggleStockTrail: (v: boolean) => void; }

### File: `ProductCard.tsx`
- **<ProductCard />** (Props: `{ product, onClick, cartQty = 0 }: ProductCardProps`)
  - *Interfaces/Types:* 
    - `Product` { id: number; name: string; price: number; stock: number; unit?: string; category_id?: number; category_name?: string; }
    - `ProductCardProps` { product: Product; onClick: (product: Product) => void; cartQty?: number; }

### File: `ReceiptIframe.tsx`
- **<ReceiptIframe />** (Props: `{ html, width = '300px' }: ReceiptIframeProps`)
  - *Interfaces/Types:* 
    - `ReceiptIframeProps` { html: string; width?: string; }

### File: `ReceiptPreview.tsx`
- **<ReceiptPreview />** (Props: `{ transaction, onClose }: ReceiptPreviewProps`)
  - *Interfaces/Types:* 
    - `ReceiptPreviewProps` { transaction: Partial<Transaction> & { invoice_number: string }

### File: `ReceiptTemplateEditor.tsx`
- **<ReceiptTemplateEditor />** (Props: `{ onClose }: ReceiptTemplateEditorProps`)
  - *Interfaces/Types:* 
    - `ReceiptTemplateEditorProps` { onClose: () => void; }

### File: `ReportPreviewModal.tsx`
- **<ReportPreviewModal />** (Props: `{ html, onClose, onPrint, onDownloadPdf }: ReportPreviewModalProps`)
  - *Interfaces/Types:* 
    - `ReportPreviewModalProps` { html: string; onClose: () => void; onPrint: () => Promise<void>; onDownloadPdf: () => Promise<void>; }

### File: `Sidebar.tsx`
- **<Sidebar />** (Props: `*No props or implicit*`)

### File: `ThemeToggle.tsx`
- **<ThemeToggle />** (Props: `{ compact = false }: ThemeToggleProps`)
  - *Interfaces/Types:* 
    - `ThemeToggleProps` { compact?: boolean; }

### File: `VirtualizedTable.tsx`
- **<VirtualizedTable />** (Props: `{    data,    columns,    rowHeight = 56,    maxHeight = '400px',    onRowClick,    className,    tableClassName,    emptyMessage = "Tidak ada data"}: VirtualizedTableProps & { emptyMessage?: string }`)
  - *Interfaces/Types:* 
    - `Column` { header: string; accessor: string | ((item: any) => React.ReactNode); className?: string; headerClassName?: string; }
    - `VirtualizedTableProps` { data: any[]; columns: Column[]; rowHeight?: number; maxHeight?: string; onRowClick?: (item: any) => void; className?: string; tableClassName?: string; }


## Directory: `src/components/charts`

### File: `HourlySalesChart.tsx`
- **<HourlySalesChart />** (Props: `{ data }: HourlySalesChartProps`)
- **<CustomTooltip />** (Props: `{ active, payload }: any`)
  - *Interfaces/Types:* 
    - `HourlySalesData` { hour: number; total: number; count: number; }
    - `HourlySalesChartProps` { data: HourlySalesData[]; }

### File: `PaymentPieChart.tsx`
- **<PaymentPieChart />** (Props: `{ data }: PaymentPieChartProps`)
- **<CustomTooltip />** (Props: `{ active, payload }: any`)
  - *Interfaces/Types:* 
    - `PaymentData` { payment_method: string; total: number; count: number; }
    - `PaymentPieChartProps` { data: PaymentData[]; }

### File: `ProfitMarginChart.tsx`
- **<ProfitMarginChart />** (Props: `{ data }: ProfitMarginChartProps`)
- **<CustomTooltip />** (Props: `{ active, payload }: any`)
  - *Interfaces/Types:* 
    - `MarginData` { product_name: string; revenue: number; total_cost: number; profit: number; margin: number; }
    - `ProfitMarginChartProps` { data: MarginData[]; }

### File: `SalesTrendChart.tsx`
- **<SalesTrendChart />** (Props: `{ data, hideCard = false }: SalesTrendChartProps`)
- **<CustomTooltip />** (Props: `{ active, payload, label }: any`)
- **<CustomBar />** (Props: `props: any`)
  - *Interfaces/Types:* 
    - `SalesData` { date: string; total: number; count: number; }
    - `SalesTrendChartProps` { data: SalesData[]; hideCard?: boolean; }

### File: `TopProductsChart.tsx`
- **<TopProductsChart />** (Props: `{ data, profitData }: TopProductsChartProps`)
- **<CustomTooltip />** (Props: `{ active, payload }: any`)
  - *Interfaces/Types:* 
    - `TopProductData` { product_name: string; total: number; qty: number; }
    - `ProfitData` { product_name: string; revenue: number; profit: number; }
    - `TopProductsChartProps` { data: TopProductData[]; profitData?: ProfitData[]; }


## Directory: `src/components/reports`

### File: `ComparisonReportTab.tsx`
- **<ComparisonReportTab />** (Props: `{ data, labelA, labelB, stockAuditData, stockTrailData }: any`)
- **<ComparisonRow />** (Props: `{ label, valA, valB, delta }: any`)

### File: `ComprehensiveReport.tsx`
- **<CollapsibleSection />** (Props: `{ id, title, icon: Icon, children }: CollapsibleSectionProps`)
- **<MiniCard />** (Props: `{ label, value, sub, color = 'blue' }: MiniCardProps`)
- **<ComprehensiveReport />** (Props: `{ data, stockAuditData, stockTrailData }: ComprehensiveReportProps`)
  - *Interfaces/Types:* 
    - `CollapsibleSectionProps` { id: string; title: string; icon: any; children: React.ReactNode; }
    - `MiniCardProps` { label: string; value: string | number; sub?: string; color?: 'blue' | 'green' | 'orange' | 'purple' | 'red'; }
    - `ComprehensiveReportProps` { data: any; stockAuditData?: any[]; stockTrailData?: any[]; }

### File: `ComprehensiveReportTab.tsx`
- **<ComprehensiveReportTab />** (Props: `{    data,    isLoading,    isError,    error,    refetch,    stockAuditData,    stockTrailData}: any`)

### File: `ProfitReportTab.tsx`
- **<ProfitReportTab />** (Props: `{ data, stockAuditData, stockTrailData, transactionsData }: any`)

### File: `SalesReportTab.tsx`
- **<CustomerTable />** (Props: `{ rows, keyField, labelField }: { rows: any[]; keyField: string; labelField: string }`)
- **<SalesReportTab />** (Props: `{ data, hourlyData, stockAuditData, transactionsData, stockTrailData }: any`)

### File: `StatCard.tsx`
- **<StatCard />** (Props: `{ title, value, icon: Icon, color }: any`)

### File: `StockAuditSection.tsx`
- **<StockAuditSection />** (Props: `{ data }: any`)

### File: `StockTrailSection.tsx`
- **<StockTrailSection />** (Props: `{ data }: any`)

### File: `TransactionLogSection.tsx`
- **<TransactionLogSection />** (Props: `{ data }: any`)


## Directory: `src/components/ui`

### File: `badge.tsx`
- **<Badge />** (Props: `{ className, variant, ...props }: BadgeProps`)

### File: `dialog.tsx`
- **<DialogHeader />** (Props: `{  className,  ...props}: React.HTMLAttributes<HTMLDivElement>`)
- **<DialogFooter />** (Props: `{  className,  ...props}: React.HTMLAttributes<HTMLDivElement>`)

### File: `dropdown-menu.tsx`
- **<DropdownMenuShortcut />** (Props: `{  className,  ...props}: React.HTMLAttributes<HTMLSpanElement>`)


## Directory: `src/pages`

### File: `CashierPage.tsx`
- **<CashierPage />** (Props: `*No props or implicit*`)
  - *Interfaces/Types:* 
    - `Product` { id: number; name: string; price: number; cost?: number; stock: number; unit?: string; category_id?: number; }
    - `CartItem` { product_id: number; product_name: string; price: number; cost: number; quantity: number; discount: number; subtotal: number; unit: string; max_stock: number; }

### File: `DashboardPage.tsx`
- **<DashboardPage />** (Props: `*No props or implicit*`)
- **<CashierDashboard />** (Props: `{ stats, user, navigate }: { stats: any; user: any; navigate: any }`)
- **<LowStockMiniTable />** (Props: `*No props or implicit*`)
- **<LoadingState />** (Props: `*No props or implicit*`)
- **<DashboardHeader />** (Props: `*No props or implicit*`)
- **<KPICardsSection />** (Props: `{ stats, hasRole }: { stats: any, hasRole: any }`)
- **<EnhancedStatCard />** (Props: `{ title, value, subtitle, comparison, icon: Icon, variant, progress }: any`)
- **<SalesChartSection />** (Props: `{ chartData, chartPeriod, setChartPeriod, stats }: any`)
- **<QuickActionsSection />** (Props: `{ hasRole, navigate }: any`)
- **<TopProductsSection />** (Props: `{ topProducts, navigate }: any`)
- **<AlertsSection />** (Props: `{ stats, navigate }: any`)
- **<AiInsightWidget />** (Props: `{ navigate }: any`)
- **<SlowMovingDashboardSection />** (Props: `{ navigate }: any`)
- **<RecentTransactionsSection />** (Props: `{ transactions, navigate }: any`)

### File: `DatabasePage.tsx`
- **<DatabasePage />** (Props: `*No props or implicit*`)
- **<MaintenanceCard />** (Props: `{ title, description, icon: Icon, label, bottomLabel, action, btnText, processing, disabled, variant }: any`)

### File: `DebtManagementPage.tsx`
- **<PaymentStatusBadge />** (Props: `{ status }: { status: string }`)
- **<DebtManagementPage />** (Props: `*No props or implicit*`)
- **<StatCard />** (Props: `{ title, value, subtitle, icon: Icon, color }: any`)
- **<TotalItem />** (Props: `{ label, value, color }: { label: string, value: number, color: 'white' | 'emerald' | 'orange' }`)

### File: `InsightPage.tsx`
- **<OnboardingDownloadCard />** (Props: `{ onDownload, onBrowse, browseError }: { onDownload: (`)
- **<DownloadProgressCard />** (Props: `{ progress, downloadedMB, totalMB, onCancel }: { progress: number; downloadedMB: number; totalMB: number; onCancel: (`)
- **<FailedCard />** (Props: `{ errorMsg, onRetry, onBrowse }: { errorMsg: string; onRetry: (`)
- **<ModelSettingsPanel />** (Props: `{ customModelPath, browseError, isChangingModel, aiMode, onBrowse, onClear }: {    customModelPath: string | null; browseError: string | null; isChangingModel: boolean; aiMode: string; onBrowse: (`)
- **<NarrativeInsight />** (Props: `{ data, days }: { data: InsightData; days: number }`)
- **<GeneratingSkeleton />** (Props: `*No props or implicit*`)
- **<PerformancePresetsPanel />** (Props: `*No props or implicit*`)
- **<InsightPage />** (Props: `*No props or implicit*`)
  - *Interfaces/Types:* 
    - `InsightData` { paragraphs?: string[]; // format baru narrative?: string; // format lama (backward compat) highlights: string[]; }
    - `CacheResult` { success: boolean; data?: InsightData; created_at?: string; from_cache?: boolean; status?: string; }
    - `ApiSettings` { mode: 'local' | 'api'; provider: string; apiKey: string; model: string; baseUrl: string; }

### File: `LoginPage.tsx`
- **<LoginPage />** (Props: `*No props or implicit*`)

### File: `LowStockPage.tsx`
- **<LowStockPage />** (Props: `*No props or implicit*`)
- **<StatCard />** (Props: `{ title, value, icon: Icon, color }: any`)

### File: `MockupPage.tsx`
- **<MockupPage />** (Props: `*No props or implicit*`)

### File: `ProductsPage.tsx`
- **<ProductsPage />** (Props: `*No props or implicit*`)
- **<StockHistoryPanelWrapper />** (Props: `{ productId, productName }: any`)
- **<StockHistoryPanel />** (Props: `{ history, loading, productName }: any`)

### File: `ReportsPage.tsx`
- **<ReportsPage />** (Props: `*No props or implicit*`)

### File: `SettingsPage.tsx`
- **<SettingsPage />** (Props: `*No props or implicit*`)
- **<MarginSettingsCard />** (Props: `{ defaultMargin, onSave }: any`)
- **<ModeButton />** (Props: `{ active, onClick, title, desc, danger }: any`)
- **<MasterKeySection />** (Props: `{ onMessage }: any`)
- **<CloudflareSection />** (Props: `*No props or implicit*`)
- **<Eye />** (Props: `{ className }: { className?: string }`)

### File: `StockTrailPage.tsx`
- **<StockTrailPage />** (Props: `*No props or implicit*`)

### File: `TransactionsPage.tsx`
- **<PaymentStatusBadge />** (Props: `{ status }: { status: string }`)
- **<TransactionsPage />** (Props: `*No props or implicit*`)
- **<InfoItem />** (Props: `{ icon: Icon, label, value, className }: any`)
- **<TotalRow />** (Props: `{ label, value, color = "text-gray-900" }: any`)

### File: `UsersPage.tsx`
- **<UsersPage />** (Props: `*No props or implicit*`)


## Directory: `src`

### File: `App.tsx`
- **<ProtectedRoute />** (Props: `{ children, roles }: ProtectedRouteProps`)
- **<App />** (Props: `*No props or implicit*`)
- **<PageLoader />** (Props: `*No props or implicit*`)
  - *Interfaces/Types:* 
    - `ProtectedRouteProps` { children: ReactNode; roles?: UserRole[]; }

