(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))s(n);new MutationObserver(n=>{for(const o of n)if(o.type==="childList")for(const i of o.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&s(i)}).observe(document,{childList:!0,subtree:!0});function a(n){const o={};return n.integrity&&(o.integrity=n.integrity),n.referrerPolicy&&(o.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?o.credentials="include":n.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function s(n){if(n.ep)return;n.ep=!0;const o=a(n);fetch(n.href,o)}})();function g(t){return new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",minimumFractionDigits:0,maximumFractionDigits:0}).format(t)}function nt(t){return new Intl.NumberFormat("id-ID").format(t)}function O(t){if(!t)return"";const e=String(t),a=/Z|[+-]\d{2}:?\d{2}$/.test(e)?e:e.replace(" ","T")+"Z",s=new Date(a);return isNaN(s.getTime())?t:new Intl.DateTimeFormat("id-ID",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"}).format(s)}function F(t){const e=String(t).replace(/\D/g,"");return e?new Intl.NumberFormat("id-ID").format(parseInt(e)):""}function ot(t){return t&&parseInt(String(t).replace(/\D/g,""))||0}function At(t){const e=document.getElementById(t);e&&(e.addEventListener("input",a=>{const s=a.target.selectionStart;a.target.value.length;const n=a.target.value,o=F(a.target.value);a.target.value=o,o.length;const i=(n.slice(0,s).match(/\./g)||[]).length,d=Math.max(0,s-i);let r=0,l=0;for(let c=0;c<o.length;c++)if(o[c]!=="."&&r++,r>=d){l=c+1;break}a.target.setSelectionRange(l,l)}),e.value&&(e.value=F(e.value)))}function ye(){const t=navigator.userAgent;let e="Unknown Device",a="Unknown Browser",s="Unknown OS";if(/Android/i.test(t)){s="Android";const n=t.match(/Android[^;]*;\s*([^)]+)/);n&&(e=n[1].split("Build")[0].trim())}else/iPhone|iPad|iPod/i.test(t)?(s="iOS",/iPhone/i.test(t)?e="iPhone":/iPad/i.test(t)?e="iPad":e="iPod"):/Windows/i.test(t)?(s="Windows",e="PC"):/Mac/i.test(t)?(s="macOS",e="Mac"):/Linux/i.test(t)&&(s="Linux",e="PC");return/Chrome/i.test(t)&&!/Edg/i.test(t)?a="Chrome":/Safari/i.test(t)&&!/Chrome/i.test(t)?a="Safari":/Firefox/i.test(t)?a="Firefox":/Edg/i.test(t)?a="Edge":/Opera|OPR/i.test(t)&&(a="Opera"),{device:e,browser:a,os:s,displayName:e!=="Unknown Device"?e:`${a} on ${s}`}}function mt(t,e,a=null,s=null){return`
    <div class="empty-state-full">
      <div class="empty-icon">${t}</div>
      <div class="empty-message">${e}</div>
      ${a?`<button class="btn btn-outline btn-sm" onclick="${s}">${a}</button>`:""}
    </div>
  `}function m(t){return t==null?"":String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}let G=null;function fe(){return G||(G=document.createElement("div"),G.className="toast-container",document.body.appendChild(G)),G}function St(t,e="success",a=3e3){const s=fe(),n=document.createElement("div");n.className=`toast toast-${e}`;const o={success:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>',error:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>',warning:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',info:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'};n.innerHTML=`
    <span class="toast-icon">${o[e]||o.info}</span>
    <span class="toast-text">${m(t)}</span>
  `,s.appendChild(n);const i=()=>{n.classList.add("toast-out"),n.addEventListener("animationend",()=>n.remove(),{once:!0})},d=setTimeout(i,a);n.addEventListener("click",()=>{clearTimeout(d),i()})}function Vt(t={}){const e=t.title||"Toko Bersama App",a=t.showBack===!0,s=t.onRefresh===!0;return`
    <div class="navbar">
      ${a?`
    <button class="navbar-back" onclick="window.history.back()" aria-label="Kembali">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M15 18l-6-6 6-6"/>
      </svg>
    </button>
  `:"<div></div>"}
      <h1 class="navbar-title">${e}</h1>
      ${s?`
    <button class="navbar-action" onclick="window.refreshCurrentPage?.()" aria-label="Segarkan">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 4v5h5M20 20v-5h-5M5 19a9 9 0 0115-6.7M19 5a9 9 0 01-15 6.7"/>
      </svg>
    </button>
  `:"<div></div>"}
    </div>
  `}function Kt(t={}){return`
    <nav class="bottom-nav">
      ${[{path:"/",label:"Dashboard",icon:"M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"},{path:"/products",label:"Produk",icon:"M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",badgeId:"products"},{path:"/transactions",label:"Transaksi",icon:"M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"},{path:"/debts",label:"Piutang",icon:"M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z",badgeId:"debts"},{path:"/profile",label:"Profil",icon:"M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"}].map(a=>{const s=a.badgeId?t[a.badgeId]:0,n=s>0?`<span class="nav-badge">${s>99?"99+":s}</span>`:"";return`<a href="#${a.path}" class="nav-item" data-path="${a.path}">
            <div class="nav-icon-wrap">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path stroke-linecap="round" stroke-linejoin="round" d="${a.icon}"/>
              </svg>
              ${n}
            </div>
            <span>${a.label}</span>
          </a>`}).join("")}
    </nav>
  `}let Ct="http",X=window.location.hostname==="localhost"?"localhost":window.location.hostname,U=3001,we=3002;function w(){const t=U&&U!==80&&U!==443?`:${U}`:"";return`${Ct}://${X}${t}/api`}function Mt(){if(X==="localhost"){const t=`:${we}`;return`${Ct}://${X}${t}/api/v2`}return w()+"/v2"}const T=new Map,be=50;function ke(t){return t.includes("/settings")||t.includes("/categories")?300*1e3:t.includes("/products")?60*1e3:t.includes("/dashboard")?35*1e3:30*1e3}function q(t=null){if(!t)T.clear(),console.log("[API Cache] All cleared");else{for(const e of T.keys())e.includes(t)&&T.delete(e);console.log(`[API Cache] Cleared keys containing: ${t}`)}}function bt(t,e=3001,a="http"){console.log("[API] Check for Proxy v3.2-fix"),X=t,U=e,Ct=a,console.log(`[API] Server set to ${a}://${t}:${e}`)}function jt(){return{host:X,port:U}}function $e(){let t=localStorage.getItem("pos_device_id");return t||(t=crypto.randomUUID(),localStorage.setItem("pos_device_id",t)),t}function xe(){try{const t=localStorage.getItem("pos_admin_session");return t?JSON.parse(t).token:null}catch{return null}}function It(t=null){localStorage.removeItem("pos_admin_session"),localStorage.removeItem("pos_admin_last_activity"),T.clear(),t&&sessionStorage.setItem("pos_logout_reason",t),(window.location.hash.replace("#","").split("?")[0]||"/")!=="/login"&&(window.location.hash="/login",window.location.reload())}async function Se(t,e,a=2,s=1500){for(let n=0;n<=a;n++)try{return await fetch(t,e)}catch(o){if(!!o.status||n===a)throw o;await new Promise(d=>setTimeout(d,s*(n+1)))}}async function f(t,e={}){const a=!e.method||e.method==="GET",s=t;if(a&&!e.bypassCache&&T.has(s)){const i=T.get(s);if(Date.now()<i.expiry)return console.log("[API Cache] Hit:",t),i.data;T.delete(s)}const n=xe(),o=n?{Authorization:`Bearer ${n}`}:{};try{const i=await Se(t,{...e,headers:{"Content-Type":"application/json",...o,...e.headers}});if(i.status===401&&!e.skipAuthRedirect){try{const r=await i.clone().json();It(r.message)}catch{It()}return}let d;try{d=await i.json()}catch{throw new Error(`Server error (${i.status})`)}if(!i.ok||d.success===!1)throw new Error(d.message||`Request failed (${i.status})`);return a?(T.size>=be&&T.delete(T.keys().next().value),T.set(s,{data:d,expiry:Date.now()+ke(t)})):(t.includes("/products")&&q("/products"),t.includes("/categories")&&q("/categories"),t.includes("/transactions")&&q("/transactions"),t.includes("/debts")&&q("/debts"),t.includes("/dashboard")&&q("/dashboard"),(t.includes("/users")||t.includes("/auth"))&&q("/users")),d}catch(i){throw console.error("[API Error]",t,i.message),i.name==="TypeError"&&i.message.includes("fetch")?new Error("Tidak dapat terhubung ke server. Periksa koneksi jaringan."):i}}async function Ie(){var p,A,_,J,st,V;let t;try{t=await f(`${Mt()}/dashboard/stats`),console.log("[Rust Service] Dashboard stats fetched successfully");try{const y=await f(`${w()}/dashboard/stats`,{bypassCache:!0});t.total_products=t.total_products||y.total_products,t.yesterday_profit=t.yesterday_profit||y.yesterday_profit,t.debt_total_outstanding=t.debt_total_outstanding||y.debt_total_outstanding,t.low_stock_products=t.low_stock_products||y.low_stock_products,t.slowMovingProducts=t.slowMovingProducts||y.slowMovingProducts}catch{}}catch(y){console.warn("[Rust Service] Unavailable, falling back to Express:",y.message),t=await f(`${w()}/dashboard/stats`,{bypassCache:!0})}const e=["Min","Sen","Sel","Rab","Kam","Jum","Sab"],a=[];for(let y=6;y>=0;y--){const C=new Date;C.setDate(C.getDate()-y);const K=C.toISOString().split("T")[0],H=(t.last_7_days||[]).find(W=>W.date===K);a.push({day:e[C.getDay()],amount:H&&(H.total||H.sales)||0,fullDate:K})}const s=[];for(let y=29;y>=0;y--){const C=new Date;C.setDate(C.getDate()-y);const K=C.toISOString().split("T")[0],H=(t.last_30_days||[]).find(ge=>ge.date===K),W=C.getMonth()+1,wt=C.getDate(),he=`${wt<10?"0"+wt:wt}/${W<10?"0"+W:W}`;s.push({day:he,amount:H&&(H.total||H.sales)||0,fullDate:K})}const n=(t.top_products_today||[]).map(y=>({name:y.product_name||y.name,sold:y.qty||y.quantity,revenue:y.total})),o=[];t.low_stock_products&&t.low_stock_products.forEach(y=>{o.push({type:"lowStock",message:`${y.name} stok tersisa ${y.stock}`,time:"Stok rendah"})}),t.debt_overdue_count>0&&o.push({type:"overdue",message:`${t.debt_overdue_count} piutang jatuh tempo`,time:"Perlu tindakan"});const i=t.today_sales_total||((p=t.today_sales)==null?void 0:p.total)||0,d=t.today_sales_count||((A=t.today_sales)==null?void 0:A.count)||0,r=t.yesterday_sales_total||((_=t.yesterday_sales)==null?void 0:_.total)||0,l=t.yesterday_sales_count||((J=t.yesterday_sales)==null?void 0:J.count)||0,c=((st=t.today_profit)==null?void 0:st.profit)??t.today_profit??0,u=((V=t.yesterday_profit)==null?void 0:V.profit)??t.yesterday_profit??0;return{todaySales:i,yesterdaySales:r,todayProfit:c,yesterdayProfit:u,todayTransactions:d,yesterdayTransactions:l,totalProducts:t.total_products||0,lowStockCount:t.low_stock_count||0,totalDebt:t.debt_total_outstanding||t.totalDebt||0,overdueCount:t.debt_overdue_count||t.overdueCount||0,weekSales:a,monthSales:s,topProducts:n,slowMovingProducts:t.slowMovingProducts||[],recentAlerts:o,fetchedAt:new Date().toISOString()}}async function Wt(t=120){let e;try{return e=await f(`${Mt()}/products/slow-moving?days=${t}`),console.log("[Rust Service] Slow moving products fetched successfully"),(Array.isArray(e)?e:e.products||[]).map(s=>({name:s.name,stock:s.stock,lastSold:s.last_sale||s.last_sold_date,daysSinceLastSale:s.days_since_sale||s.days_since_last_sale||s.days_inactive||t,daysSinceAdded:s.days_since_added}))}catch(a){console.warn("[Rust Service] Unavailable, falling back to Express:",a.message),e=await f(`${w()}/products/slow-moving?days=${t}`)}return(e.products||[]).map(a=>({name:a.name,stock:a.stock,lastSold:a.last_sold_date,daysSinceLastSale:a.days_since_last_sale||a.days_inactive||t,daysSinceAdded:a.days_since_added}))}async function Gt(){const t=JSON.parse(localStorage.getItem("pos_admin_session")||"null"),e=(t==null?void 0:t.userId)||1;try{const s=(await f(`${w()}/users/${e}`)).user||{};return{id:s.id,username:s.username||"User",fullName:s.full_name||s.username||"User",role:s.role||"cashier",lastLogin:s.last_login||null}}catch(a){throw console.error("[API] fetchCurrentUser failed:",a.message),(a.message.includes("tidak ditemukan")||a.message.includes("404"))&&(console.warn("[Session] User ID no longer valid, logging out..."),It("Sesi pengguna tidak valid")),a}}async function Ee(t,e){return await f(`${w()}/auth/login`,{method:"POST",skipAuthRedirect:!0,body:JSON.stringify({username:t,password:e,device_id:$e(),device_name:navigator.userAgent.slice(0,150)})})}async function Yt(t){return f(`${w()}/users/${t}/sessions`,{bypassCache:!0})}async function Te(t,e){return f(`${w()}/users/${t}/sessions/${e}`,{method:"DELETE"})}async function Zt(){return(await f(`${w()}/categories`)).categories||[]}async function Le(t){const e=await f(`${w()}/categories`,{method:"POST",body:JSON.stringify({name:t})});return{id:e.id,name:e.name}}async function _e(){return(await f(`${w()}/products/generate-barcode`,{bypassCache:!0})).barcode}async function ft(t="",e={},a=null,s=0){const n=new URLSearchParams;t&&n.append("search",t),e.categoryId&&n.append("category_id",e.categoryId),e.lowStock&&n.append("low_stock","true"),e.sortBy&&n.append("sort_by",e.sortBy),e.sortOrder&&n.append("sort_order",e.sortOrder),a&&n.append("limit",a),s&&n.append("offset",s);const o=await f(`${w()}/products?${n}`);let i=o.data||o.products,d=o.total;i||(i=Object.keys(o).filter(l=>l!=="success"&&!isNaN(l)).map(l=>o[l]),d||(d=i.length));let r=i.map(l=>({id:l.id,name:l.name,barcode:l.barcode,price:l.price,cost:l.cost,stock:l.stock,unit:l.unit||"pcs",category:l.category_name||l.category,categoryId:l.category_id}));return a!==null?{data:r,total:d||r.length}:r}async function Ce(t){const e=JSON.parse(localStorage.getItem("pos_admin_session")||"null"),a={...t,userId:(e==null?void 0:e.userId)||1,userName:(e==null?void 0:e.username)||"Admin"};return await f(`${w()}/products`,{method:"POST",body:JSON.stringify(a)})}async function Me(t,e){const a=JSON.parse(localStorage.getItem("pos_admin_session")||"null"),s={...e,userId:(a==null?void 0:a.userId)||1,userName:(a==null?void 0:a.username)||"Admin"};return await f(`${w()}/products/${t}`,{method:"PUT",body:JSON.stringify(s)})}async function Be(t=null){const e=t?`${w()}/stock-history?productId=${t}`:`${w()}/stock-history`;return((await f(e)).history||[]).map(s=>({id:s.id,productId:s.product_id,productName:s.product_name,changeType:s.event_type||"manual",quantity:s.quantity_change||0,previousStock:s.quantity_before,newStock:s.quantity_after,notes:s.notes,createdAt:s.created_at,userName:s.user_name}))}async function Pe(t,e,a=""){const s=JSON.parse(localStorage.getItem("pos_admin_session")||"null"),n=(s==null?void 0:s.userId)||1;return await f(`${w()}/products/${t}/stock`,{method:"POST",body:JSON.stringify({adjustment:e,userId:n,notes:a})})}async function Qt(t={}){const e=new URLSearchParams;return t.status&&t.status!=="all"&&e.append("status",t.status),t.dateFrom&&e.append("date_from",t.dateFrom),t.dateTo&&e.append("date_to",t.dateTo),t.search&&e.append("search",t.search),((await f(`${w()}/transactions?${e}`)).transactions||[]).map(s=>{var n;return{id:s.id,invoiceNumber:s.invoice_number,date:s.created_at,total:s.total,amountPaid:s.amount_paid,remainingBalance:s.remaining_balance,change:s.change_amount,items:s.item_count||((n=s.items)==null?void 0:n.length)||0,status:s.payment_status||"lunas",paymentStatus:s.payment_status,paymentMethod:s.payment_method,cashierName:s.cashier_name,customerName:s.customer_name,customerPhone:s.customer_phone,dueDate:s.due_date,paymentNotes:s.payment_notes,itemDetails:s.items}})}async function Bt(t){var s;let e,a;try{e=await f(`${Mt()}/transactions/${t}`),console.log("[Rust Service] Transaction detail fetched successfully"),a=e.transaction||e}catch(n){console.warn("[Rust Service] Unavailable, falling back to Express:",n.message),e=await f(`${w()}/transactions/${t}`),a=e.transaction}return{id:a.id,invoiceNumber:a.invoice_number||a.invoiceNumber,date:a.created_at||a.date,total:a.total,amountPaid:a.amount_paid||a.amountPaid,remainingBalance:a.remaining_balance||a.remainingBalance,change:a.change_amount||a.change,items:a.item_count||((s=a.items)==null?void 0:s.length)||0,status:a.payment_status||a.status||"lunas",paymentMethod:a.payment_method||a.paymentMethod,cashierName:a.cashier_name||a.cashierName,customerName:a.customer_name||a.customerName,dueDate:a.due_date||a.dueDate,itemDetails:a.items||a.itemDetails,paymentHistory:a.payment_history||a.paymentHistory||[],paymentNotes:a.payment_notes||a.paymentNotes}}async function De(t,e){return await f(`${w()}/transactions/${t}/void`,{method:"POST",body:JSON.stringify({reason:e})})}async function Xt(t={}){const e=new URLSearchParams;return t.status&&t.status!=="all"&&e.append("status",t.status),t.overdue&&e.append("overdue","true"),t.search&&e.append("search",t.search),((await f(`${w()}/debts?${e}`)).debts||[]).map(s=>({id:s.invoice_number||s.id,customerName:s.customer_name,customerPhone:s.customer_phone,date:s.created_at,total:s.total,totalPaid:s.total_paid,remainingBalance:s.remaining_balance,dueDate:s.due_date,status:s.payment_status,isOverdue:s.is_overdue,daysOverdue:s.days_overdue||0}))}async function te(){const t=await f(`${w()}/debts/summary`),e={pending:{count:0,total:0},hutang:{count:0,total:0},cicilan:{count:0,total:0}};return Array.isArray(t.by_status)&&t.by_status.forEach(a=>{a.payment_status&&e[a.payment_status]&&(e[a.payment_status]={count:a.count||0,total:a.total||0})}),{totalOutstanding:t.total_outstanding||0,totalCustomers:t.total_count||0,overdueCount:t.overdue_count||0,overdueAmount:t.overdue_total||0,byStatus:e}}async function Ae(t,e,a,s){const n=JSON.parse(localStorage.getItem("pos_admin_session")||"null");return await f(`${w()}/transactions/${t}/payment`,{method:"POST",body:JSON.stringify({amount:e,method:a,userId:(n==null?void 0:n.userId)||1,notes:s})})}async function Pt(){try{return(await f(`${w()}/settings`)).settings||{}}catch(t){return console.warn("Failed to fetch settings, using defaults",t),{default_margin_percent:10.5}}}async function je(t){try{return await f(`${w()}/settings`,{method:"POST",body:JSON.stringify(t)})}catch(e){throw console.error("Failed to update settings",e),e}}async function He(){return(await f(`${w()}/users`,{bypassCache:!0})).users}let B=[],x=[],Y=120;async function qe(){const[t,e]=await Promise.all([Ie(),Wt(Y)]);B=t.topProducts,x=e;const a=t.yesterdaySales>0?((t.todaySales-t.yesterdaySales)/t.yesterdaySales*100).toFixed(1):0;t.yesterdayTransactions>0&&((t.todayTransactions-t.yesterdayTransactions)/t.yesterdayTransactions*100).toFixed(1);const s={week:t.weekSales,month:t.monthSales||[]},n=s.week.reduce((r,l)=>r+l.amount,0),o=s.month.reduce((r,l)=>r+l.amount,0),i=t.todaySales>=t.yesterdaySales?"positive":"negative",d=t.yesterdaySales>0?((t.todaySales-t.yesterdaySales)/t.yesterdaySales*100).toFixed(1):0;return window.dashboardData=s,window.currentChartPeriod="week",window._dashboardStats=t,window.renderChart=r=>{const l=window.dashboardData[r],c=Math.max(...l.map(u=>u.amount))||1;return l.map((u,p)=>{const A=u.amount/c*100,_=r==="week"&&p===l.length-1;return`
        <div class="chart-col${_?" chart-col-today":""}" data-amount="${u.amount}" onclick="handleChartTap(this)">
          <span class="chart-val-label"></span>
          <div class="chart-bar-bg">
            <div class="chart-bar-fill" style="height: ${A}%"></div>
          </div>
          <span class="chart-label">${_?"<strong>"+u.day+"</strong>":u.day}</span>
        </div>
      `}).join("")},window.updateChartHeader=r=>{const l=r==="week"?n:o;document.getElementById("chart-total-value").textContent=g(l),document.getElementById("chart-total-label").textContent=r==="week"?"Total 7 Hari":"Total 30 Hari",document.querySelectorAll(".chart-filter-btn").forEach(c=>{c.classList.toggle("active",c.dataset.period===r)}),document.getElementById("dashboard-chart-container").innerHTML=window.renderChart(r),document.getElementById("dashboard-chart-container").className=`chart-container ${r==="month"?"compact-bars":""}`},setTimeout(()=>{window.updateChartHeader("week")},0),window.refreshDashboard=async()=>{var r;(r=window.refreshCurrentPage)==null||r.call(window)},`
    <div class="page dashboard-page">
      <div class="page-header">
        <h2 class="page-title">
          Dashboard
          <span style="font-size: 11px; font-weight: 500; color: var(--text-muted); margin-top: 4px; display: block; letter-spacing: 0;">
            Data per ${O(t.fetchedAt)}
          </span>
        </h2>
        <div class="header-actions">
          <button class="btn btn-icon" id="btn-refresh" onclick="refreshDashboard()" title="Segarkan Data" aria-label="Segarkan Data">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
          </button>
        </div>
      </div>

      <!-- Summary Cards Row (Profit & Sales Today) -->
      <div class="summary-row">
        <div class="summary-card primary">
           <div class="summary-content">
            <div class="summary-label">Penjualan Hari Ini</div>
            <div class="summary-value">${g(t.todaySales)}</div>
            <div class="summary-change ${a>=0?"positive":"negative"}">
              ${a>=0?"Naik":"Turun"} ${Math.abs(a)}%
            </div>
          </div>
        </div>
        <div class="summary-card profit">
          <div class="summary-content">
            <div class="summary-label">Laba Hari Ini</div>
            <div class="summary-value">${g(t.todayProfit)}</div>
          </div>
        </div>
      </div>

      <!-- Sales Trend Chart Card -->
      <div class="section-card chart-card">
        <div class="chart-header-row">
          <div class="chart-info">
            <h3 class="chart-title">Tren Penjualan</h3>
            <div class="chart-stats">
              <span id="chart-total-label" class="chart-stat-label">Total 7 Hari</span>:
              <span id="chart-total-value" class="chart-stat-value">${g(n)}</span>
              <span class="chart-trend ${i==="positive"?"positive":"negative"}">
                ${i==="positive"?"↗":"↘"} ${Math.abs(d)}%
              </span>
            </div>
          </div>
          <div class="chart-controls">
            <button class="chart-filter-btn active" data-period="week" onclick="updateChartHeader('week')">7 Hari</button>
            <button class="chart-filter-btn" data-period="month" onclick="updateChartHeader('month')">30 Hari</button>
          </div>
        </div>

        <div id="dashboard-chart-container" class="chart-container">
          <!-- Rendered by JS -->
        </div>
      </div>

      <!-- Quick Stats Grid -->
      <div class="quick-stats">
        <div class="quick-stat" onclick="window.location.hash='/transactions'" style="cursor: pointer">
          <div class="quick-stat-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
          </div>
          <div class="quick-stat-value" data-value="${t.todayTransactions}">${nt(t.todayTransactions)}</div>
          <div class="quick-stat-label">Transaksi</div>
        </div>
        <div class="quick-stat">
          <div class="quick-stat-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
          </div>
          <div class="quick-stat-value" data-value="${t.totalProducts}">${nt(t.totalProducts)}</div>
          <div class="quick-stat-label">Total Produk</div>
        </div>
        <div class="quick-stat ${t.lowStockCount>0?"warning":""}" onclick="window.location.hash='/products?filter=low'" style="cursor: pointer">
          <div class="quick-stat-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <div class="quick-stat-value" data-value="${t.lowStockCount}">${nt(t.lowStockCount)}</div>
          <div class="quick-stat-label">Stok Menipis</div>
        </div>
        <div class="quick-stat ${t.overdueCount>0?"danger":""}" onclick="window.location.hash='/debts'" style="cursor: pointer">
          <div class="quick-stat-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div class="quick-stat-value" data-value="${t.overdueCount}">${nt(t.overdueCount)}</div>
          <div class="quick-stat-label">Jatuh Tempo</div>
        </div>
      </div>

      <!-- Alerts -->
      ${t.recentAlerts.length>0?`
        <div class="section-card">
          <div class="section-header">
            <h3 class="section-title">Peringatan</h3>
          </div>
          <div class="alerts-container">
            ${t.recentAlerts.map(r=>`
              <div class="alert-item ${r.type}" 
                   onclick="${r.type==="lowStock"?"window.location.hash='/products?filter=low'":""}"
                   style="${r.type==="lowStock"?"cursor: pointer":""}">
                <div class="alert-icon">
                  ${r.type==="lowStock"?'<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" style="color:var(--warning-dark)"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>':'<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" style="color:var(--danger)"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>'}
                </div>
                <div class="alert-content">
                  <div class="alert-message">${m(r.message)}</div>
                  <div class="alert-time">${r.time}</div>
                </div>
                ${r.type==="lowStock"?`
                  <div class="alert-action">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M9 5l7 7-7 7"/>
                    </svg>
                  </div>
                `:""}
              </div>
            `).join("")}
          </div>
        </div>
      `:""}

      <!-- Top Products (Expandable) -->
      <div class="section-card">
        <div class="section-header">
          <h3 class="section-title">Produk Terlaris</h3>
          <span class="list-count" id="top-count">5 dari ${B.length}</span>
        </div>
        <div class="list-container" id="top-products-list">
          ${Et(B.slice(0,5))}
        </div>
        ${B.length>5?`
          <button class="expand-btn" id="btn-expand-top" onclick="toggleTopProducts()">
            <span>Lihat Semua</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 6l4 4 4-4"/>
            </svg>
          </button>
        `:""}
      </div>

    </div>
  `}function Et(t){return t.length===0?'<div class="empty-state small">Tidak ada data</div>':t.map((e,a)=>`
    <div class="list-item">
      <div class="list-rank">${a+1}</div>
      <div class="list-content">
        <div class="list-title">${m(e.name)}</div>
        <div class="list-subtitle">${e.sold} terjual</div>
      </div>
      <div class="list-value">${g(e.revenue)}</div>
    </div>
  `).join("")}function Tt(t){return t.length===0?"":t.map((e,a)=>`
    <div class="list-item slow-item">
      <div class="list-rank danger">${a+1}</div>
      <div class="list-content">
        <div class="list-title">${m(e.name)}</div>
        <div class="list-subtitle">
          Stok: ${e.stock} •
          ${e.lastSold?`Terakhir: ${e.lastSold}`:"Belum pernah terjual"}
        </div>
      </div>
      <div class="list-days">
        <span class="days-badge">${e.daysSinceLastSale} hari</span>
      </div>
    </div>
  `).join("")}let kt=!1,dt=!1;window.toggleTopProducts=()=>{kt=!kt;const t=document.getElementById("top-products-list"),e=document.getElementById("btn-expand-top"),a=document.getElementById("top-count");kt?(t.innerHTML=Et(B.slice(0,30)),e.innerHTML=`
      <span>Tutup</span>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 10l4-4 4 4"/>
      </svg>
    `,e.classList.add("expanded"),a.textContent=`${Math.min(30,B.length)} dari ${B.length}`):(t.innerHTML=Et(B.slice(0,5)),e.innerHTML=`
      <span>Lihat Semua (${B.length})</span>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 6l4 4 4-4"/>
      </svg>
    `,e.classList.remove("expanded"),a.textContent=`5 dari ${B.length}`)};window.toggleSlowProducts=()=>{dt=!dt;const t=document.getElementById("slow-products-list"),e=document.getElementById("btn-expand-slow"),a=document.getElementById("slow-count");dt?(t.innerHTML=Tt(x.slice(0,30)),e.innerHTML=`
      <span>Tutup</span>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 10l4-4 4 4"/>
      </svg>
    `,e.classList.add("expanded"),a.textContent=`${Math.min(30,x.length)} dari ${x.length}`):(t.innerHTML=Tt(x.slice(0,5)),e.innerHTML=`
      <span>Lihat Semua (${x.length})</span>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 6l4 4 4-4"/>
      </svg>
    `,e.classList.remove("expanded"),a.textContent=`${Math.min(5,x.length)} dari ${x.length}`)};window.filterSlowProducts=async t=>{var n;Y=parseInt(t),x=await Wt(Y),dt=!1;const e=document.getElementById("slow-products-list"),a=document.getElementById("slow-count"),s=document.getElementById("days-label");if((n=document.getElementById("btn-expand-slow"))==null||n.parentElement,s.textContent=Y,x.length===0)e.innerHTML=`<div class="empty-state small">Tidak ada produk tidak laku dalam ${Y} hari</div>`,a.textContent="0",document.getElementById("btn-expand-slow")&&(document.getElementById("btn-expand-slow").style.display="none");else{e.innerHTML=Tt(x.slice(0,5)),a.textContent=`${Math.min(5,x.length)} dari ${x.length}`;let o=document.getElementById("btn-expand-slow");x.length>5?o&&(o.style.display="flex",o.innerHTML=`
          <span>Lihat Semua (${x.length})</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 6l4 4 4-4"/>
          </svg>
        `,o.classList.remove("expanded")):o&&(o.style.display="none")}};window.initDashboard=()=>{window.handleChartTap=t=>{document.querySelectorAll(".chart-val-label").forEach(a=>{a.textContent="",a.classList.remove("visible")});const e=parseInt(t.dataset.amount);if(e>0){const a=t.querySelector(".chart-val-label");a&&(a.textContent=g(e),a.classList.add("visible"))}},window.animateValue=(t,e,a,s=600)=>{if(!t||e===a){t&&(t.textContent=t.dataset.formatted||a);return}const n=performance.now(),o=i=>{if(!t.isConnected)return;const d=i-n,r=Math.min(d/s,1),l=1-Math.pow(1-r,3),c=Math.round(e+(a-e)*l);t.textContent=c.toLocaleString("id-ID"),r<1?requestAnimationFrame(o):t.textContent=t.dataset.formatted||a.toLocaleString("id-ID")};requestAnimationFrame(o)},requestAnimationFrame(()=>{document.querySelectorAll(".quick-stat-value[data-value]").forEach(t=>{const e=parseInt(t.dataset.value);isNaN(e)||window.animateValue(t,0,e)})})};let S=[],Ht=[],N=0,pt=1;const vt=20;let h={search:"",categoryId:null,lowStock:!1};async function Ne(t={}){t.filter==="low"&&(h.lowStock=!0,h.categoryId=null,h.search=""),pt=1;const[e,a]=await Promise.all([ft(h.search,h,vt,0),Zt()]);S=e.data||e,N=e.total||S.length,Ht=a;const s=Ht.map(n=>`
    <button class="chip ${h.categoryId===n.id?"active":""}" data-category="${m(n.id)}">${m(n.name)}</button>
  `).join("");return`
    <div class="page products-page">
      <div class="page-header">
        <h2 class="page-title">Produk</h2>
        <div class="header-actions">
          <button class="btn btn-icon" data-action="stock-history" title="Riwayat Stok" aria-label="Riwayat Stok">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          <button class="btn btn-icon" data-action="add-product" title="Tambah Produk" aria-label="Tambah Produk">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 4v16m-8-8h16"/>
            </svg>
          </button>
        </div>
      </div>

      <div class="search-bar">
        <div class="search-wrap">
          <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input type="text" id="product-search" placeholder="Cari produk atau barcode..." class="search-input" value="${m(h.search)}">
        </div>
      </div>

      <div class="filter-chips">
        <button class="chip ${!h.lowStock&&!h.categoryId?"active":""}" data-filter="all">Semua</button>
        <button class="chip chip-warning ${h.lowStock?"active":""}" data-filter="low">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          Stok Rendah
        </button>
        ${s}
      </div>

      <div class="product-count">
        Menampilkan <span id="product-count-shown">${S.length}</span> dari <span id="product-count-total">${N}</span> produk
      </div>

      <div class="compact-list" id="product-list">
        ${ae(S)}
      </div>

      <div class="load-more-container ${S.length>=N?"hidden":""}" id="load-more-container">
        <button class="btn btn-outline load-more-btn" id="load-more-btn">Muat Lebih Banyak</button>
      </div>

      <!-- Stock Adjustment Modal -->
      <div class="modal-overlay" id="stock-adjust-modal">
        <div class="product-modal-card">
          <div class="modal-header">
            <h3 class="modal-title" id="stock-adjust-title">Sesuaikan Stok</h3>
            <button class="modal-close" onclick="closeModal('stock-adjust-modal')">&times;</button>
          </div>
          <div class="modal-body">
            <p id="stock-adjust-desc" style="color:var(--text-secondary);margin-bottom:12px;font-size:13px;"></p>
            <div class="form-group">
              <label>Jumlah</label>
              <input type="number" id="stock-adjust-qty" min="1" value="1" class="search-input">
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" onclick="closeModal('stock-adjust-modal')">Batal</button>
            <button class="btn btn-primary" id="btn-confirm-stock-adjust">Konfirmasi</button>
          </div>
        </div>
      </div>
    </div>
  `}function ee(t){return t.map(e=>{const a=e.stock<5?"danger":e.stock<15?"warning":"",s=e.name.match(/^(\d+\w*\.\w+)\s+(.+)$/),n=s?s[1]:null,o=s?s[2]:e.name;return`
      <div class="compact-item ${a}" data-product-id="${e.id}">
        <div class="compact-info" data-action="edit-product" data-product-id="${e.id}">
          ${n?`<span class="compact-code">${m(n)}</span>`:""}
          <span class="compact-name">${m(o)}</span>
          <span class="compact-meta">${m(e.category)||"Umum"} • ${g(e.price)}</span>
        </div>
        <div class="compact-actions">
          <div class="stock-ctrl-group">
            <button class="stock-ctrl-btn" data-action="decrease-stock" data-product-id="${e.id}" aria-label="Kurangi Stok">−</button>
            <div class="stock-display">
              <span class="stock-badge ${a}">${e.stock}</span>
              <span class="stock-unit">${m(e.unit)||"pcs"}</span>
            </div>
            <button class="stock-ctrl-btn" data-action="increase-stock" data-product-id="${e.id}" aria-label="Tambah Stok">+</button>
          </div>
        </div>
      </div>
    `}).join("")}function ae(t){return t.length?ee(t):h.lowStock?mt('<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>',"Semua stok dalam kondisi baik",null,null):mt('<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>',"Tidak ada produk ditemukan","Tambah Produk","window.location.hash='/products/add'")}async function $t(){pt=1;const t=await ft(h.search,h,vt,0);S=t.data||t,N=t.total||S.length;const e=document.getElementById("product-list");e&&(e.innerHTML=ae(S)),se();const a=document.getElementById("load-more-container");a&&a.classList.toggle("hidden",S.length>=N)}async function Oe(){const t=document.getElementById("load-more-btn");t&&(t.disabled=!0,t.textContent="Memuat...");try{const e=pt*vt,a=await ft(h.search,h,vt,e),s=a.data||a;if(s.length>0){S=[...S,...s],pt++;const o=document.getElementById("product-list");o&&o.insertAdjacentHTML("beforeend",ee(s)),se()}const n=document.getElementById("load-more-container");n&&n.classList.toggle("hidden",S.length>=N)}catch(e){console.error("Error loading more products:",e)}finally{t&&(t.disabled=!1,t.textContent="Muat Lebih Banyak")}}function se(){const t=document.getElementById("product-count-shown"),e=document.getElementById("product-count-total");t&&(t.textContent=S.length),e&&(e.textContent=N)}window.initProducts=async(t={})=>{const e=document.querySelector(".products-page");if(!e)return;const a=document.getElementById("stock-adjust-modal");if(a&&a.parentElement!==document.body&&document.body.appendChild(a),t.filter==="low"){const r=document.querySelector('.chip[data-filter="low"]');if(!(r!=null&&r.classList.contains("active"))){h.lowStock=!0,h.categoryId=null,h.search="";const l=document.getElementById("product-search");l&&(l.value=""),document.querySelectorAll(".chip").forEach(c=>c.classList.remove("active")),r==null||r.classList.add("active"),await $t()}}e.addEventListener("click",async r=>{const l=r.target.closest("[data-action]");if(!l)return;const c=l.dataset.action,u=l.dataset.productId;switch(c){case"stock-history":window.location.hash="/stock-history";break;case"add-product":window.location.hash="/products/add";break;case"edit-product":u&&(window.location.hash=`/products/edit?id=${u}`);break;case"increase-stock":u&&await Nt(parseInt(u),1);break;case"decrease-stock":u&&await Nt(parseInt(u),-1);break}}),e.addEventListener("click",async r=>{const l=r.target.closest(".chip");if(!l)return;const c=l.dataset.category,u=l.dataset.filter;u==="all"?(h.categoryId=null,h.lowStock=!1,h.sortBy="name",h.sortOrder="asc"):u==="low"?(h.categoryId=null,h.lowStock=!0,h.sortBy="stock",h.sortOrder="asc"):c&&(h.categoryId=parseInt(c),h.lowStock=!1,h.sortBy="name",h.sortOrder="asc"),document.querySelectorAll(".chip").forEach(p=>p.classList.remove("active")),l.classList.add("active"),await $t()});const s=document.getElementById("product-search");let n;s==null||s.addEventListener("input",r=>{clearTimeout(n),n=setTimeout(async()=>{h.search=r.target.value,await $t()},150)});const o=document.getElementById("load-more-btn");o==null||o.addEventListener("click",async()=>{await Oe()});const i=document.getElementById("btn-confirm-stock-adjust");i==null||i.removeEventListener("click",Lt),i==null||i.addEventListener("click",Lt);const d=document.getElementById("stock-adjust-qty");d==null||d.removeEventListener("keydown",qt),d==null||d.addEventListener("keydown",qt)};let lt=null;function qt(t){t.key==="Enter"&&Lt()}function Nt(t,e){const a=S.find(d=>d.id===t);if(!a)return;const s=e>0?"Penambahan":"Pengurangan";lt={productId:t,direction:e,type:s};const n=document.getElementById("stock-adjust-title"),o=document.getElementById("stock-adjust-desc"),i=document.getElementById("stock-adjust-qty");n&&(n.textContent=`${s} Stok`),o&&(o.textContent=`Produk: ${a.name} (stok saat ini: ${a.stock})`),i&&(i.value="1",i.focus()),openModal("stock-adjust-modal")}async function Lt(){var r,l,c,u;if(!lt)return;const{productId:t,direction:e,type:a}=lt,s=S.find(p=>p.id===t);if(!s)return;const n=document.getElementById("stock-adjust-qty"),o=parseInt((n==null?void 0:n.value)||"0");if(isNaN(o)||o<=0){(r=window.showToast)==null||r.call(window,"Jumlah harus berupa angka lebih dari 0","warning");return}const i=e*o,d=s.stock+i;if(d<0){(l=window.showToast)==null||l.call(window,"Stok tidak bisa kurang dari 0","error");return}closeModal("stock-adjust-modal"),lt=null;try{await Pe(t,i,`${a} manual via PWA`),s.stock=d;const p=document.querySelector(`[data-product-id="${t}"] .stock-badge`);p&&(p.textContent=d,p.classList.remove("animating"),p.offsetWidth,p.classList.add("animating"),p.addEventListener("animationend",()=>p.classList.remove("animating"),{once:!0}),p.classList.remove("warning","danger"),d<5?p.classList.add("danger"):d<15&&p.classList.add("warning")),(c=window.showToast)==null||c.call(window,`Stok berhasil diperbarui: ${d}`,"success")}catch(p){console.error("Error adjusting stock:",p),(u=window.showToast)==null||u.call(window,"Gagal mengubah stok: "+p.message,"error")}}let ht=[],k=null,Z=10.5,E=!1;async function Ot(t){const e=t.id?parseInt(t.id):null,a=!!e;try{const d=await Pt();d.default_margin_percent&&(Z=parseFloat(d.default_margin_percent))}catch{console.warn("Using default margin 10.5%")}ht=await Zt();const s=ht.map(d=>`<option value="${m(d.name)}">`).join(""),o=["pcs","kg","gram","liter","ml","pack","box","lusin","dus","karton","sachet","botol","kaleng","bungkus","pasang","set","rim","roll","meter","lembar"].map(d=>`<option value="${m(d)}">`).join("");if(a){if(k=(await ft()).find(r=>r.id===e),!k)return Re(e);if(k.margin_mode==="manual")E=!0;else if(k.margin_mode==="auto")E=!1;else{const r=k.price||0,l=k.cost||0,c=1-Z/100,u=Math.round(r*c);E=Math.abs(l-u)>100}}else k=null,E=!1;return`
    <div class="page product-form-page">
      <div class="page-header">
        <button class="btn btn-icon" id="btn-back" aria-label="Kembali">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 class="page-title">${a?"Edit Produk":"Tambah Produk"}</h2>
      </div>

      <div class="form-container">
        <form id="product-form" class="product-form">
          <div class="form-section">
            <h3 class="section-title">Informasi Dasar</h3>
            
            <div class="form-grup-wrapper">
              <div class="form-group full-width">
                <label>Nama Produk <span class="required">*</span></label>
                <input type="text" id="product-name" required placeholder="Contoh: Indomie Goreng" 
                  value="${a?m(k.name):""}" class="input-lg">
              </div>

              <div class="form-group half-width">
                <label>Kategori <span class="required">*</span></label>
                <div class="input-with-icon">
                   <input type="text" id="product-category" list="category-list" placeholder="Pilih kategori..." 
                    autocomplete="off" required value="${a?m(k.category||""):""}">
                   <datalist id="category-list">${s}</datalist>
                   <svg class="icon-right" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 9l-7 7-7-7"/></svg>
                </div>
              </div>

              <div class="form-group half-width">
                <label>Satuan <span class="required">*</span></label>
                <input type="text" id="product-unit" list="unit-list" placeholder="pcs" 
                  autocomplete="off" required value="${a?m(k.unit||"pcs"):""}">
                <datalist id="unit-list">${o}</datalist>
              </div>
            </div>
          </div>

          <div class="form-section">
            <h3 class="section-title">Harga & Stok</h3>
            
            <div class="form-grup-wrapper">
              <div class="form-group half-width">
                <label>Harga Jual <span class="required">*</span></label>
                <div class="input-prefix">
                  <span>Rp</span>
                  <input type="text" id="product-price" inputmode="numeric" required placeholder="0" autocomplete="off"
                    value="${a?F(k.price):""}">
                </div>
              </div>

              <div class="form-group half-width">
                <div class="label-with-action">
                  <label>Harga Modal</label>
                  <label class="toggle-switch">
                    <input type="checkbox" id="cost-manual-toggle" ${E?"checked":""}>
                    <span class="toggle-slider"></span>
                    <span class="toggle-label">Manual</span>
                  </label>
                </div>
                <div class="input-prefix">
                  <span>Rp</span>
                  <input type="text" id="product-cost" inputmode="numeric" placeholder="0" autocomplete="off"
                    value="${a&&k.cost?F(k.cost):""}"
                    ${E?"":"readonly"} class="${E?"":"bg-gray"}">
                </div>
                <small class="form-hint" id="cost-hint">
                  ${E?"Input manual":`Otomatis (Margin ${Z}%)`}
                </small>
              </div>

              <div class="form-group half-width">
                <label>Stok Awal ${a?"":'<span class="required">*</span>'}</label>
                <input type="number" id="product-stock" ${a?"disabled":"required"} placeholder="0"
                  value="${a?k.stock:""}">
                ${a?'<small class="form-hint">Stok dikelola via riwayat</small>':""}
              </div>
            </div>
          </div>

          <div class="form-actions sticky-bottom">
            <button type="button" class="btn btn-lg btn-secondary" id="btn-cancel">Batal</button>
            <button type="submit" class="btn btn-lg btn-primary" id="btn-save">
              ${a?"Simpan Perubahan":"Simpan Produk"}
            </button>
          </div>
        </form>
      </div>
    </div>
  `}function Re(t){return`
    <div class="page product-form-page">
      <div class="page-header">
        <button class="btn btn-icon" onclick="window.location.hash='/products'" aria-label="Kembali ke Produk">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 class="page-title">Error</h2>
      </div>
      <div class="empty-state">
        <p>Produk dengan ID ${t} tidak ditemukan.</p>
        <button class="btn btn-primary" onclick="window.location.hash='/products'">Kembali</button>
      </div>
    </div>
  `}async function Ue(t){const e=ht.find(a=>a.name.toLowerCase()===t.toLowerCase());if(e)return e.id;try{const a=await Le(t);return ht.push(a),a.id}catch(a){return console.error("Error creating category:",a),null}}function Rt(t){const e=1-Z/100;return Math.round(t*e)}async function Ut(){try{const t=await Gt();return{userId:t.id,userName:t.username}}catch{return{userId:null,userName:"System"}}}window.initProductForm=()=>{const t=document.getElementById("product-form"),e=document.getElementById("btn-back"),a=document.getElementById("btn-cancel"),s=document.getElementById("product-price"),n=document.getElementById("product-cost"),o=document.getElementById("cost-manual-toggle"),i=document.getElementById("cost-hint");try{At("product-price"),At("product-cost")}catch(r){console.error(r)}o==null||o.addEventListener("change",r=>{if(E=r.target.checked,E)n.readOnly=!1,n.classList.remove("bg-gray"),i.textContent="Input manual",n.focus();else{n.readOnly=!0,n.classList.add("bg-gray"),i.textContent=`Otomatis (Margin ${Z}%)`;const l=ot(s.value);l&&(n.value=F(Rt(l)))}}),s==null||s.addEventListener("input",r=>{E||setTimeout(()=>{const l=ot(s.value);if(l){const c=Rt(l);n.value=F(c)}else n.value=""},0)});const d=()=>window.location.hash="/products";e==null||e.addEventListener("click",d),a==null||a.addEventListener("click",d),t==null||t.addEventListener("submit",async r=>{r.preventDefault();const l=document.getElementById("btn-save");l.textContent,l.disabled=!0,l.textContent="Menyimpan...";try{const c=document.getElementById("product-name").value.trim(),u=ot(s.value),p=ot(n.value)||0,A=parseInt(document.getElementById("product-stock").value)||0,_=document.getElementById("product-unit").value.trim().toLowerCase(),J=document.getElementById("product-category").value.trim();if(!c||!u||!_||!J)throw new Error("Mohon lengkapi field bertanda *");const st=await Ue(J),V={name:c,price:u,cost:p,unit:_,category_id:st,margin_mode:E?"manual":"auto",userId:(await Ut()).userId,userName:(await Ut()).userName};if(k)await Me(k.id,V),alert("Produk berhasil diperbarui");else{const y=await _e();await Ce({...V,barcode:y,stock:A}),alert("Produk berhasil ditambahkan")}d()}catch(c){console.error(c),alert(c.message),l.disabled=!1}})};let D=[],P={status:"all",dateFrom:"",dateTo:"",search:""},v=null;async function ze(){const t=new Date,e=`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,"0")}-${String(t.getDate()).padStart(2,"0")}`;return P.dateFrom=e,P.dateTo=e,D=await Qt(P),`
    <div class="page transactions-page">
      <h2 class="page-title">Transaksi</h2>

      <div class="search-bar">
        <input type="text" id="tx-search" placeholder="Cari ID atau nama customer..." class="search-input">
      </div>

      <div class="date-presets">
        <button class="preset-btn active" data-preset="today">Hari Ini</button>
        <button class="preset-btn" data-preset="yesterday">Kemarin</button>
        <button class="preset-btn" data-preset="week">7 Hari</button>
        <button class="preset-btn" data-preset="month">Bulan Ini</button>
      </div>

      <div class="date-filter">
        <input type="date" id="date-from" class="date-input" value="${e}">
        <span class="date-separator">-</span>
        <input type="date" id="date-to" class="date-input" value="${e}">
      </div>

      <div class="filter-chips">
        <button class="chip active" data-status="all">Semua</button>
        <button class="chip" data-status="lunas">Lunas</button>
        <button class="chip" data-status="pending">Pending</button>
        <button class="chip" data-status="hutang">Hutang</button>
        <button class="chip" data-status="cicilan">Cicilan</button>
        <button class="chip" data-status="void">Void</button>
      </div>

      <div class="tx-summary">
        <div class="summary-item">
          <span class="summary-label">Total</span>
          <span class="summary-value" id="tx-total">${g(ne(D))}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Transaksi</span>
          <span class="summary-value" id="tx-count">${D.length}</span>
        </div>
      </div>

      <div class="compact-list" id="tx-list">
        ${oe(D)}
      </div>

      <!-- Transaction Detail Modal -->
      <div class="modal-overlay" id="tx-detail-modal">
        <div class="product-modal-card modal-lg">
          <div class="modal-header">
            <h3 class="modal-title">Detail Transaksi</h3>
            <button class="modal-close" onclick="closeModal('tx-detail-modal')">&times;</button>
          </div>
          <div class="modal-body" id="tx-detail-content">
            <!-- Filled by JS -->
          </div>
          <div class="modal-footer" id="tx-detail-footer">
            <!-- Filled by JS -->
          </div>
        </div>
      </div>

      <!-- Void Modal -->
      <div class="modal-overlay" id="void-modal">
        <div class="product-modal-card">
          <div class="modal-header">
            <h3 class="modal-title">Void Transaksi</h3>
            <button class="modal-close" onclick="closeModal('void-modal')">&times;</button>
          </div>
          <div class="modal-body">
            <p>Apakah Anda yakin ingin membatalkan transaksi ini?</p>
            <div class="form-group">
              <label>Alasan pembatalan</label>
              <textarea id="void-reason" rows="3" placeholder="Masukkan alasan..." required></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" onclick="closeModal('void-modal')">Batal</button>
            <button class="btn btn-danger" id="btn-confirm-void">Void Transaksi</button>
          </div>
        </div>
      </div>
    </div>
  `}function ne(t){return t.filter(e=>e.status!=="void").reduce((e,a)=>e+a.total,0)}function oe(t){return t.length===0?mt('<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>',"Tidak ada transaksi pada periode ini",null,null):t.map(e=>{var o;const a={lunas:{class:"success",label:"Lunas"},pending:{class:"info",label:"Pending"},hutang:{class:"warning",label:"Hutang"},cicilan:{class:"purple",label:"Cicilan"},void:{class:"danger",label:"Void"}},s=a[e.status]||a.lunas,n=((o=e.itemDetails)==null?void 0:o.map(i=>`
      <div class="tx-item-row">
        <span class="tx-item-name">${m(i.name||i.product_name)}</span>
        <span class="tx-item-qty">${i.qty||i.quantity}x</span>
        <span class="tx-item-price">${g(i.subtotal||i.price*(i.qty||i.quantity))}</span>
      </div>
    `).join(""))||'<div class="tx-items-loading">Memuat...</div>';return`
      <div class="tx-card status-${e.status} ${e.status==="void"?"voided":""}" data-id="${e.id}">
        <div class="tx-card-header" onclick="toggleTxExpand('${e.id}')">
          <div class="tx-card-main">
            <div class="tx-card-id">${m(e.invoiceNumber)||"#"+e.id}</div>
            <div class="tx-card-info">
              ${m(e.customerName)||"Walk-in"} • ${e.items} item • ${O(e.date)}
            </div>
          </div>
          <div class="tx-card-end">
            <div class="tx-card-total">${g(e.total)}</div>
            <span class="badge badge-${s.class}">${s.label}</span>
          </div>
          <div class="tx-expand-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </div>
        </div>
        <div class="tx-card-body" id="tx-body-${e.id}">
          <div class="tx-items-list">
            ${n}
          </div>
          <div class="tx-card-footer">
            <button class="btn btn-sm btn-outline" onclick="showTxDetail('${e.id}')">Detail</button>
            ${e.status!=="void"?`<button class="btn btn-sm btn-outline btn-danger" onclick="showVoidModalFor('${e.id}')">Void</button>`:""}
          </div>
        </div>
      </div>
    `}).join("")}window.showTxDetail=async t=>{var d;if(v=await Bt(t),!v)return;const e={lunas:{class:"success",label:"Lunas"},pending:{class:"info",label:"Pending"},hutang:{class:"warning",label:"Hutang"},cicilan:{class:"purple",label:"Cicilan"},void:{class:"danger",label:"Void"}},a=e[v.status]||e.lunas,s=((d=v.itemDetails)==null?void 0:d.map(r=>`
    <div class="item-row">
      <div class="item-name">${m(r.name||r.product_name)}</div>
      <div class="item-qty">${r.qty||r.quantity}x ${g(r.price)}</div>
      <div class="item-subtotal">${g(r.subtotal)}</div>
    </div>
  `).join(""))||'<div class="empty-state small">Data item tidak tersedia</div>';let n="";v.paymentHistory&&v.paymentHistory.length>0&&(n=`
      <div class="detail-section">
        <h4 class="section-title">Riwayat Pembayaran</h4>
        <div class="payment-list">
          ${v.paymentHistory.map(l=>`
      <div class="payment-row">
        <div class="payment-info">
          <div class="payment-date">${l.date}</div>
          <div class="payment-method">${l.method} - ${m(l.receivedBy)}</div>
          ${l.notes?`<div class="payment-notes">${m(l.notes)}</div>`:""}
        </div>
        <div class="payment-amount">${g(l.amount)}</div>
      </div>
    `).join("")}
        </div>
      </div>
    `);let o="";v.status==="void"&&(o=`
      <div class="void-info">
        <div class="void-label">Dibatalkan</div>
        <div class="void-reason">${m(v.voidReason)||"-"}</div>
        <div class="void-meta">${v.voidedAt} oleh ${m(v.voidedBy)}</div>
      </div>
    `),document.getElementById("tx-detail-content").innerHTML=`
    <div class="detail-section">
      <div class="detail-header">
        <h4 class="detail-name">${m(v.invoiceNumber)||"#"+v.id}</h4>
        <span class="badge badge-${a.class}">${a.label}</span>
      </div>
      <div class="detail-info">
        <div class="detail-row">
          <span class="detail-label">Tanggal</span>
          <span class="detail-value">${v.date}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Kasir</span>
          <span class="detail-value">${m(v.cashierName)}</span>
        </div>
        ${v.customerName?`
          <div class="detail-row">
            <span class="detail-label">Customer</span>
            <span class="detail-value">${m(v.customerName)}</span>
          </div>
        `:""}
        ${v.dueDate?`
          <div class="detail-row">
            <span class="detail-label">Jatuh Tempo</span>
            <span class="detail-value">${v.dueDate}</span>
          </div>
        `:""}
        <div class="detail-row">
          <span class="detail-label">Metode Pembayaran</span>
          <span class="detail-value">${m(v.paymentMethod)||"-"}</span>
        </div>
      </div>
    </div>
    
    ${v.paymentNotes?`
    <div class="detail-section tx-notes">
        <div class="tx-notes-label">Catatan</div>
        <div class="tx-notes-text">${m(v.paymentNotes)}</div>
    </div>
    `:""}

    <div class="detail-section">
      <h4 class="section-title">Item (${v.items})</h4>
      <div class="items-list">
        ${s}
      </div>
      <div class="items-total">
        <div class="total-row">
          <span>Total</span>
          <span>${g(v.total)}</span>
        </div>
        <div class="total-row">
          <span>Dibayar</span>
          <span>${g(v.amountPaid)}</span>
        </div>
        ${v.remainingBalance?`
          <div class="total-row highlight">
            <span>Sisa</span>
            <span>${g(v.remainingBalance)}</span>
          </div>
        `:""}
        ${v.change>0?`
          <div class="total-row">
            <span>Kembalian</span>
            <span>${g(v.change)}</span>
          </div>
        `:""}
      </div>
    </div>

    ${n}
    ${o}
  `;let i=`<button class="btn" onclick="closeModal('tx-detail-modal')">Tutup</button>`;v.status!=="void"&&(i=`
      <button class="btn btn-outline btn-danger" onclick="showVoidModal()">Void</button>
      ${i}
    `),document.getElementById("tx-detail-footer").innerHTML=i,openModal("tx-detail-modal")};window.showVoidModal=()=>{closeModal("tx-detail-modal"),document.getElementById("void-reason").value="",openModal("void-modal")};window.showVoidModalFor=t=>{const e=parseInt(t);v=D.find(a=>a.id===e),document.getElementById("void-reason").value="",openModal("void-modal")};window.toggleTxExpand=async t=>{var n;const e=document.querySelector(`.tx-card[data-id="${t}"]`),a=document.getElementById(`tx-body-${t}`);if(!e||!a)return;const s=e.classList.contains("expanded");if(document.querySelectorAll(".tx-card.expanded").forEach(o=>{o.classList.remove("expanded")}),!s){e.classList.add("expanded");const o=D.find(i=>String(i.id)===String(t));if(o&&!o.itemDetails)try{const i=await Bt(t);o.itemDetails=i.itemDetails;const d=((n=o.itemDetails)==null?void 0:n.map(r=>`
          <div class="tx-item-row">
            <span class="tx-item-name">${r.name||r.product_name}</span>
            <span class="tx-item-qty">${r.qty||r.quantity}x</span>
            <span class="tx-item-price">${g(r.subtotal||r.price*(r.qty||r.quantity))}</span>
          </div>
        `).join(""))||'<div class="empty-state small">Tidak ada item</div>';a.querySelector(".tx-items-list").innerHTML=d}catch(i){console.error("Error loading transaction items:",i),a.querySelector(".tx-items-list").innerHTML='<div class="empty-state small">Gagal memuat item</div>'}}};window.initTransactions=()=>{const t=document.querySelectorAll(".chip"),e=document.getElementById("date-from"),a=document.getElementById("date-to"),s=document.getElementById("tx-search"),n=document.getElementById("btn-confirm-void");t.forEach(i=>{i.addEventListener("click",async()=>{t.forEach(d=>d.classList.remove("active")),i.classList.add("active"),P.status=i.dataset.status,await R()})});function o(i){const d=new Date,r=u=>String(u).padStart(2,"0"),l=u=>`${u.getFullYear()}-${r(u.getMonth()+1)}-${r(u.getDate())}`,c=l(d);switch(i){case"today":return{from:c,to:c};case"yesterday":{const u=new Date(d);u.setDate(u.getDate()-1);const p=l(u);return{from:p,to:p}}case"week":{const u=new Date(d);return u.setDate(u.getDate()-6),{from:l(u),to:c}}case"month":{const u=new Date(d.getFullYear(),d.getMonth(),1);return{from:l(u),to:c}}default:return{from:c,to:c}}}document.querySelectorAll(".preset-btn").forEach(i=>{i.addEventListener("click",async()=>{document.querySelectorAll(".preset-btn").forEach(r=>r.classList.remove("active")),i.classList.add("active");const d=o(i.dataset.preset);e&&(e.value=d.from),a&&(a.value=d.to),P.dateFrom=d.from,P.dateTo=d.to,await R()})}),e==null||e.addEventListener("change",async()=>{document.querySelectorAll(".preset-btn").forEach(i=>i.classList.remove("active")),P.dateFrom=e.value,await R()}),a==null||a.addEventListener("change",async()=>{document.querySelectorAll(".preset-btn").forEach(i=>i.classList.remove("active")),P.dateTo=a.value,await R()}),s==null||s.addEventListener("input",async i=>{P.search=i.target.value,await R()}),n==null||n.addEventListener("click",async()=>{var d;if(!v)return;const i=document.getElementById("void-reason").value.trim();if(!i){(d=window.showToast)==null||d.call(window,"Masukkan alasan pembatalan","warning");return}await De(v.id,i),closeModal("void-modal"),await R()})};async function R(){D=await Qt(P),document.getElementById("tx-list").innerHTML=oe(D),document.getElementById("tx-total").textContent=g(ne(D)),document.getElementById("tx-count").textContent=D.length}let tt=[],$={},M={status:"all",search:"",overdue:!1},b=null;async function Fe(){const[t,e]=await Promise.all([Xt(),te()]);return tt=t,$=e,`
    <div class="page debts-page">
      <h2 class="page-title">Piutang</h2>

      <!-- Summary Cards -->
      <div class="debt-summary-cards">
        <div class="debt-summary-card primary">
          <div class="debt-card-label">Total Piutang</div>
          <div class="debt-card-value">${g($.totalOutstanding)}</div>
          <div class="debt-card-sub">${$.totalCustomers} customer</div>
        </div>
        <div class="debt-summary-card ${$.overdueCount>0?"danger":"success"}">
          <div class="debt-card-label">Jatuh Tempo</div>
          <div class="debt-card-value">${$.overdueCount}</div>
          <div class="debt-card-sub">${g($.overdueAmount)}</div>
        </div>
      </div>

      <!-- Status Breakdown -->
      <div class="status-breakdown">
        <div class="status-item" data-status="pending">
          <span class="status-dot pending"></span>
          <span class="status-label">Pending</span>
          <span class="status-count">${$.byStatus.pending.count}</span>
        </div>
        <div class="status-item" data-status="hutang">
          <span class="status-dot hutang"></span>
          <span class="status-label">Hutang</span>
          <span class="status-count">${$.byStatus.hutang.count}</span>
        </div>
        <div class="status-item" data-status="cicilan">
          <span class="status-dot cicilan"></span>
          <span class="status-label">Cicilan</span>
          <span class="status-count">${$.byStatus.cicilan.count}</span>
        </div>
      </div>

      <div class="search-bar">
        <input type="text" id="debt-search" placeholder="Cari customer atau ID transaksi..." class="search-input">
      </div>

      <div class="filter-chips">
        <button class="chip active" data-filter="all">Semua</button>
        <button class="chip" data-filter="overdue">Jatuh Tempo</button>
        <button class="chip" data-filter="pending">Pending</button>
        <button class="chip" data-filter="hutang">Hutang</button>
        <button class="chip" data-filter="cicilan">Cicilan</button>
      </div>

      <div class="compact-list" id="debt-list">
        ${ie(tt)}
      </div>

      <!-- Debt Detail Modal -->
      <div class="modal-overlay" id="debt-detail-modal">
        <div class="product-modal-card modal-lg">
          <div class="modal-header">
            <h3 class="modal-title">Detail Piutang</h3>
            <button class="modal-close" onclick="closeModal('debt-detail-modal')">&times;</button>
          </div>
          <div class="modal-body" id="debt-detail-content">
            <!-- Filled by JS -->
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" onclick="closeModal('debt-detail-modal')">Tutup</button>
            <button class="btn" id="btn-add-payment">Tambah Pembayaran</button>
          </div>
        </div>
      </div>

      <!-- Add Payment Modal -->
      <div class="modal-overlay" id="payment-modal">
        <div class="product-modal-card">
          <div class="modal-header">
            <h3 class="modal-title">Tambah Pembayaran</h3>
            <button class="modal-close" onclick="closeModal('payment-modal')">&times;</button>
          </div>
          <div class="modal-body">
            <div class="payment-info-header">
              <div class="payment-customer" id="payment-customer">-</div>
              <div class="payment-remaining">
                Sisa: <strong id="payment-remaining">Rp 0</strong>
              </div>
            </div>
            <form id="payment-form">
              <div class="form-group">
                <label>Jumlah Bayar</label>
                <input type="number" id="payment-amount" required placeholder="0" min="1">
              </div>
              <div class="form-group">
                <label>Metode Pembayaran</label>
                <select id="payment-method">
                  <option value="cash">Cash</option>
                  <option value="transfer">Transfer</option>
                  <option value="qris">QRIS</option>
                </select>
              </div>
              <div class="form-group">
                <label>Catatan (opsional)</label>
                <input type="text" id="payment-notes" placeholder="Catatan pembayaran">
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" onclick="closeModal('payment-modal')">Batal</button>
            <button type="submit" form="payment-form" class="btn">Simpan Pembayaran</button>
          </div>
        </div>
      </div>
    </div>
  `}function ie(t){return t.length===0?mt('<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',"Tidak ada piutang aktif",null,null):t.map(e=>{const a={pending:{class:"info",label:"Pending"},hutang:{class:"warning",label:"Hutang"},cicilan:{class:"purple",label:"Cicilan"}},s=a[e.status]||a.hutang,n=e.isOverdue?"overdue":"",o=(e.totalPaid/e.total*100).toFixed(0);return`
      <div class="debt-card ${n}" onclick="showDebtDetail('${e.id}')">
        <div class="debt-card-header">
          <div class="debt-customer">${m(e.customerName)}</div>
          <span class="badge badge-${s.class}">${s.label}</span>
        </div>
        <div class="debt-card-body">
          <div class="debt-tx-id">#${e.id}</div>
          <div class="debt-dates">
            <span>Transaksi: ${O(e.date)}</span>
            <span>Jatuh tempo: ${e.dueDate}</span>
          </div>
          ${e.isOverdue?`
            <div class="debt-overdue-badge">
              Terlambat ${e.daysOverdue} hari
            </div>
          `:""}
        </div>
        <div class="debt-card-footer">
          <div class="debt-amounts">
            <div class="debt-total">Total: ${g(e.total)}</div>
            <div class="debt-remaining">Sisa: <strong>${g(e.remainingBalance)}</strong></div>
          </div>
          <div class="debt-progress">
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${o}%"></div>
            </div>
            <div class="progress-text">${o}% terbayar</div>
          </div>
        </div>
      </div>
    `}).join("")}window.showDebtDetail=async t=>{const e=await Bt(t);if(b=tt.find(i=>i.id===t),!e||!b)return;const a={pending:{class:"info",label:"Pending"},hutang:{class:"warning",label:"Hutang"},cicilan:{class:"purple",label:"Cicilan"}},s=a[b.status]||a.hutang,n=(b.totalPaid/b.total*100).toFixed(0);let o="";e.paymentHistory&&e.paymentHistory.length>0&&(o=`
      <div class="detail-section">
        <h4 class="section-title">Riwayat Pembayaran</h4>
        <div class="payment-list">
          ${e.paymentHistory.map(d=>`
      <div class="payment-row">
        <div class="payment-info">
          <div class="payment-date">${d.date}</div>
          <div class="payment-method">${d.method} - ${m(d.receivedBy)}</div>
          ${d.notes?`<div class="payment-notes">${m(d.notes)}</div>`:""}
        </div>
        <div class="payment-amount">${g(d.amount)}</div>
      </div>
    `).join("")}
        </div>
      </div>
    `),document.getElementById("debt-detail-content").innerHTML=`
    <div class="detail-section">
      <div class="detail-header">
        <div>
          <h4 class="detail-name">${m(b.customerName)}</h4>
          <div class="detail-phone">${m(b.customerPhone)||"-"}</div>
        </div>
        <span class="badge badge-${s.class}">${s.label}</span>
      </div>
      ${b.isOverdue?`
        <div class="overdue-alert">
          Terlambat ${b.daysOverdue} hari dari jatuh tempo
        </div>
      `:""}
      <div class="detail-info">
        <div class="detail-row">
          <span class="detail-label">ID Transaksi</span>
          <span class="detail-value">#${b.id}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Tanggal Transaksi</span>
          <span class="detail-value">${O(b.date)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Jatuh Tempo</span>
          <span class="detail-value ${b.isOverdue?"text-danger":""}">${b.dueDate}</span>
        </div>
      </div>
    </div>

    <div class="detail-section">
      <h4 class="section-title">Ringkasan Pembayaran</h4>
      <div class="payment-summary">
        <div class="payment-summary-row">
          <span>Total Tagihan</span>
          <span>${g(b.total)}</span>
        </div>
        <div class="payment-summary-row">
          <span>Sudah Dibayar</span>
          <span class="text-success">${g(b.totalPaid)}</span>
        </div>
        <div class="payment-summary-row highlight">
          <span>Sisa Tagihan</span>
          <span>${g(b.remainingBalance)}</span>
        </div>
      </div>
      <div class="debt-progress large">
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${n}%"></div>
        </div>
        <div class="progress-text">${n}% terbayar</div>
      </div>
    </div>

    ${o}
  `,openModal("debt-detail-modal")};window.initDebts=()=>{const t=document.querySelectorAll(".chip"),e=document.getElementById("debt-search"),a=document.getElementById("btn-add-payment"),s=document.getElementById("payment-form");t.forEach(n=>{n.addEventListener("click",async()=>{t.forEach(i=>i.classList.remove("active")),n.classList.add("active"),document.querySelectorAll(".status-item").forEach(i=>i.classList.remove("active"));const o=n.dataset.filter;o==="all"?M={status:"all",search:M.search,overdue:!1}:o==="overdue"?(M.overdue=!0,M.status="all"):(M.status=o,M.overdue=!1),await it()})}),document.querySelectorAll(".status-item").forEach(n=>{n.addEventListener("click",async()=>{const o=n.dataset.status;document.querySelectorAll(".status-item").forEach(d=>d.classList.remove("active")),n.classList.add("active"),t.forEach(d=>d.classList.remove("active"));const i=document.querySelector(`.chip[data-filter="${o}"]`);i&&i.classList.add("active"),M.status=o,M.overdue=!1,await it()})}),e==null||e.addEventListener("input",async n=>{M.search=n.target.value,await it()}),a==null||a.addEventListener("click",()=>{b&&(closeModal("debt-detail-modal"),document.getElementById("payment-customer").textContent=b.customerName,document.getElementById("payment-remaining").textContent=g(b.remainingBalance),document.getElementById("payment-amount").max=b.remainingBalance,document.getElementById("payment-amount").value="",document.getElementById("payment-method").value="cash",document.getElementById("payment-notes").value="",openModal("payment-modal"))}),s==null||s.addEventListener("submit",async n=>{var r;if(n.preventDefault(),!b)return;const o=parseInt(document.getElementById("payment-amount").value),i=document.getElementById("payment-method").value,d=document.getElementById("payment-notes").value;if(o>b.remainingBalance){(r=window.showToast)==null||r.call(window,"Jumlah pembayaran melebihi sisa tagihan","warning");return}await Ae(b.id,o,i,d),closeModal("payment-modal"),await it(),$=await te(),Je()})};async function it(){tt=await Xt(M),document.getElementById("debt-list").innerHTML=ie(tt)}function Je(){const t=document.querySelectorAll(".debt-summary-card");if(t.length>=2){const e=t[0],a=e.querySelector(".debt-card-value"),s=e.querySelector(".debt-card-sub");a&&(a.textContent=g($.totalOutstanding)),s&&(s.textContent=`${$.totalCustomers} customer`);const n=t[1],o=n.querySelector(".debt-card-value"),i=n.querySelector(".debt-card-sub");o&&(o.textContent=$.overdueCount),i&&(i.textContent=g($.overdueAmount)),$.overdueCount>0?(n.classList.remove("success"),n.classList.add("danger")):(n.classList.remove("danger"),n.classList.add("success"))}}const Ve="pos_server_config";function Ke(){localStorage.removeItem(Ve)}const gt=600*1e3,We=1440*60*1e3,et="pos_admin_session",at="pos_admin_last_activity";let L=null,_t=!1,zt=0;const Ge=5e3,re=["mousedown","mousemove","keydown","scroll","touchstart","touchmove","click"];function de(){if(!_t){if(!ct()){me();return}re.forEach(t=>{document.addEventListener(t,le,{passive:!0})}),ue(),document.addEventListener("visibilitychange",()=>{document.visibilityState==="visible"&&Ze()}),_t=!0,console.log("[Session] Initialized with 10 minute timeout")}}function le(){const t=Date.now();t-zt<Ge||(zt=t,ce(),ue())}function ce(){localStorage.setItem(at,Date.now().toString())}function Ye(){const t=localStorage.getItem(at);return t?parseInt(t):Date.now()}function ue(){L&&clearTimeout(L),L=setTimeout(()=>{console.log("[Session] Inactivity timeout reached"),yt("Sesi berakhir karena tidak ada aktivitas")},gt)}function Ze(){const t=Ye(),e=Date.now()-t;if(e>=gt)console.log("[Session] Session expired while away"),yt("Sesi berakhir karena tidak ada aktivitas");else{const a=gt-e;L&&clearTimeout(L),L=setTimeout(()=>{yt("Sesi berakhir karena tidak ada aktivitas")},a)}}function rt(){localStorage.removeItem(et),localStorage.removeItem(at)}function ct(){const t=localStorage.getItem(et);if(!t)return!1;try{const e=JSON.parse(t);if(e.loginAt&&Date.now()-new Date(e.loginAt).getTime()>=We||!e.token)return rt(),!1;const a=localStorage.getItem(at);return a&&Date.now()-parseInt(a)>=gt?(rt(),!1):!0}catch{return rt(),!1}}function Qe(t){localStorage.setItem(et,JSON.stringify({...t,loginAt:new Date().toISOString()})),ce(),de()}function Xe(){try{const t=localStorage.getItem(et);return t?JSON.parse(t):null}catch{return null}}function yt(t=null){L&&(clearTimeout(L),L=null),q(),re.forEach(e=>{document.removeEventListener(e,le)}),localStorage.removeItem(et),localStorage.removeItem(at),_t=!1,t&&sessionStorage.setItem("pos_logout_reason",t),me()}function me(){window.location.hash="/login",window.location.reload()}window.addEventListener("beforeunload",()=>{L&&clearTimeout(L)});let I=null;async function ta(){const[t,e]=await Promise.all([Gt(),Pt()]);I=t;const s=(await Yt(t.id).catch(()=>({sessions:[]}))).sessions||[];ye();const n={admin:"Administrator",supervisor:"Supervisor",cashier:"Kasir"},o=localStorage.getItem("pos_device_id"),i=t.role==="admin",d=pe(s,t.id,o,i);return`
    <div class="page profile-page">
      <h2 class="page-title">Profil</h2>

      <!-- User Info Card -->
      <div class="profile-card">
        <div class="profile-avatar">
          ${m(I.fullName).charAt(0).toUpperCase()}
        </div>
        <div class="profile-info">
          <div class="profile-name">${m(I.fullName)}</div>
          <div class="profile-role-badge ${I.role}">${n[I.role]||I.role}</div>
        </div>
      </div>

      <!-- User Details -->
      <div class="section-card">
        <div class="section-header">
          <h3 class="section-title">Informasi Akun</h3>
        </div>
        <div class="profile-details">
          <div class="detail-row">
            <span class="detail-label">Username</span>
            <span class="detail-value">${m(I.username)}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Login Terakhir</span>
            <span class="detail-value">${I.lastLogin?O(I.lastLogin):"-"}</span>
          </div>
          ${i?`
          <div class="detail-row clickable" onclick="window.location.hash='/users'">
            <span class="detail-label">Aktivitas Login</span>
            <span class="detail-value">
              Lihat Semua
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 5l7 7-7 7"/>
              </svg>
            </span>
          </div>`:""}
        </div>
      </div>

      <!-- Active Devices -->
      <div class="section-card">
        <div class="section-header">
          <h3 class="section-title">Perangkat Aktif</h3>
        </div>
        <div class="sessions-list" id="sessions-list">
          ${d}
        </div>
      </div>

      <!-- Server Connection -->
      <div class="section-card">
        <div class="section-header">
          <h3 class="section-title">Koneksi Server</h3>
        </div>
        <div class="settings-list">
          <div class="setting-item">
            <span class="setting-label">Server POS</span>
            <span class="setting-value" id="current-server">${jt().host}:${jt().port}</span>
          </div>
          <div class="setting-item">
            <div class="connection-status">
              <span class="status-dot online" id="connection-dot"></span>
              <span id="connection-text">Terhubung</span>
            </div>
            <button class="btn btn-sm btn-outline" onclick="rediscoverServer()">Ubah Server</button>
          </div>
        </div>
      </div>

      <!-- Settings -->
      <div class="section-card">
        <div class="section-header">
          <h3 class="section-title">Notifikasi</h3>
        </div>
        <div class="settings-list">
          <div class="setting-item">
            <label class="setting-label">Stok rendah</label>
            <label class="toggle">
              <input type="checkbox" checked id="notify-stock">
              <span class="toggle-slider"></span>
            </label>
          </div>
          <div class="setting-item">
            <label class="setting-label">Piutang jatuh tempo</label>
            <label class="toggle">
              <input type="checkbox" checked id="notify-debt">
              <span class="toggle-slider"></span>
            </label>
          </div>
          <div class="setting-item">
            <span class="setting-label">Zona Waktu (Timezone)</span>
            <select class="select-sm" id="select-timezone" onchange="updateTimezone(this.value)">
              <option value="7">WIB (UTC+7)</option>
              <option value="8">WITA (UTC+8)</option>
              <option value="9">WIT (UTC+9)</option>
            </select>
          </div>
        </div>
      </div>

      <!-- App Info -->
      <div class="section-card">
        <div class="section-header">
          <h3 class="section-title">Aplikasi</h3>
        </div>
        <div class="app-info">
          <div class="detail-row">
            <span class="detail-label">Versi</span>
            <span class="detail-value">1.0.0</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Platform</span>
            <span class="detail-value">PWA / Mobile</span>
          </div>
        </div>
        <div class="app-actions">
          <button class="btn btn-outline btn-block" onclick="clearCache()">Hapus Cache</button>
        </div>
      </div>

      <!-- Logout -->
      <div class="logout-section">
        <button class="btn btn-danger btn-block" onclick="handleLogout()">
          Keluar dari Akun
        </button>
      </div>
    </div>
  `}function pe(t,e,a,s=!1){return t.length===0?'<div class="empty-state small">Belum ada data perangkat</div>':t.map(n=>{const o=n.device_id===a,i=n.last_seen?new Date(n.last_seen).toLocaleString("id-ID",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}):"-";return`
      <div class="session-item ${o?"current":""}">
        <div class="session-info">
          <div class="session-device">${ea(n.device_name)}</div>
          <div class="session-details">
            Terakhir aktif: ${i}
            ${o?'<span class="current-badge">Perangkat Ini</span>':""}
          </div>
        </div>
        ${!o&&s?`<button class="btn btn-sm btn-danger" onclick="revokeSession(${e}, ${n.id})">Cabut</button>`:""}
      </div>
    `}).join("")}function ea(t){if(!t)return"Perangkat tidak dikenal";if(t.includes("Android")){const e=t.match(/Android[^;)]*[;)]/);return"Android - "+(e?e[0].replace(/[;)]/g,"").trim():"Mobile")}return t.includes("iPhone")||t.includes("iPad")?"iOS - Safari":t.includes("Windows")?"Windows - Browser":t.includes("Mac")?"Mac - Browser":t.slice(0,40)+"..."}function Dt(t,e){const a=document.getElementById("confirm-dialog");a&&a.remove();const s=document.createElement("div");s.id="confirm-dialog",s.className="modal-overlay open",s.innerHTML=`
    <div class="product-modal-card">
      <div class="modal-body" style="padding: 24px 20px;">
        <p style="color: var(--text-main); font-size: 15px; line-height: 1.5;">${t}</p>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline" id="confirm-cancel">Batal</button>
        <button class="btn btn-danger" id="confirm-ok">Ya, Lanjutkan</button>
      </div>
    </div>
  `,document.body.appendChild(s),document.getElementById("confirm-cancel").onclick=()=>s.remove(),document.getElementById("confirm-ok").onclick=()=>{s.remove(),e()}}window.rediscoverServer=()=>{Dt("Cari ulang server POS?<br>Aplikasi akan dimuat ulang.",()=>{Ke(),window.location.reload()})};window.clearCache=async()=>{var t;if("caches"in window){const e=await caches.keys();await Promise.all(e.map(a=>caches.delete(a))),(t=window.showToast)==null||t.call(window,"Cache berhasil dihapus","success")}};window.handleLogout=()=>{Dt("Keluar dari akun?",()=>yt())};window.updateTimezone=async t=>{var e,a;try{const s=parseFloat(t);await je({timezone_offset:s}),(e=window.showToast)==null||e.call(window,"Zona waktu berhasil disimpan","success")}catch(s){(a=window.showToast)==null||a.call(window,"Gagal menyimpan zona waktu: "+s.message,"error")}};window.initProfile=async()=>{try{const t=await Pt(),e=document.getElementById("select-timezone");e&&t.timezone_offset?e.value=t.timezone_offset:e&&(e.value="7")}catch(t){console.error("Error init profile settings",t)}};window.revokeSession=async(t,e)=>{var a;if((I==null?void 0:I.role)!=="admin"){(a=window.showToast)==null||a.call(window,"Hanya admin yang dapat mencabut akses perangkat","error");return}Dt("Cabut akses perangkat ini?",async()=>{var s,n;try{await Te(t,e);const o=await Yt(t).catch(()=>({sessions:[]})),i=localStorage.getItem("pos_device_id");document.getElementById("sessions-list").innerHTML=pe(o.sessions||[],t,i,!0),(s=window.showToast)==null||s.call(window,"Akses perangkat dicabut","success")}catch(o){(n=window.showToast)==null||n.call(window,"Gagal mencabut akses: "+o.message,"error")}})};let Ft=[];async function aa(){const t=Xe();if((t==null?void 0:t.role)!=="admin")return window.location.hash="/","<div></div>";Ft=await He();const e={admin:"Administrator",supervisor:"Supervisor",cashier:"Kasir"};return`
    <div class="page user-activity-page">
      <div class="page-header">
        <button class="btn-back" onclick="window.history.back()">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <h2 class="page-title">Aktivitas Login</h2>
      </div>

      <div class="activity-list">
        ${Ft.map(s=>`
      <div class="section-card user-activity-card">
        <div class="user-card-header">
          <div class="user-avatar">${m(s.fullName||s.username||"U").charAt(0).toUpperCase()}</div>
          <div class="user-main-info">
            <div class="user-name">${m(s.fullName||s.username)}</div>
            <div class="user-role-badge ${s.role}">${e[s.role]||s.role}</div>
          </div>
        </div>
        <div class="user-card-details">
          <div class="detail-row">
            <span class="detail-label">Username</span>
            <span class="detail-value">@${m(s.username)}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Login Terakhir</span>
            <span class="detail-value">${s.lastLogin?O(s.lastLogin):"Belum pernah login"}</span>
          </div>
        </div>
      </div>
    `).join("")}
      </div>
    </div>
  `}window.initUserActivity=()=>{};async function sa(){const t=await Be(null);return`
    <div class="page stock-history-page">
      <div class="page-header">
        <button class="btn btn-icon" onclick="window.history.back()" aria-label="Kembali">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 class="page-title">Riwayat Stok</h2>
      </div>

      <div class="history-list full-page-list">
        ${na(t)}
      </div>
    </div>
  `}function na(t){if(t.length===0)return'<div class="empty-state">Belum ada riwayat perubahan stok</div>';const e=t.reduce((a,s)=>{const n=s.createdAt.split("T")[0];return a[n]||(a[n]=[]),a[n].push(s),a},{});return Object.keys(e).sort().reverse().map(a=>`
    <div class="history-group">
      <div class="history-date-header">${O(a)}</div>
      ${e[a].map(s=>{const n={sale:"Penjualan",manual:"Manual",restock:"Restok",adjustment:"Koreksi",import:"Import",initial:"Stok Awal"},o=s.quantity>0?"positive":"negative";return`
          <div class="history-item">
            <div class="history-icon ${s.changeType}">
               ${oa(s.changeType)}
            </div>
            <div class="history-content">
              <div class="history-title">${m(s.productName)}</div>
              <div class="history-meta">
                ${n[s.changeType]||s.changeType} • ${m(s.userName)||"-"}
                ${s.notes?`<br><span class="history-notes">"${m(s.notes)}"</span>`:""}
              </div>
            </div>
            <div class="history-change ${o}">
              ${s.quantity>0?"+":""}${s.quantity}
            </div>
          </div>
        `}).join("")}
    </div>
  `).join("")}function oa(t){return t==="sale"?'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>':t==="restock"?'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v16m-8-8h16"/></svg>':'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>'}function ia(){const t=window.APP_CONFIG||{name:"POS Admin",logo:null,tagline:"Masuk untuk mengelola toko Anda"},e=t.name,a=t.tagline||"Masuk untuk mengelola toko Anda";return`
    <div class="login-page">
      <div class="login-container">
        <div class="login-logo">
          ${t.logo?`
            <img src="${t.logo}" alt="Logo" style="width: 80px; height: 80px; object-fit: contain;">
          `:`
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
              <line x1="8" y1="21" x2="16" y2="21"/>
              <line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
          `}
        </div>
        <h1 class="login-title">${e}</h1>
        <p class="login-subtitle">${a}</p>

        <form id="login-form" class="login-form">
          <div class="form-group">
            <label for="username">Username</label>
            <div class="input-wrapper">
              <svg class="input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
              <input type="text" id="username" name="username" required 
                placeholder="Masukkan username" autocomplete="username">
            </div>
          </div>
          
          <div class="form-group">
            <label for="password">Password</label>
            <div class="input-wrapper">
              <svg class="input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
              <input type="password" id="password" name="password" required 
                placeholder="Masukkan password" autocomplete="current-password">
              <div class="toggle-password" id="toggle-password">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                </svg>
              </div>
            </div>
          </div>

          <div class="login-error" id="login-error" style="display: none;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span id="error-text"></span>
          </div>

          <button type="submit" class="btn-login" id="btn-login">
            <span class="btn-text">Masuk Sekarang</span>
          </button>
        </form>
      </div>
    </div>
  `}function ra(){const t=document.getElementById("login-form"),e=document.getElementById("login-error"),a=document.getElementById("error-text"),s=document.getElementById("btn-login"),n=document.getElementById("password"),o=document.getElementById("toggle-password"),i=sessionStorage.getItem("pos_logout_reason");i&&(sessionStorage.removeItem("pos_logout_reason"),a.textContent=i,e.style.display="flex"),setTimeout(()=>{var r;(r=document.getElementById("username"))==null||r.focus()},300),o==null||o.addEventListener("click",()=>{const r=n.getAttribute("type")==="password"?"text":"password";n.setAttribute("type",r);const l=r==="password"?'<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>':'<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path>';o.querySelector("svg").innerHTML=l}),t==null||t.addEventListener("submit",async r=>{r.preventDefault();const l=document.getElementById("username").value.trim(),c=document.getElementById("password").value;if(!l||!c){d("Username dan password wajib diisi");return}s.disabled=!0,s.innerHTML='<div class="login-spinner"></div> Memproses...',e.style.display="none";try{const u=Date.now(),p=await Ee(l,c),A=Date.now()-u;A<500&&await new Promise(_=>setTimeout(_,500-A)),p.success?(Qe({userId:p.user.id,username:p.user.username,fullName:p.user.full_name||p.user.name,role:p.user.role,token:p.token}),window.location.hash="/",window.location.reload()):d(p.message||"Login gagal, periksa username/password")}catch(u){console.error("Login error:",u),d(u.message||"Gagal terhubung ke server")}finally{!e.style.display||e.style.display==="none"||(s.disabled=!1,s.innerHTML='<span class="btn-text">Masuk Sekarang</span>')}});function d(r){a.textContent=r,e.style.display="flex",s.disabled=!1,s.innerHTML='<span class="btn-text">Masuk Sekarang</span>',e.style.animation="none",e.offsetHeight,e.style.animation="shake 0.4s ease-in-out"}}function da(t){const e=(s,n=52,o=6,i="var(--radius-sm)")=>Array.from({length:s},()=>`<span class="sk" style="width:100%;height:${n}px;margin-bottom:${o}px;border-radius:${i};"></span>`).join(""),a=s=>s.map(n=>`<span class="sk sk-pill" style="flex-shrink:0;width:${n}px;height:30px;"></span>`).join("");switch(t){case"/":return`
        <div class="page dashboard-page">
          <div class="page-header">
            <span class="sk" style="width:110px;height:24px;border-radius:6px;"></span>
          </div>
          <div class="section-card chart-card">
            <span class="sk" style="width:55%;height:15px;margin-bottom:8px;"></span>
            <span class="sk" style="width:28%;height:12px;margin-bottom:20px;"></span>
            <span class="sk" style="width:100%;height:138px;border-radius:var(--radius-md);"></span>
          </div>
          <div class="quick-stats">
            ${e(4,64,0,"var(--radius-md)")}
          </div>
          <div class="summary-row">
            <span class="sk" style="height:78px;border-radius:var(--radius-md);"></span>
            <span class="sk" style="height:78px;border-radius:var(--radius-md);"></span>
          </div>
          <div class="section-card">
            <span class="sk" style="width:48%;height:15px;margin-bottom:16px;"></span>
            ${e(5,52,6)}
          </div>
        </div>`;case"/products":return`
        <div class="page products-page">
          <div class="page-header">
            <span class="sk" style="width:80px;height:24px;border-radius:6px;"></span>
          </div>
          <span class="sk" style="width:100%;height:42px;margin-bottom:12px;border-radius:var(--radius-md);"></span>
          <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;">
            ${a([70,90,80,75,65])}
          </div>
          ${e(8,62,6)}
        </div>`;case"/transactions":return`
        <div class="page transactions-page">
          <span class="sk" style="width:110px;height:24px;border-radius:6px;margin-bottom:16px;"></span>
          <span class="sk" style="width:100%;height:42px;margin-bottom:10px;border-radius:var(--radius-md);"></span>
          <div style="display:flex;gap:8px;margin-bottom:12px;overflow:hidden;">
            ${a([60,72,78,72,60,55])}
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px;">
            <span class="sk" style="height:50px;border-radius:var(--radius-md);"></span>
            <span class="sk" style="height:50px;border-radius:var(--radius-md);"></span>
          </div>
          ${e(5,72,8,"var(--radius-md)")}
        </div>`;case"/debts":return`
        <div class="page debts-page">
          <span class="sk" style="width:90px;height:24px;border-radius:6px;margin-bottom:16px;"></span>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
            ${Array.from({length:4},()=>'<span class="sk" style="height:78px;border-radius:var(--radius-md);"></span>').join("")}
          </div>
          <div style="display:flex;gap:8px;margin-bottom:16px;overflow:hidden;">
            ${a([65,80,75,70])}
          </div>
          ${e(5,72,8,"var(--radius-md)")}
        </div>`;case"/profile":return`
        <div class="page profile-page">
          <div style="display:flex;align-items:center;gap:16px;padding:20px;background:var(--surface);border-radius:var(--radius-lg);margin-bottom:20px;border:1px solid var(--border-light);">
            <span class="sk" style="width:60px;height:60px;border-radius:50%;flex-shrink:0;"></span>
            <div style="flex:1;">
              <span class="sk" style="width:55%;height:17px;margin-bottom:8px;"></span>
              <span class="sk" style="width:38%;height:13px;"></span>
            </div>
          </div>
          ${[1,2].map(()=>`
            <div class="section-card" style="margin-bottom:12px;">
              <span class="sk" style="width:42%;height:15px;margin-bottom:14px;"></span>
              ${e(3,46,6)}
            </div>`).join("")}
        </div>`;default:return`
        <div class="page">
          <span class="sk" style="width:130px;height:24px;border-radius:6px;margin-bottom:20px;"></span>
          ${[1,2,3].map(()=>`
            <div class="section-card" style="margin-bottom:12px;">
              <span class="sk" style="width:44%;height:15px;margin-bottom:14px;"></span>
              ${e(3,48,6)}
            </div>`).join("")}
        </div>`}}const Jt={"/":qe,"/products":Ne,"/products/add":Ot,"/products/edit":Ot,"/transactions":ze,"/debts":Fe,"/profile":ta,"/login":ia,"/stock-history":sa,"/users":aa},Q=new Map;let ut=!1,j=null;const la=15e3;function ca(t){return Promise.race([t,new Promise((e,a)=>setTimeout(()=>a(new Error("__TIMEOUT__")),la))])}window.retryCurrentPage=()=>{j&&Q.delete(j),z()};function ua(){const t=window.location.hash.slice(1)||"/",[e,a]=t.split("?");return{path:e||"/",query:ma(a)}}function ma(t){return t?t.split("&").reduce((e,a)=>{const[s,n]=a.split("=");try{s&&(e[decodeURIComponent(s)]=decodeURIComponent(n||""))}catch{}return e},{}):{}}async function z(){var r,l;if(!ut)return;const{path:t,query:e}=ua();if(t===j&&t!=="/products/edit"&&!(t==="/products"&&e.filter))return;if(t!=="/login"&&!ct()){window.location.hash="/login";return}if(t==="/login"&&ct()){window.location.hash="/";return}const a=document.getElementById("page");document.querySelectorAll(".nav-item"),j=t,a.querySelectorAll(".page-instance").forEach(c=>{c.dataset.path!==t&&(c.classList.remove("active"),setTimeout(()=>{c.classList.contains("active")||(c.style.display="none")},300))});let n=Q.get(t);const o=!n;o&&(n=document.createElement("div"),n.className="page-instance",n.dataset.path=t,n.style.display="none",a.appendChild(n),Q.set(t,n));const i=document.getElementById("navbar"),d=document.getElementById("bottom-nav");if(t==="/login")i.style.display="none",d.style.display="none",document.body.style.paddingTop="0",document.body.style.paddingBottom="0";else{let c={title:"Toko Bersama App",showBack:!1,onRefresh:!1};t==="/"?c={title:"Dashboard",showBack:!1,onRefresh:!0}:t==="/products"?c={title:"Produk",showBack:!1,onRefresh:!1}:t==="/products/add"?c={title:"Tambah Produk",showBack:!0,onRefresh:!1}:t==="/products/edit"?c={title:"Edit Produk",showBack:!0,onRefresh:!1}:t==="/transactions"?c={title:"Transaksi",showBack:!1,onRefresh:!1}:t==="/debts"?c={title:"Piutang",showBack:!1,onRefresh:!1}:t==="/profile"?c={title:"Profil",showBack:!1,onRefresh:!1}:t==="/stock-history"?c={title:"Riwayat Stok",showBack:!0,onRefresh:!1}:t==="/users"&&(c={title:"Aktivitas User",showBack:!0,onRefresh:!1}),i.innerHTML=Vt(c),i.style.display="";const u={products:((r=window._dashboardStats)==null?void 0:r.lowStockCount)||0,debts:((l=window._dashboardStats)==null?void 0:l.overdueCount)||0};d.innerHTML=Kt(u),d.style.display="",document.body.style.paddingTop="",document.body.style.paddingBottom=""}try{const c=Jt[t]||Jt["/"];if(o||t==="/products/edit"||t==="/products/add"){t!=="/login"&&(n.innerHTML=da(t),n.style.display="block",requestAnimationFrame(()=>n.classList.add("active")));const u=await ca(c(e));n.innerHTML=u,t==="/login"&&ra(),t==="/"&&window.initDashboard&&window.initDashboard(),t==="/products"&&window.initProducts&&window.initProducts(),t==="/transactions"&&window.initTransactions&&window.initTransactions(),t==="/debts"&&window.initDebts&&window.initDebts(),t==="/profile"&&window.initProfile&&window.initProfile(),t==="/stock-history"&&window.initStockHistory&&window.initStockHistory(),t==="/users"&&window.initUserActivity&&window.initUserActivity(),(t==="/products/add"||t==="/products/edit")&&window.initProductForm&&window.initProductForm()}else t==="/"&&window.initDashboard&&window.initDashboard(),t==="/products"&&window.initProducts&&window.initProducts(e);n.classList.contains("active")||(n.style.display="block",requestAnimationFrame(()=>n.classList.add("active"))),t!=="/login"&&ct()&&de()}catch(c){const u=c.message==="__TIMEOUT__",p=u?"Koneksi ke server terlalu lama.<br>Periksa jaringan Anda dan coba lagi.":(c.message||"Terjadi kesalahan").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");j&&Q.delete(j),n.innerHTML=`
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 20px;text-align:center;gap:16px;min-height:60vh;">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color:var(--text-muted);flex-shrink:0;">
          ${u?'<path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>':'<path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>'}
        </svg>
        <p style="color:var(--text-secondary);font-size:14px;line-height:1.6;max-width:280px;margin:0;">${p}</p>
        <button class="btn btn-outline" onclick="window.retryCurrentPage()">Coba Lagi</button>
      </div>
    `,n.style.display="block",n.classList.add("active")}pa(t)}function pa(t){document.querySelectorAll(".nav-item").forEach(e=>{e.classList.toggle("active",e.dataset.path===t)})}async function va(){if(window.location.hostname==="localhost"||window.location.hostname==="127.0.0.1"){bt("localhost",3001),ut=!0,xt(),z();return}if(["admin.tbersamapalandan.my.id","admin.tbersama.my.id","app.tbersamapalandan.my.id"].includes(window.location.hostname)){bt(window.location.hostname,443,"https"),ut=!0,xt(),z();return}bt(window.location.hostname,443,"https"),ut=!0,xt(),z()}function xt(){document.getElementById("navbar").innerHTML=Vt({title:"Toko Bersama App",showBack:!1,onRefresh:!1}),document.getElementById("bottom-nav").innerHTML=Kt()}window.refreshCurrentPage=async()=>{const t=j;Q.delete(t),j=null,await z()};window.addEventListener("hashchange",z);window.addEventListener("load",va);"serviceWorker"in navigator&&navigator.serviceWorker.register("/sw.js").then(t=>{t.addEventListener("updatefound",()=>{const e=t.installing;e.addEventListener("statechange",()=>{e.state==="installed"&&navigator.serviceWorker.controller&&ha(()=>window.location.reload())})})}).catch(()=>{});function ha(t){if(document.getElementById("pwa-update-banner"))return;const a=document.createElement("div");a.id="pwa-update-banner",a.innerHTML=`
    <span>Versi terbaru tersedia</span>
    <button id="btn-pwa-update">Muat Ulang</button>
    <button id="btn-pwa-dismiss">✕</button>
  `,document.body.appendChild(a),document.getElementById("btn-pwa-update").addEventListener("click",()=>{a.remove(),t()}),document.getElementById("btn-pwa-dismiss").addEventListener("click",()=>{a.remove()})}window.showToast=St;window.openModal=t=>{const e=document.getElementById(t);e&&(e.classList.add("open"),document.body.classList.add("modal-open"),e.addEventListener("click",a=>{a.target===e&&window.closeModal(t)},{once:!0}))};window.closeModal=t=>{var e;(e=document.getElementById(t))==null||e.classList.remove("open"),document.body.classList.remove("modal-open")};document.addEventListener("click",t=>{t.target.classList.contains("modal-overlay")&&(t.target.classList.remove("open"),document.body.classList.remove("modal-open"))});function ve(){const t=navigator.onLine;document.body.classList.toggle("offline-mode",!t),t?document.body.classList.contains("was-offline")&&St("Koneksi terpulihkan","success",2500):St("Koneksi terputus. Beberapa fitur mungkin tidak tersedia.","warning",5e3),document.body.classList.toggle("was-offline",!t)}window.addEventListener("online",ve);window.addEventListener("offline",ve);
