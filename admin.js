const ORDERS_KEY='scandiaOrders_v1';
const statuses={NEW:'Нове',CONFIRMED:'Підтверджено',PREPARING:'Готується',READY:'Готове',DELIVERING:'Доставляється',COMPLETED:'Виконано',CANCELLED:'Скасовано'};
const $=s=>document.querySelector(s); const money=n=>`${Number(n||0).toLocaleString('uk-UA',{maximumFractionDigits:2})} ₴`;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
let orders=load();
function load(){try{return JSON.parse(localStorage.getItem(ORDERS_KEY)||'[]')}catch{return[]}}
function save(){localStorage.setItem(ORDERS_KEY,JSON.stringify(orders))}
function render(){
 const q=$('#order-search').value.trim().toLowerCase(), st=$('#status-filter').value;
 const filtered=orders.filter(o=>(st==='ALL'||o.status===st)&&(!q||[o.id,o.customer?.name,o.customer?.phone,o.address].join(' ').toLowerCase().includes(q)));
 const counts=Object.fromEntries(Object.keys(statuses).map(s=>[s,orders.filter(o=>o.status===s).length]));
 $('#stats').innerHTML=`<article><b>${orders.length}</b><span>Всього</span></article><article><b>${counts.NEW||0}</b><span>Нові</span></article><article><b>${counts.PREPARING||0}</b><span>Готуються</span></article><article><b>${orders.filter(o=>o.status!=='CANCELLED').reduce((s,o)=>s+Number(o.total||0),0).toLocaleString('uk-UA')} ₴</b><span>Сума замовлень</span></article>`;
 $('#orders').innerHTML=filtered.length?filtered.map(card).join(''):'<div class="admin-empty">Замовлень за заданими умовами немає.</div>';
}
function card(o){const dt=new Date(o.createdAt);const items=o.items.map(i=>`${esc(i.name)} × ${i.qty}`).join('<br>'); const address=o.fulfillment==='delivery'?[o.address,o.apartment&&`кв. ${o.apartment}`,o.floor&&`пов. ${o.floor}`,o.intercom&&`домофон ${o.intercom}`].filter(Boolean).join(', '):'Самовивіз · ЖК Scandia, вул. Героїв Крут, 14';
 return `<article class="order-card"><div class="order-main"><div class="order-top"><strong>${esc(o.id)}</strong><time>${dt.toLocaleString('uk-UA')}</time></div><div class="order-grid"><div><span>КЛІЄНТ</span><b>${esc(o.customer?.name||'—')}</b><a href="tel:${esc(o.customer?.phone||'')}">${esc(o.customer?.phone||'—')}</a></div><div><span>ОТРИМАННЯ</span><b>${o.fulfillment==='delivery'?'Доставка':'Самовивіз'}</b><p>${esc(address)}</p></div><div><span>ЗАМОВЛЕННЯ</span><p>${items}</p>${o.comment?`<small>Коментар: ${esc(o.comment)}</small>`:''}</div><div><span>СУМА</span><b class="order-total">${money(o.total)}</b></div></div></div><div class="order-actions"><label>Статус<select data-status="${esc(o.id)}">${Object.entries(statuses).map(([k,v])=>`<option value="${k}" ${o.status===k?'selected':''}>${v}</option>`).join('')}</select></label><button class="btn btn-ghost" data-delete="${esc(o.id)}">Видалити</button></div></article>`}

document.addEventListener('change',e=>{if(e.target.matches('[data-status]')){const o=orders.find(x=>x.id===e.target.dataset.status);if(o){o.status=e.target.value;o.updatedAt=new Date().toISOString();save();render()}}});
document.addEventListener('click',e=>{const b=e.target.closest('[data-delete]');if(b){const id=b.dataset.delete;if(confirm(`Видалити ${id}?`)){orders=orders.filter(o=>o.id!==id);save();render()}}});
$('#order-search').oninput=render; $('#status-filter').onchange=render;
$('#clear-orders').onclick=()=>{if(!orders.length)return;if(confirm('Видалити всі демо-замовлення?')){orders=[];save();render()}};
$('#export-orders').onclick=()=>{const blob=new Blob([JSON.stringify(orders,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`scandia-orders-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)};
render();
