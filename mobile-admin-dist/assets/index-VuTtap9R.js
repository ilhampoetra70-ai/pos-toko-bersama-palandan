(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))s(n);new MutationObserver(n=>{for(const i of n)if(i.type==="childList")for(const o of i.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&s(o)}).observe(document,{childList:!0,subtree:!0});function a(n){const i={};return n.integrity&&(i.integrity=n.integrity),n.referrerPolicy&&(i.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?i.credentials="include":n.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function s(n){if(n.ep)return;n.ep=!0;const i=a(n);fetch(n.href,i)}})();let W=null;function Se(){return W||(W=document.createElement("div"),W.className="toast-container",document.body.appendChild(W)),W}function xe(t,e="success",a=3e3){const s=Se(),n=document.createElement("div");n.className=`toast toast-${e}`,n.textContent=t,s.appendChild(n);const i=()=>{n.classList.add("toast-out"),n.addEventListener("animationend",()=>n.remove(),{once:!0})},o=setTimeout(i,a);n.addEventListener("click",()=>{clearTimeout(o),i()})}function Ie(){return`
    <div class="navbar">
      <h1 class="navbar-title">Toko Bersama App</h1>
      <button class="navbar-btn" onclick="location.reload()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 4v5h5M20 20v-5h-5M5 19a9 9 0 0115-6.7M19 5a9 9 0 01-15 6.7"/>
        </svg>
      </button>
    </div>
  `}function Ee(){return`
    <nav class="bottom-nav">
      ${[{path:"/",label:"Dashboard",icon:"M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"},{path:"/products",label:"Produk",icon:"M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"},{path:"/transactions",label:"Transaksi",icon:"M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"},{path:"/debts",label:"Piutang",icon:"M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"},{path:"/profile",label:"Profil",icon:"M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"}].map(e=>`
        <a href="#${e.path}" class="nav-item" data-path="${e.path}">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path stroke-linecap="round" stroke-linejoin="round" d="${e.icon}"/>
          </svg>
          <span>${e.label}</span>
        </a>
      `).join("")}
    </nav>
  `}const _e="modulepreload",Te=function(t,e){return new URL(t,e).href},Nt={},Pe=function(e,a,s){let n=Promise.resolve();if(a&&a.length>0){let o=function(c){return Promise.all(c.map(m=>Promise.resolve(m).then(u=>({status:"fulfilled",value:u}),u=>({status:"rejected",reason:u}))))};const l=document.getElementsByTagName("link"),r=document.querySelector("meta[property=csp-nonce]"),d=(r==null?void 0:r.nonce)||(r==null?void 0:r.getAttribute("nonce"));n=o(a.map(c=>{if(c=Te(c,s),c in Nt)return;Nt[c]=!0;const m=c.endsWith(".css"),u=m?'[rel="stylesheet"]':"";if(!!s)for(let E=l.length-1;E>=0;E--){const D=l[E];if(D.href===c&&(!m||D.rel==="stylesheet"))return}else if(document.querySelector(`link[href="${c}"]${u}`))return;const k=document.createElement("link");if(k.rel=m?"stylesheet":_e,m||(k.as="script"),k.crossOrigin="",k.href=c,d&&k.setAttribute("nonce",d),document.head.appendChild(k),m)return new Promise((E,D)=>{k.addEventListener("load",E),k.addEventListener("error",()=>D(new Error(`Unable to preload CSS for ${c}`)))})}))}function i(o){const l=new Event("vite:preloadError",{cancelable:!0});if(l.payload=o,window.dispatchEvent(l),!l.defaultPrevented)throw o}return n.then(o=>{for(const l of o||[])l.status==="rejected"&&i(l.reason);return e().catch(i)})};let Pt="http",et=window.location.hostname==="localhost"?"localhost":window.location.hostname,O=3001,Me=3002;function f(){const t=O&&O!==80&&O!==443?`:${O}`:"";return`${Pt}://${et}${t}/api`}function Mt(){if(et==="localhost"){const t=`:${Me}`;return`${Pt}://${et}${t}/api/v2`}return f()+"/v2"}const T=new Map,Ce=50;function Be(t){return t.includes("/settings")||t.includes("/categories")?300*1e3:t.includes("/products")?60*1e3:t.includes("/dashboard")?35*1e3:30*1e3}function H(t=null){if(!t)T.clear(),console.log("[API Cache] All cleared");else{for(const e of T.keys())e.includes(t)&&T.delete(e);console.log(`[API Cache] Cleared keys containing: ${t}`)}}function K(t,e=3001,a="http"){console.log("[API] Check for Proxy v3.2-fix"),et=t,O=e,Pt=a,console.log(`[API] Server set to ${a}://${t}:${e}`)}function Ht(){return{host:et,port:O}}function Le(){let t=localStorage.getItem("pos_device_id");return t||(t=crypto.randomUUID(),localStorage.setItem("pos_device_id",t)),t}function De(){try{const t=localStorage.getItem("pos_admin_session");return t?JSON.parse(t).token:null}catch{return null}}function qt(t=null){localStorage.removeItem("pos_admin_session"),localStorage.removeItem("pos_admin_last_activity"),T.clear(),t&&sessionStorage.setItem("pos_logout_reason",t),(window.location.hash.replace("#","").split("?")[0]||"/")!=="/login"&&(window.location.hash="/login",window.location.reload())}async function y(t,e={}){const a=!e.method||e.method==="GET",s=t;if(a&&!e.bypassCache&&T.has(s)){const o=T.get(s);if(Date.now()<o.expiry)return console.log("[API Cache] Hit:",t),o.data;T.delete(s)}const n=De(),i=n?{Authorization:`Bearer ${n}`}:{};try{const o=await fetch(t,{...e,headers:{"Content-Type":"application/json",...i,...e.headers}});if(o.status===401&&!e.skipAuthRedirect){try{const r=await o.clone().json();qt(r.message)}catch{qt()}return}let l;try{l=await o.json()}catch{throw new Error(`Server error (${o.status})`)}if(!o.ok||l.success===!1)throw new Error(l.message||`Request failed (${o.status})`);return a?(T.size>=Ce&&T.delete(T.keys().next().value),T.set(s,{data:l,expiry:Date.now()+Be(t)})):(t.includes("/products")&&H("/products"),t.includes("/categories")&&H("/categories"),t.includes("/transactions")&&H("/transactions"),t.includes("/debts")&&H("/debts"),t.includes("/dashboard")&&H("/dashboard"),(t.includes("/users")||t.includes("/auth"))&&H("/users")),l}catch(o){throw console.error("[API Error]",t,o.message),o.name==="TypeError"&&o.message.includes("fetch")?new Error("Tidak dapat terhubung ke server. Periksa koneksi jaringan."):o}}async function Ae(){var u,w,k,E,D,z;let t;try{t=await y(`${Mt()}/dashboard/stats`),console.log("[Rust Service] Dashboard stats fetched successfully");try{const g=await y(`${f()}/dashboard/stats`,{bypassCache:!0});t.total_products=t.total_products||g.total_products,t.yesterday_profit=t.yesterday_profit||g.yesterday_profit,t.debt_total_outstanding=t.debt_total_outstanding||g.debt_total_outstanding,t.low_stock_products=t.low_stock_products||g.low_stock_products,t.slowMovingProducts=t.slowMovingProducts||g.slowMovingProducts}catch{}}catch(g){console.warn("[Rust Service] Unavailable, falling back to Express:",g.message),t=await y(`${f()}/dashboard/stats`,{bypassCache:!0})}const e=["Min","Sen","Sel","Rab","Kam","Jum","Sab"],a=[];for(let g=6;g>=0;g--){const M=new Date;M.setDate(M.getDate()-g);const J=M.toISOString().split("T")[0],N=(t.last_7_days||[]).find(V=>V.date===J);a.push({day:e[M.getDay()],amount:N&&(N.total||N.sales)||0,fullDate:J})}const s=[];for(let g=29;g>=0;g--){const M=new Date;M.setDate(M.getDate()-g);const J=M.toISOString().split("T")[0],N=(t.last_30_days||[]).find($e=>$e.date===J),V=M.getMonth()+1,ft=M.getDate(),ke=`${ft<10?"0"+ft:ft}/${V<10?"0"+V:V}`;s.push({day:ke,amount:N&&(N.total||N.sales)||0,fullDate:J})}const n=(t.top_products_today||[]).map(g=>({name:g.product_name||g.name,sold:g.qty||g.quantity,revenue:g.total})),i=[];t.low_stock_products&&t.low_stock_products.forEach(g=>{i.push({type:"lowStock",message:`${g.name} stok tersisa ${g.stock}`,time:"Stok rendah"})}),t.debt_overdue_count>0&&i.push({type:"overdue",message:`${t.debt_overdue_count} piutang jatuh tempo`,time:"Perlu tindakan"});const o=t.today_sales_total||((u=t.today_sales)==null?void 0:u.total)||0,l=t.today_sales_count||((w=t.today_sales)==null?void 0:w.count)||0,r=t.yesterday_sales_total||((k=t.yesterday_sales)==null?void 0:k.total)||0,d=t.yesterday_sales_count||((E=t.yesterday_sales)==null?void 0:E.count)||0,c=((D=t.today_profit)==null?void 0:D.profit)??t.today_profit??0,m=((z=t.yesterday_profit)==null?void 0:z.profit)??t.yesterday_profit??0;return{todaySales:o,yesterdaySales:r,todayProfit:c,yesterdayProfit:m,todayTransactions:l,yesterdayTransactions:d,totalProducts:t.total_products||0,lowStockCount:t.low_stock_count||0,totalDebt:t.debt_total_outstanding||t.totalDebt||0,overdueCount:t.debt_overdue_count||t.overdueCount||0,weekSales:a,monthSales:s,topProducts:n,slowMovingProducts:t.slowMovingProducts||[],recentAlerts:i}}async function Zt(t=120){let e;try{return e=await y(`${Mt()}/products/slow-moving?days=${t}`),console.log("[Rust Service] Slow moving products fetched successfully"),(Array.isArray(e)?e:e.products||[]).map(s=>({name:s.name,stock:s.stock,lastSold:s.last_sale||s.last_sold_date,daysSinceLastSale:s.days_since_sale||s.days_since_last_sale||s.days_inactive||t,daysSinceAdded:s.days_since_added}))}catch(a){console.warn("[Rust Service] Unavailable, falling back to Express:",a.message),e=await y(`${f()}/products/slow-moving?days=${t}`)}return(e.products||[]).map(a=>({name:a.name,stock:a.stock,lastSold:a.last_sold_date,daysSinceLastSale:a.days_since_last_sale||a.days_inactive||t,daysSinceAdded:a.days_since_added}))}async function Xt(){const t=JSON.parse(localStorage.getItem("pos_admin_session")||"null"),e=(t==null?void 0:t.userId)||1;try{const s=(await y(`${f()}/users/${e}`)).user||{};return{id:s.id,username:s.username||"User",fullName:s.full_name||s.username||"User",role:s.role||"cashier",lastLogin:s.last_login||null}}catch(a){if(console.error("[API] fetchCurrentUser failed:",a.message),a.message.includes("tidak ditemukan")||a.message.includes("404")){console.warn("[Session] User ID no longer valid, logging out...");const{logout:s}=await Pe(async()=>{const{logout:n}=await Promise.resolve().then(()=>ha);return{logout:n}},void 0,import.meta.url);s()}throw a}}async function je(t,e){return await y(`${f()}/auth/login`,{method:"POST",skipAuthRedirect:!0,body:JSON.stringify({username:t,password:e,device_id:Le(),device_name:navigator.userAgent.slice(0,150)})})}async function te(t){return y(`${f()}/users/${t}/sessions`,{bypassCache:!0})}async function Ne(t,e){return y(`${f()}/users/${t}/sessions/${e}`,{method:"DELETE"})}async function ee(){return(await y(`${f()}/categories`)).categories||[]}async function He(t){const e=await y(`${f()}/categories`,{method:"POST",body:JSON.stringify({name:t})});return{id:e.id,name:e.name}}async function qe(){return(await y(`${f()}/products/generate-barcode`,{bypassCache:!0})).barcode}async function gt(t="",e={},a=null,s=0){const n=new URLSearchParams;t&&n.append("search",t),e.categoryId&&n.append("category_id",e.categoryId),e.lowStock&&n.append("low_stock","true"),e.sortBy&&n.append("sort_by",e.sortBy),e.sortOrder&&n.append("sort_order",e.sortOrder),a&&n.append("limit",a),s&&n.append("offset",s);const i=await y(`${f()}/products?${n}`);let o=i.data||i.products,l=i.total;o||(o=Object.keys(i).filter(d=>d!=="success"&&!isNaN(d)).map(d=>i[d]),l||(l=o.length));let r=o.map(d=>({id:d.id,name:d.name,barcode:d.barcode,price:d.price,cost:d.cost,stock:d.stock,unit:d.unit||"pcs",category:d.category_name||d.category,categoryId:d.category_id}));return a!==null?{data:r,total:l||r.length}:r}async function Oe(t){const e=JSON.parse(localStorage.getItem("pos_admin_session")||"null"),a={...t,userId:(e==null?void 0:e.userId)||1,userName:(e==null?void 0:e.username)||"Admin"};return await y(`${f()}/products`,{method:"POST",body:JSON.stringify(a)})}async function Ue(t,e){const a=JSON.parse(localStorage.getItem("pos_admin_session")||"null"),s={...e,userId:(a==null?void 0:a.userId)||1,userName:(a==null?void 0:a.username)||"Admin"};return await y(`${f()}/products/${t}`,{method:"PUT",body:JSON.stringify(s)})}async function Re(t=null){const e=t?`${f()}/stock-history?productId=${t}`:`${f()}/stock-history`;return((await y(e)).history||[]).map(s=>({id:s.id,productId:s.product_id,productName:s.product_name,changeType:s.event_type||"manual",quantity:s.quantity_change||0,previousStock:s.quantity_before,newStock:s.quantity_after,notes:s.notes,createdAt:s.created_at,userName:s.user_name}))}async function Fe(t,e,a=""){const s=JSON.parse(localStorage.getItem("pos_admin_session")||"null"),n=(s==null?void 0:s.userId)||1;return await y(`${f()}/products/${t}/stock`,{method:"POST",body:JSON.stringify({adjustment:e,userId:n,notes:a})})}async function ae(t={}){const e=new URLSearchParams;return t.status&&t.status!=="all"&&e.append("status",t.status),t.dateFrom&&e.append("date_from",t.dateFrom),t.dateTo&&e.append("date_to",t.dateTo),t.search&&e.append("search",t.search),((await y(`${f()}/transactions?${e}`)).transactions||[]).map(s=>{var n;return{id:s.id,invoiceNumber:s.invoice_number,date:s.created_at,total:s.total,amountPaid:s.amount_paid,remainingBalance:s.remaining_balance,change:s.change_amount,items:s.item_count||((n=s.items)==null?void 0:n.length)||0,status:s.payment_status||"lunas",paymentStatus:s.payment_status,paymentMethod:s.payment_method,cashierName:s.cashier_name,customerName:s.customer_name,customerPhone:s.customer_phone,dueDate:s.due_date,paymentNotes:s.payment_notes,itemDetails:s.items}})}async function Ct(t){var s;let e,a;try{e=await y(`${Mt()}/transactions/${t}`),console.log("[Rust Service] Transaction detail fetched successfully"),a=e.transaction||e}catch(n){console.warn("[Rust Service] Unavailable, falling back to Express:",n.message),e=await y(`${f()}/transactions/${t}`),a=e.transaction}return{id:a.id,invoiceNumber:a.invoice_number||a.invoiceNumber,date:a.created_at||a.date,total:a.total,amountPaid:a.amount_paid||a.amountPaid,remainingBalance:a.remaining_balance||a.remainingBalance,change:a.change_amount||a.change,items:a.item_count||((s=a.items)==null?void 0:s.length)||0,status:a.payment_status||a.status||"lunas",paymentMethod:a.payment_method||a.paymentMethod,cashierName:a.cashier_name||a.cashierName,customerName:a.customer_name||a.customerName,dueDate:a.due_date||a.dueDate,itemDetails:a.items||a.itemDetails,paymentHistory:a.payment_history||a.paymentHistory||[],paymentNotes:a.payment_notes||a.paymentNotes}}async function ze(t,e){return await y(`${f()}/transactions/${t}/void`,{method:"POST",body:JSON.stringify({reason:e})})}async function se(t={}){const e=new URLSearchParams;return t.status&&t.status!=="all"&&e.append("status",t.status),t.overdue&&e.append("overdue","true"),t.search&&e.append("search",t.search),((await y(`${f()}/debts?${e}`)).debts||[]).map(s=>({id:s.invoice_number||s.id,customerName:s.customer_name,customerPhone:s.customer_phone,date:s.created_at,total:s.total,totalPaid:s.total_paid,remainingBalance:s.remaining_balance,dueDate:s.due_date,status:s.payment_status,isOverdue:s.is_overdue,daysOverdue:s.days_overdue||0}))}async function ne(){const t=await y(`${f()}/debts/summary`),e={pending:{count:0,total:0},hutang:{count:0,total:0},cicilan:{count:0,total:0}};return Array.isArray(t.by_status)&&t.by_status.forEach(a=>{a.payment_status&&e[a.payment_status]&&(e[a.payment_status]={count:a.count||0,total:a.total||0})}),{totalOutstanding:t.total_outstanding||0,totalCustomers:t.total_count||0,overdueCount:t.overdue_count||0,overdueAmount:t.overdue_total||0,byStatus:e}}async function Je(t,e,a,s){const n=JSON.parse(localStorage.getItem("pos_admin_session")||"null");return await y(`${f()}/transactions/${t}/payment`,{method:"POST",body:JSON.stringify({amount:e,method:a,userId:(n==null?void 0:n.userId)||1,notes:s})})}async function Bt(){try{return(await y(`${f()}/settings`)).settings||{}}catch(t){return console.warn("Failed to fetch settings, using defaults",t),{default_margin_percent:10.5}}}async function Ve(t){try{return await y(`${f()}/settings`,{method:"POST",body:JSON.stringify(t)})}catch(e){throw console.error("Failed to update settings",e),e}}async function We(){return(await y(`${f()}/users`,{bypassCache:!0})).users}function h(t){return new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",minimumFractionDigits:0,maximumFractionDigits:0}).format(t)}function ot(t){return new Intl.NumberFormat("id-ID").format(t)}function F(t){if(!t)return"";const e=String(t),a=/Z|[+-]\d{2}:?\d{2}$/.test(e)?e:e.replace(" ","T")+"Z",s=new Date(a);return isNaN(s.getTime())?t:new Intl.DateTimeFormat("id-ID",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"}).format(s)}function U(t){const e=String(t).replace(/\D/g,"");return e?new Intl.NumberFormat("id-ID").format(parseInt(e)):""}function rt(t){return t&&parseInt(String(t).replace(/\D/g,""))||0}function Ot(t){const e=document.getElementById(t);e&&(e.addEventListener("input",a=>{const s=a.target.selectionStart,n=a.target.value.length;a.target.value;const i=U(a.target.value);a.target.value=i;const l=i.length-n,r=Math.max(0,s+l);a.target.setSelectionRange(r,r)}),e.value&&(e.value=U(e.value)))}function Ke(){const t=navigator.userAgent;let e="Unknown Device",a="Unknown Browser",s="Unknown OS";if(/Android/i.test(t)){s="Android";const n=t.match(/Android[^;]*;\s*([^)]+)/);n&&(e=n[1].split("Build")[0].trim())}else/iPhone|iPad|iPod/i.test(t)?(s="iOS",/iPhone/i.test(t)?e="iPhone":/iPad/i.test(t)?e="iPad":e="iPod"):/Windows/i.test(t)?(s="Windows",e="PC"):/Mac/i.test(t)?(s="macOS",e="Mac"):/Linux/i.test(t)&&(s="Linux",e="PC");return/Chrome/i.test(t)&&!/Edg/i.test(t)?a="Chrome":/Safari/i.test(t)&&!/Chrome/i.test(t)?a="Safari":/Firefox/i.test(t)?a="Firefox":/Edg/i.test(t)?a="Edge":/Opera|OPR/i.test(t)&&(a="Opera"),{device:e,browser:a,os:s,displayName:e!=="Unknown Device"?e:`${a} on ${s}`}}let B=[],x=[],Q=120;async function ie(){const[t,e]=await Promise.all([Ae(),Zt(Q)]);B=t.topProducts,x=e;const a=t.yesterdaySales>0?((t.todaySales-t.yesterdaySales)/t.yesterdaySales*100).toFixed(1):0;t.yesterdayTransactions>0&&((t.todayTransactions-t.yesterdayTransactions)/t.yesterdayTransactions*100).toFixed(1);const s={week:t.weekSales,month:t.monthSales||[]},n=s.week.reduce((r,d)=>r+d.amount,0),i=s.month.reduce((r,d)=>r+d.amount,0),o=t.todaySales>=t.yesterdaySales?"positive":"negative",l=t.yesterdaySales>0?((t.todaySales-t.yesterdaySales)/t.yesterdaySales*100).toFixed(1):0;return window.dashboardData=s,window.currentChartPeriod="week",window.renderChart=r=>{const d=window.dashboardData[r],c=Math.max(...d.map(m=>m.amount))||1;return d.map(m=>{const u=m.amount/c*100;return`
        <div class="chart-col" title="${m.fullDate}: ${h(m.amount)}">
          <div class="chart-bar-bg">
            <div class="chart-bar-fill" style="height: ${u}%"></div>
          </div>
          <span class="chart-label">${m.day}</span>
        </div>
      `}).join("")},window.updateChartHeader=r=>{const d=r==="week"?n:i;document.getElementById("chart-total-value").textContent=h(d),document.getElementById("chart-total-label").textContent=r==="week"?"Total 7 Hari":"Total 30 Hari",document.querySelectorAll(".chart-filter-btn").forEach(c=>{c.classList.toggle("active",c.dataset.period===r)}),document.getElementById("dashboard-chart-container").innerHTML=window.renderChart(r),document.getElementById("dashboard-chart-container").className=`chart-container ${r==="month"?"compact-bars":""}`},setTimeout(()=>{window.updateChartHeader("week")},0),window.refreshDashboard=async()=>{const r=document.getElementById("btn-refresh");r&&(r.style.transition="transform 0.5s",r.style.transform="rotate(180deg)");const d=await ie();document.getElementById("page").innerHTML=d},`
    <div class="page dashboard-page">
      <div class="page-header">
        <h2 class="page-title">Dashboard</h2>
        <div class="header-actions">
          <button class="btn btn-icon" id="btn-refresh" onclick="refreshDashboard()" title="Segarkan Data">
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
            <div class="summary-value">${h(t.todaySales)}</div>
            <div class="summary-change ${a>=0?"positive":"negative"}">
              ${a>=0?"Naik":"Turun"} ${Math.abs(a)}%
            </div>
          </div>
        </div>
        <div class="summary-card success">
          <div class="summary-content">
            <div class="summary-label">Laba Hari Ini</div>
            <div class="summary-value">${h(t.todayProfit)}</div>
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
              <span id="chart-total-value" class="chart-stat-value">${h(n)}</span>
              <span class="chart-trend ${o==="positive"?"positive":"negative"}">
                ${o==="positive"?"↗":"↘"} ${Math.abs(l)}%
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
          <div class="quick-stat-value">${ot(t.todayTransactions)}</div>
          <div class="quick-stat-label">Transaksi</div>
        </div>
        <div class="quick-stat">
          <div class="quick-stat-value">${ot(t.totalProducts)}</div>
          <div class="quick-stat-label">Total Produk</div>
        </div>
         <div class="quick-stat ${t.lowStockCount>0?"warning":""}" onclick="window.location.hash='/products?filter=low'" style="cursor: pointer">
          <div class="quick-stat-value">${ot(t.lowStockCount)}</div>
          <div class="quick-stat-label">Stok Menipis</div>
        </div>
        <div class="quick-stat ${t.overdueCount>0?"danger":""}">
          <div class="quick-stat-value">${ot(t.overdueCount)}</div>
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
                  <div class="alert-message">${r.message}</div>
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
          ${xt(B.slice(0,5))}
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

      <!-- Quick Actions -->
      <div class="section-card">
        <div class="section-header">
          <h3 class="section-title">Aksi Cepat</h3>
        </div>
        <div class="quick-actions">
          <a href="#/products" class="action-btn">
            <svg class="action-icon-svg" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
              <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
            </svg>
            <span>Produk</span>
          </a>
          <a href="#/transactions" class="action-btn">
            <svg class="action-icon-svg" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
            </svg>
            <span>Transaksi</span>
          </a>
          <a href="#/debts" class="action-btn">
            <svg class="action-icon-svg" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
            </svg>
            <span>Piutang</span>
          </a>
          <a href="#/profile" class="action-btn">
            <svg class="action-icon-svg" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
            </svg>
            <span>Pengaturan</span>
          </a>
        </div>
      </div>
    </div>
  `}function xt(t){return t.length===0?'<div class="empty-state small">Tidak ada data</div>':t.map((e,a)=>`
    <div class="list-item">
      <div class="list-rank">${a+1}</div>
      <div class="list-content">
        <div class="list-title">${e.name}</div>
        <div class="list-subtitle">${e.sold} terjual</div>
      </div>
      <div class="list-value">${h(e.revenue)}</div>
    </div>
  `).join("")}function It(t){return t.length===0?"":t.map((e,a)=>`
    <div class="list-item slow-item">
      <div class="list-rank danger">${a+1}</div>
      <div class="list-content">
        <div class="list-title">${e.name}</div>
        <div class="list-subtitle">
          Stok: ${e.stock} •
          ${e.lastSold?`Terakhir: ${e.lastSold}`:"Belum pernah terjual"}
        </div>
      </div>
      <div class="list-days">
        <span class="days-badge">${e.daysSinceLastSale} hari</span>
      </div>
    </div>
  `).join("")}let bt=!1,ct=!1;window.toggleTopProducts=()=>{bt=!bt;const t=document.getElementById("top-products-list"),e=document.getElementById("btn-expand-top"),a=document.getElementById("top-count");bt?(t.innerHTML=xt(B.slice(0,30)),e.innerHTML=`
      <span>Tutup</span>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 10l4-4 4 4"/>
      </svg>
    `,e.classList.add("expanded"),a.textContent=`${Math.min(30,B.length)} dari ${B.length}`):(t.innerHTML=xt(B.slice(0,5)),e.innerHTML=`
      <span>Lihat Semua (${B.length})</span>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 6l4 4 4-4"/>
      </svg>
    `,e.classList.remove("expanded"),a.textContent=`5 dari ${B.length}`)};window.toggleSlowProducts=()=>{ct=!ct;const t=document.getElementById("slow-products-list"),e=document.getElementById("btn-expand-slow"),a=document.getElementById("slow-count");ct?(t.innerHTML=It(x.slice(0,30)),e.innerHTML=`
      <span>Tutup</span>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 10l4-4 4 4"/>
      </svg>
    `,e.classList.add("expanded"),a.textContent=`${Math.min(30,x.length)} dari ${x.length}`):(t.innerHTML=It(x.slice(0,5)),e.innerHTML=`
      <span>Lihat Semua (${x.length})</span>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 6l4 4 4-4"/>
      </svg>
    `,e.classList.remove("expanded"),a.textContent=`${Math.min(5,x.length)} dari ${x.length}`)};window.filterSlowProducts=async t=>{var n;Q=parseInt(t),x=await Zt(Q),ct=!1;const e=document.getElementById("slow-products-list"),a=document.getElementById("slow-count"),s=document.getElementById("days-label");if((n=document.getElementById("btn-expand-slow"))==null||n.parentElement,s.textContent=Q,x.length===0)e.innerHTML=`<div class="empty-state small">Tidak ada produk tidak laku dalam ${Q} hari</div>`,a.textContent="0",document.getElementById("btn-expand-slow")&&(document.getElementById("btn-expand-slow").style.display="none");else{e.innerHTML=It(x.slice(0,5)),a.textContent=`${Math.min(5,x.length)} dari ${x.length}`;let i=document.getElementById("btn-expand-slow");x.length>5?i&&(i.style.display="flex",i.innerHTML=`
          <span>Lihat Semua (${x.length})</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 6l4 4 4-4"/>
          </svg>
        `,i.classList.remove("expanded")):i&&(i.style.display="none")}};window.initDashboard=()=>{};let S=[],Ut=[],q=0,mt=1;const pt=20;let v={search:"",categoryId:null,lowStock:!1};async function Ge(t={}){t.filter==="low"&&(v.lowStock=!0,v.categoryId=null,v.search=""),mt=1;const[e,a]=await Promise.all([gt(v.search,v,pt,0),ee()]);S=e.data||e,q=e.total||S.length,Ut=a;const s=Ut.map(n=>`
    <button class="chip ${v.categoryId===n.id?"active":""}" data-category="${n.id}">${n.name}</button>
  `).join("");return`
    <div class="page products-page">
      <div class="page-header">
        <h2 class="page-title">Produk</h2>
        <div class="header-actions">
          <button class="btn btn-icon" data-action="stock-history" title="Riwayat Stok">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          <button class="btn btn-icon" data-action="add-product" title="Tambah Produk">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 4v16m-8-8h16"/>
            </svg>
          </button>
        </div>
      </div>

      <div class="search-bar">
        <input type="text" id="product-search" placeholder="Cari produk atau barcode..." class="search-input" value="${v.search}">
      </div>

      <div class="filter-chips">
        <button class="chip ${!v.lowStock&&!v.categoryId?"active":""}" data-filter="all">Semua</button>
        <button class="chip ${v.lowStock?"active":""}" data-filter="low">Stok Rendah &#9660;</button>
        ${s}
      </div>

      <div class="product-count">
        Menampilkan <span id="product-count-shown">${S.length}</span> dari <span id="product-count-total">${q}</span> produk
      </div>

      <div class="compact-list" id="product-list">
        ${Lt(S)}
      </div>

      <div class="load-more-container ${S.length>=q?"hidden":""}" id="load-more-container">
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
  `}function Lt(t){return t.length?t.map(e=>{const a=e.stock<=5;return`
      <div class="compact-item" data-product-id="${e.id}">
        <div class="compact-info" data-action="edit-product" data-product-id="${e.id}">
          <span class="compact-name">${e.name}</span>
          <span class="compact-meta">${e.category||"Umum"} • ${h(e.price)}</span>
        </div>
        <div class="compact-actions">
          <button class="btn btn-sm btn-icon" data-action="decrease-stock" data-product-id="${e.id}">−</button>
          <span class="stock-badge ${a?"low":""}">${e.stock}</span>
          <span class="stock-unit">${e.unit||"pcs"}</span>
          <button class="btn btn-sm btn-icon" data-action="increase-stock" data-product-id="${e.id}">+</button>
        </div>
      </div>
    `}).join(""):'<div class="empty-state">Tidak ada produk ditemukan</div>'}async function wt(){mt=1;const t=await gt(v.search,v,pt,0);S=t.data||t,q=t.total||S.length;const e=document.getElementById("product-list");e&&(e.innerHTML=Lt(S)),oe();const a=document.getElementById("load-more-container");a&&a.classList.toggle("hidden",S.length>=q)}async function Qe(){const t=document.getElementById("load-more-btn");t&&(t.disabled=!0,t.textContent="Memuat...");try{const e=mt*pt,a=await gt(v.search,v,pt,e),s=a.data||a;if(s.length>0){S=[...S,...s],mt++;const i=document.getElementById("product-list");i&&(i.innerHTML=Lt(S)),oe()}const n=document.getElementById("load-more-container");n&&n.classList.toggle("hidden",S.length>=q)}catch(e){console.error("Error loading more products:",e)}finally{t&&(t.disabled=!1,t.textContent="Muat Lebih Banyak")}}function oe(){const t=document.getElementById("product-count-shown"),e=document.getElementById("product-count-total");t&&(t.textContent=S.length),e&&(e.textContent=q)}window.initProducts=async(t={})=>{const e=document.querySelector(".products-page");if(!e)return;const a=document.getElementById("stock-adjust-modal");if(a&&a.parentElement!==document.body&&document.body.appendChild(a),t.filter==="low"){const r=document.querySelector('.chip[data-filter="low"]');if(!(r!=null&&r.classList.contains("active"))){v.lowStock=!0,v.categoryId=null,v.search="";const d=document.getElementById("product-search");d&&(d.value=""),document.querySelectorAll(".chip").forEach(c=>c.classList.remove("active")),r==null||r.classList.add("active"),await wt()}}e.addEventListener("click",async r=>{const d=r.target.closest("[data-action]");if(!d)return;const c=d.dataset.action,m=d.dataset.productId;switch(c){case"stock-history":window.location.hash="/stock-history";break;case"add-product":window.location.hash="/products/add";break;case"edit-product":m&&(window.location.hash=`/products/edit?id=${m}`);break;case"increase-stock":m&&await Ft(parseInt(m),1);break;case"decrease-stock":m&&await Ft(parseInt(m),-1);break}}),e.addEventListener("click",async r=>{const d=r.target.closest(".chip");if(!d)return;const c=d.dataset.category,m=d.dataset.filter;m==="all"?(v.categoryId=null,v.lowStock=!1,v.sortBy="name",v.sortOrder="asc"):m==="low"?(v.categoryId=null,v.lowStock=!0,v.sortBy="stock",v.sortOrder="asc"):c&&(v.categoryId=parseInt(c),v.lowStock=!1,v.sortBy="name",v.sortOrder="asc"),document.querySelectorAll(".chip").forEach(u=>u.classList.remove("active")),d.classList.add("active"),await wt()});const s=document.getElementById("product-search");let n;s==null||s.addEventListener("input",r=>{clearTimeout(n),n=setTimeout(async()=>{v.search=r.target.value,await wt()},150)});const i=document.getElementById("load-more-btn");i==null||i.addEventListener("click",async()=>{await Qe()});const o=document.getElementById("btn-confirm-stock-adjust");o==null||o.removeEventListener("click",Et),o==null||o.addEventListener("click",Et);const l=document.getElementById("stock-adjust-qty");l==null||l.removeEventListener("keydown",Rt),l==null||l.addEventListener("keydown",Rt)};let ut=null;function Rt(t){t.key==="Enter"&&Et()}function Ft(t,e){const a=S.find(l=>l.id===t);if(!a)return;const s=e>0?"Penambahan":"Pengurangan";ut={productId:t,direction:e,type:s};const n=document.getElementById("stock-adjust-title"),i=document.getElementById("stock-adjust-desc"),o=document.getElementById("stock-adjust-qty");n&&(n.textContent=`${s} Stok`),i&&(i.textContent=`Produk: ${a.name} (stok saat ini: ${a.stock})`),o&&(o.value="1",o.focus()),openModal("stock-adjust-modal")}async function Et(){var r,d,c,m;if(!ut)return;const{productId:t,direction:e,type:a}=ut,s=S.find(u=>u.id===t);if(!s)return;const n=document.getElementById("stock-adjust-qty"),i=parseInt((n==null?void 0:n.value)||"0");if(isNaN(i)||i<=0){(r=window.showToast)==null||r.call(window,"Jumlah harus berupa angka lebih dari 0","warning");return}const o=e*i,l=s.stock+o;if(l<0){(d=window.showToast)==null||d.call(window,"Stok tidak bisa kurang dari 0","error");return}closeModal("stock-adjust-modal"),ut=null;try{await Fe(t,o,`${a} manual via PWA`),s.stock=l;const u=document.querySelector(`[data-product-id="${t}"] .stock-badge`);u&&(u.textContent=l,u.classList.toggle("low",l<=5)),(c=window.showToast)==null||c.call(window,`Stok berhasil diperbarui: ${l}`,"success")}catch(u){console.error("Error adjusting stock:",u),(m=window.showToast)==null||m.call(window,"Gagal mengubah stok: "+u.message,"error")}}let vt=[],$=null,X=10.5,I=!1;async function zt(t){const e=t.id?parseInt(t.id):null,a=!!e;try{const l=await Bt();l.default_margin_percent&&(X=parseFloat(l.default_margin_percent))}catch{console.warn("Using default margin 10.5%")}vt=await ee();const s=vt.map(l=>`<option value="${l.name}">`).join(""),i=["pcs","kg","gram","liter","ml","pack","box","lusin","dus","karton","sachet","botol","kaleng","bungkus","pasang","set","rim","roll","meter","lembar"].map(l=>`<option value="${l}">`).join("");if(a){if($=(await gt()).find(r=>r.id===e),!$)return Ye(e);if($.margin_mode==="manual")I=!0;else if($.margin_mode==="auto")I=!1;else{const r=$.price||0,d=$.cost||0,c=1-X/100,m=Math.round(r*c);I=Math.abs(d-m)>100}}else $=null,I=!1;return`
    <div class="page product-form-page">
      <div class="page-header">
        <button class="btn btn-icon" id="btn-back">
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
                  value="${a?$.name:""}" class="input-lg">
              </div>

              <div class="form-group half-width">
                <label>Kategori <span class="required">*</span></label>
                <div class="input-with-icon">
                   <input type="text" id="product-category" list="category-list" placeholder="Pilih kategori..." 
                    autocomplete="off" required value="${a&&$.category||""}">
                   <datalist id="category-list">${s}</datalist>
                   <svg class="icon-right" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 9l-7 7-7-7"/></svg>
                </div>
              </div>

              <div class="form-group half-width">
                <label>Satuan <span class="required">*</span></label>
                <input type="text" id="product-unit" list="unit-list" placeholder="pcs" 
                  autocomplete="off" required value="${a?$.unit||"pcs":""}">
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
                    value="${a?U($.price):""}">
                </div>
              </div>

              <div class="form-group half-width">
                <div class="label-with-action">
                  <label>Harga Modal</label>
                  <label class="toggle-switch">
                    <input type="checkbox" id="cost-manual-toggle" ${I?"checked":""}>
                    <span class="toggle-slider"></span>
                    <span class="toggle-label">Manual</span>
                  </label>
                </div>
                <div class="input-prefix">
                  <span>Rp</span>
                  <input type="text" id="product-cost" inputmode="numeric" placeholder="0" autocomplete="off"
                    value="${a&&$.cost?U($.cost):""}"
                    ${I?"":"readonly"} class="${I?"":"bg-gray"}">
                </div>
                <small class="form-hint" id="cost-hint">
                  ${I?"Input manual":`Otomatis (Margin ${X}%)`}
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
  `}function Ye(t){return`
    <div class="page product-form-page">
      <div class="page-header">
        <button class="btn btn-icon" onclick="window.location.hash='/products'">
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
  `}async function Ze(t){const e=vt.find(a=>a.name.toLowerCase()===t.toLowerCase());if(e)return e.id;try{const a=await He(t);return vt.push(a),a.id}catch(a){return console.error("Error creating category:",a),null}}function Jt(t){const e=1-X/100;return Math.round(t*e)}async function Vt(){try{const t=await Xt();return{userId:t.id,userName:t.username}}catch{return{userId:null,userName:"System"}}}window.initProductForm=()=>{const t=document.getElementById("product-form"),e=document.getElementById("btn-back"),a=document.getElementById("btn-cancel"),s=document.getElementById("product-price"),n=document.getElementById("product-cost"),i=document.getElementById("cost-manual-toggle"),o=document.getElementById("cost-hint");try{Ot("product-price"),Ot("product-cost")}catch(r){console.error(r)}i==null||i.addEventListener("change",r=>{if(I=r.target.checked,I)n.readOnly=!1,n.classList.remove("bg-gray"),o.textContent="Input manual",n.focus();else{n.readOnly=!0,n.classList.add("bg-gray"),o.textContent=`Otomatis (Margin ${X}%)`;const d=rt(s.value);d&&(n.value=U(Jt(d)))}}),s==null||s.addEventListener("input",r=>{I||setTimeout(()=>{const d=rt(s.value);if(d){const c=Jt(d);n.value=U(c)}else n.value=""},0)});const l=()=>window.location.hash="/products";e==null||e.addEventListener("click",l),a==null||a.addEventListener("click",l),t==null||t.addEventListener("submit",async r=>{r.preventDefault();const d=document.getElementById("btn-save");d.textContent,d.disabled=!0,d.textContent="Menyimpan...";try{const c=document.getElementById("product-name").value.trim(),m=rt(s.value),u=rt(n.value)||0,w=parseInt(document.getElementById("product-stock").value)||0,k=document.getElementById("product-unit").value.trim().toLowerCase(),E=document.getElementById("product-category").value.trim();if(!c||!m||!k||!E)throw new Error("Mohon lengkapi field bertanda *");const D=await Ze(E),z={name:c,price:m,cost:u,unit:k,category_id:D,margin_mode:I?"manual":"auto",userId:(await Vt()).userId,userName:(await Vt()).userName};if($)await Ue($.id,z),alert("Produk berhasil diperbarui");else{const g=await qe();await Oe({...z,barcode:g,stock:w}),alert("Produk berhasil ditambahkan")}l()}catch(c){console.error(c),alert(c.message),d.disabled=!1}})};let L=[],j={status:"all",dateFrom:"",dateTo:"",search:""},p=null;async function Xe(){const t=new Date,e=`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,"0")}-${String(t.getDate()).padStart(2,"0")}`;return j.dateFrom=e,j.dateTo=e,L=await ae(j),`
    <div class="page transactions-page">
      <h2 class="page-title">Transaksi</h2>

      <div class="search-bar">
        <input type="text" id="tx-search" placeholder="Cari ID atau nama customer..." class="search-input">
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
          <span class="summary-value" id="tx-total">${h(re(L))}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Transaksi</span>
          <span class="summary-value" id="tx-count">${L.length}</span>
        </div>
      </div>

      <div class="compact-list" id="tx-list">
        ${de(L)}
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
  `}function re(t){return t.filter(e=>e.status!=="void").reduce((e,a)=>e+a.total,0)}function de(t){return t.length===0?'<div class="empty-state">Tidak ada transaksi ditemukan</div>':t.map(e=>{var i;const a={lunas:{class:"success",label:"Lunas"},pending:{class:"info",label:"Pending"},hutang:{class:"warning",label:"Hutang"},cicilan:{class:"purple",label:"Cicilan"},void:{class:"danger",label:"Void"}},s=a[e.status]||a.lunas,n=((i=e.itemDetails)==null?void 0:i.map(o=>`
      <div class="tx-item-row">
        <span class="tx-item-name">${o.name||o.product_name}</span>
        <span class="tx-item-qty">${o.qty||o.quantity}x</span>
        <span class="tx-item-price">${h(o.subtotal||o.price*(o.qty||o.quantity))}</span>
      </div>
    `).join(""))||'<div class="tx-items-loading">Memuat...</div>';return`
      <div class="tx-card status-${e.status} ${e.status==="void"?"voided":""}" data-id="${e.id}">
        <div class="tx-card-header" onclick="toggleTxExpand('${e.id}')">
          <div class="tx-card-main">
            <div class="tx-card-id">${e.invoiceNumber||"#"+e.id}</div>
            <div class="tx-card-info">
              ${e.customerName||"Walk-in"} • ${e.items} item • ${F(e.date)}
            </div>
          </div>
          <div class="tx-card-end">
            <div class="tx-card-total">${h(e.total)}</div>
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
    `}).join("")}window.showTxDetail=async t=>{var l;if(p=await Ct(t),!p)return;const e={lunas:{class:"success",label:"Lunas"},pending:{class:"info",label:"Pending"},hutang:{class:"warning",label:"Hutang"},cicilan:{class:"purple",label:"Cicilan"},void:{class:"danger",label:"Void"}},a=e[p.status]||e.lunas,s=((l=p.itemDetails)==null?void 0:l.map(r=>`
    <div class="item-row">
      <div class="item-name">${r.name||r.product_name}</div>
      <div class="item-qty">${r.qty||r.quantity}x ${h(r.price)}</div>
      <div class="item-subtotal">${h(r.subtotal)}</div>
    </div>
  `).join(""))||'<div class="empty-state small">Data item tidak tersedia</div>';let n="";p.paymentHistory&&p.paymentHistory.length>0&&(n=`
      <div class="detail-section">
        <h4 class="section-title">Riwayat Pembayaran</h4>
        <div class="payment-list">
          ${p.paymentHistory.map(d=>`
      <div class="payment-row">
        <div class="payment-info">
          <div class="payment-date">${d.date}</div>
          <div class="payment-method">${d.method} - ${d.receivedBy}</div>
          ${d.notes?`<div class="payment-notes">${d.notes}</div>`:""}
        </div>
        <div class="payment-amount">${h(d.amount)}</div>
      </div>
    `).join("")}
        </div>
      </div>
    `);let i="";p.status==="void"&&(i=`
      <div class="void-info">
        <div class="void-label">Dibatalkan</div>
        <div class="void-reason">${p.voidReason||"-"}</div>
        <div class="void-meta">${p.voidedAt} oleh ${p.voidedBy}</div>
      </div>
    `),document.getElementById("tx-detail-content").innerHTML=`
    <div class="detail-section">
      <div class="detail-header">
        <h4 class="detail-name">${p.invoiceNumber||"#"+p.id}</h4>
        <span class="badge badge-${a.class}">${a.label}</span>
      </div>
      <div class="detail-info">
        <div class="detail-row">
          <span class="detail-label">Tanggal</span>
          <span class="detail-value">${p.date}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Kasir</span>
          <span class="detail-value">${p.cashierName}</span>
        </div>
        ${p.customerName?`
          <div class="detail-row">
            <span class="detail-label">Customer</span>
            <span class="detail-value">${p.customerName}</span>
          </div>
        `:""}
        ${p.dueDate?`
          <div class="detail-row">
            <span class="detail-label">Jatuh Tempo</span>
            <span class="detail-value">${p.dueDate}</span>
          </div>
        `:""}
          <span class="detail-value">${p.paymentMethod||"-"}</span>
        </div>
      </div>
    </div>
    
    ${p.paymentNotes?`
    <div class="detail-section tx-notes">
        <div class="tx-notes-label">Catatan</div>
        <div class="tx-notes-text">${p.paymentNotes}</div>
    </div>
    `:""}

    <div class="detail-section">
      <h4 class="section-title">Item (${p.items})</h4>
      <div class="items-list">
        ${s}
      </div>
      <div class="items-total">
        <div class="total-row">
          <span>Total</span>
          <span>${h(p.total)}</span>
        </div>
        <div class="total-row">
          <span>Dibayar</span>
          <span>${h(p.amountPaid)}</span>
        </div>
        ${p.remainingBalance?`
          <div class="total-row highlight">
            <span>Sisa</span>
            <span>${h(p.remainingBalance)}</span>
          </div>
        `:""}
        ${p.change>0?`
          <div class="total-row">
            <span>Kembalian</span>
            <span>${h(p.change)}</span>
          </div>
        `:""}
      </div>
    </div>

    ${n}
    ${i}
  `;let o=`<button class="btn" onclick="closeModal('tx-detail-modal')">Tutup</button>`;p.status!=="void"&&(o=`
      <button class="btn btn-outline btn-danger" onclick="showVoidModal()">Void</button>
      ${o}
    `),document.getElementById("tx-detail-footer").innerHTML=o,openModal("tx-detail-modal")};window.showVoidModal=()=>{closeModal("tx-detail-modal"),document.getElementById("void-reason").value="",openModal("void-modal")};window.showVoidModalFor=t=>{const e=parseInt(t);p=L.find(a=>a.id===e),document.getElementById("void-reason").value="",openModal("void-modal")};window.toggleTxExpand=async t=>{var n;const e=document.querySelector(`.tx-card[data-id="${t}"]`),a=document.getElementById(`tx-body-${t}`);if(!e||!a)return;const s=e.classList.contains("expanded");if(document.querySelectorAll(".tx-card.expanded").forEach(i=>{i.classList.remove("expanded")}),!s){e.classList.add("expanded");const i=L.find(o=>String(o.id)===String(t));if(i&&!i.itemDetails)try{const o=await Ct(t);i.itemDetails=o.itemDetails;const l=((n=i.itemDetails)==null?void 0:n.map(r=>`
          <div class="tx-item-row">
            <span class="tx-item-name">${r.name||r.product_name}</span>
            <span class="tx-item-qty">${r.qty||r.quantity}x</span>
            <span class="tx-item-price">${h(r.subtotal||r.price*(r.qty||r.quantity))}</span>
          </div>
        `).join(""))||'<div class="empty-state small">Tidak ada item</div>';a.querySelector(".tx-items-list").innerHTML=l}catch(o){console.error("Error loading transaction items:",o),a.querySelector(".tx-items-list").innerHTML='<div class="empty-state small">Gagal memuat item</div>'}}};window.initTransactions=()=>{const t=document.querySelectorAll(".chip"),e=document.getElementById("date-from"),a=document.getElementById("date-to"),s=document.getElementById("tx-search"),n=document.getElementById("btn-confirm-void");t.forEach(i=>{i.addEventListener("click",async()=>{t.forEach(o=>o.classList.remove("active")),i.classList.add("active"),j.status=i.dataset.status,await G()})}),e==null||e.addEventListener("change",async()=>{j.dateFrom=e.value,await G()}),a==null||a.addEventListener("change",async()=>{j.dateTo=a.value,await G()}),s==null||s.addEventListener("input",async i=>{j.search=i.target.value,await G()}),n==null||n.addEventListener("click",async()=>{var o;if(!p)return;const i=document.getElementById("void-reason").value.trim();if(!i){(o=window.showToast)==null||o.call(window,"Masukkan alasan pembatalan","warning");return}await ze(p.id,i),closeModal("void-modal"),await G()})};async function G(){L=await ae(j),document.getElementById("tx-list").innerHTML=de(L),document.getElementById("tx-total").textContent=h(re(L)),document.getElementById("tx-count").textContent=L.length}let at=[],C={},A={status:"all",search:"",overdue:!1},b=null;async function ta(){const[t,e]=await Promise.all([se(),ne()]);return at=t,C=e,`
    <div class="page debts-page">
      <h2 class="page-title">Piutang</h2>

      <!-- Summary Cards -->
      <div class="debt-summary-cards">
        <div class="debt-summary-card primary">
          <div class="debt-card-label">Total Piutang</div>
          <div class="debt-card-value">${h(C.totalOutstanding)}</div>
          <div class="debt-card-sub">${C.totalCustomers} customer</div>
        </div>
        <div class="debt-summary-card ${C.overdueCount>0?"danger":"success"}">
          <div class="debt-card-label">Jatuh Tempo</div>
          <div class="debt-card-value">${C.overdueCount}</div>
          <div class="debt-card-sub">${h(C.overdueAmount)}</div>
        </div>
      </div>

      <!-- Status Breakdown -->
      <div class="status-breakdown">
        <div class="status-item" data-status="pending">
          <span class="status-dot pending"></span>
          <span class="status-label">Pending</span>
          <span class="status-count">${C.byStatus.pending.count}</span>
        </div>
        <div class="status-item" data-status="hutang">
          <span class="status-dot hutang"></span>
          <span class="status-label">Hutang</span>
          <span class="status-count">${C.byStatus.hutang.count}</span>
        </div>
        <div class="status-item" data-status="cicilan">
          <span class="status-dot cicilan"></span>
          <span class="status-label">Cicilan</span>
          <span class="status-count">${C.byStatus.cicilan.count}</span>
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
        ${le(at)}
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
  `}function le(t){return t.length===0?'<div class="empty-state">Tidak ada piutang</div>':t.map(e=>{const a={pending:{class:"info",label:"Pending"},hutang:{class:"warning",label:"Hutang"},cicilan:{class:"purple",label:"Cicilan"}},s=a[e.status]||a.hutang,n=e.isOverdue?"overdue":"",i=(e.totalPaid/e.total*100).toFixed(0);return`
      <div class="debt-card ${n}" onclick="showDebtDetail('${e.id}')">
        <div class="debt-card-header">
          <div class="debt-customer">${e.customerName}</div>
          <span class="badge badge-${s.class}">${s.label}</span>
        </div>
        <div class="debt-card-body">
          <div class="debt-tx-id">#${e.id}</div>
          <div class="debt-dates">
            <span>Transaksi: ${F(e.date)}</span>
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
            <div class="debt-total">Total: ${h(e.total)}</div>
            <div class="debt-remaining">Sisa: <strong>${h(e.remainingBalance)}</strong></div>
          </div>
          <div class="debt-progress">
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${i}%"></div>
            </div>
            <div class="progress-text">${i}% terbayar</div>
          </div>
        </div>
      </div>
    `}).join("")}window.showDebtDetail=async t=>{const e=await Ct(t);if(b=at.find(o=>o.id===t),!e||!b)return;const a={pending:{class:"info",label:"Pending"},hutang:{class:"warning",label:"Hutang"},cicilan:{class:"purple",label:"Cicilan"}},s=a[b.status]||a.hutang,n=(b.totalPaid/b.total*100).toFixed(0);let i="";e.paymentHistory&&e.paymentHistory.length>0&&(i=`
      <div class="detail-section">
        <h4 class="section-title">Riwayat Pembayaran</h4>
        <div class="payment-list">
          ${e.paymentHistory.map(l=>`
      <div class="payment-row">
        <div class="payment-info">
          <div class="payment-date">${l.date}</div>
          <div class="payment-method">${l.method} - ${l.receivedBy}</div>
          ${l.notes?`<div class="payment-notes">${l.notes}</div>`:""}
        </div>
        <div class="payment-amount">${h(l.amount)}</div>
      </div>
    `).join("")}
        </div>
      </div>
    `),document.getElementById("debt-detail-content").innerHTML=`
    <div class="detail-section">
      <div class="detail-header">
        <div>
          <h4 class="detail-name">${b.customerName}</h4>
          <div class="detail-phone">${b.customerPhone||"-"}</div>
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
          <span class="detail-value">${F(b.date)}</span>
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
          <span>${h(b.total)}</span>
        </div>
        <div class="payment-summary-row">
          <span>Sudah Dibayar</span>
          <span class="text-success">${h(b.totalPaid)}</span>
        </div>
        <div class="payment-summary-row highlight">
          <span>Sisa Tagihan</span>
          <span>${h(b.remainingBalance)}</span>
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
  `,openModal("debt-detail-modal")};window.initDebts=()=>{const t=document.querySelectorAll(".chip"),e=document.getElementById("debt-search"),a=document.getElementById("btn-add-payment"),s=document.getElementById("payment-form");t.forEach(n=>{n.addEventListener("click",async()=>{t.forEach(o=>o.classList.remove("active")),n.classList.add("active");const i=n.dataset.filter;i==="all"?A={status:"all",search:A.search,overdue:!1}:i==="overdue"?(A.overdue=!0,A.status="all"):(A.status=i,A.overdue=!1),await kt()})}),e==null||e.addEventListener("input",async n=>{A.search=n.target.value,await kt()}),a==null||a.addEventListener("click",()=>{b&&(closeModal("debt-detail-modal"),document.getElementById("payment-customer").textContent=b.customerName,document.getElementById("payment-remaining").textContent=h(b.remainingBalance),document.getElementById("payment-amount").max=b.remainingBalance,document.getElementById("payment-amount").value="",document.getElementById("payment-method").value="cash",document.getElementById("payment-notes").value="",openModal("payment-modal"))}),s==null||s.addEventListener("submit",async n=>{if(n.preventDefault(),!b)return;const i=parseInt(document.getElementById("payment-amount").value),o=document.getElementById("payment-method").value,l=document.getElementById("payment-notes").value;if(i>b.remainingBalance){alert("Jumlah pembayaran melebihi sisa tagihan");return}await Je(b.id,i,o,l),closeModal("payment-modal"),await kt(),C=await ne()})};async function kt(){at=await se(A),document.getElementById("debt-list").innerHTML=le(at)}const R=3001,ea=1500,$t=20,aa=3e4,sa=["192.168.1","192.168.0","10.0.0","10.0.1","10.1.0","10.1.1","172.16.0","172.16.1"],Dt="pos_server_config";function At(){try{const t=localStorage.getItem(Dt);return t?JSON.parse(t):null}catch{return null}}function ce(t){try{return localStorage.setItem(Dt,JSON.stringify({...t,savedAt:new Date().toISOString()})),!0}catch{return!1}}function na(){localStorage.removeItem(Dt)}async function yt(t,e=R){const a=new AbortController,s=setTimeout(()=>a.abort(),ea);try{const n=await fetch(`http://${t}:${e}/api/health`,{method:"GET",signal:a.signal,mode:"cors"});if(clearTimeout(s),n.ok){const i=await n.json();return{success:!0,ip:t,port:e,serverName:i.serverName||"POS Server",version:i.version||"1.0.0"}}return{success:!1}}catch{return clearTimeout(s),{success:!1}}}async function ia(){return new Promise(t=>{const e=[];try{const a=new RTCPeerConnection({iceServers:[{urls:"stun:stun.l.google.com:19302"}]});a.createDataChannel(""),a.onicecandidate=s=>{if(!s.candidate){a.close();const o=Wt(e);console.log("[Discovery] IP candidates:",e,"Best:",o),t(o);return}const i=s.candidate.candidate.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/);if(i){const o=i[1],l=oa(o);l&&e.push(l)}},a.createOffer().then(s=>a.setLocalDescription(s)).catch(s=>{console.error("[Discovery] WebRTC offer error:",s)}),setTimeout(()=>{a.close();const s=Wt(e);console.log("[Discovery] IP candidates (timeout):",e,"Best:",s),t(s)},3e3)}catch(a){console.error("[Discovery] WebRTC error:",a),t(null)}})}function oa(t){if(!t||!/^\d+\.\d+\.\d+\.\d+$/.test(t))return null;const e=t.split(".").map(Number),[a,s]=e;let n=0;if(a===10)n=3;else if(a===192&&s===168)n=2;else if(a===172&&s>=16&&s<=31)n=1;else return null;return{ip:t,subnet:e.slice(0,3).join("."),priority:n}}function Wt(t){return t.length===0?null:(t.sort((e,a)=>a.priority-e.priority),{ip:t[0].ip,subnet:t[0].subnet})}async function ra(t,e=R){return(await Promise.all(t.map(s=>yt(s,e)))).find(s=>s.success)||null}async function da(t,e,a,s){const n=[];for(let i=1;i<=254;i++)n.push(`${t}.${i}`);for(let i=0;i<n.length;i+=$t){if(s!=null&&s.aborted)return null;const o=n.slice(i,i+$t),l=await ra(o,e);if(a&&a({scanned:Math.min(i+$t,254),total:254,subnet:t}),l)return l}return null}async function la(t=null){const e=i=>{t&&t(i)},a=new AbortController;let s=!1;const n=setTimeout(()=>{s=!0,a.abort()},aa);try{e({phase:"checking_saved",message:"Memeriksa server tersimpan..."});const i=At();if(i&&i.ip){e({phase:"pinging_saved",message:`Menghubungi ${i.ip}...`});const d=await yt(i.ip,i.port||R);if(d.success)return clearTimeout(n),e({phase:"found",message:"Server ditemukan!",server:d}),d}e({phase:"detecting_ip",message:"Mendeteksi alamat IP perangkat..."});let o=null,l=null;try{const d=await ia();console.log("[Discovery] Device info:",d),d&&d.ip?(o=d.subnet,l=d.ip,e({phase:"detected_ip",message:`Perangkat di ${l}`,deviceIP:l,subnet:o})):(console.log("[Discovery] No device IP detected"),e({phase:"detection_failed",message:"Tidak dapat mendeteksi IP, mencoba subnet umum..."}))}catch(d){console.error("[Discovery] Detection error:",d),e({phase:"detection_failed",message:"Tidak dapat mendeteksi IP, mencoba subnet umum..."})}const r=[];o&&r.push(o);for(const d of sa)r.includes(d)||r.push(d);console.log("[Discovery] Subnets to scan:",r);for(let d=0;d<r.length&&!a.signal.aborted;d++){const c=r[d];e({phase:"scanning_subnet",message:d===0&&o?`Memindai jaringan ${c}.x ...`:`Mencoba subnet ${c}.x ...`,subnet:c,subnetIndex:d+1,totalSubnets:r.length});const u=await da(c,R,w=>{e({phase:"scanning_subnet",message:`Memindai ${c}.x (${w.scanned}/254)`,...w,subnetIndex:d+1,totalSubnets:r.length})},a.signal);if(u)return clearTimeout(n),ce(u),e({phase:"found",message:"Server ditemukan!",server:u}),u}return clearTimeout(n),s?(e({phase:"timeout",message:"Waktu pencarian habis"}),{timeout:!0}):(e({phase:"not_found",message:"Server tidak ditemukan"}),null)}catch(i){return clearTimeout(n),s?(e({phase:"timeout",message:"Waktu pencarian habis"}),{timeout:!0}):(e({phase:"error",message:"Terjadi kesalahan: "+i.message}),null)}}function ca(t){try{if(t.startsWith("http")){const n=new URL(t);return{ip:n.hostname,port:parseInt(n.port)||R}}const[e,a]=t.split(":"),s=parseInt(a)||R;return/^\d+\.\d+\.\d+\.\d+$/.test(e)?{ip:e,port:s}:null}catch{return null}}async function ua(t){const e=ca(t);if(!e)return{success:!1,error:"Format tidak valid. Gunakan format IP:Port (contoh: 192.168.1.100:3001)"};const a=await yt(e.ip,e.port);return a.success?(ce(a),a):{success:!1,error:"Server tidak merespons. Pastikan POS server berjalan."}}const ht=600*1e3,ma=1440*60*1e3,nt="pos_admin_session",it="pos_admin_last_activity";let P=null,_t=!1;const ue=["mousedown","mousemove","keydown","scroll","touchstart","touchmove","click"];function jt(){if(!_t){if(!tt()){ye();return}ue.forEach(t=>{document.addEventListener(t,me,{passive:!0})}),ve(),document.addEventListener("visibilitychange",()=>{document.visibilityState==="visible"&&va()}),_t=!0,console.log("[Session] Initialized with 10 minute timeout")}}function me(){pe(),ve()}function pe(){localStorage.setItem(it,Date.now().toString())}function pa(){const t=localStorage.getItem(it);return t?parseInt(t):Date.now()}function ve(){P&&clearTimeout(P),P=setTimeout(()=>{console.log("[Session] Inactivity timeout reached"),st("Sesi berakhir karena tidak ada aktivitas")},ht)}function va(){const t=pa(),e=Date.now()-t;if(e>=ht)console.log("[Session] Session expired while away"),st("Sesi berakhir karena tidak ada aktivitas");else{const a=ht-e;P&&clearTimeout(P),P=setTimeout(()=>{st("Sesi berakhir karena tidak ada aktivitas")},a)}}function dt(){localStorage.removeItem(nt),localStorage.removeItem(it)}function tt(){const t=localStorage.getItem(nt);if(!t)return!1;try{const e=JSON.parse(t);if(e.loginAt&&Date.now()-new Date(e.loginAt).getTime()>=ma||!e.token)return dt(),!1;const a=localStorage.getItem(it);return a&&Date.now()-parseInt(a)>=ht?(dt(),!1):!0}catch{return dt(),!1}}function he(t){localStorage.setItem(nt,JSON.stringify({...t,loginAt:new Date().toISOString()})),pe(),jt()}function ge(){try{const t=localStorage.getItem(nt);return t?JSON.parse(t):null}catch{return null}}function st(t=null){P&&(clearTimeout(P),P=null),H(),ue.forEach(e=>{document.removeEventListener(e,me)}),localStorage.removeItem(nt),localStorage.removeItem(it),_t=!1,t&&sessionStorage.setItem("pos_logout_reason",t),ye()}function ye(){window.location.hash="/login",window.location.reload()}window.addEventListener("beforeunload",()=>{P&&clearTimeout(P)});const ha=Object.freeze(Object.defineProperty({__proto__:null,getSession:ge,initSession:jt,isLoggedIn:tt,logout:st,saveSession:he},Symbol.toStringTag,{value:"Module"}));let _=null;async function ga(){const[t,e]=await Promise.all([Xt(),Bt()]);_=t;const s=(await te(t.id).catch(()=>({sessions:[]}))).sessions||[];Ke();const n={admin:"Administrator",supervisor:"Supervisor",cashier:"Kasir"},i=localStorage.getItem("pos_device_id"),o=t.role==="admin",l=fe(s,t.id,i,o);return`
    <div class="page profile-page">
      <h2 class="page-title">Profil</h2>

      <!-- User Info Card -->
      <div class="profile-card">
        <div class="profile-avatar">
          ${_.fullName.charAt(0).toUpperCase()}
        </div>
        <div class="profile-info">
          <div class="profile-name">${_.fullName}</div>
          <div class="profile-role">${n[_.role]||_.role}</div>
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
            <span class="detail-value">${_.username}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Login Terakhir</span>
            <span class="detail-value">${_.lastLogin?F(_.lastLogin):"-"}</span>
          </div>
          ${o?`
          <div class="detail-row clickable" onclick="window.location.hash='#/users'">
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
          ${l}
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
            <span class="setting-value" id="current-server">${Ht().host}:${Ht().port}</span>
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
  `}function fe(t,e,a,s=!1){return t.length===0?'<div class="empty-state small">Belum ada data perangkat</div>':t.map(n=>{const i=n.device_id===a,o=n.last_seen?new Date(n.last_seen).toLocaleString("id-ID",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}):"-";return`
      <div class="session-item ${i?"current":""}">
        <div class="session-info">
          <div class="session-device">${ya(n.device_name)}</div>
          <div class="session-details">
            Terakhir aktif: ${o}
            ${i?'<span class="current-badge">Perangkat Ini</span>':""}
          </div>
        </div>
        ${!i&&s?`<button class="btn btn-sm btn-danger" onclick="revokeSession(${e}, ${n.id})">Cabut</button>`:""}
      </div>
    `}).join("")}function ya(t){if(!t)return"Perangkat tidak dikenal";if(t.includes("Android")){const e=t.match(/Android[^;)]*[;)]/);return"Android - "+(e?e[0].replace(/[;)]/g,"").trim():"Mobile")}return t.includes("iPhone")||t.includes("iPad")?"iOS - Safari":t.includes("Windows")?"Windows - Browser":t.includes("Mac")?"Mac - Browser":t.slice(0,40)+"..."}window.rediscoverServer=()=>{confirm(`Cari ulang server POS?
Aplikasi akan dimuat ulang.`)&&(na(),window.location.reload())};window.clearCache=async()=>{var t;if("caches"in window){const e=await caches.keys();await Promise.all(e.map(a=>caches.delete(a))),(t=window.showToast)==null||t.call(window,"Cache berhasil dihapus","success")}};window.handleLogout=()=>{confirm("Keluar dari akun?")&&st()};window.updateTimezone=async t=>{var e,a;try{const s=parseFloat(t);await Ve({timezone_offset:s}),(e=window.showToast)==null||e.call(window,"Zona waktu berhasil disimpan","success")}catch(s){(a=window.showToast)==null||a.call(window,"Gagal menyimpan zona waktu: "+s.message,"error")}};window.initProfile=async()=>{try{const t=await Bt(),e=document.getElementById("select-timezone");e&&t.timezone_offset?e.value=t.timezone_offset:e&&(e.value="7")}catch(t){console.error("Error init profile settings",t)}};window.revokeSession=async(t,e)=>{var a,s,n;if((_==null?void 0:_.role)!=="admin"){(a=window.showToast)==null||a.call(window,"Hanya admin yang dapat mencabut akses perangkat","error");return}if(confirm("Cabut akses perangkat ini?"))try{await Ne(t,e);const i=await te(t).catch(()=>({sessions:[]})),o=localStorage.getItem("pos_device_id");document.getElementById("sessions-list").innerHTML=fe(i.sessions||[],t,o,!0),(s=window.showToast)==null||s.call(window,"Akses perangkat dicabut","success")}catch(i){(n=window.showToast)==null||n.call(window,"Gagal mencabut akses: "+i.message,"error")}};let Kt=[];async function fa(){const t=ge();if((t==null?void 0:t.role)!=="admin")return window.location.hash="/","<div></div>";Kt=await We();const e={admin:"Administrator",supervisor:"Supervisor",cashier:"Kasir"};return`
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
        ${Kt.map(s=>`
      <div class="section-card user-activity-card">
        <div class="user-card-header">
          <div class="user-avatar">${(s.fullName||s.username||"U").charAt(0).toUpperCase()}</div>
          <div class="user-main-info">
            <div class="user-name">${s.fullName||s.username}</div>
            <div class="user-role-badge ${s.role}">${e[s.role]||s.role}</div>
          </div>
        </div>
        <div class="user-card-details">
          <div class="detail-row">
            <span class="detail-label">Username</span>
            <span class="detail-value">@${s.username}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Login Terakhir</span>
            <span class="detail-value">${s.lastLogin?F(s.lastLogin):"Belum pernah login"}</span>
          </div>
        </div>
      </div>
    `).join("")}
      </div>
    </div>
  `}window.initUserActivity=()=>{};async function ba(){const t=await Re(null);return`
    <div class="page stock-history-page">
      <div class="page-header">
        <button class="btn btn-icon" onclick="window.history.back()">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 class="page-title">Riwayat Stok</h2>
      </div>

      <div class="history-list full-page-list">
        ${wa(t)}
      </div>
    </div>
  `}function wa(t){if(t.length===0)return'<div class="empty-state">Belum ada riwayat perubahan stok</div>';const e=t.reduce((a,s)=>{const n=s.createdAt.split("T")[0];return a[n]||(a[n]=[]),a[n].push(s),a},{});return Object.keys(e).sort().reverse().map(a=>`
    <div class="history-group">
      <div class="history-date-header">${F(a)}</div>
      ${e[a].map(s=>{const n={sale:"Penjualan",manual:"Manual",restock:"Restok",adjustment:"Koreksi",import:"Import",initial:"Stok Awal"},i=s.quantity>0?"positive":"negative";return`
          <div class="history-item">
            <div class="history-icon ${s.changeType}">
               ${ka(s.changeType)}
            </div>
            <div class="history-content">
              <div class="history-title">${s.productName}</div>
              <div class="history-meta">
                ${n[s.changeType]||s.changeType} • ${s.userName||"-"}
                ${s.notes?`<br><span class="history-notes">"${s.notes}"</span>`:""}
              </div>
            </div>
            <div class="history-change ${i}">
              ${s.quantity>0?"+":""}${s.quantity}
            </div>
          </div>
        `}).join("")}
    </div>
  `).join("")}function ka(t){return t==="sale"?'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>':t==="restock"?'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v16m-8-8h16"/></svg>':'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>'}function $a(){const t=window.APP_CONFIG||{name:"POS Admin",logo:null,tagline:"Masuk untuk mengelola toko Anda"},e=t.name,a=t.tagline||"Masuk untuk mengelola toko Anda";return`
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
  `}function Sa(){const t=document.getElementById("login-form"),e=document.getElementById("login-error"),a=document.getElementById("error-text"),s=document.getElementById("btn-login"),n=document.getElementById("password"),i=document.getElementById("toggle-password"),o=sessionStorage.getItem("pos_logout_reason");o&&(sessionStorage.removeItem("pos_logout_reason"),a.textContent=o,e.style.display="flex"),setTimeout(()=>{var r;(r=document.getElementById("username"))==null||r.focus()},300),i==null||i.addEventListener("click",()=>{const r=n.getAttribute("type")==="password"?"text":"password";n.setAttribute("type",r);const d=r==="password"?'<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>':'<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path>';i.querySelector("svg").innerHTML=d}),t==null||t.addEventListener("submit",async r=>{r.preventDefault();const d=document.getElementById("username").value.trim(),c=document.getElementById("password").value;if(!d||!c){l("Username dan password wajib diisi");return}s.disabled=!0,s.innerHTML='<div class="login-spinner"></div> Memproses...',e.style.display="none";try{const m=Date.now(),u=await je(d,c),w=Date.now()-m;w<500&&await new Promise(k=>setTimeout(k,500-w)),u.success?(he({userId:u.user.id,username:u.user.username,fullName:u.user.full_name||u.user.name,role:u.user.role,token:u.token}),window.location.hash="/",window.location.reload()):l(u.message||"Login gagal, periksa username/password")}catch(m){console.error("Login error:",m),l(m.message||"Gagal terhubung ke server")}finally{!e.style.display||e.style.display==="none"||(s.disabled=!1,s.innerHTML='<span class="btn-text">Masuk Sekarang</span>')}});function l(r){a.textContent=r,e.style.display="flex",s.disabled=!1,s.innerHTML='<span class="btn-text">Masuk Sekarang</span>',e.style.animation="none",e.offsetHeight,e.style.animation="shake 0.4s ease-in-out"}}let Tt=null,St=!1;function xa(){return`
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
  `}async function Ia(){return new Promise(t=>{Tt=t,Ea().catch(e=>{console.error("[Discovery] Unexpected error:",e);const a=document.getElementById("discovery-status"),s=document.getElementById("discovery-manual");a&&(a.style.display="none"),s&&(s.style.display="block"),be()})})}async function Ea(){const t=document.getElementById("discovery-status"),e=document.getElementById("discovery-message"),a=document.getElementById("discovery-submessage"),s=document.getElementById("discovery-progress"),n=document.getElementById("progress-fill"),i=document.getElementById("progress-text"),o=document.getElementById("discovery-result"),l=document.getElementById("discovery-manual"),r=document.querySelector(".manual-title");St=!0;const d=document.getElementById("timer-text");let c=30;const m=setInterval(()=>{c--,d&&(d.textContent=c),c<=0&&clearInterval(m)},1e3),u=await la(w=>{if(St&&(e.textContent=w.message,w.phase==="detected_ip"&&w.deviceIP&&(a.textContent=`IP Perangkat: ${w.deviceIP}`),w.phase==="scanning_subnet"&&w.scanned)){s.style.display="block";const k=Math.round(w.scanned/w.total*100);n.style.width=`${k}%`,i.textContent=`${k}%`,w.subnet&&(a.textContent=`Subnet: ${w.subnet}.x`)}});St=!1,clearInterval(m),s.style.display="none",document.getElementById("discovery-timer").style.display="none",u&&u.success?(t.style.display="none",o.style.display="block",document.getElementById("result-message").textContent="Server ditemukan!",document.getElementById("result-server").textContent=`${u.ip}:${u.port}`,setTimeout(()=>{we(u)},1500)):(t.style.display="none",l.style.display="block",u&&u.timeout&&r&&(r.textContent="Waktu pencarian habis"),be())}function be(){const t=document.getElementById("manual-server"),e=document.getElementById("btn-manual-connect"),a=document.getElementById("btn-scan-qr"),s=document.getElementById("btn-retry-scan"),n=document.getElementById("manual-error"),i=At();i&&i.ip&&(t.value=`${i.ip}:${i.port||3001}`),e==null||e.addEventListener("click",async()=>{const o=t.value.trim();if(!o){n.textContent="Masukkan alamat server";return}e.disabled=!0,e.textContent="Menghubungkan...",n.textContent="";const l=await ua(o);l.success?we(l):(n.textContent=l.error,e.disabled=!1,e.textContent="Hubungkan")}),t==null||t.addEventListener("keypress",o=>{o.key==="Enter"&&(e==null||e.click())}),a==null||a.addEventListener("click",()=>{_a()}),s==null||s.addEventListener("click",()=>{location.reload()})}async function _a(){const t=document.getElementById("qr-scanner-modal"),e=document.getElementById("qr-video"),a=document.getElementById("btn-close-qr");t.style.display="flex";try{const s=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment"}});e.srcObject=s,e.play(),a.onclick=()=>{s.getTracks().forEach(n=>n.stop()),t.style.display="none"}}catch(s){console.error("Camera error:",s),alert("Tidak dapat mengakses kamera. Pastikan izin kamera diberikan."),t.style.display="none"}}function we(t){const e=document.getElementById("discovery-screen");e.classList.add("fade-out"),setTimeout(()=>{e.remove(),Tt&&Tt(t)},300)}function Ta(t){const e=(s,n=52,i=6,o="var(--radius-sm)")=>Array.from({length:s},()=>`<span class="sk" style="width:100%;height:${n}px;margin-bottom:${i}px;border-radius:${o};"></span>`).join(""),a=s=>s.map(n=>`<span class="sk sk-pill" style="flex-shrink:0;width:${n}px;height:30px;"></span>`).join("");switch(t){case"/":return`
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
        </div>`}}const Gt={"/":ie,"/products":Ge,"/products/add":zt,"/products/edit":zt,"/transactions":Xe,"/debts":ta,"/profile":ga,"/login":$a,"/stock-history":ba,"/users":fa},Qt=new Map;let Y=!1,Yt=null;function Pa(){const t=window.location.hash.slice(1)||"/",[e,a]=t.split("?");return{path:e||"/",query:Ma(a)}}function Ma(t){return t?t.split("&").reduce((e,a)=>{const[s,n]=a.split("=");try{s&&(e[decodeURIComponent(s)]=decodeURIComponent(n||""))}catch{}return e},{}):{}}async function Z(){if(!Y)return;const{path:t,query:e}=Pa();if(t===Yt&&t!=="/products/edit"&&!(t==="/products"&&e.filter))return;if(t!=="/login"&&!tt()){window.location.hash="/login";return}if(t==="/login"&&tt()){window.location.hash="/";return}const a=document.getElementById("page");document.querySelectorAll(".nav-item"),Yt=t,a.querySelectorAll(".page-instance").forEach(r=>{r.dataset.path!==t&&(r.classList.remove("active"),setTimeout(()=>{r.classList.contains("active")||(r.style.display="none")},300))});let n=Qt.get(t);const i=!n;i&&(n=document.createElement("div"),n.className="page-instance",n.dataset.path=t,n.style.display="none",a.appendChild(n),Qt.set(t,n));const o=document.getElementById("navbar"),l=document.getElementById("bottom-nav");t==="/login"?(o.style.display="none",l.style.display="none",document.body.style.paddingTop="0",document.body.style.paddingBottom="0"):(o.style.display="",l.style.display="",document.body.style.paddingTop="",document.body.style.paddingBottom="");try{const r=Gt[t]||Gt["/"];if(i||t==="/products/edit"||t==="/products/add"){t!=="/login"&&(n.innerHTML=Ta(t),n.style.display="block",requestAnimationFrame(()=>n.classList.add("active")));const d=await r(e);n.innerHTML=d,t==="/login"&&Sa(),t==="/"&&window.initDashboard&&window.initDashboard(),t==="/products"&&window.initProducts&&window.initProducts(),t==="/transactions"&&window.initTransactions&&window.initTransactions(),t==="/debts"&&window.initDebts&&window.initDebts(),t==="/profile"&&window.initProfile&&window.initProfile(),t==="/stock-history"&&window.initStockHistory&&window.initStockHistory(),t==="/users"&&window.initUserActivity&&window.initUserActivity(),(t==="/products/add"||t==="/products/edit")&&window.initProductForm&&window.initProductForm()}else t==="/"&&window.initDashboard&&window.initDashboard(),t==="/products"&&window.initProducts&&window.initProducts(e);n.classList.contains("active")||(n.style.display="block",requestAnimationFrame(()=>n.classList.add("active"))),t!=="/login"&&tt()&&jt()}catch(r){const d=(r.message||"Unknown error").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");n.innerHTML=`<div class="error">Error: ${d}</div>`,n.style.display="block",n.classList.add("active")}Ca(t)}function Ca(t){document.querySelectorAll(".nav-item").forEach(e=>{e.classList.toggle("active",e.dataset.path===t)})}async function Ba(){if(window.location.hostname==="localhost"||window.location.hostname==="127.0.0.1"){K("localhost",3001),Y=!0,lt(),Z();return}if(["admin.tbersamapalandan.my.id","admin.tbersama.my.id"].includes(window.location.hostname)){K(window.location.hostname,443,"https"),Y=!0,lt(),Z();return}const a=At();if(a&&a.ip){const n=await yt(a.ip,a.port||3001);if(n.success){K(n.ip,n.port),Y=!0,lt(),Z();return}}document.body.insertAdjacentHTML("afterbegin",xa());const s=await Ia();s?K(s.ip,s.port):K(window.location.hostname,3001),Y=!0,lt(),Z()}function lt(){document.getElementById("navbar").innerHTML=Ie(),document.getElementById("bottom-nav").innerHTML=Ee()}window.addEventListener("hashchange",Z);window.addEventListener("load",Ba);"serviceWorker"in navigator&&navigator.serviceWorker.register("/sw.js").catch(()=>{});window.showToast=xe;window.openModal=t=>{var e;(e=document.getElementById(t))==null||e.classList.add("open"),document.body.classList.add("modal-open")};window.closeModal=t=>{var e;(e=document.getElementById(t))==null||e.classList.remove("open"),document.body.classList.remove("modal-open")};document.addEventListener("click",t=>{t.target.classList.contains("modal-overlay")&&(t.target.classList.remove("open"),document.body.classList.remove("modal-open"))});
