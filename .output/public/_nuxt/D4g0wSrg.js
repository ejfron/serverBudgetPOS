import{x as m,R as E}from"./CFAr_G9y.js";const p=m(!1),w=m(null),P=m(null),$=m(!1),A=m([]),h=m(""),I=m(""),C=m(!1),x=m(32),S=m(!0);let K=!1;const te={tapsilogan:"TAPSILOGAN",restaurant:"RESTAURANT",fastfood:"FAST FOOD",karinderya:"KARINDERYA",sarisari:"SARI-SARI STORE"};function z(u){return te[u??""]??"TAPSILOGAN"}function M(u){const g=u.price_type==="wholesale"?"Wholesale":u.price_type==="custom"?"Custom":"",_=[];return u.size_name&&_.push(u.size_name),g&&_.push(g),_.length?` (${_.join(", ")})`:""}function ae(){function u(){try{return!!window.Capacitor?.isNativePlatform?.()}catch{return!1}}function g(){try{return!!window.electronAPI?.isElectron}catch{return!1}}if(!K){K=!0;try{const e=localStorage.getItem("tapsilogan_printer_width");(e==="32"||e==="42")&&(x.value=Number(e));const s=localStorage.getItem("tapsilogan_print_kitchen_copy");s!==null&&(S.value=s==="true")}catch{}}function _(e){x.value=e,localStorage.setItem("tapsilogan_printer_width",String(e))}function W(e){S.value=e,localStorage.setItem("tapsilogan_print_kitchen_copy",String(e))}async function G(){if($.value=!0,A.value=[],h.value="",I.value="",!u()){$.value=!1,h.value="Bluetooth printing only works in the Android app.";return}try{const{BluetoothSerial:e}=await E(async()=>{const{BluetoothSerial:r}=await import("./BqPI0Rop.js");return{BluetoothSerial:r}},[],import.meta.url);let s=!1;try{s=await e.isEnabled()}catch{}if(!s)try{await e.enable(),await new Promise(r=>setTimeout(r,1500))}catch{h.value="Please enable Bluetooth in phone settings, then tap Refresh.",$.value=!1;return}const o=await e.list();A.value=Array.isArray(o)?o:[],A.value.length===0&&(h.value="No paired devices found. Go to phone Settings → Bluetooth → pair your printer first. PIN is usually 0000 or 1234.")}catch(e){h.value=e?.message??"Failed to scan. Make sure Bluetooth is ON and location permission is granted.",console.error("Scan error:",e)}finally{$.value=!1}}function U(e){return new Promise(async(s,o)=>{if(!u()){o(new Error("Not running on Android"));return}try{const{BluetoothSerial:r}=await E(async()=>{const{BluetoothSerial:t}=await import("./BqPI0Rop.js");return{BluetoothSerial:t}},[],import.meta.url);try{await r.isConnected()&&await r.disconnect()}catch{}let c=!1;r.connect(e.id).subscribe({next:()=>{c||(c=!0,p.value=!0,P.value=e,localStorage.setItem("tapsilogan_printer",JSON.stringify(e)),I.value=`Connected to ${e.name}`,s())},error:t=>{p.value=!1,c?(w.value="Printer disconnected",console.warn("Printer dropped connection")):(c=!0,o(t))}})}catch(r){o(r)}})}async function Y(e){h.value="",I.value="";try{await U(e)}catch(s){throw h.value=`Cannot connect to ${e.name}. Make sure it is ON, charged, and nearby.`,s}}async function j(){if(u()){try{const{BluetoothSerial:e}=await E(async()=>{const{BluetoothSerial:s}=await import("./BqPI0Rop.js");return{BluetoothSerial:s}},[],import.meta.url);await e.disconnect()}catch{}p.value=!1,P.value=null,localStorage.removeItem("tapsilogan_printer")}}async function F(){if(g())try{const e=await window.electronAPI.connectPrinter();return p.value=e.ok??!1,p.value}catch{return p.value=!1,!1}return p.value}function V(e,s,o,r){const c=r??S.value,t=27,v=29,f=x.value,y=[],b=l=>{for(const O of l)y.push(O.charCodeAt(0))},n=(l="")=>b(l+`
`),a=(...l)=>y.push(...l),T=(l,O,ee=f)=>l+" ".repeat(Math.max(ee-l.length-O.length,1))+O,d=l=>n(l.repeat(f)),i=l=>`P${Number(l).toFixed(2)}`,L=new Date(e.created_at),X=L.toLocaleDateString("en-PH",{month:"short",day:"numeric",year:"numeric"}),D=L.toLocaleTimeString("en-PH",{hour:"2-digit",minute:"2-digit"}),R=e.payment_method==="gcash"?"Payment: GCash":"Payment: Cash",k=e.order_type==="take-out"?"Order Type: Take out":"Order Type: Dine In",H=o!=="sarisari",Z=z(o);a(t,64),a(t,97,1),a(t,69,1,t,33,16),n(Z),a(t,33,0,t,69,0),n(s),n(),a(t,97,0),d("-"),n(`Order #: ${String(e.order_number).padStart(3,"0")}`),n(`Date   : ${X}`),n(`Time   : ${D}`),d("-"),a(t,69,1),n(T("ITEM","AMOUNT")),a(t,69,0),d("-");for(const l of e.order_items??[])n(`${l.item_name}${M(l)}`),n(T(`  ${l.quantity} x ${i(l.unit_price)}`,i(l.subtotal)));if(d("-"),a(t,69,1),n(T("TOTAL",i(e.total_amount))),a(t,69,0),d("-"),n(R),H&&n(k),d("-"),a(t,97,1),n(),n("Salamat po!"),n("Balik kayo :)"),n(),n("--- CUSTOMER COPY ---"),n(),a(t,100,2),c){a(t,97,1),a(t,69,1,t,33,16),n("KITCHEN COPY"),a(t,33,0,t,69,0),n(),a(t,97,0),d("="),a(t,69,1),n(`Order #${String(e.order_number).padStart(3,"0")}`),a(t,69,0),n(`Time: ${D}`),d("="),n();for(const l of e.order_items??[])a(t,69,1),n(`${l.quantity}x  ${l.item_name}${M(l)}`),a(t,69,0);n(),d("-"),a(t,69,1),n(`TOTAL: ${i(e.total_amount)}`),a(t,69,0),n(R),H&&n(k),d("-"),a(t,97,1),n(),n("--- KITCHEN COPY ---"),n()}return a(t,100,3),a(v,86,65,3),new Uint8Array(y)}function q(){const o=[],r=v=>{for(const f of v)o.push(f.charCodeAt(0))},c=(v="")=>r(v+`
`),t=(...v)=>o.push(...v);return t(27,64),t(27,97,1),t(27,69,1),c("TEST PRINT"),t(27,69,0),c(P.value?.name??"Printer"),c(new Date().toLocaleString("en-PH")),c("If you can read this,"),c("your printer is ready."),c("Thank you for choosing Budget POS."),c(),t(27,100,3),t(29,86,65,3),new Uint8Array(o)}async function N(e){const{BluetoothSerial:s}=await E(async()=>{const{BluetoothSerial:r}=await import("./BqPI0Rop.js");return{BluetoothSerial:r}},[],import.meta.url),o=128;for(let r=0;r<e.length;r+=o)await s.write(e.slice(r,r+o)),await new Promise(c=>setTimeout(c,30))}async function J(){if(!u()||!p.value)return alert("Connect a printer first."),!1;C.value=!0;try{return await N(q()),!0}catch(e){return w.value=e?.message??"Test print failed",alert(`Test print failed: ${w.value}`),p.value=!1,!1}finally{C.value=!1}}function B(e,s,o,r){const c=r??S.value;try{const t=document.createElement("iframe");Object.assign(t.style,{position:"fixed",width:"0",height:"0",border:"none"}),document.body.appendChild(t);const v=t.contentWindow.document,f=i=>`₱${Number(i).toFixed(2)}`,y=new Date(e.created_at),b=e.payment_method==="gcash"?"GCash":"Cash",n=e.order_type==="take-out"?"Order Type: Take out":"Order Type: Dine In",a=o!=="sarisari",T=z(o),d=c?`
        <div style="margin-top:16px"></div>
        <div class="div2"></div>
        <div class="c b big">KITCHEN COPY</div>
        <div class="div2"></div>
        <div class="b">Order #${String(e.order_number).padStart(3,"0")}</div>
        <div>Time: ${y.toLocaleTimeString("en-PH",{hour:"2-digit",minute:"2-digit"})}</div>
        <div class="div2"></div>
        ${(e.order_items??[]).map(i=>`
          <div class="b">${i.quantity}x  ${i.item_name}${i.size_name||i.price_type&&i.price_type!=="regular"?` (${[i.size_name,i.price_type==="wholesale"?"Wholesale":i.price_type==="custom"?"Custom":null].filter(Boolean).join(", ")})`:""}</div>
        `).join("")}
        <div class="div"></div>
        <div class="row b"><span>TOTAL</span><span>${f(e.total_amount)}</span></div>
        <div>Payment: ${b}</div>
        ${a?`<div>${n}</div>`:""}
        <div class="div"></div>
        <div class="c">--- KITCHEN COPY ---</div>
      `:"";return v.open(),v.write(`
        <html><head><style>
          @page{size:58mm auto;margin:2mm}
          body{width:54mm;font-family:'Courier New',monospace;font-size:11px;padding:0;margin:0}
          .c{text-align:center}.b{font-weight:bold}.big{font-size:15px}
          .row{display:flex;justify-content:space-between}
          .sub{padding-left:8px}
          .div{border-top:1px dashed #000;margin:4px 0}
          .div2{border-top:2px solid #000;margin:6px 0}
          .tier{color:#555;font-size:10px}
        </style></head><body>
        <div class="c b big">${T}</div>
        <div class="c">${s}</div>
        <div class="div"></div>
        <div>Order #: ${String(e.order_number).padStart(3,"0")}</div>
        <div>Date: ${y.toLocaleDateString("en-PH",{month:"short",day:"numeric",year:"numeric"})}</div>
        <div>Time: ${y.toLocaleTimeString("en-PH",{hour:"2-digit",minute:"2-digit"})}</div>
        <div class="div"></div>
        <div class="row b"><span>ITEM</span><span>AMOUNT</span></div>
        <div class="div"></div>
        ${(e.order_items??[]).map(i=>`
          <div>${i.item_name}${i.size_name||i.price_type&&i.price_type!=="regular"?`<span class="tier"> (${[i.size_name,i.price_type==="wholesale"?"Wholesale":i.price_type==="custom"?"Custom":null].filter(Boolean).join(", ")})</span>`:""}</div>
          <div class="row sub"><span>${i.quantity} x ${f(i.unit_price)}</span><span>${f(i.subtotal)}</span></div>
        `).join("")}
        <div class="div"></div>
        <div class="row b"><span>TOTAL</span><span>${f(e.total_amount)}</span></div>
        <div class="div"></div>
        <div>Payment: ${b}</div>
        ${a?`<div>${n}</div>`:""}
        <div class="div"></div>
        <div class="c">Salamat po!</div>
        <div class="c">Balik kayo :)</div>
        <div class="div"></div>
        <div class="c">--- CUSTOMER COPY ---</div>
        ${d}
        </body></html>
      `),v.close(),t.contentWindow.focus(),t.contentWindow.print(),setTimeout(()=>document.body.removeChild(t),1e3),!0}catch(t){return console.error("Browser print failed:",t),!1}}async function Q(e,s,o,r){const c=r??S.value;C.value=!0;try{if(g())try{return(await window.electronAPI.printReceipt(e,s,o,c)).ok??!1}catch{return!1}if(u()){if(!p.value||!P.value)return alert('No printer connected. Tap "Connect printer" in the header first.'),!1;try{return await N(V(e,s,o,c)),console.log("✅ Receipt printed successfully"),!0}catch(t){return w.value=t?.message??"Print failed",alert(`Print failed: ${w.value}`),p.value=!1,!1}}return B(e,s,o,c)}finally{C.value=!1}}return{connected:p,lastError:w,connectedDevice:P,scanning:$,pairedDevices:A,errorMsg:h,successMsg:I,paperChars:x,setPaperWidth:_,printKitchenCopy:S,setPrintKitchenCopy:W,isNative:u,isElectron:g,connect:F,scanDevices:G,selectDevice:Y,disconnectPrinter:j,printReceipt:Q,printViaBrowser:B,testPrint:J,printing:C}}export{ae as u};
