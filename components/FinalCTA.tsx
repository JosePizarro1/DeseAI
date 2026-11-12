'use client';
import React from 'react';

export default function FinalCTA() {
  return (
    <section className={"ds-wish-cta"} aria-labelledby={"ds-wish-cta-title"}>{"\n"}<div className={"ds-wish-shell ds-enter"} data-animate={""}>{"\n"}<div className={"ds-wish-content"}>{"\n"}<span className={"ds-wish-kicker"}>{"TU IDEA PUEDE SER EL COMIENZO"}</span>{"\n"}<h2 id={"ds-wish-cta-title"}>{"Los mejores planes empiezan con "}<em>{"un deseo."}</em></h2>{"\n"}<p>{"Cuenta qué buscas, encuentra personas que quieren lo mismo y da el primer paso para hacerlo posible."}</p>{"\n"}<div className={"ds-wish-actions"}><a className={"ds-wish-btn ds-wish-main"} href={"/crear"}>{"Crear mi deseo "}<span aria-hidden={"true"}>{"✦"}</span></a><a className={"ds-wish-btn ds-wish-outline"} href={"/explorar"}>{"Explorar ideas "}<span aria-hidden={"true"}>{"↗"}</span></a></div>{"\n"}<small>{"Sin registro obligatorio para probar DeseAI"}</small>{"\n"}</div>{"\n"}<div className={"ds-wish-art"}><img src={"/assets/deyo-cta-transparente.webp"} width={"1448"} height={"1086"} loading={"lazy"} alt={"Deyo celebra una nueva idea entre nubes y una figura luminosa en forma de corazón"} /></div>{"\n"}</div>{"\n"}</section>
  );
}
