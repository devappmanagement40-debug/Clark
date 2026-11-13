import{d as at,a as Ut,b as qt,$ as Vt,r,j as e,L as O,a0 as _t,h as k,F as Kt}from"./index-BTT4mfJq.js";import{u as z}from"./useQuery-CBYcMHBj.js";import{u as I}from"./useMutation-DwmKuRur.js";import{C as Wt}from"./country-selector-DlTr2TBZ.js";import{b as Yt}from"./countries-Dxa2RqvP.js";import{w as Gt,s as u}from"./wave-payment-link-BblNfOVB.js";import{r as Qt,q as Bt,g as Ht}from"./platform-settings-BY9EySds.js";import{C as j}from"./chevron-left-BXQAgjz5.js";import{C as Jt}from"./chevron-down-CPeWC_6p.js";import{P as oe,E as A}from"./phone-CTMnweGW.js";import{I as Zt,Z as Xt}from"./zap-CTU9ROSi.js";import{L as v}from"./loader-circle-DftbW3uA.js";import{R as G}from"./refresh-cw-BTjey6Cd.js";import"./search-B1LvosH1.js";const Q=at("CircleCheckBig",[["path",{d:"M21.801 10A10 10 0 1 1 17 3.335",key:"yps3ct"}],["path",{d:"m9 11 3 3L22 4",key:"1pflzl"}]]);const es=at("Upload",[["path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",key:"ih7n3h"}],["polyline",{points:"17 8 12 3 7 8",key:"t8dd8p"}],["line",{x1:"12",x2:"12",y1:"3",y2:"15",key:"widbto"}]]),S="#00317d",st="#123a78",d="linear-gradient(105deg, #0c3a83 0%, #5273a7 100%)",rt="soleaspay-pending-deposit",ts=`
  .deposit-step-shell {
    min-height: 100dvh;
    max-width: 512px;
    margin: 0 auto;
    overflow: hidden;
    background: #f1f1fa;
    color: #202124;
    font-family: Roboto, Arial, sans-serif;
  }
  .deposit-step-shell .deposit-step-header {
    min-height: 72px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 14px 16px;
    border-bottom: 0;
    background: #00317d;
    color: #fff;
  }
  .deposit-step-shell .deposit-step-back {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    min-height: 42px;
    padding: 8px 12px 8px 8px;
    border: 1px solid rgb(255 255 255 / 42%);
    border-radius: 10px;
    background: #fff;
    color: #00317d;
    font-size: 15px;
    font-weight: 800;
    box-shadow: none;
  }
  .deposit-step-shell .deposit-step-back:active {
    transform: translateY(2px);
    box-shadow: none;
  }
  .deposit-step-shell .deposit-step-history {
    min-height: 40px;
    padding: 8px 12px;
    border: 1px solid rgb(255 255 255 / 42%);
    border-radius: 11px;
    background: rgb(255 255 255 / 12%);
    color: #fff;
    font-size: 12px;
    font-weight: 800;
  }
  .deposit-step-shell .deposit-step-content {
    padding: 16px;
  }
  .deposit-step-shell .deposit-step-summary {
    border: 1px solid #dce2ec;
    border-radius: 14px;
    background: #fff;
    box-shadow: 0 2px 7px rgb(25 44 78 / 8%);
  }
  .deposit-step-shell .deposit-step-card {
    border: 1px solid #dce2ec;
    border-radius: 14px;
    background: #fff;
    box-shadow: 0 2px 7px rgb(25 44 78 / 8%);
  }
  .deposit-step-shell .deposit-step-card-accent {
    border-color: ${S};
    background: #edf2ff;
  }
  .deposit-step-shell .deposit-step-field {
    border: 1px solid #d4dce9 !important;
    border-radius: 9px !important;
    background: #f1f3f8 !important;
    box-shadow: none;
  }
  .deposit-step-shell .deposit-step-primary {
    min-height: 54px;
    border: 1px solid #092e6b !important;
    border-radius: 999px !important;
    background: ${d} !important;
    color: #fff !important;
    font-weight: 800 !important;
    box-shadow: 0 4px 9px rgb(19 49 99 / 22%);
  }
  .deposit-step-shell .deposit-step-primary:active:not(:disabled) {
    transform: translateY(3px);
    box-shadow: 0 2px 5px rgb(19 49 99 / 18%);
  }
  .deposit-step-shell .deposit-step-secondary {
    border: 1px solid #d8dfe9 !important;
    border-radius: 12px !important;
    background: #f3f5f8 !important;
    color: #111827 !important;
    font-weight: 800 !important;
    box-shadow: none;
  }
  .deposit-step-shell .deposit-step-icon {
    display: grid;
    width: 76px;
    height: 76px;
    place-items: center;
    border: 1px solid #dce2ec;
    border-radius: 50%;
    background: #edf2ff;
    box-shadow: 0 2px 5px rgb(25 44 78 / 8%);
  }
  .deposit-step-shell .deposit-step-icon svg {
    color: ${S};
  }
  .deposit-step-shell .deposit-step-operator {
    border: 1px solid #dce2ec !important;
    border-radius: 12px !important;
    background: #fff !important;
    box-shadow: 0 2px 5px rgb(25 44 78 / 8%);
  }
  .deposit-step-shell .deposit-step-operator-selected {
    border-color: ${S} !important;
    background: ${S} !important;
    color: #fff !important;
    box-shadow: 0 3px 8px rgb(25 44 78 / 18%);
  }
  .deposit-step-shell .deposit-step-otp {
    border: 1px solid #d4dce9 !important;
    border-radius: 12px !important;
    background: #f1f3f8 !important;
    box-shadow: none;
  }
  .deposit-step-shell [class*="text-[#D40030]"],
  .deposit-step-shell [class*="text-[#A60026]"],
  .deposit-step-shell [class*="border-[#D40030]"],
  .deposit-step-shell [class*="hover:border-[#D40030]"],
  .deposit-step-shell [class*="focus:border-[#D40030]"] {
    color: #1947b8 !important;
    border-color: #1947b8 !important;
  }
  .deposit-step-shell [class*="bg-[#D40030]"] {
    background-color: #1947b8 !important;
  }
  .deposit-step-shell [class*="bg-[#FFF0F3]"],
  .deposit-step-shell [class*="hover:bg-[#FFF0F3]"] {
    background-color: #edf2ff !important;
  }
  @media (max-width: 360px) {
    .deposit-step-shell .deposit-step-header { padding-right: 12px; padding-left: 12px; }
    .deposit-step-shell .deposit-step-content { padding: 12px; }
    .deposit-step-shell .deposit-step-back { font-size: 14px; }
  }
`;function f(){return e.jsx("style",{children:ts})}function Ss(){const{user:m,refreshUser:B}=Ut(),{toast:i}=qt(),L=Vt(),ke=r.useRef(null),[c,n]=r.useState("amount"),[l,nt]=r.useState(null),[h,Se]=r.useState(""),[ss,rs]=r.useState(null),[o,g]=r.useState(""),[w,Ce]=r.useState(""),[Pe,ze]=r.useState(!1),[ie,Ie]=r.useState(m?.phone||""),[M,Me]=r.useState(""),[ot,De]=r.useState(""),[Ee,Oe]=r.useState(""),[Ae,Le]=r.useState(""),[D,it]=r.useState(m?.country||""),[ce,ct]=r.useState(""),[b,T]=r.useState(null),[H,J]=r.useState(null),[le,Z]=r.useState(""),[lt,de]=r.useState(""),[pe,xe]=r.useState(""),[Te,dt]=r.useState(""),[as,pt]=r.useState(""),[xt,mt]=r.useState(""),[$e,$]=r.useState(""),[Fe,y]=r.useState(!1),[F,me]=r.useState(null),[C,X]=r.useState(""),[ht,ut]=r.useState(""),[Re,ee]=r.useState(!1),[R,ft]=r.useState(m?.country||""),[te,gt]=r.useState(""),[U,Ue]=r.useState(""),[q,se]=r.useState(null),[he,qe]=r.useState(""),[ue,Ve]=r.useState(""),[ns,_e]=r.useState(""),[bt,yt]=r.useState(""),[os,re]=r.useState(""),[Ke,V]=r.useState(!1),p=w,{data:We,isError:ae}=z({queryKey:["/api/countries"]}),Ye=Yt(We,ae),_=Ye.find(t=>t.code===p&&t.isActive),x=_?.currency||"FCFA",{data:jt,isFetching:Ge}=z({queryKey:["/api/settings"],...Kt}),{data:vt,isLoading:fe,isError:Qe}=z({queryKey:["/api/deposit/methods",p],queryFn:async()=>{const t=await fetch(`/api/deposit/methods/${encodeURIComponent(p)}`,{credentials:"include"}),s=await t.json();if(!t.ok)throw new Error(s.message||"Impossible de charger les moyens de dépôt");return s},enabled:!!p}),P=vt?.methods||[],Be=new Set(P.map(t=>t.provider)),wt=P.map(t=>t.provider).join(",");r.useEffect(()=>{P.length===1?Se(P[0].provider):Se("")},[p,wt]);const K=Qt(jt?.minDeposit,Ht),Nt=Bt,ge=Be.has("ashtech"),He={CI:0,NE:1},W=Ye.filter(t=>t.isActive).sort((t,s)=>(He[t.code.toUpperCase()]??2)-(He[s.code.toUpperCase()]??2));r.useEffect(()=>{if(w)return;const t=String(m?.country||"").toUpperCase(),s=W.find(a=>a.code.toUpperCase()===t);s&&Ce(s.code)},[w,We,ae,m?.country]);const kt=ge?[p.toUpperCase()]:[],{data:is=[],isLoading:cs}=z({queryKey:["/api/payment-numbers",p],queryFn:async()=>{const t=await fetch(`/api/payment-numbers?country=${p}`,{credentials:"include"});if(!t.ok)throw new Error("Impossible de charger les numéros de paiement");return t.json()},enabled:!!p}),{data:St,isLoading:Ct}=z({queryKey:["/api/sendavapay/operators",D],queryFn:async()=>{const t=await fetch(`/api/sendavapay/operators/${D}`,{credentials:"include"});if(!t.ok)throw new Error("Impossible de charger les opérateurs SendavaPay");return t.json()},enabled:c==="sv-operator"&&!!D}),Je=(St?.data||[]).filter(t=>t.status==="online"),{data:Pt=[],isLoading:zt}=z({queryKey:["/api/ashtechpay/countries"],queryFn:async()=>{const t=await fetch("/api/ashtechpay/countries",{credentials:"include"});if(!t.ok)throw new Error("Impossible de charger les opérateurs");return t.json()},enabled:c==="ashtech-operator"&&ge}),{data:It}=z({queryKey:["/api/ashtechpay/operators",R],queryFn:async()=>{const t=await fetch(`/api/ashtechpay/operators/${encodeURIComponent(R)}`,{credentials:"include"}),s=await t.json();if(!t.ok)throw new Error(s.message||"Impossible de charger les opérateurs");return s},enabled:c==="ashtech-operator"&&ge&&!!R}),Mt=Pt.filter(t=>W.some(s=>s.code.toUpperCase()===t.code.toUpperCase())&&kt.includes(t.code.toUpperCase())),Ze=It?.operators||[];r.useEffect(()=>{if(c!=="sv-waiting"||!H||!Fe)return;const t=setInterval(async()=>{try{const a=await(await fetch(`/api/deposits/${H}/sendavapay-status`,{credentials:"include"})).json();$(a.status),a.status==="approved"?(clearInterval(t),y(!1),i({title:"Paiement confirmé !",description:"Votre solde a été crédité."}),B(),L.invalidateQueries({queryKey:["/api/deposits/history"]}),n("amount"),g(""),T(null),J(null),Z(""),de(""),xe(""),$("")):a.status==="rejected"&&(clearInterval(t),y(!1),i({title:"Paiement échoué",description:"Le paiement a été refusé ou annulé.",variant:"destructive"}),n("sv-operator"))}catch{}},5e3);return()=>clearInterval(t)},[c,H,Fe]),r.useEffect(()=>{if(c!=="ashtech-waiting"||!q||!Ke)return;const t=setInterval(async()=>{try{const a=await(await fetch(`/api/deposits/${q}/ashtechpay-status`,{credentials:"include"})).json();re(a.status),a.status==="approved"?(clearInterval(t),V(!1),i({title:"Paiement confirmé !",description:"Votre solde a été crédité."}),B(),L.invalidateQueries({queryKey:["/api/deposits/history"]}),n("amount"),g(""),se(null),re("")):a.status==="rejected"&&(clearInterval(t),V(!1),i({title:"Paiement échoué",description:"Le paiement a été refusé ou annulé.",variant:"destructive"}),n("ashtech-operator"))}catch{}},5e3);return()=>clearInterval(t)},[c,q,Ke]),r.useEffect(()=>{const t=new URLSearchParams(window.location.search),s=t.get("soleaspayReturn");if(s!=="success"&&s!=="failure")return;const a=t.get("orderId");let N=!1;try{const ne=sessionStorage.getItem(rt),we=ne?JSON.parse(ne):null,Ne=Number(we?.depositId),Rt=typeof we?.orderId=="string"?we.orderId:"";Number.isInteger(Ne)&&Ne>0&&(!a||Rt===a)&&(me(Ne),X("pending"),ut(s==="success"?"Retour du paiement reçu. Vérification en cours...":"Retour du paiement reçu. Vérification de l'état final..."),ee(!0),n("soleaspay-waiting"),N=!0)}catch(ne){console.warn("[soleaspay] Could not resume pending deposit:",ne)}N||i({title:"Retour du paiement reçu",description:"Consultez l'historique des dépôts pour vérifier le statut du paiement."}),t.delete("soleaspayReturn"),t.delete("orderId");const tt=t.toString();window.history.replaceState({},"",`${window.location.pathname}${tt?`?${tt}`:""}${window.location.hash}`)},[i]),r.useEffect(()=>{if(c!=="soleaspay-waiting"||!F||!Re)return;const t=setInterval(async()=>{try{const s=await fetch(`/api/deposits/${F}/verify`,{credentials:"include"}),a=await s.json();if(!s.ok)throw new Error(a.message||"Vérification SoleaPay impossible");if(a.status&&X(a.status),a.status==="approved"||a.status==="rejected"){clearInterval(t),ee(!1);try{sessionStorage.removeItem(rt)}catch{}a.status==="approved"&&(i({title:"Paiement confirmé !",description:"Votre solde a été crédité."}),B(),L.invalidateQueries({queryKey:["/api/deposits/history"]}))}}catch{}},5e3);return()=>clearInterval(t)},[c,F,Re]);const Dt=t=>{const s=t.target.files?.[0];if(!s)return;if(s.size>5*1024*1024){i({title:"Fichier trop grand",description:"Maximum 5 Mo",variant:"destructive"});return}De(s.name);const a=new FileReader;a.onload=N=>Me(N.target?.result),a.readAsDataURL(s)},be=I({mutationFn:async()=>{if(!l)throw new Error("Aucun numéro sélectionné");const t=await k("POST","/api/deposits",{amount:Number(o),accountName:m?.fullName||"",accountNumber:ie,paymentMethod:l.operatorName,country:p,paymentNumberId:l.id,channelName:l.paymentLink?`${l.operatorName} - Lien de paiement`:`${l.operatorName} - ${l.phone}`,screenshot:M||null,paymentMessage:Ee||null,reference:Ae||null});if(!t.ok){const s=await t.json();throw new Error(s.message||"Dépôt non enregistré")}return t.json()},onSuccess:()=>{i({title:"Demande envoyée !",description:"Votre dépôt est en attente de validation"}),L.invalidateQueries({queryKey:["/api/deposits/history"]}),B(),n("amount"),nt(null),g(""),Ie(m?.phone||""),Me(""),De(""),Oe(""),Le("")},onError:t=>i({title:"Dépôt non enregistré",description:u(t.message,"Impossible d’enregistrer le dépôt."),variant:"destructive"})}),[ls,Et]=r.useState(null),[ds,Ot]=r.useState("");r.useEffect(()=>{const t=new URLSearchParams(window.location.search),s=t.get("wp_status"),a=t.get("wp_depositId");s&&(Ot(s),a&&Et(parseInt(a)),window.history.replaceState({},"","/deposit"),s==="success"&&(i({title:"Paiement en cours de confirmation",description:"Votre dépôt sera crédité dès confirmation."}),L.invalidateQueries({queryKey:["/api/deposits/history"]})))},[]);const Y=I({mutationFn:async()=>{const t=await k("POST","/api/deposits",{amount:Number(o),accountName:m?.fullName||"",accountNumber:m?.phone||"",paymentMethod:"WestPay",country:p,useWestpay:!0});if(!t.ok){const s=await t.json();throw new Error(s.message||"Dépôt non enregistré")}return t.json()},onSuccess:t=>{t.westpayUrl&&(window.location.href=t.westpayUrl)},onError:t=>i({title:"Dépôt non enregistré",description:u(t.message,"Impossible d’enregistrer le dépôt."),variant:"destructive"})}),Xe=I({mutationFn:async()=>{const t=await k("POST","/api/deposits",{amount:Number(o),accountName:m?.fullName||"",accountNumber:m?.phone||"",paymentMethod:"InPay",country:p,useInpay:!0});if(!t.ok){const s=await t.json();throw new Error(s.message||"Dépôt non enregistré")}return t.json()},onSuccess:t=>{t.inpayUrl&&(window.location.href=t.inpayUrl)},onError:t=>i({title:"Dépôt non enregistré",description:u(t.message,"Impossible d’enregistrer le dépôt."),variant:"destructive"})}),E=I({mutationFn:async t=>{if(!U||!te.trim())throw new Error("Sélectionnez un opérateur et saisissez votre numéro");const s=await k("POST","/api/ashtechpay/collect",{amount:Number(o),country:R,operator:U,phone:te.trim(),depositId:q||void 0,otp:t||void 0});if(!s.ok){const a=await s.json();throw new Error(a.message||"Dépôt non enregistré")}return s.json()},onSuccess:t=>{se(t.depositId),_e(u(t.message,"")),Ve(t.ussdCode||""),t.waveUrl?(yt(t.waveUrl),n("ashtech-redirect")):t.requiresOtp?n("ashtech-otp"):(V(!0),re(t.status||"pending"),n("ashtech-waiting"))},onError:t=>{if(t.data?.requiresOtp){se(t.data.depositId||q),Ve(t.data.ussdCode||""),_e(u(t.message,"Composez le code indiqué puis saisissez le code OTP.")),qe(""),n("ashtech-otp");return}i({title:"Dépôt non enregistré",description:u(t.message,"Impossible d’enregistrer le dépôt."),variant:"destructive"})}}),ye=I({mutationFn:async()=>{if(!b)throw new Error("Sélectionnez un opérateur");const t=await k("POST","/api/sendavapay/create",{amount:Number(o),country:D,operatorId:b.id,operatorName:b.name,payerPhone:ce});if(!t.ok){const N=await t.json();throw new Error(N.message||"Création du paiement impossible")}const s=await t.json();J(s.depositId),Z(s.paymentToken);const a=await k("POST","/api/sendavapay/initiate",{paymentToken:s.paymentToken,payerCountry:D,operatorId:b.id,depositId:s.depositId,payerPhone:ce});if(!a.ok){const N=await a.json();throw new Error(N.message||"Initiation du paiement impossible")}return a.json()},onSuccess:t=>{const s=b?.name?.toLowerCase().includes("wave");t.requiresRedirect&&t.redirectUrl&&s?(mt(t.redirectUrl),n("sv-redirect")):t.requiresRedirect&&!s?(y(!0),n("sv-waiting")):t.requiresOtp&&t.otpToken?(de(t.otpToken),dt(t.ussdCode||""),pt(u(t.message,"")),n("sv-otp")):t.success?(y(!0),n("sv-waiting")):i({title:"Paiement impossible",description:u(t.error||t.message,"Le paiement n'a pas pu être initié."),variant:"destructive"})},onError:t=>i({title:"Paiement impossible",description:u(t.message,"Le paiement n'a pas pu être initié."),variant:"destructive"})}),je=I({mutationFn:async()=>{if(!le)throw new Error("Token de paiement manquant");const t=await k("POST","/api/sendavapay/retry",{paymentToken:le,depositId:H});if(!t.ok){const s=await t.json();throw new Error(s.message||"Nouvelle tentative impossible")}return t.json()},onSuccess:()=>{xe(""),de(""),$(""),y(!1),n("sv-operator"),i({title:"Prêt à réessayer",description:"Sélectionnez un opérateur et relancez le paiement."})},onError:t=>i({title:"Nouvelle tentative impossible",description:u(t.message,"Réessayez dans quelques instants."),variant:"destructive"})}),ve=I({mutationFn:async()=>{const t=await k("POST","/api/sendavapay/submit-otp",{otpToken:lt,otp:pe});if(!t.ok){const s=await t.json();throw new Error(s.message||"Validation du code OTP impossible")}return t.json()},onSuccess:()=>{y(!0),n("sv-waiting")},onError:t=>i({title:"Validation du code OTP impossible",description:u(t.message,"Vérifiez le code puis réessayez."),variant:"destructive"})}),At=()=>{if(!o||Number(o)<K){i({title:"Montant invalide",description:`Le minimum est de ${K.toLocaleString()} ${x}`,variant:"destructive"});return}if(h==="inpay"&&(!Number.isInteger(Number(o))||Number(o)%5!==0)){i({title:"Montant invalide",description:"Utilisez un montant entier multiple de 5 : 300, 305, 310…",variant:"destructive"});return}Lt()},Lt=()=>{if(!w){i({title:"Pays requis",description:"Sélectionnez le pays du paiement.",variant:"destructive"});return}if(!h||!Be.has(h)){i({title:"Moyen de dépôt requis",description:fe?"Chargement des moyens disponibles...":"Aucun moyen de dépôt n’est configuré pour ce pays.",variant:"destructive"});return}if(h==="soleaspay"||h==="ashtech"||h==="sendavapay"||h==="manual"||h==="clapay"){window.location.href=`/robotpay?amount=${encodeURIComponent(Number(o))}&country=${encodeURIComponent(w)}&provider=${encodeURIComponent(h)}`;return}if(h==="inpay"){if(!Number.isInteger(Number(o))||Number(o)%5!==0){i({title:"Montant invalide",description:"Utilisez un montant entier multiple de 5 : 300, 305, 310…",variant:"destructive"});return}Xe.mutate();return}if(h==="westpay"){Y.mutate();return}},Tt=t=>{const s=t.toLowerCase();return s.includes("tmoney")||s.includes("t-money")?"/operators/tmoney.png":s.includes("moov")?p.toUpperCase()==="TG"?"/operators/moov-money-togo.webp":"/operators/moov.jpg":s.includes("orange")?"/operators/orange.png":s.includes("mtn")?"/operators/mtn.png":s.includes("airtel")?"/operators/airtel.png":s.includes("wave")?"/operators/wave.png":null},$t=()=>{if(!ie.trim()){i({title:"Numéro requis",description:"Entrez le numéro depuis lequel vous avez payé",variant:"destructive"});return}if(!M){i({title:"Capture requise",description:"Veuillez joindre la capture d'écran du paiement",variant:"destructive"});return}be.mutate()};if(!m)return null;const et=Number.parseFloat(m.depositBalance||"0"),Ft=Math.round(Number.isFinite(et)?et:0);return c==="amount"?e.jsxs("main",{className:"recharge-reference min-h-screen bg-white",children:[e.jsx("style",{children:`
        .recharge-reference {
          min-height: 100dvh;
          background: #fff;
          color: #111827;
          font-family: Inter, Arial, sans-serif;
        }
        .recharge-reference .recharge-screen {
          width: 100%;
          max-width: 512px;
          min-height: 100dvh;
          margin: 0 auto;
          overflow: hidden;
          background: #fff;
        }
        .recharge-reference .recharge-hero {
          position: relative;
          display: flex;
          box-sizing: border-box;
          height: 64px;
          align-items: center;
          justify-content: center;
          padding: 0 58px;
          background: #fff;
          border-bottom: 1px solid #e5e7eb;
        }
        .recharge-reference .recharge-title {
          margin: 0;
          color: #111827;
          font-size: 20px;
          font-weight: 800;
          line-height: 1.2;
        }
        .recharge-reference .recharge-back {
          position: absolute;
          z-index: 3;
          top: 10px;
          display: grid;
          width: 42px;
          height: 42px;
          place-items: center;
          border: 1.5px solid #eab1be;
          border-radius: 12px;
          padding: 0;
          background: #edf2ff;
          color: ${st};
          box-shadow: 0 2px 0 #f2c2cc;
        }
        .recharge-reference .recharge-back {
          left: 16px;
        }
        .recharge-reference .recharge-back:active {
          transform: translateY(1px);
          color: ${st};
          background: #ffe4ea;
          box-shadow: 0 1px 0 #f2c2cc;
        }
        .recharge-reference .account-summary {
          display: flex;
          min-height: 132px;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 20px 18px;
          border-bottom: 1px solid #e5e7eb;
          background: #fff;
        }
        .recharge-reference .balance-value {
          margin: 0;
          color: #111827;
          font-size: 28px;
          font-weight: 800;
          line-height: 1.1;
        }
        .recharge-reference .balance-label {
          margin: 8px 0 0;
          color: #6b7280;
          font-size: 14px;
        }
        .recharge-reference .country-chip {
          display: flex;
          max-width: 54%;
          min-height: 42px;
          align-items: center;
          gap: 8px;
          padding: 0 13px;
          border: 1px solid #e5e7eb;
          border-radius: 999px;
          background: #f6f8ff;
          color: #111827;
          font-size: 13px;
          font-weight: 700;
        }
        .recharge-reference .country-chip-icon {
          flex: 0 0 auto;
          box-sizing: content-box;
          width: 20px;
          height: 20px;
          padding: 5px;
          border-radius: 50%;
          background: #ffe4ea;
          color: ${S};
        }
        .recharge-reference .country-chip-name {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .recharge-reference .amount-panel {
          padding: 32px 18px 18px;
          background: #fff;
        }
        .recharge-reference .preset-row {
          display: flex;
          overflow-x: auto;
          gap: 8px;
          margin-top: 10px;
          overscroll-behavior-x: contain;
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
        }
        .recharge-reference .preset-row::-webkit-scrollbar {
          display: none;
        }
        .recharge-reference .preset {
          min-width: 82px;
          min-height: 42px;
          flex: 0 0 82px;
          border: 1.5px solid #111827;
          border-radius: 999px;
          background: #f9fafb;
          color: #24252a;
          font-size: 14px;
          font-weight: 800;
        }
        .recharge-reference .preset.active {
          background: ${d};
          border-color: #111827;
          color: #fff;
          box-shadow: 0 3px 0 #111827;
        }
        .recharge-reference .preset:disabled {
          cursor: not-allowed;
          opacity: 0.55;
          box-shadow: 0 2px 0 #17191c, 0 4px 9px rgba(17, 24, 39, .08);
        }
        .recharge-reference .amount-label {
          display: flex;
          flex-wrap: wrap;
          align-items: baseline;
          gap: 4px 8px;
          margin: 0 0 10px;
          color: #111827;
          font-size: 16px;
          font-weight: 800;
        }
        .recharge-reference .amount-input {
          display: flex;
          height: 60px;
          align-items: center;
          overflow: hidden;
          border: 2px solid #111827;
          border-radius: 12px;
          background: #fff;
        }
        .recharge-reference .amount-input input {
          width: 100%;
          flex: 1;
          height: 100%;
          min-width: 0;
          padding: 0 14px;
          border: 0;
          outline: 0;
          color: #111827;
          background: transparent;
          font-size: 19px;
        }
        .recharge-reference .currency {
          flex: 0 0 auto;
          padding: 0 13px;
          border-right: 1px solid #e5e7eb;
          color: #111827;
          font-size: 18px;
          font-weight: 800;
        }
        .recharge-reference .country-panel {
          margin: 15px 18px 0;
        }
        .recharge-reference .country-heading {
          display: block;
          margin: 0 0 10px;
          color: #111827;
          font-size: 16px;
          font-weight: 800;
        }
        .recharge-reference .continue {
          display: flex;
          width: calc(100% - 36px);
          min-height: 57px;
          align-items: center;
          justify-content: center;
          margin: 24px 18px 0;
          border: 2px solid #111827;
          border-radius: 12px;
          background: ${d};
          color: #fff;
          font-size: 16px;
          font-weight: 800;
          box-shadow: 0 4px 0 #111827;
        }
        .recharge-reference .continue:active:not(:disabled) {
          transform: translateY(3px);
          box-shadow: 0 1px 0 #111827;
        }
        .recharge-reference .continue:disabled {
          opacity: .55;
        }
        .recharge-reference .instructions {
          margin: 18px 18px 24px;
          padding: 22px 16px 10px;
          border: 2px solid #111827;
          border-top: 5px solid ${S};
          border-radius: 14px;
          background: #fff;
          color: #4b5563;
        }
        .recharge-reference .instructions-title {
          margin: 0 0 20px;
          color: #111827;
          font-size: 19px;
          font-weight: 800;
        }
        .recharge-reference .instructions-title::before {
          content: "•";
          margin-right: 8px;
          color: ${S};
          font-size: 24px;
          line-height: 0;
        }
        .recharge-reference .instruction {
          position: relative;
          margin: 0 0 16px 20px;
          font-size: 15px;
          font-weight: 500;
          line-height: 1.65;
        }
        .recharge-reference .instruction::before {
          position: absolute;
          top: 7px;
          left: -15px;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          content: "";
          background: ${S};
        }
        .recharge-reference .instruction strong { color: #111827; font-weight: 800; }
        @media (max-width: 360px) {
          .recharge-reference .recharge-back { left: 12px; }
          .recharge-reference .account-summary { padding-right: 12px; padding-left: 12px; }
          .recharge-reference .balance-value { font-size: 24px; }
          .recharge-reference .country-chip { padding: 0 9px; font-size: 12px; }
          .recharge-reference .amount-panel { padding-right: 12px; padding-left: 12px; }
          .recharge-reference .country-panel { margin-right: 12px; margin-left: 12px; }
          .recharge-reference .continue { width: calc(100% - 24px); margin-right: 12px; margin-left: 12px; }
          .recharge-reference .preset { font-size: 12px; }
          .recharge-reference .instruction { font-size: 15px; }
        }
        .recharge-reference {
          background: #f1f1fa;
          color: #202124;
          font-family: Roboto, Arial, sans-serif;
        }
        .recharge-reference .recharge-screen {
          max-width: 512px;
          padding-bottom: max(18px, env(safe-area-inset-bottom));
          background: #f1f1fa;
        }
        .recharge-reference .recharge-hero {
          height: 64px;
          background: #00317d;
          border: 0;
          color: #fff;
        }
        .recharge-reference .recharge-title { color: #fff; font-size: 19px; font-weight: 750; }
        .recharge-reference .recharge-back {
          top: 11px;
          width: 40px;
          height: 40px;
          border: 0;
          border-radius: 50%;
          background: rgb(255 255 255 / 13%);
          color: #fff;
          box-shadow: none;
        }
        .recharge-reference .recharge-back:active {
          background: rgb(255 255 255 / 22%);
          color: #fff;
          box-shadow: none;
        }
        .recharge-reference .deposit-intro {
          position: relative;
          display: flex;
          min-height: 118px;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          margin: 18px 18px 0;
          padding: 23px 19px 35px;
          overflow: hidden;
          border: 1px solid #0b3475;
          border-radius: 22px 22px 12px 12px;
          background: ${d};
          color: #fff;
          box-shadow: 0 4px 11px rgb(13 48 104 / 16%);
        }
        .recharge-reference .deposit-intro-copy {
          position: relative;
          z-index: 1;
          margin: 0;
          max-width: 270px;
          font-size: 16px;
          font-weight: 700;
          line-height: 1.45;
        }
        .recharge-reference .deposit-intro-icon {
          flex: 0 0 auto;
          width: 42px;
          height: 42px;
          margin-top: 1px;
          color: #dce7ff;
          opacity: .92;
        }
        .recharge-reference .account-summary {
          position: relative;
          z-index: 2;
          min-height: 106px;
          justify-content: center;
          margin: -7px 18px 0;
          padding: 18px 16px;
          border: 1px solid #e0e5ed;
          border-radius: 24px;
          background: #fff;
          box-shadow: 0 2px 8px rgb(25 44 78 / 8%);
          text-align: center;
        }
        .recharge-reference .balance-value {
          display: inline;
          color: #00317d;
          font-size: 23px;
          font-weight: 800;
          letter-spacing: -.03em;
        }
        .recharge-reference .balance-label {
          display: inline;
          margin: 0 7px 0 0;
          color: #777b83;
          font-size: 16px;
        }
        .recharge-reference .country-chip { display: none; }
        .recharge-reference .amount-panel {
          margin: 22px 18px 0;
          padding: 17px 16px 16px;
          border: 1px solid #e0e5ed;
          border-radius: 18px;
          background: #fff;
          box-shadow: 0 2px 8px rgb(25 44 78 / 8%);
        }
        .recharge-reference .amount-label {
          display: flex;
          align-items: center;
          margin: 0 0 12px;
          padding-bottom: 11px;
          border-bottom: 1px solid #e8e8e6;
          color: #252a32;
          font-size: 16px;
          font-weight: 750;
        }
        .recharge-reference .amount-heading-icon { flex: none; width: 20px; height: 20px; margin-right: 9px; color: #1947b8; }
        .recharge-reference .preset-row {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 7px;
          margin: 0 0 10px;
          overflow: visible;
        }
        .recharge-reference .preset {
          min-width: 0;
          min-height: 48px;
          border: 1px solid #e0e5ed;
          border-radius: 10px;
          background: #f7f8fb;
          color: #30343b;
          font-size: 15px;
          font-weight: 700;
          box-shadow: none;
          transition: transform .16s ease, box-shadow .16s ease, background-color .16s ease;
        }
        .recharge-reference .preset.active {
          border-color: #0b3475;
          background: ${d};
          color: #fff;
          box-shadow: 0 4px 9px rgb(13 48 104 / 20%);
        }
        .recharge-reference .preset:hover:not(:disabled) { transform: translateY(-1px); }
        .recharge-reference .preset:active:not(:disabled) { transform: translateY(1px); box-shadow: 0 2px 5px rgb(13 48 104 / 16%); }
        .recharge-reference .amount-input {
          height: 52px;
          border: 1px solid #d6deea;
          border-radius: 10px;
          background: #f1f3f8;
          box-shadow: none;
        }
        .recharge-reference .amount-input:focus-within {
          border-color: #00317d;
          box-shadow: none;
        }
        .recharge-reference .amount-input input { font-size: 16px; }
        .recharge-reference .currency {
          padding: 0 13px;
          border: 0;
          color: #00317d;
          font-size: 15px;
          font-weight: 700;
        }
        .recharge-reference .country-panel {
          margin: 16px 18px 0;
          padding: 16px;
          border: 1px solid #e0e5ed;
          border-radius: 17px;
          background: #fff;
          box-shadow: 0 2px 8px rgb(25 44 78 / 8%);
        }
        .recharge-reference .country-heading {
          margin: 0 0 10px;
          color: #292e37;
          font-size: 15px;
          font-weight: 750;
        }
        .recharge-reference .country-options {
          display: block;
        }
        .recharge-reference .country-select {
          display: flex;
          width: 100%;
          min-height: 52px;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 0 14px;
          border: 1px solid #d6deea;
          border-radius: 10px;
          outline: 0;
          background: #f1f3f8;
          color: #454a53;
          font: inherit;
          font-size: 15px;
          text-align: left;
          cursor: pointer;
          box-shadow: none;
          transition: transform .16s ease, border-color .16s ease, box-shadow .16s ease, background-color .16s ease;
        }
        .recharge-reference .country-select:focus-visible {
          border-color: #00317d;
          outline: 0;
          box-shadow: none;
        }
        .recharge-reference .country-select:hover { background: #e9eef7; }
        .recharge-reference .country-select-prefix {
          margin-left: auto;
          color: #00317d;
          font-size: 13px;
          font-weight: 700;
          white-space: nowrap;
        }
        .recharge-reference .country-select svg { flex: none; color: #6b7280; }
        .recharge-reference .continue {
          width: calc(100% - 36px);
          min-height: 58px;
          margin: 17px 18px 0;
          border: 1px solid #0b3475;
          border-radius: 14px;
          background: ${d};
          color: #fff;
          font-size: 16px;
          font-weight: 800;
          box-shadow: 0 4px 10px rgb(13 48 104 / 22%);
          transition: transform .16s ease, box-shadow .16s ease;
        }
        .recharge-reference .continue:active:not(:disabled) {
          transform: translateY(3px);
          box-shadow: 0 2px 5px rgb(13 48 104 / 18%);
        }
        .recharge-reference .continue:disabled { opacity: .5; }
        .recharge-reference .instructions {
          margin: 17px 18px 20px;
          padding: 16px 15px 5px;
          border: 1px solid #e0e5ed;
          border-top: 4px solid #00317d;
          border-radius: 17px;
          background: #fff;
          color: #444a54;
          box-shadow: 0 2px 8px rgb(25 44 78 / 8%);
        }
        .recharge-reference .instructions-title {
          margin: 0 0 12px;
          font-size: 16px;
          font-weight: 800;
        }
        .recharge-reference .instructions-title::before {
          content: "!";
          display: inline-grid;
          width: 19px;
          height: 19px;
          place-items: center;
          margin-right: 8px;
          border-radius: 50%;
          background: #00317d;
          color: #fff;
          font-size: 13px;
          font-weight: 800;
        }
        .recharge-reference .instruction {
          margin: 0 0 12px 0;
          padding-left: 0;
          font-size: 14px;
          line-height: 1.55;
        }
        .recharge-reference .instruction::before { display: none; }
        .recharge-reference .instruction strong { color: #303640; }
        @media (max-width: 360px) {
          .recharge-reference .deposit-intro,
          .recharge-reference .account-summary,
          .recharge-reference .amount-panel,
          .recharge-reference .country-panel,
          .recharge-reference .instructions { margin-right: 12px; margin-left: 12px; }
          .recharge-reference .continue { width: calc(100% - 24px); margin-right: 12px; margin-left: 12px; }
          .recharge-reference .preset { font-size: 13px; }
        }
        .recharge-reference {
          background: #f0f1f8;
          color: #202124;
          font-family: Roboto, Arial, sans-serif;
        }
        .recharge-reference .recharge-screen {
          padding-bottom: calc(78px + env(safe-area-inset-bottom));
          background: #f0f1f8;
        }
        .recharge-reference .recharge-hero {
          height: 48px;
          padding: 0 54px;
          background: #00317d;
          border: 0;
        }
        .recharge-reference .recharge-title {
          font-size: 18px;
          font-weight: 700;
        }
        .recharge-reference .recharge-back {
          top: 6px;
          width: 36px;
          height: 36px;
          border: 0;
          border-radius: 50%;
          background: rgb(255 255 255 / 12%);
          color: #fff;
          box-shadow: none;
        }
        .recharge-reference .recharge-back:active {
          background: rgb(255 255 255 / 20%);
          color: #fff;
          box-shadow: none;
        }
        .recharge-reference .deposit-intro,
        .recharge-reference .account-summary {
          display: none;
        }
        .recharge-reference .presets-panel {
          margin: 18px 18px 0;
          padding: 16px;
          border: 1px solid #e1e5ed;
          border-radius: 15px;
          background: #fff;
          box-shadow: 0 2px 8px rgb(25 44 78 / 7%);
        }
        .recharge-reference .preset-row {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
          margin: 0;
        }
        .recharge-reference .preset {
          min-width: 0;
          min-height: 48px;
          border: 0;
          border-radius: 999px;
          background: #f4f5f8;
          color: #202124;
          font-size: 15px;
          font-weight: 700;
          box-shadow: none;
        }
        .recharge-reference .preset.active {
          border: 0;
          background: ${d};
          color: #fff;
          box-shadow: 0 4px 9px rgb(13 48 104 / 22%);
        }
        .recharge-reference .amount-panel {
          margin: 16px 18px 0;
          padding: 18px;
          border: 1px solid #e1e5ed;
          border-radius: 15px;
          background: #fff;
          box-shadow: 0 2px 8px rgb(25 44 78 / 7%);
        }
        .recharge-reference .amount-balance {
          display: flex;
          align-items: baseline;
          gap: 9px;
          margin: 0 0 16px;
          color: #252a32;
          font-size: 15px;
        }
        .recharge-reference .amount-balance strong {
          color: #41464f;
          font-size: 15px;
          font-weight: 500;
        }
        .recharge-reference .amount-label {
          margin: 0 0 9px;
          padding: 0;
          border: 0;
          color: #252a32;
          font-size: 15px;
          font-weight: 500;
        }
        .recharge-reference .amount-input {
          height: 54px;
          border: 1px solid transparent;
          border-radius: 10px;
          background: #f0f2f9;
          box-shadow: none;
        }
        .recharge-reference .amount-input:focus-within {
          border-color: #00317d;
          box-shadow: none;
        }
        .recharge-reference .amount-input input { font-size: 18px; font-weight: 700; }
        .recharge-reference .country-panel {
          margin: 16px 18px 0;
          padding: 16px;
          border: 1px solid #e1e5ed;
          border-radius: 15px;
          background: #fff;
          box-shadow: 0 2px 8px rgb(25 44 78 / 7%);
        }
        .recharge-reference .country-heading {
          margin-bottom: 11px;
          color: #252a32;
          font-size: 15px;
          font-weight: 700;
        }
        .recharge-reference .country-select {
          min-height: 52px;
          border: 0;
          border-radius: 999px;
          background: #f0f2f9;
          color: #123a78;
          box-shadow: none;
        }
        .recharge-reference .country-select:hover { background: #e9edf6; }
        .recharge-reference .country-select:focus-visible {
          border: 1px solid #00317d;
          box-shadow: none;
        }
        .recharge-reference .continue {
          width: calc(100% - 36px);
          min-height: 55px;
          margin: 16px 18px 0;
          border: 0;
          border-radius: 999px;
          background: ${d};
          box-shadow: 0 4px 10px rgb(13 48 104 / 22%);
          font-size: 17px;
        }
        .recharge-reference .continue:active:not(:disabled) {
          transform: translateY(2px);
          box-shadow: 0 2px 5px rgb(13 48 104 / 18%);
        }
        .recharge-reference .instructions {
          display: grid;
          gap: 12px;
          margin: 16px 18px 20px;
          padding: 0;
          border: 0;
          border-radius: 0;
          background: transparent;
          box-shadow: none;
        }
        .recharge-reference .instructions-title { display: none; }
        .recharge-reference .instruction {
          margin: 0;
          border-left: 2px solid #00317d;
          padding: 11px 14px;
          background: #f1f3f8;
          color: #344b60;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 14px;
          line-height: 1.5;
        }
        .recharge-reference .instruction strong {
          color: #183d73;
          font-weight: 700;
        }
        @media (max-width: 360px) {
          .recharge-reference .presets-panel,
          .recharge-reference .amount-panel,
          .recharge-reference .country-panel,
          .recharge-reference .instructions {
            margin-right: 12px;
            margin-left: 12px;
          }
          .recharge-reference .continue {
            width: calc(100% - 24px);
            margin-right: 12px;
            margin-left: 12px;
          }
        }
      `}),e.jsxs("div",{className:"recharge-screen",children:[e.jsxs("header",{className:"recharge-hero","aria-label":"Dépôt",children:[e.jsx("h1",{className:"recharge-title",children:e.jsx("span",{children:"Dépôt"})}),e.jsx(O,{href:"/my-page",className:"recharge-back","aria-label":"Retour à l’accueil",children:e.jsx(j,{className:"h-6 w-6",strokeWidth:2.6,"aria-hidden":"true"})})]}),e.jsx("section",{className:"presets-panel","aria-label":"Montants proposés",children:e.jsx("div",{className:"preset-row",children:Nt.map(t=>e.jsx("button",{type:"button",className:`preset ${o===t?"active":""}`,disabled:t<K,"aria-label":`${t.toLocaleString("fr-FR")} ${x}${t<K?" - inférieur au minimum":""}`,"aria-pressed":o===t,onClick:()=>g(t),children:t.toLocaleString("fr-FR")},t))})}),e.jsxs("section",{className:"amount-panel","aria-label":"Montant de recharge",children:[e.jsxs("p",{className:"amount-balance",children:[e.jsx("span",{children:"Solde disponible :"}),e.jsxs("strong",{children:[Ft.toLocaleString("fr-FR")," ",x]})]}),e.jsx("p",{className:"amount-label",children:"Montant du dépôt"}),e.jsxs("label",{className:"amount-input",children:[e.jsx("span",{className:"currency",children:x}),e.jsx("input",{type:"number",inputMode:"numeric",value:o,onChange:t=>g(t.target.value?Number(t.target.value):""),placeholder:"Saisissez le montant","aria-label":"Montant de recharge"})]})]}),e.jsxs("section",{className:"country-panel","aria-label":"Pays et institutions de recharge",children:[e.jsx("h2",{className:"country-heading",children:"Pays de dépôt"}),e.jsx("div",{className:"country-options",children:e.jsxs("button",{type:"button",className:"country-select",onClick:()=>ze(!0),"aria-label":`Pays de dépôt : ${_?.name||"sélectionner un pays"}`,"aria-haspopup":"dialog","aria-expanded":Pe,"data-testid":"button-select-deposit-country",children:[e.jsx("span",{children:_?.name||"Sélectionnez un pays"}),_?.phonePrefix&&e.jsxs("span",{className:"country-select-prefix",children:["+",_.phonePrefix]}),e.jsx(Jt,{className:"h-4 w-4","aria-hidden":"true"})]})}),W.length===0&&!ae&&e.jsx("p",{className:"text-sm text-gray-600",children:"Aucun pays de dépôt n’est disponible pour le moment."}),ae&&e.jsx("p",{className:"mt-2 text-xs text-amber-700",children:"Liste locale temporaire affichée."}),w&&!fe&&(Qe||P.length===0||P.length>1)&&e.jsx("p",{role:"alert",className:"mt-2 text-sm text-red-700",children:Qe?"Impossible de vérifier les options de paiement pour ce pays.":P.length>1?"Plusieurs options de paiement sont configurées pour ce pays. Contactez le service client.":"Aucune option de paiement n’est disponible pour ce pays."})]}),e.jsx("button",{className:"continue",onClick:At,disabled:!w||Ge||fe||!h||Xe.isPending||Y.isPending,children:"Continuer"}),e.jsxs("section",{className:"instructions","aria-label":"Bon à savoir",children:[e.jsxs("p",{className:"instruction",children:["Montant minimum de dépôt :"," ",e.jsx("strong",{children:Ge?"Actualisation…":`${K.toLocaleString("fr-FR")} ${x}`})]}),e.jsx("p",{className:"instruction",children:"Vérifiez attentivement vos informations de compte lors du virement pour que votre paiement soit traité correctement."}),e.jsx("p",{className:"instruction",children:"Chaque commande possède ses propres informations de paiement ; ne réutilisez pas les informations précédentes pour un second paiement."}),e.jsx("p",{className:"instruction",children:"Après un virement réussi, veuillez patienter 10 à 30 minutes."})]}),e.jsx(Wt,{open:Pe,onClose:()=>ze(!1),onSelect:Ce,selectedCountryCode:w,allowedCountryCodes:W.map(t=>t.code)})]}),e.jsx(_t,{})]}):c==="form"&&l?e.jsxs("div",{className:"deposit-step-shell",children:[e.jsx(f,{}),e.jsx("header",{className:"deposit-step-header",children:e.jsxs("button",{className:"deposit-step-back",onClick:()=>n("amount"),children:[e.jsx(j,{className:"w-5 h-5"}),e.jsx("span",{className:"font-semibold text-base",children:"Confirmer le paiement"})]})}),e.jsxs("div",{className:"deposit-step-content space-y-4 pb-10",children:[e.jsxs("div",{className:"deposit-step-card deposit-step-card-accent p-4 flex items-center gap-3",children:[l.logoUrl?e.jsx("img",{src:l.logoUrl,alt:l.operatorName,className:"w-10 h-10 rounded-lg object-contain"}):e.jsx("div",{className:"w-10 h-10 rounded-lg bg-white flex items-center justify-center border-2 border-[#D40030]",children:e.jsx(oe,{className:"w-5 h-5 text-[#D40030]"})}),e.jsxs("div",{className:"flex-1",children:[e.jsx("p",{className:"text-xs text-gray-500",children:l.paymentLink?"Lien de paiement":"Numéro destinataire"}),l.paymentLink?e.jsxs("a",{href:Gt(l.paymentLink,Number(o),p)||l.paymentLink,target:"_blank",rel:"noreferrer",className:"mt-1 flex items-center gap-1 text-sm font-bold text-[#A60026] underline",children:[e.jsx(A,{className:"h-4 w-4"})," Ouvrir le lien de paiement"]}):e.jsxs("p",{className:"font-bold text-[#A60026] text-sm",children:[l.operatorName," — ",l.phone]}),e.jsx("p",{className:"text-xs text-gray-500",children:l.ownerName})]}),e.jsxs("div",{className:"text-right",children:[e.jsx("p",{className:"text-xs text-gray-500",children:"Montant"}),e.jsxs("p",{className:"font-bold text-gray-800",children:[Number(o).toLocaleString()," ",x]})]})]}),e.jsxs("div",{children:[e.jsx("p",{className:"text-sm font-semibold text-gray-800 mb-2",children:"Votre numéro payeur"}),e.jsxs("div",{className:"deposit-step-field flex items-center overflow-hidden",children:[e.jsx(oe,{className:"w-4 h-4 text-gray-400 ml-4"}),e.jsx("input",{type:"tel",value:ie,onChange:t=>Ie(t.target.value),placeholder:"Numéro depuis lequel vous avez payé",className:"flex-1 px-3 py-4 text-sm text-gray-700 outline-none bg-transparent"})]})]}),e.jsxs("div",{children:[e.jsxs("p",{className:"text-sm font-semibold text-gray-800 mb-2",children:["Référence / ID transaction ",e.jsx("span",{className:"text-gray-400 font-normal",children:"(optionnel)"})]}),e.jsx("input",{type:"text",value:Ae,onChange:t=>Le(t.target.value),placeholder:"Numéro de référence de la transaction",className:"deposit-step-field w-full px-4 py-4 text-sm text-gray-700 outline-none"})]}),e.jsxs("div",{children:[e.jsxs("p",{className:"text-sm font-semibold text-gray-800 mb-2",children:["Message reçu après paiement ",e.jsx("span",{className:"text-gray-400 font-normal",children:"(optionnel)"})]}),e.jsx("textarea",{value:Ee,onChange:t=>Oe(t.target.value),placeholder:"Collez ici le SMS ou message de confirmation reçu...",rows:3,className:"deposit-step-field w-full px-4 py-3 text-sm text-gray-700 outline-none resize-none"})]}),e.jsxs("div",{children:[e.jsxs("p",{className:"text-sm font-semibold text-gray-800 mb-2",children:["Capture d'écran du paiement ",e.jsx("span",{className:"text-red-500",children:"*"})]}),e.jsx("input",{ref:ke,type:"file",accept:"image/*",onChange:Dt,className:"hidden"}),e.jsx("button",{onClick:()=>ke.current?.click(),className:`w-full border-2 border-dashed rounded-xl py-7 flex flex-col items-center gap-2 transition-colors ${M?"border-[#D40030] bg-[#FFF0F3]":"border-gray-300 bg-gray-50 hover:border-[#D40030] hover:bg-[#FFF0F3]"}`,children:M?e.jsxs(e.Fragment,{children:[e.jsx(Q,{className:"w-8 h-8 text-[#D40030]"}),e.jsx("p",{className:"text-sm font-medium text-[#A60026]",children:ot}),e.jsx("p",{className:"text-xs text-gray-400",children:"Appuyez pour changer"})]}):e.jsxs(e.Fragment,{children:[e.jsx(Zt,{className:"w-8 h-8 text-gray-400"}),e.jsx("p",{className:"text-sm font-medium text-gray-600",children:"Appuyez pour ajouter la capture"}),e.jsx("p",{className:"text-xs text-gray-400",children:"JPG, PNG — max 5 Mo"})]})}),M&&e.jsx("div",{className:"mt-3 rounded-xl overflow-hidden border border-gray-100",children:e.jsx("img",{src:M,alt:"Capture",className:"w-full max-h-52 object-contain bg-gray-50"})})]}),e.jsx("button",{onClick:$t,disabled:be.isPending,className:"deposit-step-primary w-full py-5 disabled:opacity-50",style:{background:d},children:be.isPending?e.jsxs("span",{className:"flex items-center justify-center gap-2",children:[e.jsx(v,{className:"w-5 h-5 animate-spin"})," Envoi en cours..."]}):e.jsxs("span",{className:"flex items-center justify-center gap-2",children:[e.jsx(es,{className:"w-5 h-5"})," Soumettre ma demande"]})})]})]}):c==="westpay"?e.jsxs("div",{className:"deposit-step-shell",children:[e.jsx(f,{}),e.jsx("header",{className:"deposit-step-header",children:e.jsxs("button",{className:"deposit-step-back",onClick:()=>n("amount"),children:[e.jsx(j,{className:"w-5 h-5"}),e.jsx("span",{className:"font-semibold text-base",children:"Paiement Mobile Money"})]})}),e.jsxs("div",{className:"deposit-step-content space-y-5 pb-10",children:[e.jsxs("div",{className:"deposit-step-summary mx-0 p-4 flex items-center justify-between",children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-xs text-gray-500",children:"Montant à déposer"}),e.jsxs("p",{className:"text-xl font-bold text-[#A60026]",children:[Number(o).toLocaleString()," ",x]})]}),e.jsx("button",{onClick:()=>n("amount"),className:"text-xs text-[#A60026] underline",children:"Modifier"})]}),e.jsxs("div",{className:"deposit-step-card p-4 space-y-2",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(Xt,{className:"w-5 h-5 text-[#D40030]"}),e.jsx("p",{className:"font-semibold text-gray-900 text-sm",children:"Comment ça marche ?"})]}),e.jsxs("p",{className:"text-xs text-gray-600 leading-relaxed",children:["1. Cliquez sur ",e.jsx("strong",{children:"Continuer le paiement"})," — vous serez redirigé vers la page de paiement sécurisée."]}),e.jsx("p",{className:"text-xs text-gray-600 leading-relaxed",children:"2. Entrez votre numéro Mobile Money et validez le paiement USSD depuis votre téléphone."}),e.jsx("p",{className:"text-xs text-gray-600 leading-relaxed",children:"3. Après paiement, vous serez automatiquement redirigé ici. Votre solde est crédité après confirmation."})]}),e.jsx("button",{onClick:()=>Y.mutate(),disabled:Y.isPending,className:"deposit-step-primary w-full py-5 disabled:opacity-40 flex items-center justify-center gap-2",style:{background:d},children:Y.isPending?e.jsxs(e.Fragment,{children:[e.jsx(v,{className:"w-5 h-5 animate-spin"})," Redirection en cours..."]}):e.jsxs(e.Fragment,{children:[e.jsx(A,{className:"w-5 h-5"})," Continuer le paiement"]})}),e.jsx("p",{className:"text-xs text-center text-gray-400",children:"Paiement sécurisé — USSD Mobile Money"})]})]}):c==="ashtech-operator"?e.jsxs("div",{className:"deposit-step-shell",children:[e.jsx(f,{}),e.jsxs("header",{className:"deposit-step-header",children:[e.jsxs("button",{className:"deposit-step-back",onClick:()=>n("amount"),children:[e.jsx(j,{className:"w-5 h-5"}),e.jsx("span",{className:"font-semibold text-base",children:"Paiement Mobile Money"})]}),e.jsx(O,{href:"/deposits-history?from=deposit",children:e.jsx("button",{className:"deposit-step-history",children:"Historique"})})]}),e.jsxs("div",{className:"deposit-step-summary mx-4 mt-4 p-4 flex items-center justify-between",children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-xs text-gray-500",children:"Montant à déposer"}),e.jsxs("p",{className:"text-xl font-bold text-[#A60026]",children:[Number(o).toLocaleString()," ",x]})]}),e.jsx("button",{onClick:()=>n("amount"),className:"text-xs text-[#A60026] underline",children:"Modifier"})]}),e.jsxs("div",{className:"deposit-step-content space-y-4 pb-10",children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-sm font-semibold text-gray-800 mb-2",children:"Pays"}),zt?e.jsx(v,{className:"w-6 h-6 animate-spin text-[#D40030] mx-auto"}):e.jsx("select",{value:R,onChange:t=>{ft(t.target.value),Ue("")},className:"deposit-step-field w-full px-4 py-4 text-sm text-gray-700 outline-none appearance-none",children:Mt.map(t=>e.jsxs("option",{value:t.code,children:[t.name," (",t.currency,")"]},t.code))})]}),e.jsxs("div",{children:[e.jsx("p",{className:"text-sm font-semibold text-gray-800 mb-2",children:"Numéro Mobile Money"}),e.jsxs("div",{className:"deposit-step-field flex items-center overflow-hidden",children:[e.jsx(oe,{className:"w-4 h-4 text-gray-400 ml-4 flex-shrink-0"}),e.jsx("input",{type:"tel",inputMode:"numeric",value:te,onChange:t=>gt(t.target.value),placeholder:"Votre numéro Mobile Money",className:"flex-1 px-3 py-4 text-sm text-gray-700 outline-none bg-transparent"})]})]}),e.jsxs("div",{children:[e.jsx("p",{className:"text-sm font-semibold text-gray-800 mb-2",children:"Opérateur Mobile Money"}),Ze.length===0?e.jsx("p",{className:"text-sm text-gray-400 text-center py-5",children:"Aucun opérateur disponible pour ce pays"}):e.jsx("div",{className:"space-y-2",children:Ze.map((t,s)=>{const a=typeof t=="string"?t:t.name||t.code||`Opérateur ${s+1}`;return e.jsxs("button",{onClick:()=>Ue(a),className:`deposit-step-operator w-full flex items-center justify-between px-4 py-4 ${U===a?"deposit-step-operator-selected":""}`,children:[e.jsx("span",{className:"font-semibold text-gray-900 text-sm",children:a}),U===a&&e.jsx(Q,{className:"w-5 h-5 text-[#D40030]"})]},`${a}-${s}`)})})]}),e.jsx("button",{onClick:()=>E.mutate(void 0),disabled:!U||!te.trim()||E.isPending,className:"deposit-step-primary w-full py-5 disabled:opacity-40",style:{background:d},children:E.isPending?e.jsxs("span",{className:"flex items-center justify-center gap-2",children:[e.jsx(v,{className:"w-5 h-5 animate-spin"})," Initiation en cours..."]}):"Initier le paiement"})]})]}):c==="ashtech-otp"?e.jsxs("div",{className:"deposit-step-shell",children:[e.jsx(f,{}),e.jsx("header",{className:"deposit-step-header",children:e.jsxs("button",{onClick:()=>n("ashtech-operator"),className:"deposit-step-back",children:[e.jsx(j,{className:"w-5 h-5"}),e.jsx("span",{children:"Code OTP"})]})}),e.jsxs("div",{className:"deposit-step-content space-y-5 pb-10",children:[e.jsxs("div",{className:"deposit-step-card deposit-step-card-accent p-4",children:[e.jsx("p",{className:"font-bold text-gray-900 text-sm mb-2",children:"Code à composer"}),ue&&e.jsx("p",{className:"deposit-step-otp px-4 py-3 text-center font-mono font-black text-2xl text-[#A60026] tracking-widest",children:ue}),e.jsx("p",{className:"text-sm text-gray-600 mt-3",children:ue?"Composez ce code sur votre téléphone pour obtenir le code OTP, puis saisissez-le ci-dessous.":"Un code OTP vous a été envoyé. Saisissez-le ci-dessous."})]}),e.jsx("input",{type:"text",inputMode:"numeric",value:he,onChange:t=>qe(t.target.value),maxLength:8,placeholder:"Code OTP reçu par SMS",className:"deposit-step-otp w-full px-4 py-4 text-center text-2xl tracking-widest font-black text-gray-800 outline-none focus:border-[#D40030]"}),e.jsx("button",{onClick:()=>E.mutate(he),disabled:!he.trim()||E.isPending,className:"deposit-step-primary w-full py-5 disabled:opacity-40",style:{background:d},children:E.isPending?e.jsxs("span",{className:"flex items-center justify-center gap-2",children:[e.jsx(v,{className:"w-5 h-5 animate-spin"})," Vérification..."]}):"Valider le code OTP"})]})]}):c==="ashtech-redirect"?e.jsxs("div",{className:"deposit-step-shell flex flex-col",children:[e.jsx(f,{}),e.jsx("header",{className:"deposit-step-header",children:e.jsxs("button",{onClick:()=>n("ashtech-operator"),className:"deposit-step-back",children:[e.jsx(j,{className:"w-5 h-5"}),e.jsx("span",{children:"Finaliser le paiement"})]})}),e.jsxs("div",{className:"flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6",children:[e.jsx("div",{className:"deposit-step-icon",children:e.jsx(A,{className:"w-10 h-10 text-[#D40030]"})}),e.jsxs("div",{children:[e.jsx("p",{className:"font-bold text-gray-900 text-xl mb-2",children:"Finaliser avec Wave"}),e.jsxs("p",{className:"text-sm text-gray-500",children:["Ouvrez la page Wave pour confirmer votre dépôt de ",e.jsxs("strong",{children:[Number(o).toLocaleString()," ",x]}),"."]})]}),e.jsxs("a",{href:bt,target:"_blank",rel:"noopener noreferrer",onClick:()=>{V(!0),n("ashtech-waiting")},className:"deposit-step-primary w-full py-5 flex items-center justify-center gap-2",style:{background:d},children:[e.jsx(A,{className:"w-5 h-5"})," Ouvrir Wave"]})]})]}):c==="ashtech-waiting"?e.jsxs("div",{className:"deposit-step-shell flex flex-col",children:[e.jsx(f,{}),e.jsx("header",{className:"deposit-step-header",children:e.jsx("span",{className:"font-semibold text-base text-gray-800",children:"Paiement en cours"})}),e.jsxs("div",{className:"flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6",children:[e.jsx("div",{className:"deposit-step-icon",children:e.jsx(G,{className:"w-10 h-10 text-[#D40030] animate-spin",style:{animationDuration:"2s"}})}),e.jsxs("div",{children:[e.jsx("p",{className:"font-bold text-gray-900 text-xl",children:"En attente de confirmation"}),e.jsx("p",{className:"text-sm text-gray-500 mt-2",children:"Validez le paiement sur votre téléphone. Cette page se met à jour automatiquement."})]}),e.jsxs("div",{className:"flex gap-3 w-full",children:[e.jsx(O,{href:"/deposits-history?from=deposit",className:"flex-1",children:e.jsx("button",{className:"deposit-step-secondary w-full py-3 text-sm",children:"Voir l'historique"})}),e.jsx("button",{onClick:()=>{n("amount"),g(""),se(null),V(!1),re("")},className:"deposit-step-secondary flex-1 py-3 text-sm",children:"Nouvelle recharge"})]})]})]}):c==="soleaspay-waiting"?e.jsxs("div",{className:"deposit-step-shell flex flex-col",children:[e.jsx(f,{}),e.jsx("header",{className:"deposit-step-header",children:e.jsx("span",{className:"font-semibold text-base text-gray-800",children:"Paiement en cours"})}),e.jsxs("div",{className:"flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6",children:[e.jsx("div",{className:"deposit-step-icon",children:C==="approved"?e.jsx(Q,{className:"w-10 h-10 text-[#D40030]"}):e.jsx(G,{className:`w-10 h-10 ${C==="rejected"?"text-red-400":"text-[#D40030] animate-spin"}`})}),e.jsxs("div",{children:[e.jsx("p",{className:"font-bold text-gray-900 text-xl",children:C==="approved"?"Paiement confirmé !":C==="rejected"?"Paiement échoué":"En attente de confirmation"}),e.jsx("p",{className:"text-sm text-gray-500 mt-2",children:C==="approved"?`Votre solde a été crédité de ${Number(o).toLocaleString()} ${x}.`:C==="rejected"?"Le paiement a été refusé ou annulé.":ht||"Validez la demande de paiement sur votre téléphone. Cette page se met à jour automatiquement."}),F&&e.jsxs("p",{className:"text-xs text-gray-400 mt-2",children:["Référence dépôt : #",F]})]}),e.jsxs("div",{className:"flex gap-3 w-full",children:[C==="rejected"?e.jsx("button",{onClick:()=>{me(null),X(""),ee(!1),window.location.href=`/robotpay?amount=${encodeURIComponent(Number(o))}&country=${encodeURIComponent(p)}&provider=soleaspay`},className:"deposit-step-primary flex-1 py-3 text-sm",style:{background:d},children:"Réessayer"}):e.jsx(O,{href:"/deposits-history?from=deposit",className:"flex-1",children:e.jsx("button",{className:"deposit-step-secondary w-full py-3 text-sm",children:"Voir l'historique"})}),e.jsx("button",{onClick:()=>{n("amount"),g(""),me(null),X(""),ee(!1)},className:"deposit-step-secondary flex-1 py-3 text-sm",children:"Nouvelle recharge"})]})]})]}):c==="sv-operator"?e.jsxs("div",{className:"deposit-step-shell",children:[e.jsx(f,{}),e.jsxs("header",{className:"deposit-step-header",children:[e.jsxs("button",{className:"deposit-step-back",onClick:()=>n("amount"),children:[e.jsx(j,{className:"w-5 h-5"}),e.jsx("span",{className:"font-semibold text-base",children:"Top up"})]}),e.jsx(O,{href:"/deposits-history?from=deposit",children:e.jsx("button",{className:"deposit-step-history",children:"Historique"})})]}),e.jsxs("div",{className:"deposit-step-summary mx-4 mt-4 p-4 flex items-center justify-between",children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-xs text-gray-500",children:"Montant à déposer"}),e.jsxs("p",{className:"text-xl font-bold text-[#A60026]",children:[Number(o).toLocaleString()," ",x]})]}),e.jsx("button",{onClick:()=>n("amount"),className:"text-xs text-[#A60026] underline",children:"Modifier"})]}),e.jsxs("div",{className:"deposit-step-content space-y-4 pb-10",children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-sm font-semibold text-gray-800 mb-2",children:"Pays"}),e.jsx("select",{value:D,onChange:t=>{it(t.target.value),T(null)},className:"deposit-step-field w-full px-4 py-4 text-sm text-gray-700 outline-none appearance-none",children:W.map(t=>e.jsx("option",{value:t.code,children:t.name},t.code))})]}),e.jsxs("div",{children:[e.jsx("p",{className:"text-sm font-semibold text-gray-800 mb-2",children:"Numéro Mobile Money"}),e.jsxs("div",{className:"deposit-step-field flex items-center overflow-hidden",children:[e.jsx(oe,{className:"w-4 h-4 text-gray-400 ml-4 flex-shrink-0"}),e.jsx("input",{type:"tel",inputMode:"numeric",value:ce,onChange:t=>ct(t.target.value),placeholder:"Numéro sur lequel envoyer la demande",className:"flex-1 px-3 py-4 text-sm text-gray-700 outline-none bg-transparent"})]})]}),e.jsxs("div",{children:[e.jsx("p",{className:"text-sm font-semibold text-gray-800 mb-2",children:"Opérateur Mobile Money"}),Ct?e.jsx("div",{className:"flex items-center justify-center py-8",children:e.jsx(v,{className:"w-6 h-6 animate-spin text-[#D40030]"})}):Je.length===0?e.jsx("div",{className:"text-center py-8 text-gray-400",children:e.jsx("p",{className:"text-sm",children:"Aucun opérateur disponible pour ce pays"})}):e.jsx("div",{className:"space-y-2",children:Je.map(t=>{const s=Tt(t.name);return e.jsxs("button",{onClick:()=>T(t),className:`deposit-step-operator w-full flex items-center justify-between px-4 py-4 transition-all ${b?.id===t.id?"deposit-step-operator-selected":""}`,children:[e.jsxs("div",{className:"flex items-center gap-3",children:[s?e.jsx("img",{src:s,alt:t.name,className:"w-10 h-10 rounded-full object-cover border border-gray-100"}):e.jsx("div",{className:`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${b?.id===t.id?"bg-[#D40030] text-white":"bg-gray-100 text-gray-600"}`,children:t.name.charAt(0)}),e.jsxs("div",{className:"text-left",children:[e.jsx("p",{className:"font-semibold text-gray-900 text-sm",children:t.name}),t.requiresOtp&&e.jsx("p",{className:"text-xs text-[#A60026]",children:"Code OTP requis"})]})]}),b?.id===t.id&&e.jsx(Q,{className:"w-5 h-5 text-[#D40030]"})]},t.id)})})]}),e.jsx("button",{onClick:()=>ye.mutate(),disabled:!b||ye.isPending,className:"deposit-step-primary w-full py-5 disabled:opacity-40",style:{background:d},children:ye.isPending?e.jsxs("span",{className:"flex items-center justify-center gap-2",children:[e.jsx(v,{className:"w-5 h-5 animate-spin"})," Initiation en cours..."]}):e.jsxs("span",{className:"flex items-center justify-center gap-2",children:[e.jsx("img",{src:"/topup-icon.png",className:"w-6 h-6 object-contain",alt:"topup"})," Initier le paiement"]})})]})]}):c==="sv-otp"?e.jsxs("div",{className:"deposit-step-shell",children:[e.jsx(f,{}),e.jsx("header",{className:"deposit-step-header",children:e.jsxs("button",{onClick:()=>n("sv-operator"),className:"deposit-step-back",children:[e.jsx(j,{className:"w-5 h-5"}),e.jsx("span",{className:"font-semibold text-base",children:"Code OTP"})]})}),e.jsxs("div",{className:"deposit-step-content space-y-5 pb-10",children:[e.jsxs("div",{className:"deposit-step-card deposit-step-card-accent p-4",children:[e.jsxs("div",{className:"flex items-center gap-2 mb-3",children:[e.jsx("div",{className:"w-7 h-7 rounded-full bg-[#D40030] flex items-center justify-center flex-shrink-0",children:e.jsx("span",{className:"text-white font-bold text-xs",children:"1"})}),e.jsx("p",{className:"font-bold text-gray-900 text-sm",children:"Composez ce code sur votre téléphone"})]}),Te?e.jsxs("div",{className:"deposit-step-otp px-4 py-3 text-center",children:[e.jsx("p",{className:"font-mono font-black text-2xl text-[#A60026] tracking-widest",children:Te}),e.jsx("p",{className:"text-xs text-gray-400 mt-1",children:"Composez ce code USSD sur votre téléphone"})]}):e.jsxs("p",{className:"text-sm text-gray-600",children:["Composez le code USSD de votre opérateur (ex : ",e.jsx("span",{className:"font-mono font-bold text-[#A60026]",children:"*144#"}),") sur votre téléphone pour recevoir le code OTP par SMS."]})]}),e.jsxs("div",{className:"deposit-step-card deposit-step-card-accent p-4",children:[e.jsxs("div",{className:"flex items-center gap-2 mb-3",children:[e.jsx("div",{className:"w-7 h-7 rounded-full bg-[#D40030] flex items-center justify-center flex-shrink-0",children:e.jsx("span",{className:"text-white font-bold text-xs",children:"2"})}),e.jsx("p",{className:"font-bold text-gray-900 text-sm",children:"Entrez le code OTP reçu par SMS"})]}),e.jsxs("p",{className:"text-xs text-gray-500 mb-3",children:["Après avoir composé le code, vous recevrez un SMS avec un code OTP. Saisissez-le ci-dessous pour confirmer le paiement de ",e.jsxs("strong",{children:[Number(o).toLocaleString()," ",x]}),"."]}),e.jsx("input",{type:"text",inputMode:"numeric",value:pe,onChange:t=>xe(t.target.value),placeholder:"Code OTP reçu par SMS",className:"deposit-step-otp w-full px-4 py-4 text-center text-2xl tracking-widest font-black text-gray-800 outline-none focus:border-[#D40030]",maxLength:8})]}),e.jsx("button",{onClick:()=>ve.mutate(),disabled:!pe.trim()||ve.isPending,className:"deposit-step-primary w-full py-5 disabled:opacity-40",style:{background:d},children:ve.isPending?e.jsxs("span",{className:"flex items-center justify-center gap-2",children:[e.jsx(v,{className:"w-5 h-5 animate-spin"})," Vérification..."]}):"Valider le code OTP"})]})]}):c==="sv-redirect"?e.jsxs("div",{className:"deposit-step-shell flex flex-col",children:[e.jsx(f,{}),e.jsx("header",{className:"deposit-step-header",children:e.jsxs("button",{onClick:()=>n("sv-operator"),className:"deposit-step-back",children:[e.jsx(j,{className:"w-5 h-5"}),e.jsx("span",{className:"font-semibold text-base",children:"Finaliser le paiement"})]})}),e.jsxs("div",{className:"flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6",children:[e.jsx("div",{className:"deposit-step-icon",children:e.jsx(A,{className:"w-10 h-10 text-[#D40030]"})}),e.jsxs("div",{children:[e.jsx("p",{className:"font-bold text-gray-900 text-xl mb-2",children:"Finaliser sur l'application"}),e.jsxs("p",{className:"text-sm text-gray-500",children:["Appuyez sur le bouton ci-dessous pour ouvrir la page de paiement de l'opérateur et confirmer votre dépôt de ",e.jsxs("strong",{children:[Number(o).toLocaleString()," ",x]}),"."]})]}),e.jsxs("a",{href:xt,target:"_blank",rel:"noopener noreferrer",className:"deposit-step-primary w-full py-5 flex items-center justify-center gap-2",style:{background:d},onClick:()=>{y(!0),n("sv-waiting")},children:[e.jsx(A,{className:"w-5 h-5"})," Ouvrir la page de paiement"]})]})]}):c==="sv-waiting"?e.jsxs("div",{className:"deposit-step-shell flex flex-col",children:[e.jsx(f,{}),e.jsx("header",{className:"deposit-step-header",children:e.jsx("span",{className:"font-semibold text-base text-gray-800",children:"Paiement en cours"})}),e.jsx("div",{className:"flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6",children:$e==="approved"?e.jsxs(e.Fragment,{children:[e.jsx("div",{className:"deposit-step-icon",children:e.jsx(Q,{className:"w-10 h-10 text-[#D40030]"})}),e.jsxs("div",{children:[e.jsx("p",{className:"font-bold text-gray-900 text-xl",children:"Paiement confirmé !"}),e.jsxs("p",{className:"text-sm text-gray-500 mt-1",children:["Votre solde a été crédité de ",e.jsxs("strong",{children:[Number(o).toLocaleString()," ",x]})]})]})]}):$e==="rejected"?e.jsxs(e.Fragment,{children:[e.jsx("div",{className:"deposit-step-icon",children:e.jsx(G,{className:"w-10 h-10 text-red-400"})}),e.jsxs("div",{children:[e.jsx("p",{className:"font-bold text-gray-900 text-xl",children:"Paiement échoué"}),e.jsx("p",{className:"text-sm text-gray-500 mt-1",children:"Le paiement a été refusé ou annulé."})]}),e.jsxs("div",{className:"flex gap-3 w-full",children:[le&&e.jsxs("button",{onClick:()=>je.mutate(),disabled:je.isPending,className:"deposit-step-primary flex-1 py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-50",style:{background:d},children:[je.isPending?e.jsx(v,{className:"w-4 h-4 animate-spin"}):e.jsx(G,{className:"w-4 h-4"}),"Réessayer"]}),e.jsx("button",{onClick:()=>{n("amount"),g(""),T(null),J(null),Z(""),y(!1),$("")},className:"deposit-step-secondary flex-1 py-3 text-sm",children:"Nouvelle recharge"})]})]}):e.jsxs(e.Fragment,{children:[e.jsx("div",{className:"deposit-step-icon",children:e.jsx(G,{className:"w-10 h-10 text-[#D40030] animate-spin",style:{animationDuration:"2s"}})}),e.jsxs("div",{children:[e.jsx("p",{className:"font-bold text-gray-900 text-xl",children:"En attente de confirmation"}),e.jsxs("p",{className:"text-sm text-gray-500 mt-2",children:["Une demande de paiement de ",e.jsxs("strong",{children:[Number(o).toLocaleString()," ",x]})," a été envoyée sur votre téléphone.",e.jsx("br",{}),"Acceptez-la sur votre téléphone. Cette page se met à jour automatiquement."]})]}),e.jsxs("div",{className:"flex gap-3 w-full",children:[e.jsx(O,{href:"/deposits-history?from=deposit",className:"flex-1",children:e.jsx("button",{className:"deposit-step-secondary w-full py-3 text-sm",children:"Voir l'historique"})}),e.jsx("button",{onClick:()=>{n("amount"),g(""),T(null),J(null),Z(""),y(!1),$("")},className:"deposit-step-secondary flex-1 py-3 text-sm",children:"Nouvelle recharge"})]})]})})]}):null}export{Ss as default};
