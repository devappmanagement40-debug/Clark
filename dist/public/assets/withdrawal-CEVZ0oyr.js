import{a as B,b as K,$ as X,r as p,u as G,j as e,L as V,h as L,F as J}from"./index-C5w3jxiZ.js";import{u as m}from"./useQuery-B17Pt1LM.js";import{u as Z}from"./useMutation-Tonfmj46.js";import{g as ee}from"./countries-Dxa2RqvP.js";import{h as te,b as ae,c as ie,d as re,a as ne,i as de,e as u,f as oe}from"./platform-settings-BY9EySds.js";import{g as se}from"./navigation-targets-DT_bim_J.js";import{A as le}from"./arrow-left-CQ5jPpOW.js";import{I as we}from"./info-Dk-gLhbe.js";import{L as S}from"./loader-circle-DRGQ9IJU.js";import{C as pe}from"./credit-card-CrHhqBxC.js";const b=w=>w.toLocaleString("fr-FR");function je(){const{user:w,refreshUser:I}=B(),{toast:r}=K(),v=X(),[a,y]=p.useState(""),[n,k]=p.useState(null),[j,N]=p.useState(!1),[,c]=G(),D=se(window.location.search),z=(w?ee(w.country):null)?.currency||"XOF",d=z==="FCFA"?"XOF":z,{data:i}=m({queryKey:["/api/settings/withdrawal"],...J}),o=i?.minWithdrawal??te,A=i?.withdrawalFees??ae,h=i?.withdrawalStartHour??ie,x=i?.withdrawalEndHour??re,f=i?.withdrawalPrepaymentEnabled??!1,P=ne(i?.withdrawalPrepaymentRate,oe,1),F=i?.withdrawalProcessingText||de,_=a?Math.floor(Number(a)*(1-A/100)):0,M=F.split("{currency}").join(d).split("{amount}").join(b(_)),R=new Date().getHours(),C=R>=h&&R<x,{data:s=[],isLoading:H,isError:E,refetch:U}=m({queryKey:["/api/wallets"],refetchOnWindowFocus:!0}),{data:O}=m({queryKey:["/api/withdrawals/available"],enabled:!!w,staleTime:0,refetchOnMount:!0});p.useEffect(()=>{const t=localStorage.getItem("selectedWalletId");if(t&&s.length>0){const l=s.find(Q=>Q.id===parseInt(t,10));l&&k(l),localStorage.removeItem("selectedWalletId")}},[s]),p.useEffect(()=>{if(!n&&s.length>0){const t=s.find(l=>l.isDefault);t&&k(t)}},[s,n]);const g=Z({mutationFn:async t=>(await L("POST","/api/withdrawals",t)).json(),onSuccess:()=>{r({title:"Demande envoyée",description:"Votre demande de retrait a été envoyée."}),I(),v.invalidateQueries({queryKey:["/api/withdrawals"]}),v.invalidateQueries({queryKey:["/api/withdrawals/available"]}),y("")},onError:t=>{if(t.data?.code==="WITHDRAWAL_PREPAYMENT_REQUIRED"&&t.data.paymentUrl){c(t.data.paymentUrl);return}r({title:"Retrait impossible",description:t.message,variant:"destructive"})}}),T=f&&a?Math.max(1,Math.round(Number(a)*P/100)):0,q=async()=>{if(f){if(!a||Number(a)<o){r({title:"Montant invalide",description:`Le montant minimum est de ${o} ${d}`,variant:"destructive"});return}N(!0);try{const l=await(await L("POST","/api/withdrawal-fee/prepare",{amount:Number(a)})).json();c(l.paymentUrl)}catch(t){r({title:"Paiement indisponible",description:t.message,variant:"destructive"})}finally{N(!1)}}},$=()=>{if(!C){r({title:"Retrait indisponible",description:`Horaires de retrait : de ${h}h à ${x}h.`,variant:"destructive"});return}if(!a||a<o){r({title:"Montant invalide",description:`Le montant minimum est de ${o} ${d}`,variant:"destructive"});return}if(!n){r({title:"Compte requis",description:"Veuillez sélectionner un compte bancaire",variant:"destructive"});return}g.mutate({amount:Number(a),walletId:n.id})};if(!w)return null;const Y=parseFloat(O?.availableBalance||"0"),W=s.length>0;return e.jsxs("main",{className:"withdraw-page",children:[e.jsx("style",{children:`
        .withdraw-page {
          --wd-ink: #17253e;
          --wd-blue: #1947b8;
          --wd-blue-dark: #12358f;
          --wd-blue-deep: #12358f;
          --wd-blue-pale: #edf2ff;
          --wd-paper: #ffffff;
          --wd-muted: #66748a;
          --wd-line: #dce5f4;
          --wd-blue-bright: #1947b8;
          min-height: 100dvh;
          padding: 0 0 calc(24px + env(safe-area-inset-bottom));
          position: relative;
          isolation: isolate;
          background: transparent;
          color: var(--wd-ink);
          font-family: var(--font-sans, "DM Sans", sans-serif);
        }
        .withdraw-page::before {
          position: fixed;
          z-index: 0;
          inset: 0;
          background: none;
          content: "";
          pointer-events: none;
        }
        .withdraw-page *,
        .withdraw-page *::before,
        .withdraw-page *::after { box-sizing: border-box; }
        .withdraw-shell {
          position: relative;
          z-index: 1;
          width: min(100%, 540px);
          min-height: 100dvh;
          margin: 0 auto;
          padding-bottom: 26px;
          background: transparent;
        }
        .withdraw-header {
          position: relative;
          display: flex;
          min-height: 68px;
          align-items: center;
          justify-content: center;
          padding: 12px 66px;
          border-bottom: 1px solid #e4eaf3;
          background: #ffffff;
          color: var(--wd-ink);
        }
        .withdraw-title {
          margin: 0;
          color: var(--wd-ink);
          font-size: 19px;
          font-weight: 750;
          letter-spacing: -.02em;
        }
        .withdraw-icon-link {
          position: absolute;
          top: 13px;
          display: grid;
          width: 42px;
          height: 42px;
          place-items: center;
          border: 1px solid #dce5f2;
          border-radius: 14px;
          background: #f7f9fd;
          color: var(--wd-blue);
          text-decoration: none;
          transition: background .18s ease, transform .18s ease;
        }
        .withdraw-icon-link:hover { background: #edf2ff; }
        .withdraw-icon-link:active { transform: translateY(1px); }
        .withdraw-back-link { left: 16px; }
        .withdraw-history-link { right: 16px; }
        .withdraw-history-icon {
          display: block;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          object-fit: cover;
        }
        .withdraw-hero {
          position: relative;
          display: grid;
          grid-template-columns: minmax(0, 1fr) 108px;
          align-items: center;
          gap: 10px;
          min-height: 190px;
          overflow: hidden;
          margin: 12px 16px 0;
          border: 2px solid #17191c;
          border-radius: 16px;
          padding: 23px 20px 26px;
          background: #fff;
          box-shadow: 0 3px 0 #17191c, 0 8px 18px rgba(17,24,39,.16);
          color: var(--wd-ink);
        }
        .withdraw-balance-copy { position: relative; z-index: 1; }
        .withdraw-eyebrow {
          margin: 0 0 8px;
          color: #607293;
          font-size: 11px;
          font-weight: 750;
          letter-spacing: .11em;
          text-transform: uppercase;
        }
        .withdraw-balance {
          margin: 0;
          color: #17253e;
          font-family: var(--font-mono, "Space Mono", monospace);
          font-size: clamp(25px, 7vw, 34px);
          font-weight: 700;
          letter-spacing: -.055em;
          line-height: 1.1;
          font-variant-numeric: tabular-nums;
        }
        .withdraw-balance-caption {
          margin: 9px 0 0;
          color: #64748b;
          font-size: 12px;
          line-height: 1.45;
        }
        .withdraw-hero-icon {
          display: block;
          width: 82px;
          height: 82px;
          justify-self: end;
          object-fit: contain;
        }
        .withdraw-content { padding: 18px 16px 0; }
        .withdraw-card {
          border: 2px solid #17191c;
          border-radius: 16px;
          background: #fff;
          box-shadow: 0 3px 0 #17191c, 0 8px 18px rgba(17,24,39,.16);
        }
        .withdraw-form-card {
          padding: 20px 18px 19px;
          border-radius: 20px;
        }
        .withdraw-section-kicker {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0 0 11px;
          color: var(--wd-ink);
          font-size: 14px;
          font-weight: 750;
        }
        .withdraw-section-kicker svg { color: var(--wd-blue); }
        .withdraw-amount-field {
          display: flex;
          min-height: 58px;
          align-items: center;
          gap: 12px;
          border: 1.5px solid #17191c;
          border-radius: 999px;
          padding: 0 18px;
          background: #ffffff;
          transition: border-color .16s ease, box-shadow .16s ease;
        }
        .withdraw-amount-field:focus-within {
          border-color: var(--wd-blue);
          box-shadow: 0 0 0 3px rgba(25,71,184,.12);
        }
        .withdraw-currency {
          flex: none;
          color: var(--wd-blue-dark);
          font-size: 15px;
          font-weight: 800;
        }
        .withdraw-amount-field input {
          width: 100%;
          min-width: 0;
          height: 56px;
          border: 0;
          outline: 0;
          background: transparent;
          color: var(--wd-ink);
          font-size: 15px;
          font-weight: 600;
        }
        .withdraw-amount-field input::placeholder { color: #8a98ac; font-weight: 450; opacity: 1; }
        .withdraw-amount-field input::-webkit-inner-spin-button,
        .withdraw-amount-field input::-webkit-outer-spin-button { margin: 0; appearance: none; }
        .withdraw-amount-field input[type=number] { appearance: textfield; }
        .withdraw-amount-meta {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          gap: 6px 12px;
          margin: 10px 2px 20px;
          color: var(--wd-muted);
          font-size: 12px;
        }
        .withdraw-amount-meta strong { color: var(--wd-ink); font-weight: 750; }
        .withdraw-net-amount { color: var(--wd-blue-bright); }
        .withdraw-wallet-label {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          margin: 0 0 9px;
          color: var(--wd-ink);
          font-size: 14px;
          font-weight: 750;
        }
        .withdraw-wallet-label span:last-child {
          color: var(--wd-muted);
          font-size: 11px;
          font-weight: 600;
        }
        .withdraw-wallet-choice {
          display: flex;
          width: 100%;
          min-height: 68px;
          align-items: center;
          gap: 12px;
          border: 1.5px solid #17191c;
          border-radius: 15px;
          padding: 11px 12px;
          background: #fff;
          color: var(--wd-ink);
          box-shadow: 0 2px 0 #17191c, 0 4px 9px rgba(17,24,39,.11);
          text-align: left;
          cursor: pointer;
          transition: border-color .16s ease, background .16s ease, transform .16s ease;
        }
        .withdraw-wallet-choice:hover { border-color: #17191c; background: #f3f6ff; }
        .withdraw-wallet-choice:active { transform: translateY(1px); }
        .withdraw-wallet-icon {
          display: grid;
          width: 42px;
          height: 42px;
          flex: none;
          place-items: center;
          border-radius: 13px;
          background: #eaf0ff;
          color: #1947b8;
        }
        .withdraw-wallet-copy { min-width: 0; flex: 1; }
        .withdraw-wallet-name {
          display: block;
          overflow: hidden;
          color: var(--wd-ink);
          font-size: 13px;
          font-weight: 750;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .withdraw-wallet-description {
          display: block;
          overflow: hidden;
          margin-top: 4px;
          color: var(--wd-muted);
          font-size: 11px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .withdraw-wallet-choice > svg:last-child { flex: none; color: #71819c; }
        .withdraw-submit {
          display: flex;
          width: 100%;
          min-height: 56px;
          align-items: center;
          justify-content: center;
          gap: 9px;
          margin-top: 19px;
          border: 0;
          border-radius: 999px;
          padding: 0 18px;
          background: linear-gradient(105deg, var(--wd-blue), #2460c8);
          box-shadow: 0 7px 15px rgba(25,71,184,.2);
          color: white;
          font-size: 15px;
          font-weight: 750;
          cursor: pointer;
          transition: transform .16s ease, opacity .16s ease, box-shadow .16s ease;
        }
        .withdraw-submit:hover:not(:disabled) { box-shadow: 0 9px 19px rgba(25,71,184,.26); }
        .withdraw-submit:active:not(:disabled) { transform: translateY(1px); }
        .withdraw-submit:disabled { opacity: .58; cursor: not-allowed; }
        .withdraw-fee-notice {
          display: grid;
          gap: 8px;
          margin-top: 14px;
          border: 1.5px solid #17191c;
          border-radius: 15px;
          padding: 14px;
          background: #edf2ff;
          box-shadow: 0 2px 0 #17191c, 0 4px 9px rgba(17,24,39,.1);
          color: var(--wd-muted);
          font-size: 12px;
          line-height: 1.5;
        }
        .withdraw-fee-title { display: flex; align-items: center; gap: 7px; color: var(--wd-ink); font-weight: 750; }
        .withdraw-fee-title svg { color: var(--wd-blue); }
        .withdraw-pay-fee {
          display: inline-flex;
          min-height: 40px;
          align-items: center;
          justify-content: center;
          gap: 7px;
          border: 1px solid #c2d3ef;
          border-radius: 11px;
          background: #eaf1ff;
          color: var(--wd-blue-dark);
          font-size: 13px;
          font-weight: 750;
          cursor: pointer;
        }
        .withdraw-pay-fee:disabled { opacity: .5; cursor: not-allowed; }
        .withdraw-instructions {
          margin-top: 14px;
          padding: 19px 18px 17px;
          border-top: 2px solid #17191c;
          border-radius: 16px;
        }
        .withdraw-instructions-heading {
          display: flex;
          align-items: center;
          gap: 9px;
          margin: 0 0 4px;
          color: var(--wd-ink);
          font-size: 16px;
          font-weight: 800;
          letter-spacing: -.02em;
        }
        .withdraw-instructions-heading svg { color: var(--wd-blue); }
        .withdraw-instructions-intro {
          margin: 0 0 12px;
          color: var(--wd-muted);
          font-size: 12px;
          line-height: 1.5;
        }
        .withdraw-rule-list { display: grid; margin: 0; padding: 0; list-style: none; }
        .withdraw-rule {
          display: flex;
          justify-content: space-between;
          gap: 14px;
          padding: 11px 0;
          border-top: 1px solid #e8edf5;
          color: var(--wd-muted);
          font-size: 12px;
          line-height: 1.4;
        }
        .withdraw-rule strong { color: var(--wd-blue-bright); font-weight: 750; text-align: right; }
        .withdraw-rule-detail { display: grid; gap: 4px; }
        .withdraw-rule-detail strong { text-align: left; }
        .withdraw-loading {
          display: grid;
          position: relative;
          z-index: 1;
          min-height: 100dvh;
          place-items: start center;
          padding: 16px;
          background: transparent;
        }
        .withdraw-skeleton {
          width: min(100%, 480px);
          display: grid;
          gap: 13px;
          padding-top: 12px;
        }
        .withdraw-skeleton-bar {
          height: 68px;
          border-radius: 17px;
          background: linear-gradient(90deg, #e8eef8 25%, #f5f8fd 42%, #e8eef8 65%);
          background-size: 300% 100%;
          animation: withdraw-shimmer 1.6s ease infinite;
        }
        .withdraw-skeleton-bar--hero { height: 185px; border-radius: 0 0 22px 22px; }
        .withdraw-skeleton-bar--tall { height: 300px; }
        @keyframes withdraw-shimmer { to { background-position: -150% 0; } }
        .withdraw-error {
          display: grid;
          justify-items: center;
          gap: 10px;
          padding: 25px 18px;
          color: var(--wd-muted);
          font-size: 13px;
          text-align: center;
        }
        .withdraw-retry {
          border: 0;
          border-radius: 10px;
          padding: 9px 14px;
          background: var(--wd-blue);
          color: white;
          font-weight: 700;
          cursor: pointer;
        }
        @media (min-width: 700px) {
          .withdraw-page { padding-top: 22px; padding-bottom: 40px; }
          .withdraw-shell {
            min-height: 0;
            overflow: hidden;
            border: 0;
            border-radius: 0;
            background: transparent;
            box-shadow: none;
          }
          .withdraw-header { min-height: 70px; }
        }
        @media (max-width: 360px) {
          .withdraw-hero { grid-template-columns: minmax(0, 1fr) 76px; min-height: 184px; padding-right: 16px; padding-left: 16px; }
          .withdraw-hero-icon { width: 62px; height: 62px; }
          .withdraw-content { padding-right: 12px; padding-left: 12px; }
          .withdraw-form-card, .withdraw-instructions { padding-right: 14px; padding-left: 14px; }
          .withdraw-rule { font-size: 11px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .withdraw-page *, .withdraw-page *::before, .withdraw-page *::after { animation-duration: .01ms !important; transition-duration: .01ms !important; }
        }

        /* The withdrawal screen follows the supplied light, navy-blue reference. */
        .withdraw-page {
          --wd-ink: #202124;
          --wd-blue: #00317d;
          --wd-blue-dark: #00317d;
          --wd-blue-deep: #00317d;
          --wd-blue-pale: #f1f3fa;
          --wd-paper: #ffffff;
          --wd-muted: #60646c;
          --wd-line: #e9ebf0;
          --wd-blue-bright: #00317d;
          min-height: 100dvh;
          padding: 0 0 calc(88px + env(safe-area-inset-bottom));
          background-image: none;
          background: #f1f1fa;
          color: var(--wd-ink);
          font-family: Roboto, Arial, sans-serif;
        }
        .withdraw-page::before { display: none; }
        .withdraw-shell {
          width: min(100%, 540px);
          min-height: 100dvh;
          padding-bottom: 0;
          background: transparent;
        }
        .withdraw-header {
          position: sticky;
          top: 0;
          z-index: 20;
          min-height: 48px;
          padding: 0 54px;
          border: 0;
          background: #00317d;
          color: #fff;
        }
        .withdraw-title {
          color: #fff;
          font-size: 18px;
          font-weight: 700;
          letter-spacing: 0;
        }
        .withdraw-icon-link {
          top: 2px;
          width: 42px;
          height: 44px;
          border: 0;
          border-radius: 0;
          background: transparent;
          color: #fff;
        }
        .withdraw-icon-link:hover { background: transparent; }
        .withdraw-back-link { left: 6px; }
        .withdraw-content {
          display: grid;
          gap: 18px;
          padding: 18px 16px 18px;
        }
        .withdraw-card {
          border: 1px solid #dce2ec;
          border-radius: 12px;
          background: #fff;
          box-shadow: 0 2px 5px rgb(25 44 78 / 7%);
        }
        .withdraw-form-card {
          padding: 36px 18px 16px;
          border-radius: 12px;
        }
        .withdraw-section-kicker {
          display: block;
          margin: 0 0 21px;
          color: #25272b;
          font-size: 16px;
          font-weight: 400;
        }
        .withdraw-amount-field {
          min-height: 54px;
          gap: 10px;
          border: 1px solid #d4dce9;
          border-radius: 7px;
          padding: 0 12px;
          background: #f1f3f8;
          box-shadow: none;
        }
        .withdraw-amount-field:focus-within {
          border: 2px solid #00317d;
          box-shadow: none;
        }
        .withdraw-currency {
          color: #00317d;
          font-size: 16px;
          font-weight: 700;
        }
        .withdraw-amount-field input {
          height: 54px;
          color: #1e3454;
          font-family: inherit;
          font-size: 19px;
          font-weight: 700;
        }
        .withdraw-amount-field input::placeholder {
          color: #7d8188;
          font-size: 18px;
          font-weight: 700;
        }
        .withdraw-balance-line {
          display: flex;
          align-items: center;
          gap: 7px;
          margin: 25px 0 18px;
          color: #383b40;
          font-size: 14px;
        }
        .withdraw-balance-line strong {
          color: #30343a;
          font-weight: 400;
        }
        .withdraw-fee-notice {
          display: block;
          margin: 0;
          border: 3px solid #00317d;
          border-radius: 12px;
          padding: 12px 11px 11px;
          background: #f2f5fa;
          box-shadow: none;
          color: #555b63;
          font-size: 13px;
          line-height: 1.55;
        }
        .withdraw-fee-notice .withdraw-fee-title {
          display: block;
          color: #00317d;
          font-size: 19px;
          font-weight: 700;
        }
        .withdraw-fee-divider {
          margin: 11px 0 10px;
          border-top: 2px dashed #173e75;
        }
        .withdraw-fee-notice p { margin: 0; }
        .withdraw-prepayment {
          display: grid;
          gap: 8px;
          margin-top: 12px;
          color: var(--wd-muted);
          font-size: 12px;
          line-height: 1.5;
        }
        .withdraw-submit {
          min-height: 54px;
          margin-top: 16px;
          border-radius: 999px;
          padding: 0 18px;
          border: 1px solid #092e6b;
          background: linear-gradient(105deg, #0a3478 0%, #45699d 100%);
          box-shadow: 0 4px 8px rgb(19 49 99 / 22%);
          color: #fff;
          font-family: inherit;
          font-size: 17px;
          font-weight: 700;
          letter-spacing: .02em;
        }
        .withdraw-submit:hover:not(:disabled) {
          background: linear-gradient(105deg, #0a3478 0%, #45699d 100%);
          box-shadow: 0 4px 8px rgb(19 49 99 / 22%);
        }
        .withdraw-wallet-card {
          border-radius: 12px;
          padding: 16px 18px 17px;
          border: 1px solid #dce2ec;
          background: #fff;
          box-shadow: 0 2px 5px rgb(25 44 78 / 7%);
        }
        .withdraw-wallet-row {
          display: grid;
          min-height: 42px;
          grid-template-columns: 40% minmax(0, 1fr);
          align-items: center;
          gap: 10px;
          border-bottom: 1px solid #e3e7ee;
          color: #27292d;
          font-size: 14px;
        }
        .withdraw-wallet-row strong {
          overflow: hidden;
          color: #26282c;
          font-weight: 400;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .withdraw-wallet-row:nth-last-child(2) { border-bottom: 0; }
        .withdraw-no-wallet {
          margin: 0;
          color: #60646c;
          font-size: 14px;
          line-height: 1.45;
        }
        .withdraw-wallet-bind {
          display: flex;
          width: 100%;
          min-height: 53px;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-top: 10px;
          border: 1px solid #092e6b;
          border-radius: 12px;
          background: linear-gradient(105deg, #0a3478 0%, #45699d 100%);
          box-shadow: 0 4px 8px rgb(19 49 99 / 22%);
          color: #fff;
          font: inherit;
          font-size: 18px;
          font-weight: 500;
          cursor: pointer;
        }
        .withdraw-wallet-bind:hover {
          background: linear-gradient(105deg, #082e6c 0%, #3c5f93 100%);
        }
        .withdraw-wallet-bind:active {
          background: linear-gradient(105deg, #082e6c 0%, #3c5f93 100%);
          box-shadow: 0 2px 5px rgb(19 49 99 / 24%);
        }
        .withdraw-wallet-error {
          display: grid;
          justify-items: start;
          gap: 10px;
          color: #5d626a;
          font-size: 14px;
        }
        .withdraw-wallet-error button {
          border: 0;
          border-radius: 8px;
          padding: 8px 12px;
          background: #00317d;
          color: #fff;
          font: inherit;
          cursor: pointer;
        }
        .withdraw-notices { display: grid; gap: 14px; }
        .withdraw-notice {
          margin: 0;
          border: 1px solid #dce2ec;
          border-left: 3px solid #00317d;
          padding: 12px 14px 12px 16px;
          background: #f4f5fa;
          color: #294363;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 15px;
          line-height: 1.45;
        }
        .withdraw-submit:focus-visible,
        .withdraw-wallet-bind:focus-visible,
        .withdraw-back-link:focus-visible {
          outline: 2px solid #00317d;
          outline-offset: 2px;
          box-shadow: none;
        }
        @media (min-width: 700px) {
          .withdraw-page { padding-top: 0; }
          .withdraw-shell { min-height: 100dvh; }
          .withdraw-header { min-height: 48px; }
        }
        @media (max-width: 360px) {
          .withdraw-content { padding-right: 12px; padding-left: 12px; }
          .withdraw-form-card, .withdraw-wallet-card { padding-right: 14px; padding-left: 14px; }
        }
      `}),H?e.jsx("div",{className:"withdraw-loading","aria-label":"Chargement",children:e.jsxs("div",{className:"withdraw-skeleton","aria-hidden":"true",children:[e.jsx("div",{className:"withdraw-skeleton-bar withdraw-skeleton-bar--hero"}),e.jsx("div",{className:"withdraw-skeleton-bar withdraw-skeleton-bar--tall"})]})}):e.jsxs("div",{className:"withdraw-shell",children:[e.jsxs("header",{className:"withdraw-header",children:[e.jsx(V,{href:D,className:"withdraw-icon-link withdraw-back-link","data-testid":"button-back","aria-label":"Retour",children:e.jsx(le,{size:20,"aria-hidden":"true"})}),e.jsx("h1",{className:"withdraw-title",children:"Retrait"})]}),e.jsxs("div",{className:"withdraw-content",children:[e.jsxs("section",{className:"withdraw-card withdraw-form-card","aria-label":"Demande de retrait",children:[e.jsx("label",{className:"withdraw-section-kicker",htmlFor:"withdrawal-amount",children:"Montant"}),e.jsxs("div",{className:"withdraw-amount-field",children:[e.jsx("span",{className:"withdraw-currency",children:d}),e.jsx("input",{id:"withdrawal-amount",type:"number",min:o,value:a,onChange:t=>y(t.target.value?Number(t.target.value):""),placeholder:"Saisissez le montant","data-testid":"input-withdrawal-amount","aria-label":"Montant de retrait"})]}),e.jsxs("div",{className:"withdraw-balance-line",children:[e.jsx("span",{children:"Solde retirable :"}),e.jsx("strong",{className:"withdraw-currency-symbol",children:d}),e.jsx("span",{"data-testid":"text-balance",children:b(Math.round(Y))})]}),e.jsxs("div",{className:"withdraw-fee-notice",children:[e.jsxs("strong",{className:"withdraw-fee-title",children:["Frais : ",A,"%"]}),e.jsx("div",{className:"withdraw-fee-divider"}),e.jsx("p",{children:M})]}),f&&e.jsxs("div",{className:"withdraw-prepayment",children:[e.jsxs("div",{className:"withdraw-fee-title",children:[e.jsx(we,{size:16,"aria-hidden":"true"})," Paiement requis avant le retrait"]}),e.jsxs("span",{children:["Vous devez payer ",P," % du montant du retrait",T>0?`, soit ${T.toLocaleString("fr-FR")} ${d}`:""," avant le lancement de votre demande."]}),e.jsx("button",{type:"button",onClick:q,disabled:j||!a||Number(a)<o,className:"withdraw-pay-fee","data-testid":"button-pay-withdrawal-prepayment",children:j?e.jsx(S,{size:16,className:"animate-spin"}):"Payer les frais"})]}),e.jsx("button",{type:"button",onClick:$,disabled:g.isPending,className:"withdraw-submit","data-testid":"button-submit-withdrawal",children:g.isPending?e.jsx(S,{size:18,className:"animate-spin"}):`Retirer ${a?b(Number(a)):"0"}`})]}),e.jsxs("section",{className:"withdraw-wallet-card","aria-label":"Compte de retrait",children:[E?e.jsxs("div",{className:"withdraw-wallet-error",role:"alert",children:[e.jsx("span",{children:"Impossible de charger vos comptes enregistrés."}),e.jsx("button",{type:"button",onClick:()=>U(),children:"Réessayer"})]}):W?e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"withdraw-wallet-row",children:[e.jsx("span",{children:"Nom réel"}),e.jsx("strong",{children:n?.accountName||"—"})]}),e.jsxs("div",{className:"withdraw-wallet-row",children:[e.jsx("span",{children:"Portefeuille"}),e.jsx("strong",{children:n?.paymentMethod||"—"})]}),e.jsxs("div",{className:"withdraw-wallet-row",children:[e.jsx("span",{children:"Compte du portefeuille"}),e.jsx("strong",{children:n?.accountNumber||"—"})]})]}):e.jsx("p",{className:"withdraw-no-wallet",children:"Aucun compte de retrait lié."}),!E&&e.jsxs("button",{type:"button",onClick:()=>c("/bind-wallet?from=withdrawal"),className:"withdraw-wallet-bind","data-testid":"button-select-wallet",children:[e.jsx(pe,{size:17,"aria-hidden":"true"}),W?"Ajouter un autre compte":"Ajouter un compte"]})]}),e.jsxs("section",{className:"withdraw-notices","aria-label":"Informations de retrait",children:[e.jsxs("p",{className:"withdraw-notice",children:["Montant minimum de retrait : ",o.toLocaleString("fr-FR")," ",d]}),e.jsxs("p",{className:"withdraw-notice",children:["Horaires de retrait : de ",h,"h à ",x,"h"]}),i?.maxWithdrawalsPerDay??u?e.jsxs("p",{className:"withdraw-notice",children:["Limite quotidienne : ",i?.maxWithdrawalsPerDay??u," demande",(i?.maxWithdrawalsPerDay??u)>1?"s":""," maximum"]}):null,e.jsx("p",{className:"withdraw-notice",children:"Avant de confirmer, vérifiez le nom du titulaire et le numéro du portefeuille."}),e.jsx("p",{className:"withdraw-notice",children:"Après l’envoi, suivez l’état de votre demande dans l’historique des retraits."})]})]})]})]})}export{je as default};
