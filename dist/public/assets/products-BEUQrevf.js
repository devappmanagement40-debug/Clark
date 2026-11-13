import{d as U,a as Q,b as W,u as H,r as h,j as e,X as Z,q as j,h as G}from"./index-D1TdXFCr.js";import{u as C}from"./useQuery-qSoJMoBJ.js";import{u as O}from"./useMutation-DIBlPhp5.js";import{g as X}from"./countries-Dxa2RqvP.js";import{i as I}from"./product-purchase-limit-aiimjyQP.js";import{C as J}from"./chevron-right-DPyGdMdR.js";import{L as B}from"./loader-circle-Cz6UY1jt.js";import{T as R}from"./triangle-alert-DyPZOFJp.js";import{W as ee}from"./wallet-y_oEzSTg.js";const te=U("BatteryCharging",[["path",{d:"M15 7h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2",key:"1sdynx"}],["path",{d:"M6 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h1",key:"1gkd3k"}],["path",{d:"m11 7-3 5h4l-3 5",key:"b4a64w"}],["line",{x1:"22",x2:"22",y1:"11",y2:"13",key:"4dh1rd"}]]);const M=U("ShoppingBag",[["path",{d:"M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z",key:"hou9p0"}],["path",{d:"M3 6h18",key:"d0wm0j"}],["path",{d:"M16 10a4 4 0 0 1-8 0",key:"1ltviw"}]]);function E(o,g){if(!Number.isFinite(o)||o<0)throw new RangeError(`${g} must be a finite, non-negative amount`);return Math.round(o*100)}function f(o){return o/100}function re(o,g,N){const d=E(o,"Total balance"),r=E(g,"Withdrawable balance"),i=E(N,"Product price");if(r>d)throw new RangeError("Withdrawable balance cannot exceed total balance");const b=d-r,x=i<=d,y=x?Math.min(i,b):0,l=x?i-y:0;return{totalBalance:f(d),depositBalance:f(b),earningsBalance:f(r),productPrice:f(i),depositUsed:f(y),earningsUsed:f(l),canPurchase:x}}const ae="/assets/IMG_20260829_070948_545_1791818775118-D3Am8Nf4.jpg",se="/assets/IMG_20260829_070922_702_1791818835262-ZV9wIvb4.jpg";function he(){const{user:o,refreshUser:g}=Q(),{toast:N}=W(),[,d]=H(),[r,i]=h.useState(null),b=h.useRef(null),x=h.useRef(!1),y=h.useRef(!1),{data:l,isLoading:$,isError:S,refetch:D}=C({queryKey:["/api/products"]}),{data:k}=C({queryKey:["/api/user/products"]}),{data:z,isLoading:K,isError:T}=C({queryKey:["/api/withdrawals/available"]}),c=O({mutationFn:async t=>{const s=await G("POST",`/api/products/${t}/purchase`,{});if(!s.ok){const a=await s.json();throw new Error(a.message||"Achat impossible")}return s.json()},onSuccess:()=>{j.invalidateQueries({queryKey:["/api/products"]}),j.invalidateQueries({queryKey:["/api/user/products"]}),j.invalidateQueries({queryKey:["/api/wheel/spins"]}),j.invalidateQueries({queryKey:["/api/withdrawals/available"]}),g(),i(null),N({title:"Produit acheté !",description:"Vous commencerez à recevoir des gains demain."})}});if(x.current=c.isPending,h.useEffect(()=>{if(y.current||!l)return;const t=new URLSearchParams(window.location.search).get("product");if(!t)return;y.current=!0;const s=Number(t),a=l.find(u=>u.id===s&&!u.isFree);a?.isActive&&!I(a.purchaseLimitPerUser,a.purchaseCount??0)&&i(a),d("/products")},[l,d]),h.useEffect(()=>{if(!r)return;const t=document.body.style.overflow,s=document.activeElement instanceof HTMLElement?document.activeElement:null,a=b.current;document.body.style.overflow="hidden",a?.focus({preventScroll:!0});const u=m=>{if(m.key==="Escape"&&!x.current){i(null);return}if(m.key!=="Tab")return;const v=a?.querySelectorAll('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])');if(!v?.length){m.preventDefault(),a?.focus();return}const A=v[0],q=v[v.length-1];m.shiftKey&&document.activeElement===A?(m.preventDefault(),q.focus()):!m.shiftKey&&document.activeElement===q&&(m.preventDefault(),A.focus())};return document.addEventListener("keydown",u),()=>{document.body.style.overflow=t,document.removeEventListener("keydown",u),s?.isConnected&&s.focus({preventScroll:!0})}},[r]),!o)return null;const _=X(o.country)?.currency||"FCFA",n=t=>t!==null&&Number.isFinite(t)?`${_} ${Math.round(t).toLocaleString("fr-FR")}`:"—",L=l?.filter(t=>!t.isFree)||[],F=(k||[]).filter(t=>t.status==="active"),V=k===void 0?null:F.length,Y=k===void 0?null:F.reduce((t,s)=>{const a=Number(s.product?.dailyEarnings);return t!==null&&Number.isFinite(a)?t+a:null},0),w=Number(o.balance||0),P=z?Number(z.availableBalance):null;let p=null;if(r&&Number.isFinite(w)&&P!==null&&Number.isFinite(P))try{p=re(w,P,Number(r.price))}catch{}return e.jsxs("main",{className:"cp-products-page",children:[e.jsx("style",{children:`
        .cp-products-page {
          min-height: 100dvh;
          padding-bottom: calc(78px + env(safe-area-inset-bottom));
          background: transparent;
          color: #111827;
          font-family: Inter, Arial, sans-serif;
        }
        .cp-products-shell { width: 100%; max-width: 512px; margin: 0 auto; background: transparent; }
        .cp-products-stats {
          display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px;
          padding: 16px 18px 14px; background: transparent;
        }
        .cp-products-stat {
          display: flex; min-width: 0; min-height: 82px; align-items: center; gap: 10px;
          padding: 11px; border: 1px solid #e3e9f4; border-radius: 14px;
          background: rgba(255,255,255,.97); color: #111827;
          box-shadow: 0 2px 9px rgba(15,23,42,.09);
        }
        .cp-products-stat-link {
          width: 100%; font: inherit; text-align: left; cursor: pointer;
          transition: transform .16s ease, border-color .16s ease, box-shadow .16s ease;
        }
        .cp-products-stat-link:hover { border-color: #b9c9ee; background: #ffffff; box-shadow: 0 5px 14px rgba(25,71,184,.12); }
        .cp-products-stat-link:active { transform: translateY(1px); }
        .cp-products-stat-link:focus-visible,
        .cp-product-buy:focus-visible,
        .cp-products-retry:focus-visible,
        .cp-products-modal-actions button:focus-visible,
        .cp-products-modal-close:focus-visible {
          outline: 3px solid rgba(25,71,184,.35); outline-offset: 3px;
        }
        .cp-products-stat-icon {
          display: grid; width: 42px; height: 42px; flex: 0 0 42px;
          place-items: center; border: 1px solid #d6e2ff; border-radius: 12px;
          background: #edf2ff; color: #1947b8;
        }
        .cp-products-stat-icon svg { width: 22px; height: 22px; }
        .cp-products-stat-icon--image {
          overflow: hidden; border-color: #d6e2ff; background: #edf2ff;
        }
        .cp-products-stat-icon--image img { display: block; width: 100%; height: 100%; object-fit: contain; }
        .cp-products-stat-copy { flex: 1; min-width: 0; }
        .cp-products-stat-value {
          display: block; overflow: hidden; color: #000; font-size: clamp(15px,4.2vw,18px); font-weight: 800; line-height: 1.1;
          text-overflow: ellipsis; white-space: nowrap;
        }
        .cp-products-stat-label { display: block; margin-top: 5px; color: #625e63; font-size: 12px; line-height: 1.2; }
        .cp-products-stat-chevron { flex: 0 0 auto; color: #1947b8; }
        .cp-products-list { display: grid; gap: 14px; padding: 0 18px; }
        .cp-product-card {
          display: grid; grid-template-columns: clamp(78px, 22vw, 100px) minmax(0, 1fr);
          align-items: stretch; gap: 12px; min-height: 170px; padding: 12px 16px;
          border: 1px solid #e6eaf1; border-radius: 14px; background: #ffffff;
          box-shadow: 0 2px 9px rgba(15,23,42,.10);
          transition: box-shadow .16s ease, transform .16s ease;
        }
        .cp-product-card:hover { transform: translateY(-1px); box-shadow: 0 5px 14px rgba(15,23,42,.13); }
        .cp-product-card.is-unavailable { border-color: #cbd5e1; box-shadow: 0 2px 8px rgba(17,24,39,.08); }
        .cp-product-card.is-unavailable .cp-product-image { opacity: .62; }
        .cp-product-image {
          position: relative; align-self: center; width: 100%; max-width: 100px; aspect-ratio: 1; min-width: 0;
          border-radius: 9px; background: #f1f2f4;
        }
        .cp-product-image-placeholder {
          position: absolute; inset: 0; display: grid; place-items: center;
          border-radius: 9px; background: #f1f2f4; color: #1947b8;
        }
        .cp-product-image img {
          position: absolute; z-index: 1; inset: 0; display: block;
          width: 100%; height: 100%; padding: 6px; border-radius: 9px;
          object-fit: contain; background: #f1f2f4;
        }
        .cp-product-duration {
          position: absolute; z-index: 2; right: -8px; bottom: 3px;
          display: grid; min-width: 54px; min-height: 27px; place-items: center;
          padding: 3px 7px; background: #1947b8; color: #ffffff;
          clip-path: polygon(6% 7%, 17% 13%, 22% 0, 34% 11%, 44% 2%, 53% 12%, 67% 3%, 73% 15%, 91% 10%, 88% 27%, 100% 36%, 91% 49%, 98% 62%, 84% 68%, 88% 87%, 71% 84%, 62% 100%, 50% 88%, 37% 98%, 31% 84%, 13% 90%, 16% 73%, 0 66%, 10% 52%, 1% 38%, 14% 29%);
          font-size: 8px; font-weight: 900; line-height: 1; white-space: nowrap;
          transform: rotate(-9deg);
        }
        .cp-product-info { display: flex; min-width: 0; flex-direction: column; justify-content: space-between; gap: 8px; }
        .cp-product-heading { display: flex; min-width: 0; align-items: flex-start; gap: 5px; }
        .cp-product-heading svg { display: block; width: 18px; height: 18px; flex: 0 0 18px; margin-top: 1px; color: #1947b8; }
        .cp-product-name {
          min-width: 0; margin: 0; color: #111827; font-size: clamp(14px, 4vw, 17px);
          font-weight: 800; line-height: 1.18; overflow-wrap: anywhere;
        }
        .cp-product-metrics {
          display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          gap: 8px; align-items: start;
        }
        .cp-product-metric { display: flex; min-width: 0; flex-direction: column; gap: 2px; }
        .cp-product-metric strong {
          overflow: hidden; color: #111827; font-size: clamp(11px, 3.15vw, 14px);
          font-weight: 500; line-height: 1.18; text-overflow: ellipsis; white-space: nowrap;
        }
        .cp-product-metric span { color: #5b606b; font-size: 11px; line-height: 1.2; }
        .cp-product-footer { display: flex; min-width: 0; align-items: center; justify-content: space-between; gap: 7px; }
        .cp-product-price { display: flex; min-width: 0; flex-wrap: wrap; align-items: baseline; gap: 3px 5px; }
        .cp-product-price strong { color: #1947b8; font-size: clamp(14px, 3.8vw, 17px); font-weight: 900; white-space: nowrap; }
        .cp-product-price span { color: #777b84; font-size: 12px; line-height: 1.2; }
        .cp-product-buy {
          display: inline-flex; flex: 0 0 clamp(92px, 24vw, 112px); min-width: 0; min-height: 36px;
          align-items: center; justify-content: center; padding: 7px 8px;
          border: 0; border-radius: 8px; background: linear-gradient(135deg, #12358f 0%, #081d58 100%);
          color: #ffffff; font-size: 15px; font-weight: 800; white-space: nowrap;
          box-shadow: 0 2px 5px rgba(8,29,88,.22);
          transition: transform .16s ease, filter .16s ease;
        }
        .cp-product-buy:hover:not(:disabled) { transform: translateY(-1px); filter: brightness(.96); }
        .cp-product-buy:active:not(:disabled) { transform: translateY(1px); }
        .cp-product-buy.is-unavailable {
          background: #e5e7eb; color: #6b7280; box-shadow: none;
          cursor: not-allowed; white-space: normal; line-height: 1.1;
        }
        .cp-products-empty {
          display: flex; min-height: 260px; flex-direction: column; align-items: center;
          justify-content: center; gap: 10px; border: 1px solid #e3e9f4; border-radius: 16px;
          padding: 20px; background: rgba(255,255,255,.97); color: #5b606b; text-align: center;
          box-shadow: 0 2px 9px rgba(15,23,42,.09);
        }
        .cp-products-empty > svg { color: #1947b8; }
        .cp-products-empty p { max-width: 280px; margin: 0; font-size: 14px; line-height: 1.4; }
        .cp-products-retry {
          min-height: 42px; margin-top: 4px; padding: 9px 16px;
          border: 0; border-radius: 10px; background: linear-gradient(135deg, #1947b8, #12358f);
          color: #fff; font-size: 13px; font-weight: 800; box-shadow: 0 3px 8px rgba(25,71,184,.2);
        }
        .cp-products-modal-backdrop {
          position: fixed; z-index: 60; inset: 0; display: grid; place-items: center;
          overflow-y: auto; overscroll-behavior: contain;
          padding: max(14px, env(safe-area-inset-top)) 14px max(14px, env(safe-area-inset-bottom));
          background: rgba(6,18,55,.70); backdrop-filter: blur(5px);
          animation: cp-modal-fade-in .16s ease-out;
        }
        .cp-products-modal {
          width: 100%; max-width: 420px; max-height: calc(100dvh - 32px); overflow-y: auto;
          overscroll-behavior: contain; scrollbar-gutter: stable;
          padding: 20px; border: 1px solid #dfe6f3; border-radius: 20px;
          background: #ffffff; color: #111827;
          box-shadow: 0 22px 70px rgba(3,12,38,.34);
          animation: cp-modal-rise-in .2s cubic-bezier(.2,.8,.2,1);
          outline: none;
        }
        .cp-products-modal-header {
          display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;
        }
        .cp-products-modal-heading { display: flex; min-width: 0; align-items: center; gap: 11px; }
        .cp-products-modal-icon {
          display: grid; width: 42px; height: 42px; flex: 0 0 42px; place-items: center;
          border: 1px solid #d6e2ff; border-radius: 13px; background: #edf2ff; color: #1947b8;
        }
        .cp-products-modal-heading-copy { min-width: 0; }
        .cp-products-modal-eyebrow {
          display: block; margin-bottom: 4px; color: #1947b8; font-size: 10px;
          font-weight: 800; letter-spacing: .09em; line-height: 1.2; text-transform: uppercase;
        }
        .cp-products-modal h2 { margin: 0; color: #0b1f54; font-size: 19px; font-weight: 800; line-height: 1.2; }
        .cp-products-modal-close {
          display: grid; width: 34px; height: 34px; flex: 0 0 34px; place-items: center;
          border: 0; border-radius: 10px; background: #f1f4fa; color: #44536f;
          transition: background-color .15s ease, color .15s ease;
        }
        .cp-products-modal-close:hover:not(:disabled) { background: #e6edfa; color: #12358f; }
        .cp-products-modal-close:disabled { cursor: not-allowed; opacity: .55; }
        .cp-products-modal-product {
          margin: 16px 0 0; padding-bottom: 11px; border-bottom: 1px solid #e9edf4;
          color: #4b5563; font-size: 14px; font-weight: 700; line-height: 1.35; overflow-wrap: anywhere;
        }
        .cp-products-modal-summary {
          display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; margin-top: 12px;
        }
        .cp-products-modal-summary-primary,
        .cp-products-modal-summary-item {
          display: flex; min-width: 0; flex-direction: column; gap: 4px;
          padding: 11px 12px; border: 1px solid #e5eaf3; border-radius: 12px; background: #f8faff;
        }
        .cp-products-modal-summary-primary {
          grid-column: 1 / -1; flex-direction: row; align-items: center;
          justify-content: space-between; gap: 10px; border-color: #d6e2ff;
          background: linear-gradient(110deg, #f0f5ff, #e7eeff);
        }
        .cp-products-modal-summary span { color: #647084; font-size: 11px; line-height: 1.25; }
        .cp-products-modal-summary strong {
          color: #101827; font-size: 14px; font-weight: 800; line-height: 1.2;
          overflow-wrap: anywhere;
        }
        .cp-products-modal-summary-primary strong { color: #12358f; font-size: 18px; text-align: right; }
        .cp-products-modal-description {
          margin: 12px 0 0; color: #5b6474; font-size: 12px; line-height: 1.5;
        }
        .cp-products-modal-wallets {
          display: grid; gap: 8px; margin-top: 14px; padding: 12px;
          border: 1px solid #dbe5ff; border-radius: 14px; background: #f8faff;
        }
        .cp-products-modal-wallets-heading {
          display: flex; align-items: center; gap: 7px; padding-bottom: 8px;
          border-bottom: 1px solid #e3eaf7; color: #12358f; font-size: 12px; font-weight: 800;
        }
        .cp-products-modal-wallet-row {
          display: flex; align-items: flex-start; justify-content: space-between; gap: 10px;
          color: #515d70; font-size: 11px; line-height: 1.4;
        }
        .cp-products-modal-wallet-row strong { flex: 0 0 auto; color: #111827; font-size: 11px; font-weight: 700; white-space: nowrap; }
        .cp-products-modal-wallet-note {
          margin: 2px 0 0 !important; padding: 8px 9px 0; border-top: 1px dashed #cbd8f7;
          color: #12358f !important; font-size: 11px !important; line-height: 1.4 !important;
        }
        .cp-products-modal-status {
          margin: 0 !important; color: #596579 !important; font-size: 11px !important;
          line-height: 1.4 !important;
        }
        .cp-products-modal-warning {
          display: flex; align-items: flex-start; gap: 8px; margin-top: 12px; padding: 9px;
          border: 1px solid #fda4af; border-radius: 10px; background: #fff1f2; color: #9f1239;
          font-size: 11px; line-height: 1.35;
        }
        .cp-products-modal-warning svg,
        .cp-products-modal-error svg { flex: 0 0 auto; margin-top: 1px; }
        .cp-products-modal-error {
          display: flex; align-items: flex-start; gap: 8px; margin-top: 11px; padding: 10px;
          border: 1px solid #fda4af; border-radius: 11px; background: #fff1f2; color: #9f1239;
          font-size: 12px; line-height: 1.4;
        }
        .cp-products-modal-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 9px; margin-top: 18px; }
        .cp-products-modal-actions button {
          display: inline-flex; min-width: 0; min-height: 44px; align-items: center; justify-content: center;
          gap: 8px; padding: 9px 10px; border: 1px solid #d5deec; border-radius: 11px;
          background: #ffffff; color: #344054; font-size: 13px; font-weight: 800;
          transition: background-color .15s ease, border-color .15s ease, transform .15s ease, opacity .15s ease;
        }
        .cp-products-modal-actions button:first-child:hover:not(:disabled) { border-color: #b9c9ee; background: #f5f8ff; }
        .cp-products-modal-actions button:last-child {
          border-color: #12358f; background: linear-gradient(135deg, #1947b8 0%, #12358f 100%);
          color: #ffffff; box-shadow: 0 4px 10px rgba(18,53,143,.2);
        }
        .cp-products-modal-actions button:last-child:hover:not(:disabled) { transform: translateY(-1px); }
        .cp-products-modal-actions button:disabled { cursor: not-allowed; opacity: .58; box-shadow: none; }
        @keyframes cp-modal-fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes cp-modal-rise-in { from { opacity: 0; transform: translateY(9px) scale(.985); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @media (prefers-reduced-motion: reduce) {
          .cp-products-modal-backdrop, .cp-products-modal, .cp-products-modal-actions button { animation: none; transition: none; }
        }
        @media (max-width: 370px) {
          .cp-products-stats { gap: 8px; padding-right: 14px; padding-left: 14px; }
          .cp-products-stat { gap: 8px; padding: 9px; }
          .cp-products-stat-icon { width: 36px; height: 36px; flex-basis: 36px; }
          .cp-products-list { padding-right: 14px; padding-left: 14px; }
          .cp-product-card { grid-template-columns: 70px minmax(0, 1fr); gap: 9px; min-height: 146px; padding: 9px; }
          .cp-product-name { font-size: 14px; }
          .cp-product-metrics { gap: 5px; }
          .cp-product-metric strong { font-size: 10px; }
          .cp-product-metric span { font-size: 9px; }
          .cp-product-buy { flex-basis: 82px; min-height: 34px; padding: 6px 4px; font-size: 12px; }
          .cp-products-modal { padding: 16px; border-radius: 17px; }
          .cp-products-modal h2 { font-size: 17px; }
          .cp-products-modal-summary-primary strong { font-size: 16px; }
          .cp-products-modal-actions button { padding-right: 6px; padding-left: 6px; font-size: 12px; }
        }
      `}),e.jsxs("div",{className:"cp-products-shell",children:[e.jsx("h1",{className:"sr-only",children:"Produits Equinor"}),e.jsxs("section",{className:"cp-products-stats","aria-label":"Résumé des produits",children:[e.jsxs("button",{className:"cp-products-stat cp-products-stat-link",type:"button",onClick:()=>d("/income"),"aria-label":"Voir les produits achetés",children:[e.jsx("span",{className:"cp-products-stat-icon cp-products-stat-icon--image",children:e.jsx("img",{src:ae,alt:"","aria-hidden":"true"})}),e.jsxs("span",{className:"cp-products-stat-copy",children:[e.jsx("strong",{className:"cp-products-stat-value",children:V??"—"}),e.jsx("small",{className:"cp-products-stat-label",children:"Produits achetés"})]}),e.jsx(J,{className:"cp-products-stat-chevron","aria-hidden":"true",size:18})]}),e.jsxs("div",{className:"cp-products-stat",children:[e.jsx("span",{className:"cp-products-stat-icon cp-products-stat-icon--image",children:e.jsx("img",{src:se,alt:"","aria-hidden":"true"})}),e.jsxs("span",{className:"cp-products-stat-copy",children:[e.jsx("strong",{className:"cp-products-stat-value",children:n(Y)}),e.jsx("small",{className:"cp-products-stat-label",children:"Revenu quotidien"})]})]})]}),e.jsx("section",{className:"cp-products-list","aria-label":"Produits disponibles",children:$?e.jsxs("div",{className:"cp-products-empty",role:"status",children:[e.jsx(B,{className:"animate-spin","aria-hidden":"true",size:30}),e.jsx("p",{children:"Chargement des produits…"})]}):S&&!l?e.jsxs("div",{className:"cp-products-empty",role:"alert",children:[e.jsx(R,{"aria-hidden":"true",size:34}),e.jsx("p",{children:"Impossible de charger les produits pour le moment."}),e.jsx("button",{className:"cp-products-retry",type:"button",onClick:()=>{D()},children:"Réessayer"})]}):L.length===0?e.jsxs("div",{className:"cp-products-empty",role:"status",children:[e.jsx(M,{"aria-hidden":"true",size:38}),e.jsx("p",{children:"Aucun produit disponible pour le moment"})]}):L.map(t=>{const s=t.imageUrl?.trim(),a=I(t.purchaseLimitPerUser,t.purchaseCount??0);return e.jsxs("article",{className:`cp-product-card${t.isActive?"":" is-unavailable"}`,"data-testid":`product-card-${t.id}`,children:[e.jsxs("div",{className:"cp-product-image",children:[e.jsx("span",{className:"cp-product-image-placeholder",children:e.jsx(te,{"aria-hidden":"true",size:30})}),s&&e.jsx("img",{src:s,alt:t.name,loading:"lazy",onError:u=>{u.currentTarget.style.display="none"}}),e.jsx("span",{className:"cp-product-duration",children:Number.isFinite(Number(t.cycleDays))?`${Number(t.cycleDays)} jours`:"Cycle"})]}),e.jsxs("div",{className:"cp-product-info",children:[e.jsxs("div",{className:"cp-product-heading",children:[e.jsxs("svg",{"aria-hidden":"true",viewBox:"0 0 24 24",children:[e.jsx("path",{d:"M12 22s8-7.3 8-13A8 8 0 1 0 4 9c0 5.7 8 13 8 13Z",fill:"currentColor"}),e.jsx("circle",{cx:"12",cy:"9",r:"2.5",fill:"#fff"})]}),e.jsxs("h2",{className:"cp-product-name",children:[t.name,!t.isActive&&e.jsx("span",{className:"ml-2 text-xs font-bold uppercase text-gray-500",children:"Indisponible"})]})]}),e.jsxs("div",{className:"cp-product-metrics",children:[e.jsxs("div",{className:"cp-product-metric",children:[e.jsx("strong",{children:n(Number(t.totalReturn))}),e.jsx("span",{children:"Revenu total"})]}),e.jsxs("div",{className:"cp-product-metric",children:[e.jsx("strong",{children:n(Number(t.dailyEarnings))}),e.jsx("span",{children:"Revenu quotidien"})]})]}),e.jsxs("div",{className:"cp-product-footer",children:[e.jsxs("div",{className:"cp-product-price",children:[e.jsx("strong",{children:n(Number(t.price))}),e.jsx("span",{children:"Prix d'achat"})]}),e.jsx("button",{className:`cp-product-buy${t.isActive?"":" is-unavailable"}`,onClick:()=>{!t.isActive||a||(c.reset(),i(t))},disabled:!t.isActive||a,"aria-label":t.isActive?a?`Limite d'achat atteinte pour ${t.name}`:`Investir dans ${t.name}`:`${t.name} indisponible`,"data-testid":`button-purchase-${t.id}`,children:t.isActive?a?"Limite atteinte":"Investir":"Indisponible"})]})]})]},t.id)})})]}),r&&e.jsx("div",{className:"cp-products-modal-backdrop",onClick:t=>{t.target===t.currentTarget&&!c.isPending&&i(null)},children:e.jsxs("div",{ref:b,className:"cp-products-modal",role:"dialog","aria-modal":"true","aria-labelledby":"cp-product-confirm-title cp-product-confirm-product","aria-describedby":"cp-product-confirm-description",tabIndex:-1,onClick:t=>t.stopPropagation(),children:[e.jsxs("div",{className:"cp-products-modal-header",children:[e.jsxs("div",{className:"cp-products-modal-heading",children:[e.jsx("span",{className:"cp-products-modal-icon",children:e.jsx(M,{"aria-hidden":"true",size:21})}),e.jsxs("div",{className:"cp-products-modal-heading-copy",children:[e.jsx("span",{className:"cp-products-modal-eyebrow",children:"Confirmation d'achat"}),e.jsx("h2",{id:"cp-product-confirm-title",children:"Vérifier votre achat"})]})]}),e.jsx("button",{className:"cp-products-modal-close",type:"button","aria-label":"Fermer la confirmation",disabled:c.isPending,onClick:()=>i(null),children:e.jsx(Z,{"aria-hidden":"true",size:18})})]}),e.jsx("div",{className:"cp-products-modal-product",id:"cp-product-confirm-product",children:r.name}),e.jsxs("div",{className:"cp-products-modal-summary",children:[e.jsxs("div",{className:"cp-products-modal-summary-primary",children:[e.jsx("span",{children:"Prix d'achat"}),e.jsx("strong",{children:n(Number(r.price))})]}),e.jsxs("div",{className:"cp-products-modal-summary-item",children:[e.jsx("span",{children:"Revenu quotidien"}),e.jsx("strong",{children:n(Number(r.dailyEarnings))})]}),e.jsxs("div",{className:"cp-products-modal-summary-item",children:[e.jsx("span",{children:"Revenu total"}),e.jsx("strong",{children:n(Number(r.totalReturn))})]})]}),e.jsxs("p",{className:"cp-products-modal-description",id:"cp-product-confirm-description",children:["Après l’achat, vos revenus seront crédités quotidiennement pendant"," ",Number.isFinite(Number(r.cycleDays))?`${Number(r.cycleDays)} jours`:"la durée prévue","."]}),e.jsxs("section",{className:"cp-products-modal-wallets","aria-label":"Répartition des soldes pour l'achat",children:[e.jsxs("div",{className:"cp-products-modal-wallets-heading",children:[e.jsx(ee,{"aria-hidden":"true",size:16}),e.jsx("span",{children:"Répartition des soldes"})]}),p?e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"cp-products-modal-wallet-row",children:[e.jsx("span",{children:"Dépôts (utilisables pour l'achat)"}),e.jsx("strong",{children:n(p.depositBalance)})]}),e.jsxs("div",{className:"cp-products-modal-wallet-row",children:[e.jsx("span",{children:"Solde retirable"}),e.jsx("strong",{children:n(p.earningsBalance)})]}),p.canPurchase&&e.jsxs("p",{className:"cp-products-modal-wallet-note",children:["Pour cet achat : ",n(p.depositUsed)," prélevés sur les dépôts",p.earningsUsed>0&&`, puis ${n(p.earningsUsed)} sur les revenus retirables`,"."]})]}):K?e.jsx("p",{className:"cp-products-modal-status",role:"status",children:"Vérification de la répartition des soldes…"}):T||!z?e.jsx("p",{className:"cp-products-modal-status",role:"status",children:"Répartition temporairement indisponible. Le serveur vérifiera les soldes avant l’achat."}):e.jsx("p",{className:"cp-products-modal-status",role:"status",children:"Répartition des soldes indisponible. Le serveur vérifiera les soldes avant l’achat."})]}),w<Number(r.price)&&e.jsxs("div",{className:"cp-products-modal-warning",role:"alert",children:[e.jsx(R,{"aria-hidden":"true",size:16}),e.jsx("span",{children:"Le solde combiné des dépôts et des revenus retirables est insuffisant."})]}),c.isError&&e.jsxs("div",{className:"cp-products-modal-error",role:"alert",children:[e.jsx(R,{"aria-hidden":"true",size:17}),e.jsx("span",{children:c.error instanceof Error?c.error.message:"L'achat n'a pas abouti. Vérifiez les informations et réessayez."})]}),e.jsxs("div",{className:"cp-products-modal-actions",children:[e.jsx("button",{type:"button",disabled:c.isPending,onClick:()=>i(null),children:"Annuler"}),e.jsx("button",{type:"button",onClick:()=>c.mutate(r.id),disabled:c.isPending||w<Number(r.price),children:c.isPending?e.jsxs(e.Fragment,{children:[e.jsx(B,{className:"animate-spin","aria-hidden":"true",size:16}),"Traitement…"]}):"Confirmer l'achat"})]})]})})]})}export{he as default};
