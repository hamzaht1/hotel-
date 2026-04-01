import{r as l,j as e,R as m}from"./app-B0YbHfXV.js";import{u as d}from"./useTemplateTranslations-QtdqGpXt.js";import"./app-BmkmKGA8.js";const f="/build/assets/logo-2-Blsl_qLC.png",o="/build/assets/star-C0Ta9Vq0.svg";function v(){d();const[c,s]=l.useState("carousel");l.useEffect(()=>{const i=localStorage.getItem("madina-partners-style");i&&s(i==="grid"?"grid":"carousel");const t=r=>{const a=r;a.detail&&a.detail.type&&s(a.detail.type)};return window.addEventListener("madina-partners-style-changed",t),()=>{window.removeEventListener("madina-partners-style-changed",t)}},[]);const n=Array(20).fill(f);return e.jsxs("section",{id:"partners",className:"py-0 relative",children:[c==="carousel"?e.jsxs("div",{className:"w-full overflow-hidden relative pb-8",children:[e.jsx("div",{className:"absolute inset-0",style:{backgroundColor:"var(--madina-partners-bg, var(--madina-primary-light))",opacity:"var(--madina-partners-opacity, 0.4)"}}),e.jsx("div",{className:"flex animate-infinite-scroll relative z-10",children:Array.from({length:3},(i,t)=>e.jsx("div",{className:"flex flex-shrink-0",children:n.map((r,a)=>e.jsxs(m.Fragment,{children:[e.jsx("div",{className:"flex items-center justify-center px-8 py-4 flex-shrink-0",children:e.jsx("img",{src:r,alt:`Partner logo ${a+1}`,className:"h-32 w-auto object-contain opacity-80 hover:opacity-100 dark:opacity-90 dark:hover:opacity-100 transition duration-300"})}),e.jsx("div",{className:"flex items-center justify-center px-4 py-4 flex-shrink-0",children:e.jsx("div",{className:"h-4 w-4","aria-label":"Star separator",style:{maskImage:`url(${o})`,WebkitMaskImage:`url(${o})`,maskSize:"contain",WebkitMaskSize:"contain",maskRepeat:"no-repeat",WebkitMaskRepeat:"no-repeat",maskPosition:"center",WebkitMaskPosition:"center",backgroundColor:"var(--madina-primary)",opacity:.5}})})]},`group-${t}-${a}`))},t))})]}):e.jsx("div",{className:"w-full overflow-hidden relative pb-8",style:{backgroundColor:"var(--madina-partners-bg, var(--madina-primary))"},children:e.jsx("div",{className:"flex animate-infinite-scroll relative z-10 py-8",children:Array.from({length:3},(i,t)=>e.jsx("div",{className:"flex flex-shrink-0",children:n.map((r,a)=>e.jsx("div",{className:"flex items-center justify-center px-8 py-4 flex-shrink-0",children:e.jsx("img",{src:r,alt:`Partner logo ${a+1}`,className:"h-24 w-auto object-contain opacity-90 hover:opacity-100 transition duration-300 filter brightness-0 invert"})},`group-${t}-${a}`))},t))})}),e.jsx("div",{className:"absolute bottom-0 left-0 right-0 w-full",style:{height:"100px",transform:"translateY(50%)",zIndex:1},children:e.jsx("svg",{viewBox:"0 0 1743 139",fill:"none",xmlns:"http://www.w3.org/2000/svg",className:"madina-partners-bottom-wave w-full h-full","aria-hidden":"true",preserveAspectRatio:"none",style:{width:"100%"},children:e.jsx("path",{d:"M0 138.775H1742.2V7.14275L1623.86 9.79579L1552.84 3.26518L1465.47 7.14275L1349.88 0.816208L1238.84 7.14275L1160.56 10.204L1105.92 7.14275L1037.68 3.67336L895.675 6.32642L851.971 12.0407L693.619 4.89784L599.861 13.2244L513.394 3.18355L415.663 9.71417L387.77 3.71417L340.42 7.14275L263.988 15.0611L152.945 -0.00012207L90.1123 7.14275H0V138.775Z",style:{fill:"var(--madina-background-color, #f5f5f5)"},className:"dark:fill-[#0F172A]"})})}),e.jsx("style",{dangerouslySetInnerHTML:{__html:`
          .animate-infinite-scroll {
            display: flex;
            animation: infiniteScroll 45s linear infinite;
            width: max-content;
          }
          
          /* LTR direction - right to left */
          @keyframes infiniteScroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(calc(-100% / 3)); }
          }
          
          /* RTL direction - left to right */
          [dir="rtl"] .animate-infinite-scroll {
            animation: infiniteScrollRTL 45s linear infinite;
          }
          
          @keyframes infiniteScrollRTL {
            0% { transform: translateX(0); }
            100% { transform: translateX(calc(100% / 3)); }
          }
          
          .animate-infinite-scroll:hover {
            animation-play-state: paused;
          }
          
          /* Dark mode: Make partner logos white (filter for carousel style) */
          .dark #partners img {
            filter: var(--madina-partners-logo-filter, none);
          }
        `}})]})}export{v as default};
