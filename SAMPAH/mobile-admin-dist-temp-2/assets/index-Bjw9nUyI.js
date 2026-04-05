(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))s(n);new MutationObserver(n=>{for(const i of n)if(i.type==="childList")for(const o of i.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&s(o)}).observe(document,{childList:!0,subtree:!0});function a(n){const i={};return n.integrity&&(i.integrity=n.integrity),n.referrerPolicy&&(i.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?i.credentials="include":n.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function s(n){if(n.ep)return;n.ep=!0;const i=a(n);fetch(n.href,i)}})();function g(t){return new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",minimumFractionDigits:0,maximumFractionDigits:0}).format(t)}function rt(t){return new Intl.NumberFormat("id-ID").format(t)}function R(t){if(!t)return"";const e=String(t),a=/Z|[+-]\d{2}:?\d{2}$/.test(e)?e:e.replace(" ","T")+"Z",s=new Date(a);return isNaN(s.getTime())?t:new Intl.DateTimeFormat("id-ID",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"}).format(s)}function z(t){const e=String(t).replace(/\D/g,"");return e?new Intl.NumberFormat("id-ID").format(parseInt(e)):""}function dt(t){return t&&parseInt(String(t).replace(/\D/g,""))||0}function Ut(t){const e=document.getElementById(t);e&&(e.addEventListener("input",a=>{const s=a.target.selectionStart;a.target.value.length;const n=a.target.value,i=z(a.target.value);a.target.value=i,i.length;const o=(n.slice(0,s).match(/\./g)||[]).length,d=Math.max(0,s-o);let r=0,l=0;for(let c=0;c<i.length;c++)if(i[c]!=="."&&r++,r>=d){l=c+1;break}a.target.setSelectionRange(l,l)}),e.value&&(e.value=z(e.value)))}function Ce(){const t=navigator.userAgent;let e="Unknown Device",a="Unknown Browser",s="Unknown OS";if(/Android/i.test(t)){s="Android";const n=t.match(/Android[^;]*;\s*([^)]+)/);n&&(e=n[1].split("Build")[0].trim())}else/iPhone|iPad|iPod/i.test(t)?(s="iOS",/iPhone/i.test(t)?e="iPhone":/iPad/i.test(t)?e="iPad":e="iPod"):/Windows/i.test(t)?(s="Windows",e="PC"):/Mac/i.test(t)?(s="macOS",e="Mac"):/Linux/i.test(t)&&(s="Linux",e="PC");return/Chrome/i.test(t)&&!/Edg/i.test(t)?a="Chrome":/Safari/i.test(t)&&!/Chrome/i.test(t)?a="Safari":/Firefox/i.test(t)?a="Firefox":/Edg/i.test(t)?a="Edge":/Opera|OPR/i.test(t)&&(a="Opera"),{device:e,browser:a,os:s,displayName:e!=="Unknown Device"?e:`${a} on ${s}`}}function ht(t,e,a=null,s=null){return`
    <div class="empty-state-full">
      <div class="empty-icon">${t}</div>
      <div class="empty-message">${e}</div>
      ${a?`<button class="btn btn-outline btn-sm" onclick="${s}">${a}</button>`:""}
    </div>
  `}function p(t){return t==null?"":String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}let Y=null;function Le(){return Y||(Y=document.createElement("div"),Y.className="toast-container",document.body.appendChild(Y)),Y}function Ct(t,e="success",a=3e3){const s=Le(),n=document.createElement("div");n.className=`toast toast-${e}`;const i={success:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>',error:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>',warning:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',info:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'};n.innerHTML=`
    <span class="toast-icon">${i[e]||i.info}</span>
    <span class="toast-text">${p(t)}</span>
  `,s.appendChild(n);const o=()=>{n.classList.add("toast-out"),n.addEventListener("animationend",()=>n.remove(),{once:!0})},d=setTimeout(o,a);n.addEventListener("click",()=>{clearTimeout(d),o()})}function te(t={}){const e=t.title||"Toko Bersama App",a=t.showBack===!0,s=t.onRefresh===!0;return`
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
  `}function ee(t={}){return`
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
  `}let At="http",at=window.location.hostname==="localhost"?"localhost":window.location.hostname,F=3001,_e=3002;function b(){const t=F&&F!==80&&F!==443?`:${F}`:"";return`${At}://${at}${t}/api`}function jt(){if(at==="localhost"){const t=`:${_e}`;return`${At}://${at}${t}/api/v2`}return b()+"/v2"}const L=new Map,Be=50;function Me(t){return t.includes("/settings")||t.includes("/categories")?300*1e3:t.includes("/products")?60*1e3:t.includes("/dashboard")?35*1e3:30*1e3}function N(t=null){if(!t)L.clear(),console.log("[API Cache] All cleared");else{for(const e of L.keys())e.includes(t)&&L.delete(e);console.log(`[API Cache] Cleared keys containing: ${t}`)}}function Q(t,e=3001,a="http"){console.log("[API] Check for Proxy v3.2-fix"),at=t,F=e,At=a,console.log(`[API] Server set to ${a}://${t}:${e}`)}function Ft(){return{host:at,port:F}}function Pe(){let t=localStorage.getItem("pos_device_id");return t||(t=crypto.randomUUID(),localStorage.setItem("pos_device_id",t)),t}function De(){try{const t=localStorage.getItem("pos_admin_session");return t?JSON.parse(t).token:null}catch{return null}}function Lt(t=null){localStorage.removeItem("pos_admin_session"),localStorage.removeItem("pos_admin_last_activity"),L.clear(),t&&sessionStorage.setItem("pos_logout_reason",t),(window.location.hash.replace("#","").split("?")[0]||"/")!=="/login"&&(window.location.hash="/login",window.location.reload())}async function Ae(t,e,a=2,s=1500){for(let n=0;n<=a;n++)try{return await fetch(t,e)}catch(i){if(!!i.status||n===a)throw i;await new Promise(d=>setTimeout(d,s*(n+1)))}}async function f(t,e={}){const a=!e.method||e.method==="GET",s=t;if(a&&!e.bypassCache&&L.has(s)){const o=L.get(s);if(Date.now()<o.expiry)return console.log("[API Cache] Hit:",t),o.data;L.delete(s)}const n=De(),i=n?{Authorization:`Bearer ${n}`}:{};try{const o=await Ae(t,{...e,headers:{"Content-Type":"application/json",...i,...e.headers}});if(o.status===401&&!e.skipAuthRedirect){try{const r=await o.clone().json();Lt(r.message)}catch{Lt()}return}let d;try{d=await o.json()}catch{throw new Error(`Server error (${o.status})`)}if(!o.ok||d.success===!1)throw new Error(d.message||`Request failed (${o.status})`);return a?(L.size>=Be&&L.delete(L.keys().next().value),L.set(s,{data:d,expiry:Date.now()+Me(t)})):(t.includes("/products")&&N("/products"),t.includes("/categories")&&N("/categories"),t.includes("/transactions")&&N("/transactions"),t.includes("/debts")&&N("/debts"),t.includes("/dashboard")&&N("/dashboard"),(t.includes("/users")||t.includes("/auth"))&&N("/users")),d}catch(o){throw console.error("[API Error]",t,o.message),o.name==="TypeError"&&o.message.includes("fetch")?new Error("Tidak dapat terhubung ke server. Periksa koneksi jaringan."):o}}async function je(){var m,w,E,V,ot,K;let t;try{t=await f(`${jt()}/dashboard/stats`),console.log("[Rust Service] Dashboard stats fetched successfully");try{const y=await f(`${b()}/dashboard/stats`,{bypassCache:!0});t.total_products=t.total_products||y.total_products,t.yesterday_profit=t.yesterday_profit||y.yesterday_profit,t.debt_total_outstanding=t.debt_total_outstanding||y.debt_total_outstanding,t.low_stock_products=t.low_stock_products||y.low_stock_products,t.slowMovingProducts=t.slowMovingProducts||y.slowMovingProducts}catch{}}catch(y){console.warn("[Rust Service] Unavailable, falling back to Express:",y.message),t=await f(`${b()}/dashboard/stats`,{bypassCache:!0})}const e=["Min","Sen","Sel","Rab","Kam","Jum","Sab"],a=[];for(let y=6;y>=0;y--){const B=new Date;B.setDate(B.getDate()-y);const W=B.toISOString().split("T")[0],q=(t.last_7_days||[]).find(G=>G.date===W);a.push({day:e[B.getDay()],amount:q&&(q.total||q.sales)||0,fullDate:W})}const s=[];for(let y=29;y>=0;y--){const B=new Date;B.setDate(B.getDate()-y);const W=B.toISOString().split("T")[0],q=(t.last_30_days||[]).find(Te=>Te.date===W),G=B.getMonth()+1,xt=B.getDate(),Ee=`${xt<10?"0"+xt:xt}/${G<10?"0"+G:G}`;s.push({day:Ee,amount:q&&(q.total||q.sales)||0,fullDate:W})}const n=(t.top_products_today||[]).map(y=>({name:y.product_name||y.name,sold:y.qty||y.quantity,revenue:y.total})),i=[];t.low_stock_products&&t.low_stock_products.forEach(y=>{i.push({type:"lowStock",message:`${y.name} stok tersisa ${y.stock}`,time:"Stok rendah"})}),t.debt_overdue_count>0&&i.push({type:"overdue",message:`${t.debt_overdue_count} piutang jatuh tempo`,time:"Perlu tindakan"});const o=t.today_sales_total||((m=t.today_sales)==null?void 0:m.total)||0,d=t.today_sales_count||((w=t.today_sales)==null?void 0:w.count)||0,r=t.yesterday_sales_total||((E=t.yesterday_sales)==null?void 0:E.total)||0,l=t.yesterday_sales_count||((V=t.yesterday_sales)==null?void 0:V.count)||0,c=((ot=t.today_profit)==null?void 0:ot.profit)??t.today_profit??0,u=((K=t.yesterday_profit)==null?void 0:K.profit)??t.yesterday_profit??0;return{todaySales:o,yesterdaySales:r,todayProfit:c,yesterdayProfit:u,todayTransactions:d,yesterdayTransactions:l,totalProducts:t.total_products||0,lowStockCount:t.low_stock_count||0,totalDebt:t.debt_total_outstanding||t.totalDebt||0,overdueCount:t.debt_overdue_count||t.overdueCount||0,weekSales:a,monthSales:s,topProducts:n,slowMovingProducts:t.slowMovingProducts||[],recentAlerts:i,fetchedAt:new Date().toISOString()}}async function ae(t=120){let e;try{return e=await f(`${jt()}/products/slow-moving?days=${t}`),console.log("[Rust Service] Slow moving products fetched successfully"),(Array.isArray(e)?e:e.products||[]).map(s=>({name:s.name,stock:s.stock,lastSold:s.last_sale||s.last_sold_date,daysSinceLastSale:s.days_since_sale||s.days_since_last_sale||s.days_inactive||t,daysSinceAdded:s.days_since_added}))}catch(a){console.warn("[Rust Service] Unavailable, falling back to Express:",a.message),e=await f(`${b()}/products/slow-moving?days=${t}`)}return(e.products||[]).map(a=>({name:a.name,stock:a.stock,lastSold:a.last_sold_date,daysSinceLastSale:a.days_since_last_sale||a.days_inactive||t,daysSinceAdded:a.days_since_added}))}async function se(){const t=JSON.parse(localStorage.getItem("pos_admin_session")||"null"),e=(t==null?void 0:t.userId)||1;try{const s=(await f(`${b()}/users/${e}`)).user||{};return{id:s.id,username:s.username||"User",fullName:s.full_name||s.username||"User",role:s.role||"cashier",lastLogin:s.last_login||null}}catch(a){throw console.error("[API] fetchCurrentUser failed:",a.message),(a.message.includes("tidak ditemukan")||a.message.includes("404"))&&(console.warn("[Session] User ID no longer valid, logging out..."),Lt("Sesi pengguna tidak valid")),a}}async function qe(t,e){return await f(`${b()}/auth/login`,{method:"POST",skipAuthRedirect:!0,body:JSON.stringify({username:t,password:e,device_id:Pe(),device_name:navigator.userAgent.slice(0,150)})})}async function ne(t){return f(`${b()}/users/${t}/sessions`,{bypassCache:!0})}async function Ne(t,e){return f(`${b()}/users/${t}/sessions/${e}`,{method:"DELETE"})}async function ie(){return(await f(`${b()}/categories`)).categories||[]}async function He(t){const e=await f(`${b()}/categories`,{method:"POST",body:JSON.stringify({name:t})});return{id:e.id,name:e.name}}async function Oe(){return(await f(`${b()}/products/generate-barcode`,{bypassCache:!0})).barcode}async function kt(t="",e={},a=null,s=0){const n=new URLSearchParams;t&&n.append("search",t),e.categoryId&&n.append("category_id",e.categoryId),e.lowStock&&n.append("low_stock","true"),e.sortBy&&n.append("sort_by",e.sortBy),e.sortOrder&&n.append("sort_order",e.sortOrder),a&&n.append("limit",a),s&&n.append("offset",s);const i=await f(`${b()}/products?${n}`);let o=i.data||i.products,d=i.total;o||(o=Object.keys(i).filter(l=>l!=="success"&&!isNaN(l)).map(l=>i[l]),d||(d=o.length));let r=o.map(l=>({id:l.id,name:l.name,barcode:l.barcode,price:l.price,cost:l.cost,stock:l.stock,unit:l.unit||"pcs",category:l.category_name||l.category,categoryId:l.category_id}));return a!==null?{data:r,total:d||r.length}:r}async function Re(t){const e=JSON.parse(localStorage.getItem("pos_admin_session")||"null"),a={...t,userId:(e==null?void 0:e.userId)||1,userName:(e==null?void 0:e.username)||"Admin"};return await f(`${b()}/products`,{method:"POST",body:JSON.stringify(a)})}async function Ue(t,e){const a=JSON.parse(localStorage.getItem("pos_admin_session")||"null"),s={...e,userId:(a==null?void 0:a.userId)||1,userName:(a==null?void 0:a.username)||"Admin"};return await f(`${b()}/products/${t}`,{method:"PUT",body:JSON.stringify(s)})}async function Fe(t=null){const e=t?`${b()}/stock-history?productId=${t}`:`${b()}/stock-history`;return((await f(e)).history||[]).map(s=>({id:s.id,productId:s.product_id,productName:s.product_name,changeType:s.event_type||"manual",quantity:s.quantity_change||0,previousStock:s.quantity_before,newStock:s.quantity_after,notes:s.notes,createdAt:s.created_at,userName:s.user_name}))}async function ze(t,e,a=""){const s=JSON.parse(localStorage.getItem("pos_admin_session")||"null"),n=(s==null?void 0:s.userId)||1;return await f(`${b()}/products/${t}/stock`,{method:"POST",body:JSON.stringify({adjustment:e,userId:n,notes:a})})}async function oe(t={}){const e=new URLSearchParams;return t.status&&t.status!=="all"&&e.append("status",t.status),t.dateFrom&&e.append("date_from",t.dateFrom),t.dateTo&&e.append("date_to",t.dateTo),t.search&&e.append("search",t.search),((await f(`${b()}/transactions?${e}`)).transactions||[]).map(s=>{var n;return{id:s.id,invoiceNumber:s.invoice_number,date:s.created_at,total:s.total,amountPaid:s.amount_paid,remainingBalance:s.remaining_balance,change:s.change_amount,items:s.item_count||((n=s.items)==null?void 0:n.length)||0,status:s.payment_status||"lunas",paymentStatus:s.payment_status,paymentMethod:s.payment_method,cashierName:s.cashier_name,customerName:s.customer_name,customerPhone:s.customer_phone,dueDate:s.due_date,paymentNotes:s.payment_notes,itemDetails:s.items}})}async function qt(t){var s;let e,a;try{e=await f(`${jt()}/transactions/${t}`),console.log("[Rust Service] Transaction detail fetched successfully"),a=e.transaction||e}catch(n){console.warn("[Rust Service] Unavailable, falling back to Express:",n.message),e=await f(`${b()}/transactions/${t}`),a=e.transaction}return{id:a.id,invoiceNumber:a.invoice_number||a.invoiceNumber,date:a.created_at||a.date,total:a.total,amountPaid:a.amount_paid||a.amountPaid,remainingBalance:a.remaining_balance||a.remainingBalance,change:a.change_amount||a.change,items:a.item_count||((s=a.items)==null?void 0:s.length)||0,status:a.payment_status||a.status||"lunas",paymentMethod:a.payment_method||a.paymentMethod,cashierName:a.cashier_name||a.cashierName,customerName:a.customer_name||a.customerName,dueDate:a.due_date||a.dueDate,itemDetails:a.items||a.itemDetails,paymentHistory:a.payment_history||a.paymentHistory||[],paymentNotes:a.payment_notes||a.paymentNotes}}async function Je(t,e){return await f(`${b()}/transactions/${t}/void`,{method:"POST",body:JSON.stringify({reason:e})})}async function re(t={}){const e=new URLSearchParams;return t.status&&t.status!=="all"&&e.append("status",t.status),t.overdue&&e.append("overdue","true"),t.search&&e.append("search",t.search),((await f(`${b()}/debts?${e}`)).debts||[]).map(s=>({id:s.invoice_number||s.id,customerName:s.customer_name,customerPhone:s.customer_phone,date:s.created_at,total:s.total,totalPaid:s.total_paid,remainingBalance:s.remaining_balance,dueDate:s.due_date,status:s.payment_status,isOverdue:s.is_overdue,daysOverdue:s.days_overdue||0}))}async function de(){const t=await f(`${b()}/debts/summary`),e={pending:{count:0,total:0},hutang:{count:0,total:0},cicilan:{count:0,total:0}};return Array.isArray(t.by_status)&&t.by_status.forEach(a=>{a.payment_status&&e[a.payment_status]&&(e[a.payment_status]={count:a.count||0,total:a.total||0})}),{totalOutstanding:t.total_outstanding||0,totalCustomers:t.total_count||0,overdueCount:t.overdue_count||0,overdueAmount:t.overdue_total||0,byStatus:e}}async function Ve(t,e,a,s){const n=JSON.parse(localStorage.getItem("pos_admin_session")||"null");return await f(`${b()}/transactions/${t}/payment`,{method:"POST",body:JSON.stringify({amount:e,method:a,userId:(n==null?void 0:n.userId)||1,notes:s})})}async function Nt(){try{return(await f(`${b()}/settings`)).settings||{}}catch(t){return console.warn("Failed to fetch settings, using defaults",t),{default_margin_percent:10.5}}}async function Ke(t){try{return await f(`${b()}/settings`,{method:"POST",body:JSON.stringify(t)})}catch(e){throw console.error("Failed to update settings",e),e}}async function We(){return(await f(`${b()}/users`,{bypassCache:!0})).users}let P=[],S=[],Z=120;async function Ge(){const[t,e]=await Promise.all([je(),ae(Z)]);P=t.topProducts,S=e;const a=t.yesterdaySales>0?((t.todaySales-t.yesterdaySales)/t.yesterdaySales*100).toFixed(1):0;t.yesterdayTransactions>0&&((t.todayTransactions-t.yesterdayTransactions)/t.yesterdayTransactions*100).toFixed(1);const s={week:t.weekSales,month:t.monthSales||[]},n=s.week.reduce((r,l)=>r+l.amount,0),i=s.month.reduce((r,l)=>r+l.amount,0),o=t.todaySales>=t.yesterdaySales?"positive":"negative",d=t.yesterdaySales>0?((t.todaySales-t.yesterdaySales)/t.yesterdaySales*100).toFixed(1):0;return window.dashboardData=s,window.currentChartPeriod="week",window._dashboardStats=t,window.renderChart=r=>{const l=window.dashboardData[r],c=Math.max(...l.map(u=>u.amount))||1;return l.map((u,m)=>{const w=u.amount/c*100,E=r==="week"&&m===l.length-1;return`
        <div class="chart-col${E?" chart-col-today":""}" data-amount="${u.amount}" onclick="handleChartTap(this)">
          <span class="chart-val-label"></span>
          <div class="chart-bar-bg">
            <div class="chart-bar-fill" style="height: ${w}%"></div>
          </div>
          <span class="chart-label">${E?"<strong>"+u.day+"</strong>":u.day}</span>
        </div>
      `}).join("")},window.updateChartHeader=r=>{const l=r==="week"?n:i;document.getElementById("chart-total-value").textContent=g(l),document.getElementById("chart-total-label").textContent=r==="week"?"Total 7 Hari":"Total 30 Hari",document.querySelectorAll(".chart-filter-btn").forEach(c=>{c.classList.toggle("active",c.dataset.period===r)}),document.getElementById("dashboard-chart-container").innerHTML=window.renderChart(r),document.getElementById("dashboard-chart-container").className=`chart-container ${r==="month"?"compact-bars":""}`},setTimeout(()=>{window.updateChartHeader("week")},0),window.refreshDashboard=async()=>{var r;(r=window.refreshCurrentPage)==null||r.call(window)},`
    <div class="page dashboard-page">
      <div class="page-header">
        <h2 class="page-title">
          Dashboard
          <span style="font-size: 11px; font-weight: 500; color: var(--text-muted); margin-top: 4px; display: block; letter-spacing: 0;">
            Data per ${R(t.fetchedAt)}
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
              <span class="chart-trend ${o==="positive"?"positive":"negative"}">
                ${o==="positive"?"↗":"↘"} ${Math.abs(d)}%
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
          <div class="quick-stat-value" data-value="${t.todayTransactions}">${rt(t.todayTransactions)}</div>
          <div class="quick-stat-label">Transaksi</div>
        </div>
        <div class="quick-stat">
          <div class="quick-stat-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
          </div>
          <div class="quick-stat-value" data-value="${t.totalProducts}">${rt(t.totalProducts)}</div>
          <div class="quick-stat-label">Total Produk</div>
        </div>
        <div class="quick-stat ${t.lowStockCount>0?"warning":""}" onclick="window.location.hash='/products?filter=low'" style="cursor: pointer">
          <div class="quick-stat-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <div class="quick-stat-value" data-value="${t.lowStockCount}">${rt(t.lowStockCount)}</div>
          <div class="quick-stat-label">Stok Menipis</div>
        </div>
        <div class="quick-stat ${t.overdueCount>0?"danger":""}" onclick="window.location.hash='/debts'" style="cursor: pointer">
          <div class="quick-stat-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div class="quick-stat-value" data-value="${t.overdueCount}">${rt(t.overdueCount)}</div>
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
                  <div class="alert-message">${p(r.message)}</div>
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
          <span class="list-count" id="top-count">5 dari ${P.length}</span>
        </div>
        <div class="list-container" id="top-products-list">
          ${_t(P.slice(0,5))}
        </div>
        ${P.length>5?`
          <button class="expand-btn" id="btn-expand-top" onclick="toggleTopProducts()">
            <span>Lihat Semua</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 6l4 4 4-4"/>
            </svg>
          </button>
        `:""}
      </div>

    </div>
  `}function _t(t){return t.length===0?'<div class="empty-state small">Tidak ada data</div>':t.map((e,a)=>`
    <div class="list-item">
      <div class="list-rank">${a+1}</div>
      <div class="list-content">
        <div class="list-title">${p(e.name)}</div>
        <div class="list-subtitle">${e.sold} terjual</div>
      </div>
      <div class="list-value">${g(e.revenue)}</div>
    </div>
  `).join("")}function Bt(t){return t.length===0?"":t.map((e,a)=>`
    <div class="list-item slow-item">
      <div class="list-rank danger">${a+1}</div>
      <div class="list-content">
        <div class="list-title">${p(e.name)}</div>
        <div class="list-subtitle">
          Stok: ${e.stock} •
          ${e.lastSold?`Terakhir: ${e.lastSold}`:"Belum pernah terjual"}
        </div>
      </div>
      <div class="list-days">
        <span class="days-badge">${e.daysSinceLastSale} hari</span>
      </div>
    </div>
  `).join("")}let St=!1,mt=!1;window.toggleTopProducts=()=>{St=!St;const t=document.getElementById("top-products-list"),e=document.getElementById("btn-expand-top"),a=document.getElementById("top-count");St?(t.innerHTML=_t(P.slice(0,30)),e.innerHTML=`
      <span>Tutup</span>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 10l4-4 4 4"/>
      </svg>
    `,e.classList.add("expanded"),a.textContent=`${Math.min(30,P.length)} dari ${P.length}`):(t.innerHTML=_t(P.slice(0,5)),e.innerHTML=`
      <span>Lihat Semua (${P.length})</span>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 6l4 4 4-4"/>
      </svg>
    `,e.classList.remove("expanded"),a.textContent=`5 dari ${P.length}`)};window.toggleSlowProducts=()=>{mt=!mt;const t=document.getElementById("slow-products-list"),e=document.getElementById("btn-expand-slow"),a=document.getElementById("slow-count");mt?(t.innerHTML=Bt(S.slice(0,30)),e.innerHTML=`
      <span>Tutup</span>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 10l4-4 4 4"/>
      </svg>
    `,e.classList.add("expanded"),a.textContent=`${Math.min(30,S.length)} dari ${S.length}`):(t.innerHTML=Bt(S.slice(0,5)),e.innerHTML=`
      <span>Lihat Semua (${S.length})</span>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 6l4 4 4-4"/>
      </svg>
    `,e.classList.remove("expanded"),a.textContent=`${Math.min(5,S.length)} dari ${S.length}`)};window.filterSlowProducts=async t=>{var n;Z=parseInt(t),S=await ae(Z),mt=!1;const e=document.getElementById("slow-products-list"),a=document.getElementById("slow-count"),s=document.getElementById("days-label");if((n=document.getElementById("btn-expand-slow"))==null||n.parentElement,s.textContent=Z,S.length===0)e.innerHTML=`<div class="empty-state small">Tidak ada produk tidak laku dalam ${Z} hari</div>`,a.textContent="0",document.getElementById("btn-expand-slow")&&(document.getElementById("btn-expand-slow").style.display="none");else{e.innerHTML=Bt(S.slice(0,5)),a.textContent=`${Math.min(5,S.length)} dari ${S.length}`;let i=document.getElementById("btn-expand-slow");S.length>5?i&&(i.style.display="flex",i.innerHTML=`
          <span>Lihat Semua (${S.length})</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 6l4 4 4-4"/>
          </svg>
        `,i.classList.remove("expanded")):i&&(i.style.display="none")}};window.initDashboard=()=>{window.handleChartTap=t=>{document.querySelectorAll(".chart-val-label").forEach(a=>{a.textContent="",a.classList.remove("visible")});const e=parseInt(t.dataset.amount);if(e>0){const a=t.querySelector(".chart-val-label");a&&(a.textContent=g(e),a.classList.add("visible"))}},window.animateValue=(t,e,a,s=600)=>{if(!t||e===a){t&&(t.textContent=t.dataset.formatted||a);return}const n=performance.now(),i=o=>{if(!t.isConnected)return;const d=o-n,r=Math.min(d/s,1),l=1-Math.pow(1-r,3),c=Math.round(e+(a-e)*l);t.textContent=c.toLocaleString("id-ID"),r<1?requestAnimationFrame(i):t.textContent=t.dataset.formatted||a.toLocaleString("id-ID")};requestAnimationFrame(i)},requestAnimationFrame(()=>{document.querySelectorAll(".quick-stat-value[data-value]").forEach(t=>{const e=parseInt(t.dataset.value);isNaN(e)||window.animateValue(t,0,e)})})};let I=[],zt=[],O=0,gt=1;const yt=20;let h={search:"",categoryId:null,lowStock:!1};async function Ye(t={}){t.filter==="low"&&(h.lowStock=!0,h.categoryId=null,h.search=""),gt=1;const[e,a]=await Promise.all([kt(h.search,h,yt,0),ie()]);I=e.data||e,O=e.total||I.length,zt=a;const s=zt.map(n=>`
    <button class="chip ${h.categoryId===n.id?"active":""}" data-category="${p(n.id)}">${p(n.name)}</button>
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
          <input type="text" id="product-search" placeholder="Cari produk atau barcode..." class="search-input" value="${p(h.search)}">
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
        Menampilkan <span id="product-count-shown">${I.length}</span> dari <span id="product-count-total">${O}</span> produk
      </div>

      <div class="compact-list" id="product-list">
        ${ce(I)}
      </div>

      <div class="load-more-container ${I.length>=O?"hidden":""}" id="load-more-container">
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
  `}function le(t){return t.map(e=>{const a=e.stock<5?"danger":e.stock<15?"warning":"",s=e.name.match(/^(\d+\w*\.\w+)\s+(.+)$/),n=s?s[1]:null,i=s?s[2]:e.name;return`
      <div class="compact-item ${a}" data-product-id="${e.id}">
        <div class="compact-info" data-action="edit-product" data-product-id="${e.id}">
          ${n?`<span class="compact-code">${p(n)}</span>`:""}
          <span class="compact-name">${p(i)}</span>
          <span class="compact-meta">${p(e.category)||"Umum"} • ${g(e.price)}</span>
        </div>
        <div class="compact-actions">
          <div class="stock-ctrl-group">
            <button class="stock-ctrl-btn" data-action="decrease-stock" data-product-id="${e.id}" aria-label="Kurangi Stok">−</button>
            <div class="stock-display">
              <span class="stock-badge ${a}">${e.stock}</span>
              <span class="stock-unit">${p(e.unit)||"pcs"}</span>
            </div>
            <button class="stock-ctrl-btn" data-action="increase-stock" data-product-id="${e.id}" aria-label="Tambah Stok">+</button>
          </div>
        </div>
      </div>
    `}).join("")}function ce(t){return t.length?le(t):h.lowStock?ht('<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>',"Semua stok dalam kondisi baik",null,null):ht('<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>',"Tidak ada produk ditemukan","Tambah Produk","window.location.hash='/products/add'")}async function It(){gt=1;const t=await kt(h.search,h,yt,0);I=t.data||t,O=t.total||I.length;const e=document.getElementById("product-list");e&&(e.innerHTML=ce(I)),ue();const a=document.getElementById("load-more-container");a&&a.classList.toggle("hidden",I.length>=O)}async function Qe(){const t=document.getElementById("load-more-btn");t&&(t.disabled=!0,t.textContent="Memuat...");try{const e=gt*yt,a=await kt(h.search,h,yt,e),s=a.data||a;if(s.length>0){I=[...I,...s],gt++;const i=document.getElementById("product-list");i&&i.insertAdjacentHTML("beforeend",le(s)),ue()}const n=document.getElementById("load-more-container");n&&n.classList.toggle("hidden",I.length>=O)}catch(e){console.error("Error loading more products:",e)}finally{t&&(t.disabled=!1,t.textContent="Muat Lebih Banyak")}}function ue(){const t=document.getElementById("product-count-shown"),e=document.getElementById("product-count-total");t&&(t.textContent=I.length),e&&(e.textContent=O)}window.initProducts=async(t={})=>{const e=document.querySelector(".products-page");if(!e)return;const a=document.getElementById("stock-adjust-modal");if(a&&a.parentElement!==document.body&&document.body.appendChild(a),t.filter==="low"){const r=document.querySelector('.chip[data-filter="low"]');if(!(r!=null&&r.classList.contains("active"))){h.lowStock=!0,h.categoryId=null,h.search="";const l=document.getElementById("product-search");l&&(l.value=""),document.querySelectorAll(".chip").forEach(c=>c.classList.remove("active")),r==null||r.classList.add("active"),await It()}}e.addEventListener("click",async r=>{const l=r.target.closest("[data-action]");if(!l)return;const c=l.dataset.action,u=l.dataset.productId;switch(c){case"stock-history":window.location.hash="/stock-history";break;case"add-product":window.location.hash="/products/add";break;case"edit-product":u&&(window.location.hash=`/products/edit?id=${u}`);break;case"increase-stock":u&&await Vt(parseInt(u),1);break;case"decrease-stock":u&&await Vt(parseInt(u),-1);break}}),e.addEventListener("click",async r=>{const l=r.target.closest(".chip");if(!l)return;const c=l.dataset.category,u=l.dataset.filter;u==="all"?(h.categoryId=null,h.lowStock=!1,h.sortBy="name",h.sortOrder="asc"):u==="low"?(h.categoryId=null,h.lowStock=!0,h.sortBy="stock",h.sortOrder="asc"):c&&(h.categoryId=parseInt(c),h.lowStock=!1,h.sortBy="name",h.sortOrder="asc"),document.querySelectorAll(".chip").forEach(m=>m.classList.remove("active")),l.classList.add("active"),await It()});const s=document.getElementById("product-search");let n;s==null||s.addEventListener("input",r=>{clearTimeout(n),n=setTimeout(async()=>{h.search=r.target.value,await It()},150)});const i=document.getElementById("load-more-btn");i==null||i.addEventListener("click",async()=>{await Qe()});const o=document.getElementById("btn-confirm-stock-adjust");o==null||o.removeEventListener("click",Mt),o==null||o.addEventListener("click",Mt);const d=document.getElementById("stock-adjust-qty");d==null||d.removeEventListener("keydown",Jt),d==null||d.addEventListener("keydown",Jt)};let pt=null;function Jt(t){t.key==="Enter"&&Mt()}function Vt(t,e){const a=I.find(d=>d.id===t);if(!a)return;const s=e>0?"Penambahan":"Pengurangan";pt={productId:t,direction:e,type:s};const n=document.getElementById("stock-adjust-title"),i=document.getElementById("stock-adjust-desc"),o=document.getElementById("stock-adjust-qty");n&&(n.textContent=`${s} Stok`),i&&(i.textContent=`Produk: ${a.name} (stok saat ini: ${a.stock})`),o&&(o.value="1",o.focus()),openModal("stock-adjust-modal")}async function Mt(){var r,l,c,u;if(!pt)return;const{productId:t,direction:e,type:a}=pt,s=I.find(m=>m.id===t);if(!s)return;const n=document.getElementById("stock-adjust-qty"),i=parseInt((n==null?void 0:n.value)||"0");if(isNaN(i)||i<=0){(r=window.showToast)==null||r.call(window,"Jumlah harus berupa angka lebih dari 0","warning");return}const o=e*i,d=s.stock+o;if(d<0){(l=window.showToast)==null||l.call(window,"Stok tidak bisa kurang dari 0","error");return}closeModal("stock-adjust-modal"),pt=null;try{await ze(t,o,`${a} manual via PWA`),s.stock=d;const m=document.querySelector(`[data-product-id="${t}"] .stock-badge`);m&&(m.textContent=d,m.classList.remove("animating"),m.offsetWidth,m.classList.add("animating"),m.addEventListener("animationend",()=>m.classList.remove("animating"),{once:!0}),m.classList.remove("warning","danger"),d<5?m.classList.add("danger"):d<15&&m.classList.add("warning")),(c=window.showToast)==null||c.call(window,`Stok berhasil diperbarui: ${d}`,"success")}catch(m){console.error("Error adjusting stock:",m),(u=window.showToast)==null||u.call(window,"Gagal mengubah stok: "+m.message,"error")}}let ft=[],$=null,tt=10.5,C=!1;async function Kt(t){const e=t.id?parseInt(t.id):null,a=!!e;try{const d=await Nt();d.default_margin_percent&&(tt=parseFloat(d.default_margin_percent))}catch{console.warn("Using default margin 10.5%")}ft=await ie();const s=ft.map(d=>`<option value="${p(d.name)}">`).join(""),i=["pcs","kg","gram","liter","ml","pack","box","lusin","dus","karton","sachet","botol","kaleng","bungkus","pasang","set","rim","roll","meter","lembar"].map(d=>`<option value="${p(d)}">`).join("");if(a){if($=(await kt()).find(r=>r.id===e),!$)return Ze(e);if($.margin_mode==="manual")C=!0;else if($.margin_mode==="auto")C=!1;else{const r=$.price||0,l=$.cost||0,c=1-tt/100,u=Math.round(r*c);C=Math.abs(l-u)>100}}else $=null,C=!1;return`
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
                  value="${a?p($.name):""}" class="input-lg">
              </div>

              <div class="form-group half-width">
                <label>Kategori <span class="required">*</span></label>
                <div class="input-with-icon">
                   <input type="text" id="product-category" list="category-list" placeholder="Pilih kategori..." 
                    autocomplete="off" required value="${a?p($.category||""):""}">
                   <datalist id="category-list">${s}</datalist>
                   <svg class="icon-right" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 9l-7 7-7-7"/></svg>
                </div>
              </div>

              <div class="form-group half-width">
                <label>Satuan <span class="required">*</span></label>
                <input type="text" id="product-unit" list="unit-list" placeholder="pcs" 
                  autocomplete="off" required value="${a?p($.unit||"pcs"):""}">
                <datalist id="unit-list">${i}</datalist>
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
                    value="${a?z($.price):""}">
                </div>
              </div>

              <div class="form-group half-width">
                <div class="label-with-action">
                  <label>Harga Modal</label>
                  <label class="toggle-switch">
                    <input type="checkbox" id="cost-manual-toggle" ${C?"checked":""}>
                    <span class="toggle-slider"></span>
                    <span class="toggle-label">Manual</span>
                  </label>
                </div>
                <div class="input-prefix">
                  <span>Rp</span>
                  <input type="text" id="product-cost" inputmode="numeric" placeholder="0" autocomplete="off"
                    value="${a&&$.cost?z($.cost):""}"
                    ${C?"":"readonly"} class="${C?"":"bg-gray"}">
                </div>
                <small class="form-hint" id="cost-hint">
                  ${C?"Input manual":`Otomatis (Margin ${tt}%)`}
                </small>
              </div>

              <div class="form-group half-width">
                <label>Stok Awal ${a?"":'<span class="required">*</span>'}</label>
                <input type="number" id="product-stock" ${a?"disabled":"required"} placeholder="0"
                  value="${a?$.stock:""}">
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
  `}function Ze(t){return`
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
  `}async function Xe(t){const e=ft.find(a=>a.name.toLowerCase()===t.toLowerCase());if(e)return e.id;try{const a=await He(t);return ft.push(a),a.id}catch(a){return console.error("Error creating category:",a),null}}function Wt(t){const e=1-tt/100;return Math.round(t*e)}async function Gt(){try{const t=await se();return{userId:t.id,userName:t.username}}catch{return{userId:null,userName:"System"}}}window.initProductForm=()=>{const t=document.getElementById("product-form"),e=document.getElementById("btn-back"),a=document.getElementById("btn-cancel"),s=document.getElementById("product-price"),n=document.getElementById("product-cost"),i=document.getElementById("cost-manual-toggle"),o=document.getElementById("cost-hint");try{Ut("product-price"),Ut("product-cost")}catch(r){console.error(r)}i==null||i.addEventListener("change",r=>{if(C=r.target.checked,C)n.readOnly=!1,n.classList.remove("bg-gray"),o.textContent="Input manual",n.focus();else{n.readOnly=!0,n.classList.add("bg-gray"),o.textContent=`Otomatis (Margin ${tt}%)`;const l=dt(s.value);l&&(n.value=z(Wt(l)))}}),s==null||s.addEventListener("input",r=>{C||setTimeout(()=>{const l=dt(s.value);if(l){const c=Wt(l);n.value=z(c)}else n.value=""},0)});const d=()=>window.location.hash="/products";e==null||e.addEventListener("click",d),a==null||a.addEventListener("click",d),t==null||t.addEventListener("submit",async r=>{r.preventDefault();const l=document.getElementById("btn-save");l.textContent,l.disabled=!0,l.textContent="Menyimpan...";try{const c=document.getElementById("product-name").value.trim(),u=dt(s.value),m=dt(n.value)||0,w=parseInt(document.getElementById("product-stock").value)||0,E=document.getElementById("product-unit").value.trim().toLowerCase(),V=document.getElementById("product-category").value.trim();if(!c||!u||!E||!V)throw new Error("Mohon lengkapi field bertanda *");const ot=await Xe(V),K={name:c,price:u,cost:m,unit:E,category_id:ot,margin_mode:C?"manual":"auto",userId:(await Gt()).userId,userName:(await Gt()).userName};if($)await Ue($.id,K),alert("Produk berhasil diperbarui");else{const y=await Oe();await Re({...K,barcode:y,stock:w}),alert("Produk berhasil ditambahkan")}d()}catch(c){console.error(c),alert(c.message),l.disabled=!1}})};let A=[],D={status:"all",dateFrom:"",dateTo:"",search:""},v=null;async function ta(){const t=new Date,e=`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,"0")}-${String(t.getDate()).padStart(2,"0")}`;return D.dateFrom=e,D.dateTo=e,A=await oe(D),`
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
          <span class="summary-value" id="tx-total">${g(me(A))}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Transaksi</span>
          <span class="summary-value" id="tx-count">${A.length}</span>
        </div>
      </div>

      <div class="compact-list" id="tx-list">
        ${pe(A)}
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
  `}function me(t){return t.filter(e=>e.status!=="void").reduce((e,a)=>e+a.total,0)}function pe(t){return t.length===0?ht('<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>',"Tidak ada transaksi pada periode ini",null,null):t.map(e=>{var i;const a={lunas:{class:"success",label:"Lunas"},pending:{class:"info",label:"Pending"},hutang:{class:"warning",label:"Hutang"},cicilan:{class:"purple",label:"Cicilan"},void:{class:"danger",label:"Void"}},s=a[e.status]||a.lunas,n=((i=e.itemDetails)==null?void 0:i.map(o=>`
      <div class="tx-item-row">
        <span class="tx-item-name">${p(o.name||o.product_name)}</span>
        <span class="tx-item-qty">${o.qty||o.quantity}x</span>
        <span class="tx-item-price">${g(o.subtotal||o.price*(o.qty||o.quantity))}</span>
      </div>
    `).join(""))||'<div class="tx-items-loading">Memuat...</div>';return`
      <div class="tx-card status-${e.status} ${e.status==="void"?"voided":""}" data-id="${e.id}">
        <div class="tx-card-header" onclick="toggleTxExpand('${e.id}')">
          <div class="tx-card-main">
            <div class="tx-card-id">${p(e.invoiceNumber)||"#"+e.id}</div>
            <div class="tx-card-info">
              ${p(e.customerName)||"Walk-in"} • ${e.items} item • ${R(e.date)}
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
    `}).join("")}window.showTxDetail=async t=>{var d;if(v=await qt(t),!v)return;const e={lunas:{class:"success",label:"Lunas"},pending:{class:"info",label:"Pending"},hutang:{class:"warning",label:"Hutang"},cicilan:{class:"purple",label:"Cicilan"},void:{class:"danger",label:"Void"}},a=e[v.status]||e.lunas,s=((d=v.itemDetails)==null?void 0:d.map(r=>`
    <div class="item-row">
      <div class="item-name">${p(r.name||r.product_name)}</div>
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
          <div class="payment-method">${l.method} - ${p(l.receivedBy)}</div>
          ${l.notes?`<div class="payment-notes">${p(l.notes)}</div>`:""}
        </div>
        <div class="payment-amount">${g(l.amount)}</div>
      </div>
    `).join("")}
        </div>
      </div>
    `);let i="";v.status==="void"&&(i=`
      <div class="void-info">
        <div class="void-label">Dibatalkan</div>
        <div class="void-reason">${p(v.voidReason)||"-"}</div>
        <div class="void-meta">${v.voidedAt} oleh ${p(v.voidedBy)}</div>
      </div>
    `),document.getElementById("tx-detail-content").innerHTML=`
    <div class="detail-section">
      <div class="detail-header">
        <h4 class="detail-name">${p(v.invoiceNumber)||"#"+v.id}</h4>
        <span class="badge badge-${a.class}">${a.label}</span>
      </div>
      <div class="detail-info">
        <div class="detail-row">
          <span class="detail-label">Tanggal</span>
          <span class="detail-value">${v.date}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Kasir</span>
          <span class="detail-value">${p(v.cashierName)}</span>
        </div>
        ${v.customerName?`
          <div class="detail-row">
            <span class="detail-label">Customer</span>
            <span class="detail-value">${p(v.customerName)}</span>
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
          <span class="detail-value">${p(v.paymentMethod)||"-"}</span>
        </div>
      </div>
    </div>
    
    ${v.paymentNotes?`
    <div class="detail-section tx-notes">
        <div class="tx-notes-label">Catatan</div>
        <div class="tx-notes-text">${p(v.paymentNotes)}</div>
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
    ${i}
  `;let o=`<button class="btn" onclick="closeModal('tx-detail-modal')">Tutup</button>`;v.status!=="void"&&(o=`
      <button class="btn btn-outline btn-danger" onclick="showVoidModal()">Void</button>
      ${o}
    `),document.getElementById("tx-detail-footer").innerHTML=o,openModal("tx-detail-modal")};window.showVoidModal=()=>{closeModal("tx-detail-modal"),document.getElementById("void-reason").value="",openModal("void-modal")};window.showVoidModalFor=t=>{const e=parseInt(t);v=A.find(a=>a.id===e),document.getElementById("void-reason").value="",openModal("void-modal")};window.toggleTxExpand=async t=>{var n;const e=document.querySelector(`.tx-card[data-id="${t}"]`),a=document.getElementById(`tx-body-${t}`);if(!e||!a)return;const s=e.classList.contains("expanded");if(document.querySelectorAll(".tx-card.expanded").forEach(i=>{i.classList.remove("expanded")}),!s){e.classList.add("expanded");const i=A.find(o=>String(o.id)===String(t));if(i&&!i.itemDetails)try{const o=await qt(t);i.itemDetails=o.itemDetails;const d=((n=i.itemDetails)==null?void 0:n.map(r=>`
          <div class="tx-item-row">
            <span class="tx-item-name">${r.name||r.product_name}</span>
            <span class="tx-item-qty">${r.qty||r.quantity}x</span>
            <span class="tx-item-price">${g(r.subtotal||r.price*(r.qty||r.quantity))}</span>
          </div>
        `).join(""))||'<div class="empty-state small">Tidak ada item</div>';a.querySelector(".tx-items-list").innerHTML=d}catch(o){console.error("Error loading transaction items:",o),a.querySelector(".tx-items-list").innerHTML='<div class="empty-state small">Gagal memuat item</div>'}}};window.initTransactions=()=>{const t=document.querySelectorAll(".chip"),e=document.getElementById("date-from"),a=document.getElementById("date-to"),s=document.getElementById("tx-search"),n=document.getElementById("btn-confirm-void");t.forEach(o=>{o.addEventListener("click",async()=>{t.forEach(d=>d.classList.remove("active")),o.classList.add("active"),D.status=o.dataset.status,await U()})});function i(o){const d=new Date,r=u=>String(u).padStart(2,"0"),l=u=>`${u.getFullYear()}-${r(u.getMonth()+1)}-${r(u.getDate())}`,c=l(d);switch(o){case"today":return{from:c,to:c};case"yesterday":{const u=new Date(d);u.setDate(u.getDate()-1);const m=l(u);return{from:m,to:m}}case"week":{const u=new Date(d);return u.setDate(u.getDate()-6),{from:l(u),to:c}}case"month":{const u=new Date(d.getFullYear(),d.getMonth(),1);return{from:l(u),to:c}}default:return{from:c,to:c}}}document.querySelectorAll(".preset-btn").forEach(o=>{o.addEventListener("click",async()=>{document.querySelectorAll(".preset-btn").forEach(r=>r.classList.remove("active")),o.classList.add("active");const d=i(o.dataset.preset);e&&(e.value=d.from),a&&(a.value=d.to),D.dateFrom=d.from,D.dateTo=d.to,await U()})}),e==null||e.addEventListener("change",async()=>{document.querySelectorAll(".preset-btn").forEach(o=>o.classList.remove("active")),D.dateFrom=e.value,await U()}),a==null||a.addEventListener("change",async()=>{document.querySelectorAll(".preset-btn").forEach(o=>o.classList.remove("active")),D.dateTo=a.value,await U()}),s==null||s.addEventListener("input",async o=>{D.search=o.target.value,await U()}),n==null||n.addEventListener("click",async()=>{var d;if(!v)return;const o=document.getElementById("void-reason").value.trim();if(!o){(d=window.showToast)==null||d.call(window,"Masukkan alasan pembatalan","warning");return}await Je(v.id,o),closeModal("void-modal"),await U()})};async function U(){A=await oe(D),document.getElementById("tx-list").innerHTML=pe(A),document.getElementById("tx-total").textContent=g(me(A)),document.getElementById("tx-count").textContent=A.length}let st=[],x={},M={status:"all",search:"",overdue:!1},k=null;async function ea(){const[t,e]=await Promise.all([re(),de()]);return st=t,x=e,`
    <div class="page debts-page">
      <h2 class="page-title">Piutang</h2>

      <!-- Summary Cards -->
      <div class="debt-summary-cards">
        <div class="debt-summary-card primary">
          <div class="debt-card-label">Total Piutang</div>
          <div class="debt-card-value">${g(x.totalOutstanding)}</div>
          <div class="debt-card-sub">${x.totalCustomers} customer</div>
        </div>
        <div class="debt-summary-card ${x.overdueCount>0?"danger":"success"}">
          <div class="debt-card-label">Jatuh Tempo</div>
          <div class="debt-card-value">${x.overdueCount}</div>
          <div class="debt-card-sub">${g(x.overdueAmount)}</div>
        </div>
      </div>

      <!-- Status Breakdown -->
      <div class="status-breakdown">
        <div class="status-item" data-status="pending">
          <span class="status-dot pending"></span>
          <span class="status-label">Pending</span>
          <span class="status-count">${x.byStatus.pending.count}</span>
        </div>
        <div class="status-item" data-status="hutang">
          <span class="status-dot hutang"></span>
          <span class="status-label">Hutang</span>
          <span class="status-count">${x.byStatus.hutang.count}</span>
        </div>
        <div class="status-item" data-status="cicilan">
          <span class="status-dot cicilan"></span>
          <span class="status-label">Cicilan</span>
          <span class="status-count">${x.byStatus.cicilan.count}</span>
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
        ${ve(st)}
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
  `}function ve(t){return t.length===0?ht('<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',"Tidak ada piutang aktif",null,null):t.map(e=>{const a={pending:{class:"info",label:"Pending"},hutang:{class:"warning",label:"Hutang"},cicilan:{class:"purple",label:"Cicilan"}},s=a[e.status]||a.hutang,n=e.isOverdue?"overdue":"",i=(e.totalPaid/e.total*100).toFixed(0);return`
      <div class="debt-card ${n}" onclick="showDebtDetail('${e.id}')">
        <div class="debt-card-header">
          <div class="debt-customer">${p(e.customerName)}</div>
          <span class="badge badge-${s.class}">${s.label}</span>
        </div>
        <div class="debt-card-body">
          <div class="debt-tx-id">#${e.id}</div>
          <div class="debt-dates">
            <span>Transaksi: ${R(e.date)}</span>
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
              <div class="progress-fill" style="width: ${i}%"></div>
            </div>
            <div class="progress-text">${i}% terbayar</div>
          </div>
        </div>
      </div>
    `}).join("")}window.showDebtDetail=async t=>{const e=await qt(t);if(k=st.find(o=>o.id===t),!e||!k)return;const a={pending:{class:"info",label:"Pending"},hutang:{class:"warning",label:"Hutang"},cicilan:{class:"purple",label:"Cicilan"}},s=a[k.status]||a.hutang,n=(k.totalPaid/k.total*100).toFixed(0);let i="";e.paymentHistory&&e.paymentHistory.length>0&&(i=`
      <div class="detail-section">
        <h4 class="section-title">Riwayat Pembayaran</h4>
        <div class="payment-list">
          ${e.paymentHistory.map(d=>`
      <div class="payment-row">
        <div class="payment-info">
          <div class="payment-date">${d.date}</div>
          <div class="payment-method">${d.method} - ${p(d.receivedBy)}</div>
          ${d.notes?`<div class="payment-notes">${p(d.notes)}</div>`:""}
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
          <h4 class="detail-name">${p(k.customerName)}</h4>
          <div class="detail-phone">${p(k.customerPhone)||"-"}</div>
        </div>
        <span class="badge badge-${s.class}">${s.label}</span>
      </div>
      ${k.isOverdue?`
        <div class="overdue-alert">
          Terlambat ${k.daysOverdue} hari dari jatuh tempo
        </div>
      `:""}
      <div class="detail-info">
        <div class="detail-row">
          <span class="detail-label">ID Transaksi</span>
          <span class="detail-value">#${k.id}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Tanggal Transaksi</span>
          <span class="detail-value">${R(k.date)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Jatuh Tempo</span>
          <span class="detail-value ${k.isOverdue?"text-danger":""}">${k.dueDate}</span>
        </div>
      </div>
    </div>

    <div class="detail-section">
      <h4 class="section-title">Ringkasan Pembayaran</h4>
      <div class="payment-summary">
        <div class="payment-summary-row">
          <span>Total Tagihan</span>
          <span>${g(k.total)}</span>
        </div>
        <div class="payment-summary-row">
          <span>Sudah Dibayar</span>
          <span class="text-success">${g(k.totalPaid)}</span>
        </div>
        <div class="payment-summary-row highlight">
          <span>Sisa Tagihan</span>
          <span>${g(k.remainingBalance)}</span>
        </div>
      </div>
      <div class="debt-progress large">
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${n}%"></div>
        </div>
        <div class="progress-text">${n}% terbayar</div>
      </div>
    </div>

    ${i}
  `,openModal("debt-detail-modal")};window.initDebts=()=>{const t=document.querySelectorAll(".chip"),e=document.getElementById("debt-search"),a=document.getElementById("btn-add-payment"),s=document.getElementById("payment-form");t.forEach(n=>{n.addEventListener("click",async()=>{t.forEach(o=>o.classList.remove("active")),n.classList.add("active"),document.querySelectorAll(".status-item").forEach(o=>o.classList.remove("active"));const i=n.dataset.filter;i==="all"?M={status:"all",search:M.search,overdue:!1}:i==="overdue"?(M.overdue=!0,M.status="all"):(M.status=i,M.overdue=!1),await lt()})}),document.querySelectorAll(".status-item").forEach(n=>{n.addEventListener("click",async()=>{const i=n.dataset.status;document.querySelectorAll(".status-item").forEach(d=>d.classList.remove("active")),n.classList.add("active"),t.forEach(d=>d.classList.remove("active"));const o=document.querySelector(`.chip[data-filter="${i}"]`);o&&o.classList.add("active"),M.status=i,M.overdue=!1,await lt()})}),e==null||e.addEventListener("input",async n=>{M.search=n.target.value,await lt()}),a==null||a.addEventListener("click",()=>{k&&(closeModal("debt-detail-modal"),document.getElementById("payment-customer").textContent=k.customerName,document.getElementById("payment-remaining").textContent=g(k.remainingBalance),document.getElementById("payment-amount").max=k.remainingBalance,document.getElementById("payment-amount").value="",document.getElementById("payment-method").value="cash",document.getElementById("payment-notes").value="",openModal("payment-modal"))}),s==null||s.addEventListener("submit",async n=>{var r;if(n.preventDefault(),!k)return;const i=parseInt(document.getElementById("payment-amount").value),o=document.getElementById("payment-method").value,d=document.getElementById("payment-notes").value;if(i>k.remainingBalance){(r=window.showToast)==null||r.call(window,"Jumlah pembayaran melebihi sisa tagihan","warning");return}await Ve(k.id,i,o,d),closeModal("payment-modal"),await lt(),x=await de(),aa()})};async function lt(){st=await re(M),document.getElementById("debt-list").innerHTML=ve(st)}function aa(){const t=document.querySelectorAll(".debt-summary-card");if(t.length>=2){const e=t[0],a=e.querySelector(".debt-card-value"),s=e.querySelector(".debt-card-sub");a&&(a.textContent=g(x.totalOutstanding)),s&&(s.textContent=`${x.totalCustomers} customer`);const n=t[1],i=n.querySelector(".debt-card-value"),o=n.querySelector(".debt-card-sub");i&&(i.textContent=x.overdueCount),o&&(o.textContent=g(x.overdueAmount)),x.overdueCount>0?(n.classList.remove("success"),n.classList.add("danger")):(n.classList.remove("danger"),n.classList.add("success"))}}const J=3001,sa=1500,Et=20,na=3e4,ia=["192.168.1","192.168.0","10.0.0","10.0.1","10.1.0","10.1.1","172.16.0","172.16.1"],Ht="pos_server_config";function Ot(){try{const t=localStorage.getItem(Ht);return t?JSON.parse(t):null}catch{return null}}function he(t){try{return localStorage.setItem(Ht,JSON.stringify({...t,savedAt:new Date().toISOString()})),!0}catch{return!1}}function oa(){localStorage.removeItem(Ht)}async function $t(t,e=J){const a=new AbortController,s=setTimeout(()=>a.abort(),sa);try{const n=await fetch(`http://${t}:${e}/api/health`,{method:"GET",signal:a.signal,mode:"cors"});if(clearTimeout(s),n.ok){const i=await n.json();return{success:!0,ip:t,port:e,serverName:i.serverName||"POS Server",version:i.version||"1.0.0"}}return{success:!1}}catch{return clearTimeout(s),{success:!1}}}async function ra(){return new Promise(t=>{const e=[];try{const a=new RTCPeerConnection({iceServers:[{urls:"stun:stun.l.google.com:19302"}]});a.createDataChannel(""),a.onicecandidate=s=>{if(!s.candidate){a.close();const o=Yt(e);console.log("[Discovery] IP candidates:",e,"Best:",o),t(o);return}const i=s.candidate.candidate.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/);if(i){const o=i[1],d=da(o);d&&e.push(d)}},a.createOffer().then(s=>a.setLocalDescription(s)).catch(s=>{console.error("[Discovery] WebRTC offer error:",s)}),setTimeout(()=>{a.close();const s=Yt(e);console.log("[Discovery] IP candidates (timeout):",e,"Best:",s),t(s)},3e3)}catch(a){console.error("[Discovery] WebRTC error:",a),t(null)}})}function da(t){if(!t||!/^\d+\.\d+\.\d+\.\d+$/.test(t))return null;const e=t.split(".").map(Number),[a,s]=e;let n=0;if(a===10)n=3;else if(a===192&&s===168)n=2;else if(a===172&&s>=16&&s<=31)n=1;else return null;return{ip:t,subnet:e.slice(0,3).join("."),priority:n}}function Yt(t){return t.length===0?null:(t.sort((e,a)=>a.priority-e.priority),{ip:t[0].ip,subnet:t[0].subnet})}async function la(t,e=J){return(await Promise.all(t.map(s=>$t(s,e)))).find(s=>s.success)||null}async function ca(t,e,a,s){const n=[];for(let i=1;i<=254;i++)n.push(`${t}.${i}`);for(let i=0;i<n.length;i+=Et){if(s!=null&&s.aborted)return null;const o=n.slice(i,i+Et),d=await la(o,e);if(a&&a({scanned:Math.min(i+Et,254),total:254,subnet:t}),d)return d}return null}async function ua(t=null){const e=i=>{t&&t(i)},a=new AbortController;let s=!1;const n=setTimeout(()=>{s=!0,a.abort()},na);try{e({phase:"checking_saved",message:"Memeriksa server tersimpan..."});const i=Ot();if(i&&i.ip){e({phase:"pinging_saved",message:`Menghubungi ${i.ip}...`});const l=await $t(i.ip,i.port||J);if(l.success)return clearTimeout(n),e({phase:"found",message:"Server ditemukan!",server:l}),l}e({phase:"detecting_ip",message:"Mendeteksi alamat IP perangkat..."});let o=null,d=null;try{const l=await ra();console.log("[Discovery] Device info:",l),l&&l.ip?(o=l.subnet,d=l.ip,e({phase:"detected_ip",message:`Perangkat di ${d}`,deviceIP:d,subnet:o})):(console.log("[Discovery] No device IP detected"),e({phase:"detection_failed",message:"Tidak dapat mendeteksi IP, mencoba subnet umum..."}))}catch(l){console.error("[Discovery] Detection error:",l),e({phase:"detection_failed",message:"Tidak dapat mendeteksi IP, mencoba subnet umum..."})}const r=[];o&&r.push(o);for(const l of ia)r.includes(l)||r.push(l);console.log("[Discovery] Subnets to scan:",r);for(let l=0;l<r.length&&!a.signal.aborted;l++){const c=r[l];e({phase:"scanning_subnet",message:l===0&&o?`Memindai jaringan ${c}.x ...`:`Mencoba subnet ${c}.x ...`,subnet:c,subnetIndex:l+1,totalSubnets:r.length});const m=await ca(c,J,w=>{e({phase:"scanning_subnet",message:`Memindai ${c}.x (${w.scanned}/254)`,...w,subnetIndex:l+1,totalSubnets:r.length})},a.signal);if(m)return clearTimeout(n),he(m),e({phase:"found",message:"Server ditemukan!",server:m}),m}return clearTimeout(n),s?(e({phase:"timeout",message:"Waktu pencarian habis"}),{timeout:!0}):(e({phase:"not_found",message:"Server tidak ditemukan"}),null)}catch(i){return clearTimeout(n),s?(e({phase:"timeout",message:"Waktu pencarian habis"}),{timeout:!0}):(e({phase:"error",message:"Terjadi kesalahan: "+i.message}),null)}}function ma(t){try{if(t.startsWith("http")){const n=new URL(t);return{ip:n.hostname,port:parseInt(n.port)||J}}const[e,a]=t.split(":"),s=parseInt(a)||J;return/^\d+\.\d+\.\d+\.\d+$/.test(e)?{ip:e,port:s}:null}catch{return null}}async function pa(t){const e=ma(t);if(!e)return{success:!1,error:"Format tidak valid. Gunakan format IP:Port (contoh: 192.168.1.100:3001)"};const a=await $t(e.ip,e.port);return a.success?(he(a),a):{success:!1,error:"Server tidak merespons. Pastikan POS server berjalan."}}const bt=600*1e3,va=1440*60*1e3,nt="pos_admin_session",it="pos_admin_last_activity";let _=null,Pt=!1,Qt=0;const ha=5e3,ge=["mousedown","mousemove","keydown","scroll","touchstart","touchmove","click"];function ye(){if(!Pt){if(!vt()){ke();return}ge.forEach(t=>{document.addEventListener(t,fe,{passive:!0})}),we(),document.addEventListener("visibilitychange",()=>{document.visibilityState==="visible"&&ya()}),Pt=!0,console.log("[Session] Initialized with 10 minute timeout")}}function fe(){const t=Date.now();t-Qt<ha||(Qt=t,be(),we())}function be(){localStorage.setItem(it,Date.now().toString())}function ga(){const t=localStorage.getItem(it);return t?parseInt(t):Date.now()}function we(){_&&clearTimeout(_),_=setTimeout(()=>{console.log("[Session] Inactivity timeout reached"),wt("Sesi berakhir karena tidak ada aktivitas")},bt)}function ya(){const t=ga(),e=Date.now()-t;if(e>=bt)console.log("[Session] Session expired while away"),wt("Sesi berakhir karena tidak ada aktivitas");else{const a=bt-e;_&&clearTimeout(_),_=setTimeout(()=>{wt("Sesi berakhir karena tidak ada aktivitas")},a)}}function ct(){localStorage.removeItem(nt),localStorage.removeItem(it)}function vt(){const t=localStorage.getItem(nt);if(!t)return!1;try{const e=JSON.parse(t);if(e.loginAt&&Date.now()-new Date(e.loginAt).getTime()>=va||!e.token)return ct(),!1;const a=localStorage.getItem(it);return a&&Date.now()-parseInt(a)>=bt?(ct(),!1):!0}catch{return ct(),!1}}function fa(t){localStorage.setItem(nt,JSON.stringify({...t,loginAt:new Date().toISOString()})),be(),ye()}function ba(){try{const t=localStorage.getItem(nt);return t?JSON.parse(t):null}catch{return null}}function wt(t=null){_&&(clearTimeout(_),_=null),N(),ge.forEach(e=>{document.removeEventListener(e,fe)}),localStorage.removeItem(nt),localStorage.removeItem(it),Pt=!1,t&&sessionStorage.setItem("pos_logout_reason",t),ke()}function ke(){window.location.hash="/login",window.location.reload()}window.addEventListener("beforeunload",()=>{_&&clearTimeout(_)});let T=null;async function wa(){const[t,e]=await Promise.all([se(),Nt()]);T=t;const s=(await ne(t.id).catch(()=>({sessions:[]}))).sessions||[];Ce();const n={admin:"Administrator",supervisor:"Supervisor",cashier:"Kasir"},i=localStorage.getItem("pos_device_id"),o=t.role==="admin",d=$e(s,t.id,i,o);return`
    <div class="page profile-page">
      <h2 class="page-title">Profil</h2>

      <!-- User Info Card -->
      <div class="profile-card">
        <div class="profile-avatar">
          ${p(T.fullName).charAt(0).toUpperCase()}
        </div>
        <div class="profile-info">
          <div class="profile-name">${p(T.fullName)}</div>
          <div class="profile-role-badge ${T.role}">${n[T.role]||T.role}</div>
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
            <span class="detail-value">${p(T.username)}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Login Terakhir</span>
            <span class="detail-value">${T.lastLogin?R(T.lastLogin):"-"}</span>
          </div>
          ${o?`
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
            <span class="setting-value" id="current-server">${Ft().host}:${Ft().port}</span>
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
  `}function $e(t,e,a,s=!1){return t.length===0?'<div class="empty-state small">Belum ada data perangkat</div>':t.map(n=>{const i=n.device_id===a,o=n.last_seen?new Date(n.last_seen).toLocaleString("id-ID",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}):"-";return`
      <div class="session-item ${i?"current":""}">
        <div class="session-info">
          <div class="session-device">${ka(n.device_name)}</div>
          <div class="session-details">
            Terakhir aktif: ${o}
            ${i?'<span class="current-badge">Perangkat Ini</span>':""}
          </div>
        </div>
        ${!i&&s?`<button class="btn btn-sm btn-danger" onclick="revokeSession(${e}, ${n.id})">Cabut</button>`:""}
      </div>
    `}).join("")}function ka(t){if(!t)return"Perangkat tidak dikenal";if(t.includes("Android")){const e=t.match(/Android[^;)]*[;)]/);return"Android - "+(e?e[0].replace(/[;)]/g,"").trim():"Mobile")}return t.includes("iPhone")||t.includes("iPad")?"iOS - Safari":t.includes("Windows")?"Windows - Browser":t.includes("Mac")?"Mac - Browser":t.slice(0,40)+"..."}function Rt(t,e){const a=document.getElementById("confirm-dialog");a&&a.remove();const s=document.createElement("div");s.id="confirm-dialog",s.className="modal-overlay open",s.innerHTML=`
    <div class="product-modal-card">
      <div class="modal-body" style="padding: 24px 20px;">
        <p style="color: var(--text-main); font-size: 15px; line-height: 1.5;">${t}</p>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline" id="confirm-cancel">Batal</button>
        <button class="btn btn-danger" id="confirm-ok">Ya, Lanjutkan</button>
      </div>
    </div>
  `,document.body.appendChild(s),document.getElementById("confirm-cancel").onclick=()=>s.remove(),document.getElementById("confirm-ok").onclick=()=>{s.remove(),e()}}window.rediscoverServer=()=>{Rt("Cari ulang server POS?<br>Aplikasi akan dimuat ulang.",()=>{oa(),window.location.reload()})};window.clearCache=async()=>{var t;if("caches"in window){const e=await caches.keys();await Promise.all(e.map(a=>caches.delete(a))),(t=window.showToast)==null||t.call(window,"Cache berhasil dihapus","success")}};window.handleLogout=()=>{Rt("Keluar dari akun?",()=>wt())};window.updateTimezone=async t=>{var e,a;try{const s=parseFloat(t);await Ke({timezone_offset:s}),(e=window.showToast)==null||e.call(window,"Zona waktu berhasil disimpan","success")}catch(s){(a=window.showToast)==null||a.call(window,"Gagal menyimpan zona waktu: "+s.message,"error")}};window.initProfile=async()=>{try{const t=await Nt(),e=document.getElementById("select-timezone");e&&t.timezone_offset?e.value=t.timezone_offset:e&&(e.value="7")}catch(t){console.error("Error init profile settings",t)}};window.revokeSession=async(t,e)=>{var a;if((T==null?void 0:T.role)!=="admin"){(a=window.showToast)==null||a.call(window,"Hanya admin yang dapat mencabut akses perangkat","error");return}Rt("Cabut akses perangkat ini?",async()=>{var s,n;try{await Ne(t,e);const i=await ne(t).catch(()=>({sessions:[]})),o=localStorage.getItem("pos_device_id");document.getElementById("sessions-list").innerHTML=$e(i.sessions||[],t,o,!0),(s=window.showToast)==null||s.call(window,"Akses perangkat dicabut","success")}catch(i){(n=window.showToast)==null||n.call(window,"Gagal mencabut akses: "+i.message,"error")}})};let Zt=[];async function $a(){const t=ba();if((t==null?void 0:t.role)!=="admin")return window.location.hash="/","<div></div>";Zt=await We();const e={admin:"Administrator",supervisor:"Supervisor",cashier:"Kasir"};return`
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
        ${Zt.map(s=>`
      <div class="section-card user-activity-card">
        <div class="user-card-header">
          <div class="user-avatar">${p(s.fullName||s.username||"U").charAt(0).toUpperCase()}</div>
          <div class="user-main-info">
            <div class="user-name">${p(s.fullName||s.username)}</div>
            <div class="user-role-badge ${s.role}">${e[s.role]||s.role}</div>
          </div>
        </div>
        <div class="user-card-details">
          <div class="detail-row">
            <span class="detail-label">Username</span>
            <span class="detail-value">@${p(s.username)}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Login Terakhir</span>
            <span class="detail-value">${s.lastLogin?R(s.lastLogin):"Belum pernah login"}</span>
          </div>
        </div>
      </div>
    `).join("")}
      </div>
    </div>
  `}window.initUserActivity=()=>{};async function xa(){const t=await Fe(null);return`
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
        ${Sa(t)}
      </div>
    </div>
  `}function Sa(t){if(t.length===0)return'<div class="empty-state">Belum ada riwayat perubahan stok</div>';const e=t.reduce((a,s)=>{const n=s.createdAt.split("T")[0];return a[n]||(a[n]=[]),a[n].push(s),a},{});return Object.keys(e).sort().reverse().map(a=>`
    <div class="history-group">
      <div class="history-date-header">${R(a)}</div>
      ${e[a].map(s=>{const n={sale:"Penjualan",manual:"Manual",restock:"Restok",adjustment:"Koreksi",import:"Import",initial:"Stok Awal"},i=s.quantity>0?"positive":"negative";return`
          <div class="history-item">
            <div class="history-icon ${s.changeType}">
               ${Ia(s.changeType)}
            </div>
            <div class="history-content">
              <div class="history-title">${p(s.productName)}</div>
              <div class="history-meta">
                ${n[s.changeType]||s.changeType} • ${p(s.userName)||"-"}
                ${s.notes?`<br><span class="history-notes">"${p(s.notes)}"</span>`:""}
              </div>
            </div>
            <div class="history-change ${i}">
              ${s.quantity>0?"+":""}${s.quantity}
            </div>
          </div>
        `}).join("")}
    </div>
  `).join("")}function Ia(t){return t==="sale"?'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>':t==="restock"?'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v16m-8-8h16"/></svg>':'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>'}function Ea(){const t=window.APP_CONFIG||{name:"POS Admin",logo:null,tagline:"Masuk untuk mengelola toko Anda"},e=t.name,a=t.tagline||"Masuk untuk mengelola toko Anda";return`
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
  `}function Ta(){const t=document.getElementById("login-form"),e=document.getElementById("login-error"),a=document.getElementById("error-text"),s=document.getElementById("btn-login"),n=document.getElementById("password"),i=document.getElementById("toggle-password"),o=sessionStorage.getItem("pos_logout_reason");o&&(sessionStorage.removeItem("pos_logout_reason"),a.textContent=o,e.style.display="flex"),setTimeout(()=>{var r;(r=document.getElementById("username"))==null||r.focus()},300),i==null||i.addEventListener("click",()=>{const r=n.getAttribute("type")==="password"?"text":"password";n.setAttribute("type",r);const l=r==="password"?'<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>':'<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path>';i.querySelector("svg").innerHTML=l}),t==null||t.addEventListener("submit",async r=>{r.preventDefault();const l=document.getElementById("username").value.trim(),c=document.getElementById("password").value;if(!l||!c){d("Username dan password wajib diisi");return}s.disabled=!0,s.innerHTML='<div class="login-spinner"></div> Memproses...',e.style.display="none";try{const u=Date.now(),m=await qe(l,c),w=Date.now()-u;w<500&&await new Promise(E=>setTimeout(E,500-w)),m.success?(fa({userId:m.user.id,username:m.user.username,fullName:m.user.full_name||m.user.name,role:m.user.role,token:m.token}),window.location.hash="/",window.location.reload()):d(m.message||"Login gagal, periksa username/password")}catch(u){console.error("Login error:",u),d(u.message||"Gagal terhubung ke server")}finally{!e.style.display||e.style.display==="none"||(s.disabled=!1,s.innerHTML='<span class="btn-text">Masuk Sekarang</span>')}});function d(r){a.textContent=r,e.style.display="flex",s.disabled=!1,s.innerHTML='<span class="btn-text">Masuk Sekarang</span>',e.style.animation="none",e.offsetHeight,e.style.animation="shake 0.4s ease-in-out"}}let Dt=null,Tt=!1;function Ca(){return`
    <div class="discovery-screen" id="discovery-screen">
      <div class="discovery-content">
        <div class="discovery-logo">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
            <line x1="8" y1="21" x2="16" y2="21"/>
            <line x1="12" y1="17" x2="12" y2="21"/>
          </svg>
        </div>
        <h1 class="discovery-title">POS Admin</h1>

        <div class="discovery-status" id="discovery-status">
          <div class="discovery-spinner"></div>
          <p class="discovery-message" id="discovery-message">Mencari server...</p>
          <p class="discovery-submessage" id="discovery-submessage"></p>
        </div>

        <div class="discovery-progress" id="discovery-progress" style="display: none;">
          <div class="progress-bar">
            <div class="progress-fill" id="progress-fill"></div>
          </div>
          <p class="progress-text" id="progress-text">0%</p>
        </div>

        <div class="discovery-timer" id="discovery-timer">
          <span id="timer-text">30</span>s
        </div>

        <div class="discovery-result" id="discovery-result" style="display: none;">
          <div class="result-icon success" id="result-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <p class="result-message" id="result-message">Server ditemukan!</p>
          <p class="result-server" id="result-server"></p>
        </div>

        <div class="discovery-manual" id="discovery-manual" style="display: none;">
          <p class="manual-title">Server tidak ditemukan</p>
          <p class="manual-desc">Masukkan alamat server secara manual:</p>
          <div class="manual-input-group">
            <input type="text" id="manual-server" placeholder="192.168.1.100:3001" class="manual-input">
            <button class="btn" id="btn-manual-connect">Hubungkan</button>
          </div>
          <p class="manual-error" id="manual-error"></p>

          <div class="manual-divider">
            <span>atau</span>
          </div>

          <button class="btn btn-outline" id="btn-scan-qr">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="7" height="7"/>
              <rect x="14" y="3" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/>
            </svg>
            Scan QR Code
          </button>

          <button class="btn btn-outline" id="btn-retry-scan" style="margin-top: 12px;">
            Cari Ulang
          </button>
        </div>

        <!-- QR Scanner Modal -->
        <div class="qr-scanner-modal" id="qr-scanner-modal" style="display: none;">
          <div class="qr-scanner-header">
            <h3>Scan QR Code Server</h3>
            <button class="modal-close" id="btn-close-qr">&times;</button>
          </div>
          <div class="qr-scanner-container" id="qr-scanner-container">
            <video id="qr-video" playsinline></video>
            <div class="qr-overlay">
              <div class="qr-frame"></div>
            </div>
          </div>
          <p class="qr-hint">Arahkan kamera ke QR Code yang ditampilkan di POS Server</p>
        </div>
      </div>
    </div>
  `}async function La(){return new Promise(t=>{Dt=t,_a().catch(e=>{console.error("[Discovery] Unexpected error:",e);const a=document.getElementById("discovery-status"),s=document.getElementById("discovery-manual");a&&(a.style.display="none"),s&&(s.style.display="block"),xe()})})}async function _a(){const t=document.getElementById("discovery-status"),e=document.getElementById("discovery-message"),a=document.getElementById("discovery-submessage"),s=document.getElementById("discovery-progress"),n=document.getElementById("progress-fill"),i=document.getElementById("progress-text"),o=document.getElementById("discovery-result"),d=document.getElementById("discovery-manual"),r=document.querySelector(".manual-title");Tt=!0;const l=document.getElementById("timer-text");let c=30;const u=setInterval(()=>{c--,l&&(l.textContent=c),c<=0&&clearInterval(u)},1e3),m=await ua(w=>{if(Tt&&(e.textContent=w.message,w.phase==="detected_ip"&&w.deviceIP&&(a.textContent=`IP Perangkat: ${w.deviceIP}`),w.phase==="scanning_subnet"&&w.scanned)){s.style.display="block";const E=Math.round(w.scanned/w.total*100);n.style.width=`${E}%`,i.textContent=`${E}%`,w.subnet&&(a.textContent=`Subnet: ${w.subnet}.x`)}});Tt=!1,clearInterval(u),s.style.display="none",document.getElementById("discovery-timer").style.display="none",m&&m.success?(t.style.display="none",o.style.display="block",document.getElementById("result-message").textContent="Server ditemukan!",document.getElementById("result-server").textContent=`${m.ip}:${m.port}`,setTimeout(()=>{Se(m)},1500)):(t.style.display="none",d.style.display="block",m&&m.timeout&&r&&(r.textContent="Waktu pencarian habis"),xe())}function xe(){const t=document.getElementById("manual-server"),e=document.getElementById("btn-manual-connect"),a=document.getElementById("btn-scan-qr"),s=document.getElementById("btn-retry-scan"),n=document.getElementById("manual-error"),i=Ot();i&&i.ip&&(t.value=`${i.ip}:${i.port||3001}`),e==null||e.addEventListener("click",async()=>{const o=t.value.trim();if(!o){n.textContent="Masukkan alamat server";return}e.disabled=!0,e.textContent="Menghubungkan...",n.textContent="";const d=await pa(o);d.success?Se(d):(n.textContent=d.error,e.disabled=!1,e.textContent="Hubungkan")}),t==null||t.addEventListener("keypress",o=>{o.key==="Enter"&&(e==null||e.click())}),a==null||a.addEventListener("click",()=>{Ba()}),s==null||s.addEventListener("click",()=>{location.reload()})}async function Ba(){const t=document.getElementById("qr-scanner-modal"),e=document.getElementById("qr-video"),a=document.getElementById("btn-close-qr");t.style.display="flex";try{const s=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment"}});e.srcObject=s,e.play(),a.onclick=()=>{s.getTracks().forEach(n=>n.stop()),t.style.display="none"}}catch(s){console.error("Camera error:",s),alert("Tidak dapat mengakses kamera. Pastikan izin kamera diberikan."),t.style.display="none"}}function Se(t){const e=document.getElementById("discovery-screen");e.classList.add("fade-out"),setTimeout(()=>{e.remove(),Dt&&Dt(t)},300)}function Ma(t){const e=(s,n=52,i=6,o="var(--radius-sm)")=>Array.from({length:s},()=>`<span class="sk" style="width:100%;height:${n}px;margin-bottom:${i}px;border-radius:${o};"></span>`).join(""),a=s=>s.map(n=>`<span class="sk sk-pill" style="flex-shrink:0;width:${n}px;height:30px;"></span>`).join("");switch(t){case"/":return`
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
        </div>`}}const Xt={"/":Ge,"/products":Ye,"/products/add":Kt,"/products/edit":Kt,"/transactions":ta,"/debts":ea,"/profile":wa,"/login":Ea,"/stock-history":xa,"/users":$a},et=new Map;let X=!1,j=null;const Pa=15e3;function Da(t){return Promise.race([t,new Promise((e,a)=>setTimeout(()=>a(new Error("__TIMEOUT__")),Pa))])}window.retryCurrentPage=()=>{j&&et.delete(j),H()};function Aa(){const t=window.location.hash.slice(1)||"/",[e,a]=t.split("?");return{path:e||"/",query:ja(a)}}function ja(t){return t?t.split("&").reduce((e,a)=>{const[s,n]=a.split("=");try{s&&(e[decodeURIComponent(s)]=decodeURIComponent(n||""))}catch{}return e},{}):{}}async function H(){var r,l;if(!X)return;const{path:t,query:e}=Aa();if(t===j&&t!=="/products/edit"&&!(t==="/products"&&e.filter))return;if(t!=="/login"&&!vt()){window.location.hash="/login";return}if(t==="/login"&&vt()){window.location.hash="/";return}const a=document.getElementById("page");document.querySelectorAll(".nav-item"),j=t,a.querySelectorAll(".page-instance").forEach(c=>{c.dataset.path!==t&&(c.classList.remove("active"),setTimeout(()=>{c.classList.contains("active")||(c.style.display="none")},300))});let n=et.get(t);const i=!n;i&&(n=document.createElement("div"),n.className="page-instance",n.dataset.path=t,n.style.display="none",a.appendChild(n),et.set(t,n));const o=document.getElementById("navbar"),d=document.getElementById("bottom-nav");if(t==="/login")o.style.display="none",d.style.display="none",document.body.style.paddingTop="0",document.body.style.paddingBottom="0";else{let c={title:"Toko Bersama App",showBack:!1,onRefresh:!1};t==="/"?c={title:"Dashboard",showBack:!1,onRefresh:!0}:t==="/products"?c={title:"Produk",showBack:!1,onRefresh:!1}:t==="/products/add"?c={title:"Tambah Produk",showBack:!0,onRefresh:!1}:t==="/products/edit"?c={title:"Edit Produk",showBack:!0,onRefresh:!1}:t==="/transactions"?c={title:"Transaksi",showBack:!1,onRefresh:!1}:t==="/debts"?c={title:"Piutang",showBack:!1,onRefresh:!1}:t==="/profile"?c={title:"Profil",showBack:!1,onRefresh:!1}:t==="/stock-history"?c={title:"Riwayat Stok",showBack:!0,onRefresh:!1}:t==="/users"&&(c={title:"Aktivitas User",showBack:!0,onRefresh:!1}),o.innerHTML=te(c),o.style.display="";const u={products:((r=window._dashboardStats)==null?void 0:r.lowStockCount)||0,debts:((l=window._dashboardStats)==null?void 0:l.overdueCount)||0};d.innerHTML=ee(u),d.style.display="",document.body.style.paddingTop="",document.body.style.paddingBottom=""}try{const c=Xt[t]||Xt["/"];if(i||t==="/products/edit"||t==="/products/add"){t!=="/login"&&(n.innerHTML=Ma(t),n.style.display="block",requestAnimationFrame(()=>n.classList.add("active")));const u=await Da(c(e));n.innerHTML=u,t==="/login"&&Ta(),t==="/"&&window.initDashboard&&window.initDashboard(),t==="/products"&&window.initProducts&&window.initProducts(),t==="/transactions"&&window.initTransactions&&window.initTransactions(),t==="/debts"&&window.initDebts&&window.initDebts(),t==="/profile"&&window.initProfile&&window.initProfile(),t==="/stock-history"&&window.initStockHistory&&window.initStockHistory(),t==="/users"&&window.initUserActivity&&window.initUserActivity(),(t==="/products/add"||t==="/products/edit")&&window.initProductForm&&window.initProductForm()}else t==="/"&&window.initDashboard&&window.initDashboard(),t==="/products"&&window.initProducts&&window.initProducts(e);n.classList.contains("active")||(n.style.display="block",requestAnimationFrame(()=>n.classList.add("active"))),t!=="/login"&&vt()&&ye()}catch(c){const u=c.message==="__TIMEOUT__",m=u?"Koneksi ke server terlalu lama.<br>Periksa jaringan Anda dan coba lagi.":(c.message||"Terjadi kesalahan").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");j&&et.delete(j),n.innerHTML=`
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 20px;text-align:center;gap:16px;min-height:60vh;">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color:var(--text-muted);flex-shrink:0;">
          ${u?'<path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>':'<path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>'}
        </svg>
        <p style="color:var(--text-secondary);font-size:14px;line-height:1.6;max-width:280px;margin:0;">${m}</p>
        <button class="btn btn-outline" onclick="window.retryCurrentPage()">Coba Lagi</button>
      </div>
    `,n.style.display="block",n.classList.add("active")}qa(t)}function qa(t){document.querySelectorAll(".nav-item").forEach(e=>{e.classList.toggle("active",e.dataset.path===t)})}async function Na(){if(window.location.hostname==="localhost"||window.location.hostname==="127.0.0.1"){Q("localhost",3001),X=!0,ut(),H();return}if(["admin.tbersamapalandan.my.id","admin.tbersama.my.id"].includes(window.location.hostname)){Q(window.location.hostname,443,"https"),X=!0,ut(),H();return}const a=Ot();if(a&&a.ip){const n=await $t(a.ip,a.port||3001);if(n.success){Q(n.ip,n.port),X=!0,ut(),H();return}}document.body.insertAdjacentHTML("afterbegin",Ca());const s=await La();s?Q(s.ip,s.port):Q(window.location.hostname,3001),X=!0,ut(),H()}function ut(){document.getElementById("navbar").innerHTML=te({title:"Toko Bersama App",showBack:!1,onRefresh:!1}),document.getElementById("bottom-nav").innerHTML=ee()}window.refreshCurrentPage=async()=>{const t=j;et.delete(t),j=null,await H()};window.addEventListener("hashchange",H);window.addEventListener("load",Na);"serviceWorker"in navigator&&navigator.serviceWorker.register("/sw.js").then(t=>{t.addEventListener("updatefound",()=>{const e=t.installing;e.addEventListener("statechange",()=>{e.state==="installed"&&navigator.serviceWorker.controller&&Ha(()=>window.location.reload())})})}).catch(()=>{});function Ha(t){if(document.getElementById("pwa-update-banner"))return;const a=document.createElement("div");a.id="pwa-update-banner",a.innerHTML=`
    <span>Versi terbaru tersedia</span>
    <button id="btn-pwa-update">Muat Ulang</button>
    <button id="btn-pwa-dismiss">✕</button>
  `,document.body.appendChild(a),document.getElementById("btn-pwa-update").addEventListener("click",()=>{a.remove(),t()}),document.getElementById("btn-pwa-dismiss").addEventListener("click",()=>{a.remove()})}window.showToast=Ct;window.openModal=t=>{const e=document.getElementById(t);e&&(e.classList.add("open"),document.body.classList.add("modal-open"),e.addEventListener("click",a=>{a.target===e&&window.closeModal(t)},{once:!0}))};window.closeModal=t=>{var e;(e=document.getElementById(t))==null||e.classList.remove("open"),document.body.classList.remove("modal-open")};document.addEventListener("click",t=>{t.target.classList.contains("modal-overlay")&&(t.target.classList.remove("open"),document.body.classList.remove("modal-open"))});function Ie(){const t=navigator.onLine;document.body.classList.toggle("offline-mode",!t),t?document.body.classList.contains("was-offline")&&Ct("Koneksi terpulihkan","success",2500):Ct("Koneksi terputus. Beberapa fitur mungkin tidak tersedia.","warning",5e3),document.body.classList.toggle("was-offline",!t)}window.addEventListener("online",Ie);window.addEventListener("offline",Ie);
