import{d as N,a as C,b as z,u as S,r as n,j as e,D as x,e as m,l as R,f as h,g as L,h as O}from"./index-DbkvBmZs.js";import{u as D}from"./useMutation-B1_c45vi.js";import{g as F}from"./countries-Dxa2RqvP.js";import{A}from"./arrow-left-CfxUb9o5.js";import{L as E}from"./loader-circle-BQBidv5D.js";const M=N("Coins",[["circle",{cx:"8",cy:"8",r:"6",key:"3yglwk"}],["path",{d:"M18.09 10.37A6 6 0 1 1 10.34 18",key:"t5s6rm"}],["path",{d:"M7 6h1v4",key:"1obek4"}],["path",{d:"m16.71 13.88.7.71-2.82 2.82",key:"1rbuyh"}]]),b="/assets/tbox1.30c08f03_1794378979582-BzeAJR_R.png";function q(){const{user:w,refreshUser:v}=C(),{toast:d}=z(),[,l]=S(),[c,g]=n.useState(""),[y,r]=n.useState(!1),[o,i]=n.useState(null),f=F(w?.country||"")?.currency||"XOF",k=t=>`${Math.round(t).toLocaleString("fr-FR")} ${f==="FCFA"?"XOF":f}`,s=D({mutationFn:async t=>{const a=await O("POST","/api/gift-codes/claim",{code:t}),p=await a.json();if(!a.ok)throw new Error(p.message||"Le code cadeau n'a pas pu être validé.");const u=Number(p.amount);if(!Number.isFinite(u))throw new Error("La récompense du code n'a pas pu être lue.");return{amount:u}},onSuccess:t=>{v(),g(""),r(!1),i(t)},onError:t=>{d({title:"Ouverture du coffre impossible",description:t instanceof Error?t.message:"Le code cadeau n'a pas pu être validé.",variant:"destructive"})}}),j=t=>{t.preventDefault();const a=c.trim().toUpperCase();if(!a){d({title:"Code requis",description:"Saisissez le code du coffre pour continuer.",variant:"destructive"});return}s.mutate(a)};return e.jsxs("main",{className:"gift-treasure-page",children:[e.jsx("style",{children:`
        .gift-treasure-page {
          position: relative;
          width: 100%;
          min-height: 100dvh;
          overflow: hidden;
          isolation: isolate;
          color: #f7f4ec;
          background:
            radial-gradient(ellipse at 50% 48%, rgba(35, 79, 151, .92) 0%, rgba(21, 53, 111, .68) 28%, transparent 67%),
            linear-gradient(145deg, #173c79 0%, #102f68 45%, #0a2048 100%);
          font-family: "DM Sans", "Avenir Next", sans-serif;
        }
        .gift-treasure-page::before {
          position: absolute;
          inset: 0;
          z-index: 0;
          content: "";
          pointer-events: none;
          background:
            radial-gradient(ellipse at 50% 48%, transparent 15%, rgba(4, 15, 39, .12) 52%, rgba(3, 13, 35, .58) 100%),
            linear-gradient(115deg, rgba(255,255,255,.045), transparent 38%, rgba(4,17,46,.2));
        }
        .gift-treasure-page::after {
          position: absolute;
          z-index: 0;
          inset: -45%;
          content: "";
          pointer-events: none;
          background: repeating-conic-gradient(
            from -5deg at 50% 50%,
            rgba(242, 202, 111, .15) 0deg 2deg,
            rgba(101, 145, 214, .10) 2deg 4deg,
            transparent 4deg 10deg,
            rgba(215, 228, 250, .09) 10deg 11deg,
            transparent 11deg 15deg
          );
          -webkit-mask-image: radial-gradient(ellipse at center, transparent 0%, transparent 7%, rgba(0,0,0,.4) 18%, #000 44%, transparent 78%);
          mask-image: radial-gradient(ellipse at center, transparent 0%, transparent 7%, rgba(0,0,0,.4) 18%, #000 44%, transparent 78%);
          transform-origin: center;
          animation: gift-rays-rotate 28s linear infinite;
        }
        .gift-treasure-page * { box-sizing: border-box; }
        .gift-treasure-screen {
          position: relative;
          z-index: 1;
          display: flex;
          min-height: 100dvh;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: max(72px, calc(env(safe-area-inset-top) + 62px)) 20px max(32px, env(safe-area-inset-bottom));
        }
        .gift-treasure-back {
          position: absolute;
          top: max(18px, env(safe-area-inset-top));
          left: max(18px, env(safe-area-inset-left));
          display: grid;
          width: 50px;
          height: 50px;
          place-items: center;
          border: 2px solid #f2c55e;
          border-radius: 14px;
          background: linear-gradient(145deg, #28589f 0%, #123d83 55%, #0a2b66 100%);
          color: #fff;
          cursor: pointer;
          box-shadow: 0 5px 14px rgba(1, 11, 31, .4), inset 0 1px 0 rgba(255, 255, 255, .2);
          transition: background .2s ease, box-shadow .2s ease, transform .2s ease;
        }
        .gift-treasure-back:hover {
          background: linear-gradient(145deg, #3568b4 0%, #17498f 55%, #103878 100%);
          box-shadow: 0 7px 18px rgba(1, 11, 31, .48), inset 0 1px 0 rgba(255, 255, 255, .25);
          transform: translateX(-2px);
        }
        .gift-treasure-back:active { transform: translateX(-2px) scale(.96); }
        .gift-treasure-back:focus-visible {
          outline: 3px solid #f2c55e;
          outline-offset: 3px;
        }
        .gift-treasure-heading {
          position: absolute;
          top: max(25px, env(safe-area-inset-top));
          left: 76px;
          right: 76px;
          margin: 0;
          color: #fff8e7;
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(19px, 4vw, 25px);
          font-weight: 700;
          letter-spacing: .025em;
          text-align: center;
          text-shadow: 0 2px 14px rgba(1, 12, 34, .55);
        }
        .gift-treasure-chest {
          display: grid;
          width: min(76vw, 390px);
          aspect-ratio: 1;
          place-items: center;
          margin: 16px 0 0;
          border: 0;
          border-radius: 0;
          padding: 0;
          background: transparent;
          cursor: pointer;
          animation: gift-chest-float 3s ease-in-out infinite;
          filter: drop-shadow(0 22px 28px rgba(1, 11, 31, .42));
          -webkit-tap-highlight-color: transparent;
          transition: filter .2s ease;
        }
        .gift-treasure-chest:hover {
          filter: drop-shadow(0 24px 32px rgba(1, 11, 31, .5));
        }
        .gift-treasure-chest img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          transform: scale(.88);
          mix-blend-mode: multiply;
        }
        .gift-treasure-chest:focus-visible {
          outline: 3px solid #f2c55e;
          outline-offset: 7px;
        }
        .gift-treasure-dialog {
          width: min(400px, calc(100vw - 32px));
          max-width: 400px;
          gap: 0;
          overflow: visible;
          border: 1px solid rgba(220, 174, 79, .65);
          border-radius: 17px;
          padding: 0;
          background: #fffdf8;
          color: #18345e;
          box-shadow: 0 24px 72px rgba(1, 12, 34, .48), 0 0 0 5px rgba(241, 197, 91, .10);
        }
        .gift-treasure-dialog > button:last-of-type {
          top: -11px;
          right: -11px;
          display: grid;
          width: 40px;
          height: 40px;
          place-items: center;
          border: 2px solid #fffdf8;
          border-radius: 50%;
          background: #c9363f;
          color: white;
          opacity: 1;
          box-shadow: 0 4px 12px rgba(62, 12, 20, .28);
        }
        .gift-treasure-dialog > button:last-of-type svg { width: 25px; height: 25px; }
        .gift-treasure-dialog-head {
          padding: 26px 24px 18px;
          border-bottom: 1px solid #ede8dd;
          text-align: center;
        }
        .gift-treasure-dialog-title {
          margin: 0;
          color: #18345e;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 21px;
          font-weight: 700;
          line-height: 1.35;
        }
        .gift-treasure-dialog-description {
          margin: 7px 0 0;
          color: #64738a;
          font-size: 14px;
          line-height: 1.5;
        }
        .gift-treasure-form { padding: 19px 22px 0; }
        .gift-treasure-input {
          width: 100%;
          height: 50px;
          border: 1px solid #d4d9e2;
          border-radius: 7px;
          padding: 0 14px;
          background: #fff;
          color: #18345e;
          font-size: 16px;
          outline: none;
          transition: border-color .2s ease, box-shadow .2s ease;
        }
        .gift-treasure-input:focus {
          border-color: #2458a5;
          box-shadow: 0 0 0 3px rgba(36, 88, 165, .15);
        }
        .gift-treasure-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          margin-top: 17px;
          border-top: 1px solid #e8e5dd;
        }
        .gift-treasure-action {
          display: grid;
          min-height: 56px;
          place-items: center;
          border: 0;
          background: #fffdf8;
          color: #173b72;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: background .18s ease, color .18s ease;
        }
        .gift-treasure-action:first-child { border-radius: 0 0 0 16px; }
        .gift-treasure-action:first-child:hover { background: #f6f2e9; }
        .gift-treasure-action:last-child {
          border-radius: 0 0 16px 0;
          background: #123f8b;
          color: white;
        }
        .gift-treasure-action:last-child:hover { background: #0d3476; }
        .gift-treasure-action:disabled { cursor: wait; opacity: .75; }
        .gift-treasure-action:focus-visible {
          position: relative;
          z-index: 1;
          outline: 3px solid #d4a844;
          outline-offset: -4px;
        }
        .gift-result-content {
          padding: 25px 22px 0;
          text-align: center;
        }
        .gift-result-title {
          margin: 0;
          color: #18345e;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 20px;
          font-weight: 700;
          line-height: 1.4;
        }
        .gift-result-amount {
          margin: 12px 0 4px;
          color: #b8323e;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 32px;
          font-weight: 800;
          line-height: 1.2;
          font-variant-numeric: tabular-nums;
        }
        .gift-result-chest {
          display: block;
          width: 150px;
          height: 150px;
          margin: 8px auto 0;
          object-fit: contain;
          filter: drop-shadow(0 8px 12px rgba(121, 82, 12, .23));
          mix-blend-mode: multiply;
        }
        .gift-result-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          margin-top: 12px;
          border-top: 1px solid #e8e5dd;
        }
        .gift-result-actions .gift-treasure-action:last-child {
          background: #123f8b;
          color: #fff;
        }
        @keyframes gift-rays-rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes gift-chest-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @media (min-width: 700px) {
          .gift-treasure-screen { padding-top: 90px; }
          .gift-treasure-chest { width: min(42vw, 410px); }
        }
        @media (max-width: 380px) {
          .gift-treasure-screen { padding-right: 16px; padding-left: 16px; }
          .gift-treasure-chest { width: min(82vw, 330px); }
          .gift-treasure-dialog-head { padding: 23px 18px 15px; }
          .gift-treasure-form { padding-right: 17px; padding-left: 17px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .gift-treasure-page::after,
          .gift-treasure-chest { animation: none; }
          .gift-treasure-back,
          .gift-treasure-chest,
          .gift-treasure-input,
          .gift-treasure-action { transition: none; }
        }
      `}),e.jsxs("section",{className:"gift-treasure-screen","aria-label":"Coffre des codes cadeaux",children:[e.jsx("button",{type:"button",className:"gift-treasure-back","aria-label":"Retour à l’accueil",onClick:()=>l("/my-page"),children:e.jsx(A,{size:22,"aria-hidden":"true"})}),e.jsx("h1",{className:"gift-treasure-heading",children:"Coffre cadeau"}),e.jsx("button",{className:"gift-treasure-chest",type:"button","aria-label":"Ouvrir le coffre et saisir un code cadeau",onClick:()=>r(!0),"data-testid":"button-open-gift-chest",children:e.jsx("img",{src:b,alt:"",draggable:!1})})]}),e.jsx(x,{open:y,onOpenChange:r,children:e.jsxs(m,{className:"gift-treasure-dialog",children:[e.jsxs(R,{className:"gift-treasure-dialog-head",children:[e.jsx(h,{className:"gift-treasure-dialog-title",children:"Saisir le code du coffre"}),e.jsx(L,{className:"gift-treasure-dialog-description",children:"Entrez votre code cadeau pour ouvrir le coffre."})]}),e.jsxs("form",{className:"gift-treasure-form",onSubmit:j,children:[e.jsx("input",{className:"gift-treasure-input",type:"text",value:c,onChange:t=>g(t.target.value.toUpperCase()),placeholder:"Saisir le code du coffre",autoComplete:"off",autoCapitalize:"characters","aria-label":"Code cadeau","data-testid":"input-gift-code"}),e.jsxs("div",{className:"gift-treasure-actions",children:[e.jsx("button",{type:"button",className:"gift-treasure-action",onClick:()=>r(!1),disabled:s.isPending,children:"Annuler"}),e.jsx("button",{className:"gift-treasure-action",type:"submit",disabled:s.isPending,"data-testid":"button-submit-code",children:s.isPending?e.jsx(E,{className:"h-5 w-5 animate-spin"}):"Ouvrir"})]})]})]})}),e.jsx(x,{open:o!==null,onOpenChange:t=>{t||i(null)},children:e.jsx(m,{className:"gift-treasure-dialog",children:o&&e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"gift-result-content",children:[e.jsx(h,{className:"gift-result-title",children:"Le coffre a été ouvert avec succès"}),e.jsx("p",{className:"gift-result-amount",children:k(o.amount)}),e.jsx("img",{className:"gift-result-chest",src:b,alt:"Illustration du coffre cadeau"})]}),e.jsxs("div",{className:"gift-result-actions",children:[e.jsx("button",{type:"button",className:"gift-treasure-action",onClick:()=>i(null),children:"Fermer"}),e.jsx("button",{type:"button",className:"gift-treasure-action",onClick:()=>{i(null),l("/wallet?from=gift-code")},children:e.jsxs("span",{className:"inline-flex items-center gap-2",children:[e.jsx(M,{size:18,"aria-hidden":"true"})," Solde"]})})]})]})})})]})}export{q as default};
