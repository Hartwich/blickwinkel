import type { HostGame, HostGameStateSource } from "@open-party-lab/game-core";
import { blickwinkelManifest } from "../manifest.js";

interface HostStateLike {
  game?: { phase?: string; state?: unknown; updatedAt?: number } | null;
  room?: { language?: "de" | "en" } | null;
}
interface HostRound { id: string; kind: "pick" | "text" | "photo" | "draw"; category: string; prompt: string; }
interface HostEntry { id: string; label: string; text?: string; media?: string; votes?: number; authorName?: string; }
interface HostGameState {
  stage: "submit" | "vote" | "reveal" | "finished"; roundIndex: number;
  rounds: HostRound[]; round: HostRound; finishAt: number | null; submittedCount: number;
  playerNames: Array<{ id: string; name: string }>; totals: Record<string, number>;
  entries: HostEntry[]; winnerIds: string[]; roundScores: Record<string, number>;
}

const styleText = `
.bw-host{--paper:#f5eddf;--ink:#30263c;--soft:#736878;--line:#dfd2c0;--coral:#ec705d;--yellow:#f2bd4b;--teal:#559b8d;position:absolute;inset:0;overflow:hidden;box-sizing:border-box;background:radial-gradient(ellipse at 80% 12%,#fff9 0,transparent 32%),var(--paper);color:var(--ink);font-family:Inter,"Avenir Next",system-ui,sans-serif;padding:clamp(22px,4vw,58px);isolation:isolate}
.bw-host *{box-sizing:border-box}.bw-host:before{content:"";position:absolute;inset:0;z-index:-1;opacity:.16;pointer-events:none;background-image:radial-gradient(#806b5828 .7px,transparent .7px);background-size:7px 7px}.bw-host h1,.bw-host h2,.bw-host p{margin:0}.bw-shell{height:100%;max-width:1600px;margin:auto;display:grid;grid-template-rows:auto 1fr auto;gap:clamp(18px,3vh,36px)}
.bw-top{display:flex;align-items:center;justify-content:space-between;gap:24px}.bw-brand{display:flex;align-items:center;gap:14px;font-size:clamp(15px,1.5vw,22px);font-weight:900;letter-spacing:.11em}.bw-mark{width:38px;height:38px;display:grid;place-items:center;border-radius:50%;background:var(--coral);color:#fff;font-family:Georgia,serif;font-size:25px;transform:rotate(-8deg);box-shadow:5px 5px 0 #30263c18}.bw-round{font-size:clamp(13px,1.2vw,18px);font-weight:800;color:var(--soft);letter-spacing:.08em;text-transform:uppercase}.bw-round b{color:var(--ink);margin-left:10px}.bw-body{min-height:0;display:grid;grid-template-columns:minmax(0,1.5fr) minmax(250px,.62fr);gap:clamp(25px,5vw,78px);align-items:center}.bw-main{min-width:0;animation:bw-rise .55s cubic-bezier(.2,.8,.2,1) both}.bw-kicker{display:flex;align-items:center;gap:10px;margin-bottom:clamp(15px,2.5vh,28px);font-size:clamp(12px,1.05vw,15px);font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:var(--coral)}.bw-kicker:before{content:"";width:27px;height:3px;border-radius:3px;background:currentColor}.bw-prompt{max-width:1050px;font-family:Georgia,"Times New Roman",serif;font-size:clamp(38px,6vw,88px);line-height:1.04;letter-spacing:-.035em;text-wrap:balance}.bw-kind{margin-top:24px;display:inline-flex;align-items:center;gap:10px;border-bottom:2px solid var(--yellow);padding:0 2px 7px;font-size:clamp(14px,1.4vw,20px);font-weight:800;color:var(--soft)}.bw-kind i{font-style:normal;color:var(--teal);font-size:1.3em}
.bw-side{display:grid;gap:20px;align-content:center}.bw-clock{width:min(260px,18vw);aspect-ratio:1;border-radius:50%;margin:0 auto;display:grid;place-items:center;position:relative;background:conic-gradient(var(--coral) var(--progress,100%),#dfd2c0 0);box-shadow:0 20px 50px #382a2415;animation:bw-pop .5s .1s cubic-bezier(.2,.8,.2,1) both}.bw-clock:before{content:"";position:absolute;inset:9px;border-radius:inherit;background:var(--paper)}.bw-clock strong{z-index:1;font-family:Georgia,serif;font-size:clamp(40px,5vw,72px);font-variant-numeric:tabular-nums}.bw-clock span{position:absolute;z-index:1;transform:translateY(48px);font-size:12px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:var(--soft)}.bw-progress{font-size:clamp(16px,1.5vw,22px);font-weight:850;text-align:center}.bw-progressbar{height:8px;background:#dfd2c0;border-radius:8px;overflow:hidden}.bw-progressbar i{height:100%;width:var(--done,0%);display:block;border-radius:inherit;background:linear-gradient(90deg,var(--teal),#86bda9);transition:width .5s ease}
.bw-roster{border-top:1px solid var(--line);padding:16px 96px 0 0;display:flex;flex-wrap:wrap;gap:9px;justify-content:flex-end}.bw-player{display:flex;align-items:center;gap:8px;padding:8px 12px;border-radius:99px;background:#fff8;border:1px solid var(--line);font-size:clamp(13px,1.1vw,16px);font-weight:750;animation:bw-rise .4s both;animation-delay:calc(var(--i)*45ms)}.bw-player i{width:9px;height:9px;border-radius:50%;background:var(--teal)}.bw-footer{display:flex;justify-content:space-between;align-items:center;padding-right:96px;color:var(--soft);font-size:clamp(12px,1vw,15px);font-weight:700}.bw-footer strong{color:var(--ink);letter-spacing:.12em}
.bw-votes{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(270px,100%),1fr));gap:clamp(14px,2vw,26px);align-content:center;max-height:100%;overflow:auto;padding:8px}.bw-entry{position:relative;min-height:180px;max-height:35vh;display:flex;flex-direction:column;overflow:hidden;border:8px solid #fff;border-bottom-width:28px;border-radius:5px;background:#fff;box-shadow:0 14px 30px #392b2018;transform:rotate(var(--tilt));animation:bw-photo .65s cubic-bezier(.16,.75,.25,1) both;animation-delay:calc(var(--i)*90ms)}.bw-entry img{width:100%;height:100%;min-height:160px;object-fit:cover;background:#ede4d8}.bw-entry__text{padding:18px;min-height:130px;display:grid;place-items:center;background:linear-gradient(135deg,#fff,#fff7e8);font-family:Georgia,serif;font-size:clamp(19px,2vw,30px);text-align:center;line-height:1.2;overflow:auto}.bw-entry__label{position:absolute;left:12px;bottom:5px;color:#544a50;font-size:14px;font-weight:800}.bw-votes.is-pick{display:flex;flex-wrap:wrap;justify-content:center;gap:18px}.bw-votes.is-pick .bw-entry{width:min(260px,24%);min-width:175px;min-height:110px;max-height:none;align-items:center;justify-content:center;border:1px solid var(--line);border-bottom:5px solid var(--yellow);border-radius:12px;background:#fff9;box-shadow:0 8px 18px #392b2010}.bw-votes.is-pick .bw-entry__text{min-height:auto;background:none;font-family:inherit;font-size:clamp(20px,2vw,30px);font-weight:850}.bw-votes.is-pick .bw-entry__label{display:none}.bw-vote-count{position:absolute;right:10px;top:10px;padding:5px 9px;border-radius:99px;background:var(--coral);color:white;font-size:13px;font-weight:900}
.bw-reveal .bw-entry{padding-bottom:24px}.bw-entry__author{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:8px 12px;background:#fff;font-size:14px;font-weight:850}.bw-entry__author b{color:var(--coral);font-size:17px}.bw-winner{outline:4px solid var(--yellow);outline-offset:4px;animation:bw-winner .7s .25s both}.bw-rank{display:grid;gap:10px;align-content:center;width:min(850px,100%);margin:auto}.bw-rankrow{display:grid;grid-template-columns:60px 1fr auto;align-items:center;gap:18px;padding:16px 22px;border-bottom:1px solid var(--line);font-size:clamp(19px,2vw,30px);animation:bw-rise .45s both;animation-delay:calc(var(--i)*90ms)}.bw-rankrow:first-child{font-size:clamp(26px,3vw,42px);color:#9a6d13}.bw-rankrow span{color:var(--coral);font-family:Georgia,serif;font-size:1.2em}.bw-rankrow b{font-variant-numeric:tabular-nums}.bw-complete{text-align:center;align-self:center}.bw-complete h1{font:700 clamp(44px,7vw,92px)/1 Georgia,serif}.bw-complete p{margin-top:18px;color:var(--soft);font-size:clamp(16px,1.6vw,23px)}
@keyframes bw-rise{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}@keyframes bw-pop{from{opacity:0;transform:scale(.82) rotate(-8deg)}to{opacity:1;transform:scale(1) rotate(0)}}@keyframes bw-photo{from{opacity:0;transform:translateY(28px) rotate(calc(var(--tilt) - 4deg)) scale(.96)}to{opacity:1;transform:translateY(0) rotate(var(--tilt)) scale(1)}}@keyframes bw-winner{0%{box-shadow:0 0 0 0 #f2bd4b88}70%{box-shadow:0 0 0 14px #f2bd4b00}100%{box-shadow:0 0 0 0 #f2bd4b00}}@media(max-width:850px){.bw-host{padding:20px}.bw-body{grid-template-columns:1fr;gap:20px;align-content:center}.bw-side{grid-template-columns:130px 1fr;align-items:center}.bw-clock{width:120px}.bw-clock strong{font-size:38px}.bw-clock span{transform:translateY(31px);font-size:9px}.bw-progress{text-align:left}.bw-progressbar{grid-column:2}.bw-roster{justify-content:flex-start}.bw-prompt{font-size:clamp(36px,8vw,66px)}.bw-votes{grid-template-columns:repeat(auto-fit,minmax(190px,1fr))}.bw-entry{min-height:140px}}
@media(max-width:560px){.bw-host{padding:17px}.bw-shell{gap:16px}.bw-top{align-items:flex-start}.bw-brand{font-size:14px}.bw-mark{width:30px;height:30px;font-size:20px}.bw-round{text-align:right;font-size:11px}.bw-body{gap:17px}.bw-side{grid-template-columns:96px 1fr;gap:12px}.bw-clock{width:90px}.bw-clock strong{font-size:32px}.bw-clock span{transform:translateY(26px)}.bw-progress{font-size:15px}.bw-roster{gap:6px}.bw-player{padding:6px 9px;font-size:12px}.bw-votes.is-pick .bw-entry{width:42%;min-width:130px}.bw-rankrow{grid-template-columns:35px 1fr auto;padding:12px 5px;gap:10px}}
@media(prefers-reduced-motion:reduce){.bw-host *, .bw-host *:before,.bw-host *:after{animation-duration:.01ms!important;animation-iteration-count:1!important;scroll-behavior:auto!important;transition-duration:.01ms!important}}
`;

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function safePhoto(value: string | undefined): string | undefined {
  return value && /^data:image\/(?:jpeg|png|webp);base64,[a-z\d+/=]+$/i.test(value) ? value : undefined;
}

export function mountBlickwinkelHost(rootInput: unknown, source: HostGameStateSource): () => void {
  const root = rootInput as HTMLElement;
  const style = el("style");
  style.textContent = styleText;
  root.className = "bw-host-mount";
  root.replaceChildren(style);
  let current: HostStateLike | null = null;
  let lastRenderKey = "";
  let ticker = 0;
  const draw = (appState: HostStateLike | null) => {
    current = appState;
    const state = appState?.game?.state as Partial<HostGameState> | undefined;
    const en = appState?.room?.language === "en";
    const renderKey = `${appState?.game?.updatedAt ?? ""}:${appState?.game?.phase ?? ""}:${state?.stage ?? ""}:${appState?.room?.language ?? "de"}`;
    if (renderKey === lastRenderKey) { updateClock(); return; }
    lastRenderKey = renderKey;
    const shell = el("main", "bw-host");
    const layout = el("div", "bw-shell");
    const top = el("header", "bw-top");
    const brand = el("div", "bw-brand");
    brand.append(el("span", "bw-mark", "b"), el("span", undefined, "BLICKWINKEL"));
    const round = el("div", "bw-round");
    round.append(document.createTextNode(en ? "ROUND" : "RUNDE"));
    const roundNumber = el("b", undefined, `${Math.min((state?.roundIndex ?? 0) + 1, state?.rounds?.length ?? 1).toString().padStart(2, "0")} / ${state?.rounds?.length ?? 8}`);
    round.append(roundNumber);
    top.append(brand, round);
    const body = el("section", "bw-body");
    const stage = state?.stage ?? "finished";
    if (!state?.round && stage !== "finished") {
      const intro = el("div", "bw-complete");
      intro.append(el("h1", undefined, en ? "Your people. Your perspective." : "Eure Leute. Euer Blickwinkel."),
        el("p", undefined, en ? "Vote, write, take photos and draw. Every perspective counts." : "Stimmt ab, schreibt, fotografiert und zeichnet. Jede Perspektive zählt."));
      body.append(intro);
    } else if (stage === "finished") {
      const finish = el("div", "bw-complete");
      finish.append(el("h1", undefined, en ? "Your perspective." : "Euer Blickwinkel."), el("p", undefined, en ? "The group has spoken. Here’s the final score." : "Die Runde ist ausgewertet. Das ist euer Endstand."));
      const rankings = el("div", "bw-rank");
      [...(state?.playerNames ?? [])].sort((a, b) => (state?.totals?.[b.id] ?? 0) - (state?.totals?.[a.id] ?? 0)).forEach((player, index) => {
        const row = el("div", "bw-rankrow"); row.style.setProperty("--i", String(index));
        row.append(el("span", undefined, `${index + 1}.`), el("strong", undefined, player.name), el("b", undefined, `${state?.totals?.[player.id] ?? 0} ${en ? "pts" : "Pkt."}`)); rankings.append(row);
      });
      body.append(finish, rankings);
    } else if (stage === "vote" || stage === "reveal") {
      const main = el("div", "bw-main");
      main.append(el("p", "bw-kicker", stage === "reveal" ? (en ? "THE GROUP HAS SPOKEN" : "DIE GRUPPE HAT ENTSCHIEDEN") : (en ? "MAKE YOUR PICK" : "GEBT EUREN TIPP AB")), el("h1", "bw-prompt", state?.round?.prompt ?? ""), el("span", "bw-kind", `${kindIcon(state?.round?.kind)}  ${kindLabel(state?.round?.kind, en)}`));
      const board = el("div", `bw-votes ${state?.round?.kind === "pick" ? "is-pick" : ""} ${stage === "reveal" ? "bw-reveal" : ""}`);
      (state?.entries ?? []).forEach((entry, index) => {
        const card = el("article", `bw-entry ${stage === "reveal" && state?.winnerIds?.includes(entry.id) ? "bw-winner" : ""}`); card.style.setProperty("--i", String(index)); card.style.setProperty("--tilt", `${(index % 3 - 1) * 1.3}deg`);
        const media = safePhoto(entry.media);
        if (media) { const image = el("img"); image.src = media; image.alt = en ? "Player photo or drawing" : "Foto oder Zeichnung eines Spielers"; card.append(image); }
        else card.append(el("div", "bw-entry__text", entry.text ?? entry.label));
        if (stage === "reveal") {
          const author = el("div", "bw-entry__author"); author.append(el("span", undefined, entry.authorName ?? entry.label), el("b", undefined, `${entry.votes ?? 0} ${en ? "votes" : "Stimmen"}`)); card.append(author);
        } else if (entry.votes !== undefined) card.append(el("span", "bw-vote-count", String(entry.votes)));
        board.append(card);
      });
      if (stage === "reveal") {
        body.append(main, board);
      } else {
        const side = el("aside", "bw-side");
        const clock = el("div", "bw-clock"); clock.append(el("strong", undefined, "—"), el("span", undefined, en ? "SECONDS" : "SEKUNDEN"));
        const info = el("div");
        const count = el("p", "bw-progress");
        const total = state?.playerNames?.length ?? 0;
        count.textContent = `${state?.submittedCount ?? 0} / ${total} ${en ? "ready" : "bereit"}`;
        const bar = el("div", "bw-progressbar"); const fill = el("i"); fill.style.setProperty("--done", `${total ? Math.min(100, (state?.submittedCount ?? 0) / total * 100) : 0}%`); bar.append(fill); info.append(count, bar);
        side.append(clock, info);
        const roster = el("footer", "bw-roster");
        (state?.playerNames ?? []).forEach((player, index) => { const chip = el("span", "bw-player"); chip.style.setProperty("--i", String(index)); chip.append(el("i"), document.createTextNode(player.name)); roster.append(chip); });
        body.append(main, side); layout.append(top, body, roster); shell.append(layout); const foot = el("div", "bw-footer"); foot.append(el("span", undefined, en ? "Choose on your phone" : "Stimmt geheim am Handy ab"), el("strong", undefined, "BLICKWINKEL")); shell.append(foot); root.replaceChildren(style, shell); updateClock(); return;
      }
    } else {
      const main = el("div", "bw-main");
      const kind = state?.round?.kind;
      main.append(el("p", "bw-kicker", en ? "YOUR GROUP, YOUR ANSWERS" : "EURE RUNDE, EURE ANTWORTEN"), el("h1", "bw-prompt", state?.round?.prompt ?? ""), el("span", "bw-kind", `${kindIcon(kind)}  ${kindLabel(kind, en)}`));
      const side = el("aside", "bw-side");
      const clock = el("div", "bw-clock"); clock.append(el("strong", undefined, "—"), el("span", undefined, en ? "SECONDS" : "SEKUNDEN"));
      const info = el("div"); const count = el("p", "bw-progress", `${state?.submittedCount ?? 0} / ${state?.playerNames?.length ?? 0} ${en ? "in" : "abgegeben"}`);
      const bar = el("div", "bw-progressbar"); const fill = el("i"); const total = state?.playerNames?.length ?? 0; fill.style.setProperty("--done", `${total ? Math.min(100, (state?.submittedCount ?? 0) / total * 100) : 0}%`); bar.append(fill); info.append(count, bar); side.append(clock, info);
      body.append(main, side);
      const roster = el("footer", "bw-roster"); (state?.playerNames ?? []).forEach((player, index) => { const chip = el("span", "bw-player"); chip.style.setProperty("--i", String(index)); chip.append(el("i"), document.createTextNode(player.name)); roster.append(chip); });
      layout.append(top, body, roster);
      shell.append(layout);
      const foot = el("div", "bw-footer"); foot.append(el("span", undefined, stage === "submit" ? (en ? "Take your time. The reveal is coming." : "Überlegt in Ruhe. Gleich wird aufgelöst.") : (en ? "Votes are in" : "Alle Stimmen sind da")), el("strong", undefined, "BLICKWINKEL")); shell.append(foot);
      root.replaceChildren(style, shell);
      updateClock(); return;
    }
    layout.append(top, body);
    shell.append(layout);
    root.replaceChildren(style, shell);
  };
  const updateClock = () => {
    const state = current?.game?.state as Partial<HostGameState> | undefined;
    const node = root.querySelector<HTMLElement>(".bw-clock strong");
    const clock = root.querySelector<HTMLElement>(".bw-clock");
    if (!node || !clock) return;
    const remaining = state?.finishAt ? Math.max(0, Math.ceil((state.finishAt - Date.now()) / 1000)) : null;
    node.textContent = remaining === null ? "∞" : String(remaining);
    const duration = state?.stage === "vote" ? 25_000 : state?.round?.kind === "pick" ? 25_000 : state?.round?.kind === "text" ? 70_000 : state?.round?.kind === "photo" ? 90_000 : 120_000;
    clock.style.setProperty("--progress", `${remaining === null ? 100 : Math.max(0, Math.min(100, remaining / (duration / 1000) * 100))}%`);
  };
  const typedSource = source as HostGameStateSource<HostStateLike>;
  const unsubscribe = typedSource.subscribe(draw);
  const initial = typedSource.getState(); if (initial) draw(initial);
  ticker = window.setInterval(updateClock, 250);
  return () => { unsubscribe(); window.clearInterval(ticker); root.replaceChildren(); root.className = ""; };
}

function kindLabel(kind: string | undefined, en: boolean): string {
  const labels: Record<string, [string, string]> = { pick: ["Wer passt am besten?", "Who fits best?"], text: ["Schreibt eure Antwort", "Write your answer"], photo: ["Macht ein Foto", "Take a photo"], draw: ["Zeichnet eure Antwort", "Draw your answer"] };
  return labels[kind ?? ""]?.[en ? 1 : 0] ?? (en ? "Your turn" : "Eure Aufgabe");
}
function kindIcon(kind: string | undefined): string { return ({ pick: "◎", text: "✎", photo: "▣", draw: "✦" } as Record<string, string>)[kind ?? ""] ?? "✦"; }

export const hostGame = {
  id: blickwinkelManifest.id,
  displayName: blickwinkelManifest.displayName,
  mountDom: mountBlickwinkelHost
} satisfies HostGame;
