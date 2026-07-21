import{l as m,R as w}from"./CM4kJe4v.js";const l=m(!1),f=m(null),h=m(null),S=m(!1),g=m([]),v=m(""),E=m(""),_=m(32);let N=!1;function V(){function p(){try{return!!window.Capacitor?.isNativePlatform?.()}catch{return!1}}function P(){try{return!!window.electronAPI?.isElectron}catch{return!1}}if(!N){N=!0;try{const t=localStorage.getItem("tapsilogan_printer_width");(t==="32"||t==="42")&&(_.value=Number(t))}catch{}}function x(t){_.value=t,localStorage.setItem("tapsilogan_printer_width",String(t))}async function B(){if(S.value=!0,g.value=[],v.value="",E.value="",!p()){S.value=!1,v.value="Bluetooth printing only works in the Android app.";return}try{const{BluetoothSerial:t}=await w(async()=>{const{BluetoothSerial:i}=await import("./BqPI0Rop.js");return{BluetoothSerial:i}},[],import.meta.url);let s=!1;try{s=await t.isEnabled()}catch{}if(!s)try{await t.enable(),await new Promise(i=>setTimeout(i,1500))}catch{v.value="Please enable Bluetooth in phone settings, then tap Refresh.",S.value=!1;return}const n=await t.list();g.value=Array.isArray(n)?n:[],g.value.length===0&&(v.value="No paired devices found. Go to phone Settings → Bluetooth → pair your printer first. PIN is usually 0000 or 1234.")}catch(t){v.value=t?.message??"Failed to scan. Make sure Bluetooth is ON and location permission is granted.",console.error("Scan error:",t)}finally{S.value=!1}}function L(t){return new Promise(async(s,n)=>{if(!p()){n(new Error("Not running on Android"));return}try{const{BluetoothSerial:i}=await w(async()=>{const{BluetoothSerial:c}=await import("./BqPI0Rop.js");return{BluetoothSerial:c}},[],import.meta.url);try{await i.isConnected()&&await i.disconnect()}catch{}let r=!1;i.connect(t.id).subscribe({next:()=>{r||(r=!0,l.value=!0,h.value=t,localStorage.setItem("tapsilogan_printer",JSON.stringify(t)),E.value=`Connected to ${t.name}`,s())},error:c=>{l.value=!1,r?(f.value="Printer disconnected",console.warn("Printer dropped connection")):(r=!0,n(c))}})}catch(i){n(i)}})}async function D(t){v.value="",E.value="";try{await L(t)}catch(s){throw v.value=`Cannot connect to ${t.name}. Make sure it is ON, charged, and nearby.`,s}}async function R(){if(p()){try{const{BluetoothSerial:t}=await w(async()=>{const{BluetoothSerial:s}=await import("./BqPI0Rop.js");return{BluetoothSerial:s}},[],import.meta.url);await t.disconnect()}catch{}l.value=!1,h.value=null,localStorage.removeItem("tapsilogan_printer")}}async function H(){if(P())try{const t=await window.electronAPI.connectPrinter();return l.value=t.ok??!1,l.value}catch{return l.value=!1,!1}return l.value}function M(t,s){const r=_.value,c=[],d=o=>{for(const C of o)c.push(C.charCodeAt(0))},e=(o="")=>d(o+`
`),a=(...o)=>c.push(...o),b=(o,C,Y=r)=>o+" ".repeat(Math.max(Y-o.length-C.length,1))+C,u=o=>e(o.repeat(r)),y=o=>`P${Number(o).toFixed(2)}`,O=new Date(t.created_at),W=O.toLocaleDateString("en-PH",{month:"short",day:"numeric",year:"numeric"}),A=O.toLocaleTimeString("en-PH",{hour:"2-digit",minute:"2-digit"}),I=t.payment_method==="gcash"?"Payment: GCash":"Payment: Cash";a(27,64),a(27,97,1),a(27,69,1,27,33,16),e("TAPSILOGAN"),a(27,33,0,27,69,0),e(s),e(),a(27,97,0),u("-"),e(`Order #: ${String(t.order_number).padStart(3,"0")}`),e(`Date   : ${W}`),e(`Time   : ${A}`),u("-"),a(27,69,1),e(b("ITEM","AMOUNT")),a(27,69,0),u("-");for(const o of t.order_items??[])e(o.item_name),e(b(`  ${o.quantity} x ${y(o.unit_price)}`,y(o.subtotal)));u("-"),a(27,69,1),e(b("TOTAL",y(t.total_amount))),a(27,69,0),u("-"),e(I),u("-"),a(27,97,1),e(),e("Salamat po!"),e("Balik kayo :)"),e(),e("--- CUSTOMER COPY ---"),e(),a(27,100,2),a(27,97,1),a(27,69,1,27,33,16),e("KITCHEN COPY"),a(27,33,0,27,69,0),e(),a(27,97,0),u("="),a(27,69,1),e(`Order #${String(t.order_number).padStart(3,"0")}`),a(27,69,0),e(`Time: ${A}`),u("="),e();for(const o of t.order_items??[])a(27,69,1),e(`${o.quantity}x  ${o.item_name}`),a(27,69,0);return e(),u("-"),a(27,69,1),e(`TOTAL: ${y(t.total_amount)}`),a(27,69,0),e(I),u("-"),a(27,97,1),e(),e("--- KITCHEN COPY ---"),e(),a(27,100,3),a(29,86,65,3),new Uint8Array(c)}function k(){const n=[],i=d=>{for(const e of d)n.push(e.charCodeAt(0))},r=(d="")=>i(d+`
`),c=(...d)=>n.push(...d);return c(27,64),c(27,97,1),c(27,69,1),r("TEST PRINT"),c(27,69,0),r(h.value?.name??"Printer"),r(new Date().toLocaleString("en-PH")),r("If you can read this,"),r("your printer is ready."),r(),c(27,100,3),c(29,86,65,3),new Uint8Array(n)}async function T(t){const{BluetoothSerial:s}=await w(async()=>{const{BluetoothSerial:i}=await import("./BqPI0Rop.js");return{BluetoothSerial:i}},[],import.meta.url),n=128;for(let i=0;i<t.length;i+=n)await s.write(t.slice(i,i+n)),await new Promise(r=>setTimeout(r,30))}async function G(){if(!p()||!l.value)return alert("Connect a printer first."),!1;try{return await T(k()),!0}catch(t){return f.value=t?.message??"Test print failed",alert(`Test print failed: ${f.value}`),l.value=!1,!1}}function $(t,s){try{const n=document.createElement("iframe");Object.assign(n.style,{position:"fixed",width:"0",height:"0",border:"none"}),document.body.appendChild(n);const i=n.contentWindow.document,r=e=>`₱${Number(e).toFixed(2)}`,c=new Date(t.created_at),d=t.payment_method==="gcash"?"GCash":"Cash";return i.open(),i.write(`
        <html><head><style>
          @page{size:58mm auto;margin:2mm}
          body{width:54mm;font-family:'Courier New',monospace;font-size:11px;padding:0;margin:0}
          .c{text-align:center}.b{font-weight:bold}.big{font-size:15px}
          .row{display:flex;justify-content:space-between}
          .sub{padding-left:8px}
          .div{border-top:1px dashed #000;margin:4px 0}
          .div2{border-top:2px solid #000;margin:6px 0}
        </style></head><body>
        <div class="c b big">TAPSILOGAN</div>
        <div class="c">${s}</div>
        <div class="div"></div>
        <div>Order #: ${String(t.order_number).padStart(3,"0")}</div>
        <div>Date: ${c.toLocaleDateString("en-PH",{month:"short",day:"numeric",year:"numeric"})}</div>
        <div>Time: ${c.toLocaleTimeString("en-PH",{hour:"2-digit",minute:"2-digit"})}</div>
        <div class="div"></div>
        <div class="row b"><span>ITEM</span><span>AMOUNT</span></div>
        <div class="div"></div>
        ${(t.order_items??[]).map(e=>`
          <div>${e.item_name}</div>
          <div class="row sub"><span>${e.quantity} x ${r(e.unit_price)}</span><span>${r(e.subtotal)}</span></div>
        `).join("")}
        <div class="div"></div>
        <div class="row b"><span>TOTAL</span><span>${r(t.total_amount)}</span></div>
        <div class="div"></div>
        <div>Payment: ${d}</div>
        <div class="div"></div>
        <div class="c">Salamat po!</div>
        <div class="c">Balik kayo :)</div>
        <div class="div"></div>
        <div class="c">--- CUSTOMER COPY ---</div>
        <div style="margin-top:16px"></div>
        <div class="div2"></div>
        <div class="c b big">KITCHEN COPY</div>
        <div class="div2"></div>
        <div class="b">Order #${String(t.order_number).padStart(3,"0")}</div>
        <div>Time: ${c.toLocaleTimeString("en-PH",{hour:"2-digit",minute:"2-digit"})}</div>
        <div class="div2"></div>
        ${(t.order_items??[]).map(e=>`
          <div class="b">${e.quantity}x  ${e.item_name}</div>
        `).join("")}
        <div class="div"></div>
        <div class="row b"><span>TOTAL</span><span>${r(t.total_amount)}</span></div>
        <div>Payment: ${d}</div>
        <div class="div"></div>
        <div class="c">--- KITCHEN COPY ---</div>
        </body></html>
      `),i.close(),n.contentWindow.focus(),n.contentWindow.print(),setTimeout(()=>document.body.removeChild(n),1e3),!0}catch(n){return console.error("Browser print failed:",n),!1}}async function U(t,s){if(P())try{return(await window.electronAPI.printReceipt(t,s)).ok??!1}catch{return!1}if(p()){if(!l.value||!h.value)return alert('No printer connected. Tap "Connect printer" in the header first.'),!1;try{return await T(M(t,s)),console.log("✅ Receipt printed successfully"),!0}catch(n){return f.value=n?.message??"Print failed",alert(`Print failed: ${f.value}`),l.value=!1,!1}}return $(t,s)}return{connected:l,lastError:f,connectedDevice:h,scanning:S,pairedDevices:g,errorMsg:v,successMsg:E,paperChars:_,setPaperWidth:x,isNative:p,isElectron:P,connect:H,scanDevices:B,selectDevice:D,disconnectPrinter:R,printReceipt:U,printViaBrowser:$,testPrint:G}}export{V as u};
