import{j as e,R as n}from"./app-B0YbHfXV.js";import{B as l}from"./BackgroundTitle-DK-9DC-0.js";import{u as o}from"./useTemplateTranslations-QtdqGpXt.js";import{l as c,r as m}from"./right-line--1ejRKwq.js";import"./app-BmkmKGA8.js";const d="/build/assets/logo-2-C3y07IGO.png",x="/build/assets/background-B613bxNJ.png",f="/build/assets/star-Cj533XJZ.svg";function k(){const t=o(),r=Array(20).fill(d);return e.jsxs("section",{className:"py-20 ",children:[e.jsx("div",{className:"container mx-auto px-4",children:e.jsxs("div",{className:"relative text-center mb-16",children:[e.jsxs("div",{className:"flex items-center justify-center gap-4 mb-4",children:[e.jsx("img",{src:c,alt:"left line",className:"h-6 w-auto hidden md:block line-icon"}),e.jsx("h2",{className:"relative z-10 text-4xl md:text-5xl font-bold riyadh-heading mb-4",children:t("sections.partners.title","شركاؤنا في النجاح")}),e.jsx("img",{src:m,alt:"right line",className:"h-6 w-auto hidden md:block line-icon"})]}),e.jsx(l,{text:t("sections.partners.background_title","الشركاء")}),e.jsx("p",{className:"relative z-10 text-xl riyadh-text-muted max-w-2xl mx-auto",children:t("sections.partners.subtitle","نتعاون مع أفضل الشركات والمؤسسات في المملكة لتقديم خدمات متميزة لضيوفنا الكرام")})]})}),e.jsxs("div",{className:"w-full overflow-hidden relative py-8 bg-black/5 dark:bg-white/50",style:{backgroundImage:`url(${x})`,backgroundSize:"cover",backgroundPosition:"center",backgroundRepeat:"no-repeat"},children:[e.jsx("div",{"aria-hidden":"true",className:"absolute inset-0 z-0 pointer-events-none bg-gradient-to-b from-black/10 via-transparent to-black/10 dark:from-white/20 dark:via-white/10 dark:to-white/20 mix-blend-multiply"}),e.jsx("div",{className:"flex animate-infinite-scroll relative z-10",children:Array.from({length:3},(h,a)=>e.jsx("div",{className:"flex flex-shrink-0",children:r.map((s,i)=>e.jsxs(n.Fragment,{children:[e.jsx("div",{className:"flex items-center justify-center px-8 py-4 flex-shrink-0",children:e.jsx("img",{src:s,alt:`Partner logo ${i+1}`,className:"h-32 w-auto object-contain opacity-80 hover:opacity-100 dark:opacity-90 dark:hover:opacity-100 dark:brightness-110 transition duration-300"})}),e.jsx("div",{className:"flex items-center justify-center px-4 py-4 flex-shrink-0",children:e.jsx("img",{src:f,alt:"Star separator",className:"h-4 w-4 object-contain opacity-50 dark:opacity-70 dark:brightness-125"})})]},`group-${a}-${i}`))},a))})]}),e.jsx("style",{dangerouslySetInnerHTML:{__html:`
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
          `}})]})}export{k as default};
