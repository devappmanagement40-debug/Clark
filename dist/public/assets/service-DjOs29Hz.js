import{j as e,L as t}from"./index-BFLNkaJe.js";import{u as n}from"./useQuery-BJj9aHMI.js";import{c as a}from"./catl-booth-2-CTzJyPOb.js";import{C as c}from"./chevron-left-lwB9c0ic.js";import{C as o}from"./chevron-right-PFzceyE1.js";const l="/assets/catl-logo-BfP2OkZl.png";function d({alt:r="Logo Dulux",...s}){return e.jsx("img",{src:l,alt:r,...s})}const p="/assets/catl-booth-1-Do1tp0_t.webp";function b(){const{data:r}=n({queryKey:["/api/settings/links"]}),s=[{label:"Service client",href:r?.supportLink||"https://t.me/sybotx",testId:"button-support-link",size:"short"},{label:"Groupe officiel",href:r?.groupLink||"https://t.me/sybotx",testId:"button-group-link",size:"tall"}];return e.jsxs("main",{className:"service-reference",children:[e.jsx("style",{children:`
        .service-reference { min-height: 100dvh; background: #ffffff; color: #111827; font-family: Arial, sans-serif; }
        .service-reference .service-screen { width: 100%; max-width: 512px; min-height: 100dvh; margin: 0 auto; overflow: hidden; background: #ffffff; }
        .service-reference .service-header { display: flex; min-height: 78px; align-items: center; gap: 14px; padding: 16px; border-bottom: 2px solid #111827; background: #fff; }
        .service-reference .service-back { display: grid; width: 42px; height: 42px; flex: none; place-items: center; border: 2px solid #111827; border-radius: 11px; padding: 0; background: #fff; box-shadow: 0 3px 0 #111827; color: #111827; }
        .service-reference .service-back svg { width: 22px; height: 22px; stroke-width: 2.5; }
        .service-reference .service-brand { display: flex; min-width: 0; align-items: center; gap: 10px; }
        .service-reference .service-logo { width: 68px; height: 34px; flex: none; border: 1px solid #d7dfec; border-radius: 8px; padding: 3px; object-fit: contain; background: #fff; }
        .service-reference .service-title { margin: 0; color: #111827; font-size: 20px; font-weight: 800; line-height: 1.2; }
        .service-reference .benefits { padding: 16px; background: #ffffff; }
        .service-reference .benefit-banner { display: block; width: 100%; height: 184px; border: 2px solid #111827; border-radius: 13px; object-fit: cover; object-position: center; box-shadow: 0 4px 0 #111827; }
        .service-reference .telegram-section { box-sizing: border-box; padding: 22px 16px 24px; border-top: 2px solid #111827; border-bottom: 2px solid #111827; background: #fff; }
        .service-reference .telegram-title { margin: 0 0 18px; color: #111827; font-size: 24px; font-weight: 800; line-height: 1.2; text-align: left; }
        .service-reference .telegram-grid { display: grid; grid-template-columns: minmax(0, 40%) minmax(0, 1fr); gap: 16px; align-items: start; }
        .service-reference .bike-image { width: 100%; height: 194px; margin: 0; border: 2px solid #111827; border-radius: 12px; object-fit: cover; object-position: center; background: #fff; }
        .service-reference .telegram-actions { min-width: 0; }
        .service-reference .telegram-link { position: relative; display: grid; width: 100%; align-items: center; justify-items: center; box-sizing: border-box; border: 2px solid #111827; border-radius: 11px; padding: 0 37px 0 10px; background: #fff; color: #111827; font-size: 17px; font-weight: 800; line-height: 23px; text-align: center; white-space: pre-line; box-shadow: 0 3px 0 #111827; transition: transform .12s ease, background-color .12s ease; }
        .service-reference .telegram-link.short { height: 62px; }
        .service-reference .telegram-link.tall { height: 78px; margin-top: 14px; }
        .service-reference .telegram-link:active { transform: translateY(2px); background: #edf2ff; box-shadow: 0 1px 0 #111827; }
        .service-reference .telegram-link svg { position: absolute; right: 11px; width: 22px; height: 22px; color: #1947b8; stroke-width: 2.5; }
        .service-reference .online-hours { margin-top: 15px; color: #4b5563; font-size: 14px; font-weight: 700; line-height: 1.45; text-align: center; white-space: normal; }
        .service-reference .online-hours p { margin: 0; }
        .service-reference .advice { min-height: 210px; box-sizing: border-box; padding: 20px 16px 70px; background: #ffffff; }
        .service-reference .advice-title { margin: 0 0 13px; color: #111827; font-size: 18px; font-weight: 800; line-height: 24px; }
        .service-reference .advice-copy { margin: 0 0 8px; color: #4b5563; font-size: 15px; font-weight: 400; line-height: 24px; }
        @media (max-width: 370px) {
          .service-reference .service-title { font-size: 18px; }
          .service-reference .benefits { padding-right: 12px; padding-left: 12px; }
          .service-reference .telegram-section { padding-right: 14px; padding-left: 14px; }
          .service-reference .telegram-grid { grid-template-columns: minmax(0, 40%) minmax(0, 1fr); gap: 12px; }
          .service-reference .bike-image { height: 176px; }
          .service-reference .telegram-link { padding-right: 28px; font-size: 17px; line-height: 23px; }
          .service-reference .telegram-link svg { right: 4px; width: 20px; }
          .service-reference .online-hours { font-size: 13px; line-height: 1.45; }
          .service-reference .advice-copy { font-size: 16px; }
        }
      `}),e.jsxs("div",{className:"service-screen",children:[e.jsxs("header",{className:"service-header",children:[e.jsx(t,{href:"/invest",children:e.jsx("button",{className:"service-back","data-testid":"button-back","aria-label":"Retour",children:e.jsx(c,{"aria-hidden":"true"})})}),e.jsxs("div",{className:"service-brand",children:[e.jsx(d,{className:"service-logo",alt:"Logo Dulux"}),e.jsx("h1",{className:"service-title",children:"Service client"})]})]}),e.jsx("section",{className:"benefits","aria-label":"Présentation d'Equinor",children:e.jsx("img",{className:"benefit-banner",src:p,alt:""})}),e.jsxs("section",{className:"telegram-section","aria-labelledby":"support-heading",children:[e.jsx("h2",{id:"support-heading",className:"telegram-title",children:"Assistance Equinor"}),e.jsxs("div",{className:"telegram-grid",children:[e.jsx("img",{className:"bike-image",src:a,alt:""}),e.jsxs("div",{className:"telegram-actions",children:[s.map(i=>e.jsxs("button",{type:"button",className:`telegram-link ${i.size}`,onClick:()=>window.open(i.href,"_blank"),"data-testid":i.testId,children:[i.label,e.jsx(o,{"aria-hidden":"true"})]},i.testId)),e.jsxs("div",{className:"online-hours",children:[e.jsx("p",{children:"Horaires en ligne :"}),e.jsx("p",{children:"9:00 AM-7:00 PM"})]})]})]})]}),e.jsxs("section",{className:"advice","aria-label":"Conseils",children:[e.jsx("h2",{className:"advice-title",children:"CONSEILS :"}),e.jsx("p",{className:"advice-copy",children:"1. Pour toute question, n'hésitez pas à contacter notre service client en ligne. Nous serons ravis de vous aider."}),e.jsx("p",{className:"advice-copy",children:"2. Veuillez conserver votre mot de passe en lieu sûr et ne le partagez avec personne."})]})]})]})}export{b as default};
