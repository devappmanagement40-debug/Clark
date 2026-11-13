import{a as ee,u as te,$ as ie,b as re,r as T,j as e,L as oe,a0 as ae,w as se}from"./index-IpgP9bKh.js";import{u as b}from"./useQuery-CjQe2uCM.js";import{g as ne}from"./countries-Dxa2RqvP.js";import{a as de,b as ce}from"./navigation-targets-DT_bim_J.js";import{d as pe}from"./dulux-logo-B7WubxGZ.js";import{C as le}from"./chevron-left-B5JIKotB.js";import{L as v}from"./loader-circle-DfVdmuuC.js";import{R as he}from"./refresh-cw-BOpPF4XZ.js";const R="#00317d",me="#43a66c",xe=new Set(["commission","deposit_commission","deposit","bonus","purchase","staking","withdrawal_refund"]),w=i=>{const o=new Date(i);if(Number.isNaN(o.getTime()))return i;const a=c=>String(c).padStart(2,"0");return`${a(o.getDate())}-${a(o.getMonth()+1)}-${o.getFullYear()} ${a(o.getHours())}:${a(o.getMinutes())}:${a(o.getSeconds())}`},I=i=>{switch(i){case"completed":case"approved":return{label:"Succès",color:me};case"rejected":return{label:"Paiement échoué",color:"#b42318"};case"processing":return{label:"En traitement",color:"#24568e"};default:return{label:"En attente",color:"#24568e"}}},ge=i=>I(i),S=i=>{if(i.walletImpact)try{const o=JSON.parse(i.walletImpact),a=[o.earningsDelta,o.legacyEarningsDelta].map(Number);if(a.every(Number.isFinite))return a.reduce((c,p)=>c+p,0)}catch{}return["deposit","bonus","purchase","staking"].includes(i.type)?0:Number(i.amount)||0},x=i=>Math.abs(i).toLocaleString("en-US",{maximumFractionDigits:2});function $({title:i,amount:o,currency:a,date:c,status:p,verify:n}){return e.jsxs("article",{className:"movement-history-card",children:[e.jsx("div",{className:"movement-history-logo",children:e.jsx("img",{src:pe,alt:"Dulux"})}),e.jsxs("div",{className:"movement-history-body",children:[e.jsxs("div",{className:"movement-history-row",children:[e.jsx("strong",{children:i}),e.jsxs("strong",{className:"movement-history-amount",children:[a," ",o]})]}),e.jsxs("div",{className:"movement-history-row movement-history-subrow",children:[e.jsx("time",{children:c}),e.jsx("span",{className:"movement-history-status",style:{color:p.color},children:p.label})]}),n?e.jsxs("button",{className:"history-verify",type:"button",onClick:n.onClick,disabled:n.busy,children:[n.busy?e.jsx(v,{className:"inline animate-spin"}):e.jsx(he,{className:"mr-1 inline h-3 w-3"}),"Vérifier le paiement"]}):null]})]})}function ke(){const{user:i,refreshUser:o}=ee(),[a,c]=te(),p=ie(),{toast:n}=re(),[l,j]=T.useState("mine"),[F,N]=T.useState(null),P=de(window.location.search),r=a==="/my-page/deposits-history"||a==="/my-page/deposit-history"?"deposits":a==="/my-page/withdrawal-history"?"withdrawals":"income",q=!!i?.isAdmin,g=i?ne(i.country):null,h=g?.currency==="XOF"||g?.currency==="XAF"?"FCFA":g?.currency||"FCFA",{data:k=[],isLoading:B,isError:H,refetch:M}=b({queryKey:["/api/deposits/history"],enabled:!!i&&r==="deposits"}),{data:z=[],isLoading:O,isError:_,refetch:V}=b({queryKey:["/api/withdrawals/history"],enabled:!!i&&r==="withdrawals"}),{data:K=[],isLoading:Q,isError:U,refetch:G}=b({queryKey:["/api/transactions"],enabled:!!i&&r==="income"}),f=[...K].sort((t,s)=>new Date(s.createdAt).getTime()-new Date(t.createdAt).getTime()||s.id-t.id),C=new Map;let m=Number(i?.earningsBalance);Number.isFinite(m)||(m=Math.max(0,Number(i?.balance||0)-Number(i?.depositBalance||0)));for(const t of f)C.set(t.id,m),m-=S(t);const X=f.filter(t=>!xe.has(t.type)&&(t.type==="withdrawal"||S(t)>0)),W=f.filter(t=>(t.type==="commission"||t.type==="deposit_commission")&&Number(t.amount)>0),Y=t=>(t.status==="pending"||t.status==="processing")&&(!!t.canVerifyPayment||!!(q&&!t.sendavapayReference&&(t.soleaspayReference||t.soleaspayOrderId||t.omnipayId||t.omnipayReference))),J=async t=>{N(t);try{await se(async()=>{const d=await(await fetch(`/api/deposits/${t}/verify`,{credentials:"include"})).json();d.status==="approved"?(n({title:"Paiement confirmé",description:"Votre compte a été crédité"}),o(),p.invalidateQueries({queryKey:["/api/deposits/history"]})):d.status==="rejected"?(n({title:"Paiement échoué",description:"Le paiement a été refusé",variant:"destructive"}),p.invalidateQueries({queryKey:["/api/deposits/history"]})):n({title:"En cours",description:"Le paiement est toujours en attente"})})}catch{n({title:"Vérification du paiement impossible",description:"Impossible de vérifier le paiement",variant:"destructive"})}finally{N(null)}};if(!i)return null;const A=l==="mine"?X:W,D=r==="income"?Q:r==="deposits"?B:O,L=r==="income"?U:r==="deposits"?H:_,E=r==="income"?G:r==="deposits"?M:V,Z=r==="income"?"Détails du solde":r==="deposits"?"Historique des dépôts":"Historique des retraits",u=t=>{c(ce(t,window.location.search))};return e.jsxs("main",{className:"history-page",children:[e.jsx("style",{children:`
        .history-page {
          width: 100%;
          min-height: 100dvh;
          overflow-x: hidden;
          background: #fff;
          color: #111827;
          font-family: Arial, sans-serif;
        }
        .history-page *,
        .history-page *::before,
        .history-page *::after {
          box-sizing: border-box;
        }
        .history-screen {
          width: 100%;
          max-width: 512px;
          min-height: 100dvh;
          margin: 0 auto;
          background: #fff;
        }
        .history-header {
          position: relative;
          display: flex;
          min-height: 78px;
          align-items: center;
          padding: 17px 16px;
          border-bottom: 2px solid #111827;
        }
        .history-back {
          display: grid;
          width: 42px;
          height: 42px;
          place-items: center;
          border: 2px solid #111827;
          border-radius: 11px;
          padding: 0;
          background: #fff;
          box-shadow: 0 3px 0 #111827;
          color: #111827;
          cursor: pointer;
        }
        .history-back svg {
          width: 22px;
          height: 22px;
          stroke-width: 2.5;
        }
        .history-title {
          position: absolute;
          right: 70px;
          left: 70px;
          margin: 0;
          color: #111827;
          font-size: 20px;
          font-weight: 800;
          line-height: 1.2;
          text-align: center;
        }
        .history-tabs {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          align-items: center;
          min-height: 78px;
          padding: 12px 16px 16px;
          border-bottom: 2px solid #111827;
        }
        .history-tab {
          display: flex;
          min-width: 0;
          height: 46px;
          align-items: center;
          justify-content: center;
          gap: 5px;
          border: 2px solid #111827;
          border-radius: 11px;
          padding: 0 8px;
          background: #ffffff;
          box-shadow: 0 3px 0 #111827;
          color: #111827;
          font-size: 14px;
          font-weight: 700;
          line-height: 1;
          white-space: nowrap;
          cursor: pointer;
        }
        .history-tab.active {
          background: #1947b8;
          color: #ffffff;
          font-weight: 700;
        }
        .history-tab-arrow {
          width: 17px;
          height: 17px;
          color: #111827;
          stroke-width: 2.8;
        }
        .history-tab-arrow.left {
          transform: rotate(180deg);
        }
        .history-content {
          min-height: calc(100dvh - 156px);
          padding: 18px 16px 40px;
          background: #edf2ff;
        }
        .history-list {
          display: grid;
          gap: 16px;
        }
        .history-card {
          position: relative;
          width: 100%;
          min-height: 154px;
          overflow: hidden;
          border: 2px solid #111827;
          border-radius: 12px;
          padding: 0 16px 16px;
          background: #ffffff;
          box-shadow: 0 4px 0 #111827, 0 8px 16px rgba(17, 24, 39, .12);
        }
        .withdrawal-receipt-card {
          min-height: 0;
          padding: 0 16px 16px;
          border-color: #17191c;
          border-radius: 15px;
          box-shadow: 0 4px 0 #17191c, 0 9px 18px rgba(17, 24, 39, .14);
        }
        .withdrawal-receipt-header {
          display: flex;
          min-height: 64px;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin: 0 -16px;
          border-bottom: 1.5px solid #e8cbd1;
          padding: 12px 16px;
          background: #ffffff;
        }
        .withdrawal-receipt-reference {
          min-width: 0;
          margin: 0;
          color: #252327;
          font-size: 15px;
          font-weight: 800;
          line-height: 1.25;
          overflow-wrap: anywhere;
        }
        .withdrawal-receipt-status {
          display: inline-flex;
          min-height: 31px;
          align-items: center;
          flex: 0 0 auto;
          border: 1.5px solid #17191c;
          border-radius: 999px;
          padding: 0 10px;
          color: #ffffff;
          font-size: 12px;
          font-weight: 800;
          line-height: 1;
          white-space: nowrap;
        }
        .withdrawal-receipt-rows {
          display: grid;
          gap: 10px;
          padding-top: 13px;
        }
        .withdrawal-receipt-card .history-row {
          min-height: 22px;
          justify-content: flex-start;
          gap: 9px;
          font-size: 14px;
          line-height: 1.35;
        }
        .withdrawal-receipt-card .history-row > span:first-child {
          flex: 0 0 86px;
          color: #6d6970;
          font-weight: 600;
        }
        .withdrawal-receipt-card .history-row > span:last-child {
          min-width: 0;
          color: #92263d;
          font-weight: 800;
          text-align: left;
          white-space: normal;
          overflow-wrap: anywhere;
        }
        .withdrawal-receipt-card .history-row:last-child > span:last-child {
          color: #252327;
          font-weight: 600;
        }
        .history-card-top {
          display: flex;
          min-height: 76px;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          margin: 0 -16px;
          padding: 14px 16px 13px;
          border-bottom: 2px solid #111827;
          background: ${R};
        }
        .history-amount {
          margin: 0;
          color: #111827;
          font-size: 19px;
          font-weight: 800;
          line-height: 1.15;
        }
        .history-card-label {
          margin: 6px 0 0;
          color: #111827;
          font-size: 16px;
          font-weight: 700;
          line-height: 1.15;
        }
        .history-status {
          display: inline-flex;
          min-height: 34px;
          align-items: center;
          flex: 0 0 auto;
          border: 2px solid #111827;
          border-radius: 11px;
          padding: 0 11px;
          color: #fff;
          font-size: 12px;
          font-weight: 700;
          line-height: 1;
          white-space: nowrap;
        }
        .history-divider {
          height: 0;
          margin: 14px 0 9px;
          border-top: 2px dashed #9ca3af;
        }
        .history-row {
          display: flex;
          min-height: 21px;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          color: #111827;
          font-size: 14px;
          line-height: 1.2;
        }
        .history-row > span:first-child {
          color: #4b5563;
          font-weight: 700;
        }
        .history-row > span:last-child {
          text-align: right;
          white-space: nowrap;
        }
        .history-empty {
          display: flex;
          min-height: 320px;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          border: 2px solid #111827;
          border-radius: 12px;
          background: #ffffff;
          box-shadow: 0 4px 0 #111827;
          color: #4b5563;
          font-size: 14px;
        }
        .history-empty img {
          width: 112px;
          height: 112px;
          object-fit: contain;
        }
        .history-verify {
          width: 100%;
          margin-top: 10px;
          min-height: 44px;
          border: 2px solid #111827;
          border-radius: 11px;
          padding: 9px 12px;
          background: ${R};
          box-shadow: 0 3px 0 #111827;
          color: #111827;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
        }
        .history-verify:disabled { cursor: wait; opacity: .7; }
        @media (max-width: 370px) {
          .history-header { height: 62px; padding-top: 6px; }
          .history-title { font-size: 19px; }
          .history-tabs { min-height: 58px; padding-bottom: 11px; }
          .history-tab { font-size: 14px; }
          .history-content { min-height: calc(100dvh - 120px); padding-right: 16px; padding-left: 16px; }
           .history-card { padding-right: 18px; padding-left: 18px; }
          .withdrawal-receipt-card { padding-right: 14px; padding-left: 14px; }
          .withdrawal-receipt-header { margin-right: -14px; margin-left: -14px; padding-right: 14px; padding-left: 14px; }
          .withdrawal-receipt-reference { font-size: 13px; }
          .withdrawal-receipt-card .history-row > span:first-child { flex-basis: 78px; }
          .history-card-label { font-size: 15px; }
          .history-status { font-size: 12px; padding-right: 8px; padding-left: 8px; }
          .history-row { font-size: 13px; }
        }
        .history-page {
          background: #f0f1f8;
          color: #202124;
          font-family: Roboto, Arial, sans-serif;
        }
        .history-screen {
          padding-bottom: calc(72px + env(safe-area-inset-bottom));
          background: #f0f1f8;
        }
        .history-header {
          min-height: 48px;
          justify-content: center;
          padding: 0 54px;
          border: 0;
          background: #00317d;
        }
        .history-back {
          position: absolute;
          left: 10px;
          width: 36px;
          height: 36px;
          border: 0;
          border-radius: 50%;
          background: transparent;
          box-shadow: none;
          color: #fff;
        }
        .history-title {
          right: 54px;
          left: 54px;
          color: #fff;
          font-size: 17px;
          font-weight: 700;
        }
        .history-tabs {
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
          min-height: 0;
          padding: 18px 16px 0;
          border: 0;
          background: #f0f1f8;
        }
        .history-tab {
          height: 44px;
          border: 0;
          border-radius: 6px;
          padding: 0 6px;
          background: #fff;
          box-shadow: none;
          color: #123a78;
          font-size: 12px;
          font-weight: 500;
        }
        .history-tab.active {
          background: #00317d;
          color: #fff;
          font-weight: 600;
        }
        .income-history-panel {
          min-height: 412px;
          margin: 18px 18px 0;
          border-radius: 14px;
          padding: 16px;
          background: #fff;
        }
        .income-history-tabs {
          display: grid;
          grid-template-columns: 1fr 1fr;
          min-height: 34px;
          overflow: hidden;
          border: 1px solid #123a78;
          border-radius: 3px;
        }
        .income-history-tab {
          min-width: 0;
          border: 0;
          padding: 5px 7px;
          background: #fff;
          color: #123a78;
          font-size: 12px;
          font-weight: 500;
        }
        .income-history-tab + .income-history-tab {
          border-left: 1px solid #123a78;
        }
        .income-history-tab.active {
          background: #00317d;
          color: #fff;
          font-weight: 700;
        }
        .income-history-content {
          display: flex;
          min-height: 360px;
          flex-direction: column;
        }
        .income-history-content > .history-no-data {
          align-self: center;
          margin: auto 0;
        }
        .history-content {
          display: flex;
          min-height: calc(100dvh - 170px);
          flex-direction: column;
          justify-content: center;
          padding: 0 18px 70px;
          background: #f0f1f8;
        }
        .history-no-data {
          margin: 0;
          color: #b5b5bd;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 22px;
          font-weight: 700;
          letter-spacing: .22em;
          line-height: 1.2;
          text-align: center;
        }
        .history-state {
          display: grid;
          min-height: 300px;
          place-items: center;
          color: #00317d;
        }
        .history-error {
          display: grid;
          justify-items: center;
          gap: 12px;
          border-radius: 12px;
          padding: 20px;
          background: #fff;
          color: #344b60;
          text-align: center;
        }
        .history-error button {
          min-height: 40px;
          border: 0;
          border-radius: 999px;
          padding: 0 18px;
          background: #00317d;
          color: #fff;
          font-weight: 700;
        }
        .history-list { gap: 12px; }
        .history-card {
          min-height: 0;
          border: 1px solid #e0e5ed;
          border-radius: 12px;
          padding: 0 14px 14px;
          box-shadow: 0 2px 8px rgb(25 44 78 / 7%);
        }
        .history-card-top {
          min-height: 64px;
          border: 0;
          border-radius: 0;
          padding: 12px 14px;
          background: #00317d;
          color: #fff;
        }
        .history-amount,
        .history-card-label { color: #fff; }
        .history-status,
        .withdrawal-receipt-status {
          border: 0;
          border-radius: 999px;
          font-weight: 700;
        }
        .history-divider { border-color: #d7deea; }
        .withdrawal-receipt-card {
          border-color: #e0e5ed;
          box-shadow: 0 2px 8px rgb(25 44 78 / 7%);
        }
        .withdrawal-receipt-header {
          border-bottom-color: #e0e5ed;
          background: #fff;
        }
        .withdrawal-receipt-card .history-row > span:last-child {
          color: #123a78;
        }
        .history-verify {
          min-height: 44px;
          border: 0;
          border-radius: 999px;
          background: linear-gradient(105deg, #0c3a83 0%, #5273a7 100%);
          box-shadow: 0 3px 8px rgb(13 48 104 / 18%);
          color: #fff;
        }
        @media (max-width: 370px) {
          .history-tabs { gap: 7px; padding-right: 12px; padding-left: 12px; }
          .history-tab { padding: 0 4px; font-size: 11px; }
          .income-history-panel { margin-right: 12px; margin-left: 12px; padding: 13px; }
          .income-history-tab { font-size: 11px; }
        }
        .history-content {
          justify-content: flex-start;
          padding-top: 12px;
        }
        .history-content > .history-no-data,
        .history-content > .history-state,
        .history-content > .history-error {
          margin-top: auto;
          margin-bottom: auto;
        }
        .history-list { gap: 16px; }
        .movement-history-card {
          display: flex;
          min-height: 94px;
          overflow: hidden;
          border: 3px solid #0c3676;
          border-radius: 13px;
          padding: 3px;
          background: #0c3676;
        }
        .movement-history-logo {
          display: grid;
          width: 88px;
          flex: 0 0 88px;
          place-items: center;
          overflow: hidden;
          background: #0c3676;
        }
        .movement-history-logo img {
          display: block;
          width: 78px;
          height: 78px;
          object-fit: cover;
        }
        .movement-history-body {
          display: flex;
          min-width: 0;
          flex: 1;
          flex-direction: column;
          justify-content: center;
          gap: 13px;
          border-radius: 7px;
          padding: 12px 13px;
          background: #f3f5fa;
        }
        .movement-history-row {
          display: flex;
          min-width: 0;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          color: #123963;
          font-size: 13px;
          line-height: 1.2;
        }
        .movement-history-row strong { font-weight: 700; }
        .movement-history-amount {
          flex: 0 0 auto;
          color: #15191f;
          font-size: 14px;
          font-weight: 700;
        }
        .movement-history-subrow time {
          overflow: hidden;
          color: #9ba3ad;
          font-size: 11px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .movement-history-status {
          flex: 0 0 auto;
          font-size: 11px;
          font-weight: 700;
        }
        .movement-history-body .history-verify {
          width: auto;
          min-height: 31px;
          margin-top: 0;
          align-self: flex-start;
          border-radius: 7px;
          padding: 5px 10px;
          font-size: 11px;
        }
        .income-history-content:has(.income-ledger-list) {
          min-height: 0;
        }
        .income-ledger-list {
          display: grid;
          gap: 15px;
          padding: 16px 0 8px;
        }
        .income-ledger-card {
          display: grid;
          min-height: 80px;
          align-content: center;
          gap: 12px;
          border-radius: 8px;
          padding: 13px 12px;
          background: #f5f5f5;
          color: #1f252d;
        }
        .income-ledger-row {
          display: flex;
          min-width: 0;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          font-size: 13px;
          line-height: 1.25;
        }
        .income-ledger-description {
          min-width: 0;
          overflow-wrap: anywhere;
          font-size: 13px;
          font-weight: 500;
        }
        .income-ledger-row time {
          flex: 0 0 auto;
          color: #262a30;
          font-size: 11px;
          white-space: nowrap;
        }
        .income-ledger-amount-row span {
          color: #17395e;
          text-align: right;
          white-space: nowrap;
        }
        .income-ledger-credit,
        .income-ledger-debit {
          color: #17395e;
          font-size: 14px;
          font-weight: 500;
          white-space: nowrap;
        }
        .income-ledger-debit { color: #17395e; }
        @media (max-width: 370px) {
          .movement-history-logo { width: 72px; flex-basis: 72px; }
          .movement-history-logo img { width: 66px; height: 66px; }
          .movement-history-body { gap: 10px; padding-right: 9px; padding-left: 9px; }
          .movement-history-row { gap: 6px; font-size: 12px; }
          .movement-history-amount { font-size: 13px; }
          .movement-history-subrow time { font-size: 10px; }
          .income-ledger-row { gap: 6px; font-size: 12px; }
          .income-ledger-row time { font-size: 10px; }
          .income-ledger-amount-row span,
          .income-ledger-credit,
          .income-ledger-debit { font-size: 12px; }
        }
      `}),e.jsxs("div",{className:"history-screen",children:[e.jsxs("header",{className:"history-header",children:[e.jsx(oe,{href:P,children:e.jsx("button",{className:"history-back","data-testid":"button-back","aria-label":"Retour",children:e.jsx(le,{"aria-hidden":"true"})})}),e.jsx("h1",{className:"history-title",children:Z})]}),e.jsxs("nav",{className:"history-tabs","aria-label":"Type d'enregistrement",children:[e.jsx("button",{className:`history-tab ${r==="income"?"active":""}`,onClick:()=>u("income"),"aria-current":r==="income"?"page":void 0,"data-testid":"tab-income",children:"Détails revenus"}),e.jsx("button",{className:`history-tab ${r==="deposits"?"active":""}`,onClick:()=>u("deposits"),"aria-current":r==="deposits"?"page":void 0,"data-testid":"tab-deposits",children:"Dépôt"}),e.jsx("button",{className:`history-tab ${r==="withdrawals"?"active":""}`,onClick:()=>u("withdrawals"),"aria-current":r==="withdrawals"?"page":void 0,"data-testid":"tab-withdrawals",children:"Retrait"})]}),r==="income"?e.jsxs("section",{className:"income-history-panel","aria-label":"Détails des revenus","aria-live":"polite",children:[e.jsxs("nav",{className:"income-history-tabs","aria-label":"Type de revenus",children:[e.jsx("button",{type:"button",className:`income-history-tab ${l==="mine"?"active":""}`,onClick:()=>j("mine"),"aria-pressed":l==="mine",children:"Mes revenus"}),e.jsx("button",{type:"button",className:`income-history-tab ${l==="subordinate"?"active":""}`,onClick:()=>j("subordinate"),"aria-pressed":l==="subordinate",children:"Revenus des filleuls"})]}),e.jsx("div",{className:"income-history-content",children:D?e.jsx("div",{className:"history-state",role:"status",children:e.jsx(v,{className:"animate-spin"})}):L?e.jsxs("div",{className:"history-error",role:"alert",children:[e.jsx("span",{children:"Impossible de charger les revenus."}),e.jsx("button",{type:"button",onClick:()=>{E()},children:"Réessayer"})]}):A.length===0?e.jsx("p",{className:"history-no-data",role:"status",children:"NO DATA"}):e.jsx("div",{className:"income-ledger-list",children:A.map(t=>{const s=Number(t.amount)||0,d=C.get(t.id)??0;return e.jsxs("article",{className:"income-ledger-card","data-testid":`income-item-${t.id}`,children:[e.jsxs("div",{className:"income-ledger-row",children:[e.jsx("strong",{className:"income-ledger-description",children:t.description||(l==="mine"?"Mouvement du compte":"Commission de parrainage")}),e.jsx("time",{children:w(t.createdAt)})]}),e.jsxs("div",{className:"income-ledger-row income-ledger-amount-row",children:[e.jsxs("strong",{className:s<0?"income-ledger-debit":"income-ledger-credit",children:[s>0?"+ ":s<0?"− ":"",x(s)," ",h]}),e.jsxs("span",{children:["Solde retirable : ",x(d)," ",h]})]})]},t.id)})})})]}):e.jsx("section",{className:"history-content","aria-live":"polite",children:D?e.jsx("div",{className:"history-state",role:"status",children:e.jsx(v,{className:"animate-spin"})}):L?e.jsxs("div",{className:"history-error",role:"alert",children:[e.jsx("span",{children:"Impossible de charger l’historique."}),e.jsx("button",{type:"button",onClick:()=>{E()},children:"Réessayer"})]}):r==="deposits"?k.length>0?e.jsx("div",{className:"history-list",children:k.map(t=>{const{label:s,color:d}=I(t.status),y=Number.parseFloat(t.amount);return e.jsx("div",{"data-testid":`deposit-item-${t.id}`,children:e.jsx($,{title:"Dépôt",amount:x(y),currency:h,date:w(t.createdAt),status:{label:s,color:d},verify:Y(t)?{busy:F===t.id,onClick:()=>J(t.id)}:void 0})},t.id)})}):e.jsx("p",{className:"history-no-data",role:"status",children:"NO DATA"}):z.length>0?e.jsx("div",{className:"history-list",children:z.map(t=>{const{label:s,color:d}=ge(t.status),y=Number.parseFloat(t.amount);return e.jsx("div",{"data-testid":`withdrawal-item-${t.id}`,children:e.jsx($,{title:"Retrait",amount:x(y),currency:h,date:w(t.createdAt),status:{label:s,color:d}})},t.id)})}):e.jsx("p",{className:"history-no-data",role:"status",children:"NO DATA"})})]}),e.jsx(ae,{})]})}export{ke as default};
