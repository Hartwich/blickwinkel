import type { HostGame, HostGameStateSource } from "@open-party-lab/game-core";
import { blickwinkelManifest } from "../manifest.js";

interface HostStateLike {
  game?: { phase?: string; state?: unknown; updatedAt?: number } | null;
  room?: { language?: "de" | "en" } | null;
}
interface HostRound { id: string; kind: "pick" | "text" | "photo" | "draw"; category: string; prompt: string; useOtherAvatar?: boolean; useOwnAvatar?: boolean; }
interface HostEntry { id: string; label: string; text?: string; media?: string; votes?: number; authorName?: string; authorId?: string; }
interface HostGameState {
  stage: "avatar" | "submit" | "showcase" | "gallery" | "vote" | "winner" | "scoreboard" | "countdown" | "finished"; roundIndex: number;
  rounds: HostRound[]; round: HostRound; finishAt: number | null; submittedCount: number;
  playerNames: Array<{ id: string; name: string; avatar?: string }>; totals: Record<string, number>;
  entries: HostEntry[]; winnerIds: string[]; roundScores: Record<string, number>; showcaseIndex: number;
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
.bw-host.is-presentation{background:radial-gradient(circle at 50% 25%,#413553,#241c32 65%,#191421);color:#fffaf2}.bw-host.is-presentation:before{opacity:.08}.bw-host.is-presentation .bw-round,.bw-host.is-presentation .bw-footer,.bw-host.is-presentation .bw-brand{color:#fff9}.bw-host.is-presentation .bw-mark{box-shadow:5px 5px 0 #ffffff24}.bw-presentation{grid-column:1/-1;min-height:0;display:grid;grid-template-rows:auto minmax(0,1fr) auto;justify-items:center;align-items:center;gap:clamp(12px,2vh,24px);text-align:center}.bw-presentation .bw-kicker{color:#f4c979;margin:0}.bw-presentation .bw-prompt{font-size:clamp(25px,3vw,44px);max-width:32ch;color:#f8eee3}.bw-feature{min-height:0;width:min(100%,1050px);display:grid;place-items:center;align-content:center;gap:14px;animation:bw-feature .55s cubic-bezier(.16,.8,.2,1) both}.bw-feature img.bw-art{display:block;max-width:100%;max-height:min(61vh,690px);object-fit:contain;border:12px solid #fffdf8;border-bottom-width:24px;border-radius:7px;box-shadow:0 26px 80px #0007}.bw-feature-text{font:700 clamp(37px,5.4vw,82px)/1.07 Georgia,serif;max-width:22ch;overflow-wrap:anywhere;text-wrap:balance}.bw-feature-author{display:flex;align-items:center;gap:12px;font-size:clamp(17px,2vw,28px);font-weight:800}.bw-avatar{width:clamp(36px,5vw,70px);aspect-ratio:1;border-radius:50%;object-fit:cover;border:3px solid #fff}.bw-gallery{grid-column:1/-1;min-height:0;width:100%;display:grid;grid-template-rows:auto 1fr;gap:16px;text-align:center}.bw-gallery .bw-prompt{font-size:clamp(26px,3vw,42px);max-width:none}.bw-gallery-grid{min-height:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(clamp(110px,13vw,220px),1fr));gap:clamp(9px,1.3vw,18px);align-content:center;overflow:auto;padding:8px}.bw-gallery-grid .bw-entry{min-height:120px;max-height:31vh;border-width:5px;border-bottom-width:8px;transform:none}.bw-gallery-grid .bw-entry img{min-height:80px;object-fit:contain}.bw-gallery-grid .bw-entry__text{min-height:90px;font-size:clamp(16px,1.45vw,25px)}.bw-gallery-grid .bw-entry__author{position:static;font-size:clamp(11px,1vw,15px)}.bw-scoreboard{grid-column:1/-1;min-height:0;width:100%;display:grid;grid-template-rows:auto 1fr;gap:12px;text-align:center}.bw-scoreboard h1{font:700 clamp(39px,6vw,80px)/1 Georgia,serif}.bw-scoreboard .bw-rank{width:min(1100px,100%);grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:4px 24px;overflow:auto}.bw-scoreboard .bw-rankrow{font-size:clamp(17px,1.6vw,25px);padding:9px 12px;grid-template-columns:40px 1fr auto}.bw-roster .bw-player img{width:28px;height:28px;border-radius:50%;object-fit:cover}.bw-vote-wait{grid-column:1/-1;display:grid;place-items:center;text-align:center;gap:14px}.bw-vote-wait h1{font:700 clamp(40px,6vw,80px)/1.05 Georgia,serif}.bw-vote-wait p{font-size:clamp(18px,2vw,27px);color:var(--soft)}@keyframes bw-feature{from{opacity:0;transform:scale(.92) translateY(28px)}to{opacity:1;transform:scale(1) translateY(0)}}
.bw-scoreboard{grid-template-rows:auto auto 1fr}.bw-scoreboard .bw-rankrow{grid-template-columns:30px 44px minmax(0,1fr) auto}.bw-scoreboard .bw-avatar{width:40px;height:40px}.bw-avatar-fallback{display:grid;place-items:center;background:#ec705d;color:#fff;font-weight:900}
.bw-gallery-grid{grid-template-columns:repeat(var(--cols,4),minmax(0,1fr));grid-template-rows:repeat(var(--rows,1),minmax(0,1fr));height:100%;overflow:hidden;align-content:stretch}.bw-gallery-grid .bw-entry{min-height:0;max-height:none;height:100%}.bw-gallery-grid .bw-entry img{min-height:0;height:calc(100% - 28px);object-fit:contain}.bw-gallery-grid .bw-entry__text{min-height:0;height:calc(100% - 28px);overflow:hidden}.bw-gallery-grid .bw-entry__author{min-height:28px;display:flex;align-items:center;justify-content:center}.bw-presentation .bw-prompt{font-size:clamp(18px,2vw,29px)}.bw-feature-text.is-long{font-size:clamp(28px,3.6vw,54px);max-width:30ch}.bw-vote-wait .bw-gallery-grid{width:100%;min-height:0}
.bw-vote-wait.is-vote{width:100%;grid-template-rows:auto auto minmax(0,1fr) auto;overflow:hidden}
.bw-presentation .bw-kicker{color:var(--coral)}.bw-presentation .bw-prompt{color:var(--ink)}.bw-gallery{grid-template-rows:minmax(0,1fr)}.bw-vote-wait.is-vote{grid-template-rows:auto auto minmax(0,1fr) auto;gap:clamp(6px,1vh,12px)}.bw-vote-wait.is-vote h1{font-size:clamp(30px,4vw,56px)}.bw-vote-wait.is-vote>.bw-progress{font-size:clamp(14px,1.4vw,21px)}
.bw-gallery-grid .bw-entry img:not(.bw-entry__portrait),.bw-gallery-grid .bw-entry__text{height:calc(100% - var(--footer-size,78px));min-height:0}.bw-gallery-grid .bw-entry__author{height:var(--footer-size,78px);min-height:0;display:flex;align-items:center;justify-content:center;gap:clamp(5px,1vw,13px);padding:4px 6px;position:static;background:#fff;color:var(--ink);font-size:clamp(12px,1.3vw,21px);overflow:hidden}.bw-gallery-grid .bw-entry__author strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.bw-gallery-grid .bw-entry .bw-entry__portrait{display:block;width:var(--portrait-size,68px);height:var(--portrait-size,68px);min-width:var(--portrait-size,68px);min-height:0;max-height:100%;border:3px solid #f7eee2;border-radius:4px;object-fit:cover;box-shadow:0 2px 8px #34231f22}.bw-gallery-grid .bw-entry .bw-entry__portrait.bw-avatar-fallback{display:grid;place-items:center}.bw-gallery-grid .bw-entry{border-bottom-width:5px}.bw-gallery-grid .bw-entry__text{font-size:clamp(15px,1.6vw,28px)}
.bw-score-scene{grid-template-rows:auto auto minmax(0,1fr);gap:clamp(6px,1.2vh,16px)}.bw-score-scene>.bw-kicker{justify-content:center;margin:0}.bw-score-scene h1{font-size:clamp(34px,4.8vw,66px)}.bw-score-polaroids{min-height:0;width:min(100%,var(--board-width,1500px));height:100%;margin:auto;display:grid;grid-template-columns:repeat(var(--cols,4),minmax(0,1fr));grid-template-rows:repeat(var(--rows,1),minmax(0,1fr));gap:clamp(10px,1.3vw,22px);padding:clamp(8px,1.2vw,18px);overflow:hidden}.bw-score-polaroid{min-width:0;min-height:0;display:grid;grid-template-rows:minmax(0,1fr) auto;gap:5px;padding:clamp(6px,.8vw,12px);background:#fffdf8;border-radius:4px;box-shadow:0 10px 24px #35243a2a;transform:rotate(var(--tilt,0deg));animation:bw-rise .5s both;animation-delay:calc(var(--i)*40ms);overflow:hidden}.bw-score-photo{display:block;width:100%;height:100%;min-height:0;object-fit:cover;border-radius:2px;background:#e9d8ce}.bw-score-photo-fallback{display:grid;place-items:center;color:#fff;font:900 clamp(50px,8vw,140px) Georgia,serif;background:linear-gradient(135deg,#ec705d,#b85e88)}.bw-score-caption{min-width:0;display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:clamp(4px,.8vw,12px);padding:clamp(4px,.6vw,10px) 2px 0;font-size:clamp(12px,1.3vw,21px);color:var(--ink)}.bw-score-rank{font:800 1.25em Georgia,serif;color:var(--coral)}.bw-score-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:left}.bw-score-points{white-space:nowrap;color:#8d6023;font-variant-numeric:tabular-nums}
.bw-remix-note{width:fit-content;max-width:100%;margin-top:clamp(12px,2vh,22px)!important;padding:10px 16px;border-radius:9px;background:#e5f2eb;border:1px solid #bad8c8;color:#235f52;font-size:clamp(14px,1.3vw,20px);font-weight:800;line-height:1.3}
@media(max-height:760px){.bw-score-scene h1{font-size:clamp(27px,4vw,48px)}.bw-score-caption{font-size:clamp(10px,1.1vw,16px)}.bw-score-polaroids{gap:8px;padding:6px}.bw-score-polaroid{padding:6px}}
.bw-vote-grid{width:100%;height:min(100%,var(--vote-grid-height,100%));min-height:0;display:grid;grid-template-columns:repeat(var(--cols,4),minmax(0,1fr));grid-template-rows:repeat(var(--rows,1),minmax(0,1fr));gap:clamp(8px,1.2vw,18px);align-self:center;padding:8px;overflow:hidden}.bw-vote-card{position:relative;min-width:0;min-height:0;display:grid;grid-template-columns:minmax(72px,27%) minmax(0,1fr);gap:clamp(5px,.8vw,14px);align-items:stretch;padding:clamp(7px,.8vw,13px);background:#fffdf8;border:2px solid #e5d8c6;border-radius:14px;box-shadow:0 8px 20px #392b2017;animation:bw-rise .45s both;animation-delay:calc(var(--i)*45ms)}.bw-vote-identity{min-width:0;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:clamp(3px,.5vw,8px);padding-right:clamp(5px,.7vw,12px);border-right:1px solid var(--line)}.bw-vote-card .bw-vote-portrait{display:block;width:min(100%,var(--vote-photo-size,100px));height:min(var(--vote-photo-size,100px),100%);min-height:0;aspect-ratio:1;border:4px solid #f5e9d7;border-radius:8px;object-fit:cover;box-shadow:0 4px 10px #392b2021}.bw-vote-card .bw-vote-portrait.bw-avatar-fallback{display:grid;place-items:center;font-size:clamp(20px,3vw,48px)}.bw-vote-name{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:clamp(11px,1.25vw,20px);line-height:1.1}.bw-vote-answer{min-width:0;min-height:0;display:grid;place-items:center;overflow:hidden}.bw-vote-media{display:block;width:100%;height:100%;min-height:0;object-fit:contain}.bw-vote-text{max-width:100%;overflow:hidden;overflow-wrap:anywhere;text-wrap:balance;font:700 clamp(15px,1.9vw,31px)/1.13 Georgia,serif;color:var(--ink)}.bw-vote-grid[style*="--rows: 3"] .bw-vote-text,.bw-vote-grid[style*="--rows: 4"] .bw-vote-text{font-size:clamp(13px,1.35vw,21px)}
.bw-vote-card.is-image{grid-template-columns:minmax(0,1fr);grid-template-rows:auto minmax(0,1fr);gap:clamp(4px,.6vw,10px)}.bw-vote-image-name{display:block;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:center;color:var(--ink);font-size:clamp(12px,1.25vw,20px);line-height:1.1}.bw-vote-card.is-image .bw-vote-answer{border-top:1px solid var(--line);padding-top:clamp(4px,.5vw,8px)}
.bw-vote-grid.is-reveal .bw-vote-card:not(.is-winner){opacity:.48;filter:saturate(.65)}.bw-vote-card.is-winner{z-index:1;border-color:#e4ae35;box-shadow:0 0 0 5px #f2bd4b7a,0 18px 38px #9c71343d;animation:bw-winner-card .7s cubic-bezier(.2,.8,.2,1) both}.bw-winner-seal{position:absolute;top:-10px;right:-8px;z-index:3;padding:6px 11px;border-radius:99px;background:#e5aa2e;color:#36231b;box-shadow:0 5px 13px #79541244;font-size:clamp(10px,1vw,15px);font-weight:950;letter-spacing:.08em;transform:rotate(5deg)}.bw-firework{position:absolute;inset:0;z-index:2;pointer-events:none;overflow:hidden}.bw-spark{position:absolute;left:50%;top:50%;width:clamp(6px,.7vw,11px);height:clamp(6px,.7vw,11px);border-radius:2px;background:var(--spark-color);box-shadow:0 0 12px var(--spark-color);animation:bw-spark .95s var(--delay) cubic-bezier(.12,.7,.25,1) both}@keyframes bw-winner-card{0%{opacity:.6;transform:scale(.94)}55%{opacity:1;transform:scale(1.035)}100%{opacity:1;transform:scale(1)}}@keyframes bw-spark{0%{opacity:0;transform:translate(-50%,-50%) scale(.2) rotate(0)}16%{opacity:1}100%{opacity:0;transform:translate(calc(-50% + var(--x)),calc(-50% + var(--y))) scale(.3) rotate(220deg)}}
.bw-vote-wait.is-winner-scene{width:100%;grid-template-rows:auto auto minmax(0,1fr);gap:clamp(6px,1vh,12px);overflow:hidden}.bw-vote-wait.is-winner-scene h1{font-size:clamp(30px,4vw,56px)}.bw-vote-wait.is-winner-scene>.bw-kicker{color:#b47b1d}
.bw-score-polaroids{height:min(100%,var(--board-height,560px));align-self:center;align-content:center;gap:clamp(8px,1vw,18px)}.bw-score-polaroids[data-rows="1"]{transform:translateY(clamp(18px,5vh,55px))}.bw-score-polaroid{position:relative;grid-template-rows:minmax(0,1fr) auto;overflow:hidden;animation:bw-polaroid-in .5s both;animation-delay:calc(var(--i)*55ms)}.bw-score-polaroid.is-gold{--medal:#f6df98;animation:bw-polaroid-in .5s both,bw-medal-reveal .65s 2.1s forwards}.bw-score-polaroid.is-silver{--medal:#dce4eb;animation:bw-polaroid-in .5s both,bw-medal-reveal .65s 2.1s forwards}.bw-score-polaroid.is-bronze{--medal:#e9bea0;animation:bw-polaroid-in .5s both,bw-medal-reveal .65s 2.1s forwards}.bw-score-polaroid.is-gold,.bw-score-polaroid.is-silver,.bw-score-polaroid.is-bronze{animation-delay:calc(var(--i)*55ms),2.1s}.bw-score-photo{object-position:center 35%}.bw-score-caption{z-index:2}.bw-coins{position:absolute;inset:0 0 28px;z-index:3;pointer-events:none;overflow:hidden}.bw-coin{position:absolute;top:-25%;width:clamp(18px,2vw,30px);height:clamp(18px,2vw,30px);display:grid;place-items:center;border:2px solid #b77b16;border-radius:50%;color:#a76c0d;background:radial-gradient(circle at 30% 25%,#fff2ac,#f4c44a 55%,#c98e26);box-shadow:0 3px 5px #66481955;font-size:clamp(9px,1vw,15px);animation:bw-coin-fall 1.15s calc(.45s + var(--coin-i)*.12s) ease-in both}@keyframes bw-polaroid-in{from{opacity:0;transform:translateY(20px) rotate(var(--tilt))}to{opacity:1;transform:translateY(0) rotate(var(--tilt))}}@keyframes bw-coin-fall{0%{opacity:0;top:-25%;transform:rotate(-45deg) scale(.7)}18%{opacity:1}78%{opacity:1;top:48%;transform:rotate(30deg) scale(1)}100%{opacity:0;top:67%;transform:rotate(55deg) scale(.8)}}@keyframes bw-medal-reveal{from{background:#fffdf8}to{background:var(--medal)}}
.bw-vote-wait.is-vote,.bw-vote-wait.is-winner-scene,.bw-score-scene{height:100%;align-self:stretch}.bw-vote-grid.is-dense .bw-vote-text{font-size:clamp(13px,1.35vw,21px)}.bw-score-polaroid.is-gold,.bw-score-polaroid.is-silver,.bw-score-polaroid.is-bronze{animation-delay:calc(var(--i)*55ms),2.6s}
@media(max-height:760px){.bw-score-polaroids[data-rows="1"]{transform:translateY(16px)}.bw-vote-card{padding:6px}.bw-vote-name{font-size:clamp(10px,1vw,15px)}}@media(max-width:850px){.bw-vote-card{grid-template-columns:minmax(55px,27%) minmax(0,1fr)}.bw-vote-grid{gap:7px}.bw-score-caption{font-size:clamp(10px,1vw,15px)}}@media(prefers-reduced-motion:reduce){.bw-vote-card.is-winner,.bw-spark,.bw-coin,.bw-score-polaroid,.bw-score-polaroid.is-gold,.bw-score-polaroid.is-silver,.bw-score-polaroid.is-bronze{animation:none!important}.bw-score-polaroid.is-gold,.bw-score-polaroid.is-silver,.bw-score-polaroid.is-bronze{background:var(--medal)}}
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

function avatarNode(value: string | undefined, name: string): HTMLElement {
  const image = safePhoto(value);
  if (!image) return el("span", "bw-avatar bw-avatar-fallback", name.slice(0, 1).toUpperCase());
  const node = el("img", "bw-avatar"); node.src = image; node.alt = name; return node;
}

function gridShape(count: number): { columns: number; rows: number } {
  const columns = Math.max(1, count <= 2 ? count : count <= 4 ? 2 : count <= 9 ? 3 : 4);
  return { columns, rows: Math.max(1, Math.ceil(count / columns)) };
}

function entryCard(entry: HostEntry, en: boolean, index: number, avatar?: string): HTMLElement {
  const card = el("article", "bw-entry");
  card.style.setProperty("--i", String(index));
  card.style.setProperty("--tilt", "0deg");
  const media = safePhoto(entry.media);
  if (media) {
    const image = el("img"); image.src = media;
    image.alt = en ? "Player photo or drawing" : "Foto oder Zeichnung eines Spielers";
    card.append(image);
  } else card.append(el("div", "bw-entry__text", entry.text ?? entry.label));
  const author = el("div", "bw-entry__author");
  const portrait = avatarNode(avatar, entry.authorName ?? entry.label);
  portrait.classList.add("bw-entry__portrait");
  author.append(portrait, el("strong", undefined, entry.authorName ?? entry.label));
  card.append(author);
  return card;
}

function voteCard(entry: HostEntry, avatar: string | undefined, en: boolean, index: number, winner = false): HTMLElement {
  const media = safePhoto(entry.media);
  const card = el("article", `bw-vote-card${media ? " is-image" : ""}${winner ? " is-winner" : ""}`);
  card.style.setProperty("--i", String(index));
  const answer = el("div", "bw-vote-answer");
  if (media) {
    const image = el("img", "bw-vote-media"); image.src = media;
    image.alt = en ? "Submitted photo or drawing" : "Eingereichtes Foto oder Bild";
    answer.append(image);
    card.append(el("strong", "bw-vote-image-name", entry.authorName ?? entry.label), answer);
  } else {
    const identity = el("div", "bw-vote-identity");
    const portrait = avatarNode(avatar, entry.authorName ?? entry.label);
    portrait.classList.add("bw-vote-portrait");
    identity.append(portrait, el("strong", "bw-vote-name", entry.authorName ?? entry.label));
    answer.append(el("p", "bw-vote-text", entry.text ?? entry.label));
    card.append(identity, answer);
  }
  if (winner) {
    card.append(el("span", "bw-winner-seal", en ? "WINNER" : "GEWINNT"));
    const firework = el("div", "bw-firework");
    firework.setAttribute("aria-hidden", "true");
    for (let spark = 0; spark < 14; spark += 1) {
      const particle = el("i", "bw-spark");
      const angle = spark * Math.PI * 2 / 14;
      particle.style.setProperty("--x", `${Math.round(Math.cos(angle) * 100)}px`);
      particle.style.setProperty("--y", `${Math.round(Math.sin(angle) * 76)}px`);
      particle.style.setProperty("--spark-color", ["#f2bd4b", "#ec705d", "#559b8d", "#e5a9ba"][spark % 4]!);
      particle.style.setProperty("--delay", `${spark % 4 * 45}ms`);
      firework.append(particle);
    }
    card.append(firework);
  }
  return card;
}

function voteGrid(state: Partial<HostGameState>, en: boolean, reveal: boolean): HTMLElement {
  const entries = state.entries ?? [];
  const { columns, rows } = gridShape(entries.length);
  const grid = el("div", `bw-vote-grid${reveal ? " is-reveal" : ""}${rows >= 3 ? " is-dense" : ""}`);
  grid.style.setProperty("--cols", String(columns));
  grid.style.setProperty("--rows", String(rows));
  grid.style.setProperty("--vote-grid-height", entries.length <= 4 ? "520px" : entries.length <= 9 ? "660px" : "100%");
  grid.style.setProperty("--vote-photo-size", entries.length >= 13 ? "64px" : entries.length >= 10 ? "78px" : entries.length >= 7 ? "92px" : entries.length >= 5 ? "108px" : "150px");
  const avatars = new Map((state.playerNames ?? []).map(({ id, avatar }) => [id, avatar]));
  entries.forEach((entry, index) => grid.append(voteCard(entry, avatars.get(entry.authorId ?? ""), en, index,
    reveal && (state.winnerIds ?? []).includes(entry.id))));
  return grid;
}

function roundWinnerPlayers(state: Partial<HostGameState>): Set<string> {
  if (state.round?.kind === "pick") return new Set(state.winnerIds ?? []);
  const winningEntries = new Set(state.winnerIds ?? []);
  return new Set((state.entries ?? []).filter(({ id }) => winningEntries.has(id)).map(({ authorId }) => authorId ?? ""));
}

function scoreboardNode(state: Partial<HostGameState>, en: boolean, final = false): HTMLElement {
  const board = el("section", "bw-scoreboard bw-score-scene");
  board.append(el("p", "bw-kicker", final ? (en ? "FINAL SCORES" : "ENDSTAND") : (en ? "CURRENT SCORES" : "AKTUELLER PUNKTESTAND")),
    el("h1", undefined, final ? (en ? "Your final scores" : "Euer Endstand") : (en ? "Here’s where everyone stands" : "So steht es gerade")));
  const players = [...(state.playerNames ?? [])].sort((a, b) =>
    (state.totals?.[b.id] ?? 0) - (state.totals?.[a.id] ?? 0) || a.name.localeCompare(b.name));
  const grid = el("div", "bw-score-polaroids");
  const rows = players.length <= 5 ? 1 : players.length <= 10 ? 2 : 3;
  const columns = Math.max(1, Math.ceil(players.length / rows));
  const cardWidth = rows === 1 ? 205 : rows === 2 ? 188 : 165;
  grid.style.setProperty("--cols", String(columns));
  grid.style.setProperty("--rows", String(rows));
  grid.style.setProperty("--board-width", `${columns * cardWidth + (columns - 1) * 18 + 24}px`);
  grid.style.setProperty("--board-height", rows === 1 ? "286px" : rows === 2 ? "470px" : "560px");
  grid.dataset.rows = String(rows);
  const roundWinners = roundWinnerPlayers(state);
  players.forEach((player, index) => {
    const medal = index < 3 ? (["gold", "silver", "bronze"] as const)[index] : undefined;
    const card = el("article", `bw-score-polaroid${medal ? ` is-${medal}` : ""}${roundWinners.has(player.id) ? " is-round-winner" : ""}`);
    card.style.setProperty("--i", String(index));
    card.style.setProperty("--tilt", `${(index % 3 - 1) * 1.2}deg`);
    const src = safePhoto(player.avatar);
    if (src) {
      const photo = el("img", "bw-score-photo"); photo.src = src; photo.alt = player.name;
      card.append(photo);
    } else card.append(el("div", "bw-score-photo bw-score-photo-fallback", player.name.slice(0, 1).toUpperCase()));
    if (roundWinners.has(player.id)) {
      const coins = el("div", "bw-coins"); coins.setAttribute("aria-hidden", "true");
      for (let coinIndex = 0; coinIndex < 7; coinIndex += 1) {
        const coin = el("span", "bw-coin", "★");
        coin.style.setProperty("--coin-i", String(coinIndex));
        coin.style.left = `${10 + coinIndex * 12}%`;
        coins.append(coin);
      }
      card.append(coins);
    }
    const caption = el("div", "bw-score-caption");
    caption.append(el("span", "bw-score-rank", `${index + 1}.`), el("strong", "bw-score-name", player.name),
      el("b", "bw-score-points", `${state.totals?.[player.id] ?? 0} ${en ? "pts" : "Pkt."}`));
    card.append(caption); grid.append(card);
  });
  board.append(grid);
  return board;
}

export function mountBlickwinkelHost(rootInput: unknown, source: HostGameStateSource): () => void {
  const root = rootInput as HTMLElement;
  const style = el("style");
  style.textContent = styleText;
  root.className = "bw-host-mount";
  root.replaceChildren(style);
  let current: HostStateLike | null = null;
  let lastRenderKey = "";
  let lastCueKey = "";
  let audio: AudioContext | null = null;
  let ticker = 0;
  const playCue = (key: string, winner = false) => {
    if (key === lastCueKey) return;
    lastCueKey = key;
    try {
      audio ??= new AudioContext();
      if (audio.state !== "running") void audio.resume();
      const at = audio.currentTime;
      (winner ? [523.25, 659.25, 783.99, 1046.5] : [523.25, 659.25]).forEach((frequency, index) => {
        const tone = audio!.createOscillator();
        const gain = audio!.createGain();
        tone.type = winner ? "triangle" : "sine"; tone.frequency.value = frequency;
        gain.gain.setValueAtTime(0.0001, at + index * .12);
        gain.gain.exponentialRampToValueAtTime(winner ? .075 : .055, at + index * .12 + .015);
        gain.gain.exponentialRampToValueAtTime(.0001, at + index * .12 + .27);
        tone.connect(gain).connect(audio!.destination);
        tone.start(at + index * .12); tone.stop(at + index * .12 + .28);
      });
    } catch { /* The host can still show the animation if audio is unavailable. */ }
  };
  const draw = (appState: HostStateLike | null) => {
    current = appState;
    const state = (appState?.game?.state ?? {}) as Partial<HostGameState>;
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
    const roundNumber = el("b", undefined, `${Math.max(0, Math.min((state?.roundIndex ?? 0) + 1, state?.rounds?.length ?? 1)).toString().padStart(2, "0")} / ${state?.rounds?.length ?? 10}`);
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
      body.append(scoreboardNode(state, en, true));
    } else if (stage === "showcase") {
      const entry = state.entries?.[state.showcaseIndex ?? 0];
      const presentation = el("section", "bw-presentation");
      presentation.append(el("p", "bw-kicker", `${en ? "ENTRY" : "ERGEBNIS"} ${(state.showcaseIndex ?? 0) + 1} / ${state.entries?.length ?? 0}`));
      const feature = el("div", "bw-feature");
      if (entry) {
        const media = safePhoto(entry.media);
        if (media) { const image = el("img", "bw-art"); image.src = media; image.alt = en ? "Submission" : "Einsendung"; feature.append(image); }
        else feature.append(el("div", `bw-feature-text ${(entry.text?.length ?? 0) > 80 ? "is-long" : ""}`, entry.text ?? entry.label));
        const author = el("div", "bw-feature-author");
        const player = state.playerNames?.find(({ id }) => id === entry.authorId);
        author.append(avatarNode(player?.avatar, entry.authorName ?? "?"), el("span", undefined, entry.authorName ?? "?"));
        feature.append(author);
      }
      presentation.append(feature, el("p", "bw-prompt", state.round?.prompt ?? ""));
      body.append(presentation);
      playCue(`showcase:${state.roundIndex}:${state.showcaseIndex}`);
    } else if (stage === "gallery") {
      const gallery = el("section", "bw-gallery");
      const grid = el("div", "bw-gallery-grid");
      const count = state.entries?.length ?? 0;
      const { columns, rows } = gridShape(count);
      grid.style.setProperty("--cols", String(columns));
      grid.style.setProperty("--rows", String(rows));
      grid.style.setProperty("--portrait-size", count >= 13 ? "38px" : count >= 10 ? "46px" : count >= 7 ? "56px" : count >= 5 ? "68px" : "86px");
      grid.style.setProperty("--footer-size", count >= 13 ? "48px" : count >= 10 ? "56px" : count >= 7 ? "66px" : count >= 5 ? "78px" : "98px");
      (state.entries ?? []).forEach((entry, index) => grid.append(entryCard(entry, en, index,
        state.playerNames?.find(({ id }) => id === entry.authorId)?.avatar)));
      gallery.append(grid); body.append(gallery);
      playCue(`gallery:${state.roundIndex}`);
    } else if (stage === "vote") {
      const wait = el("section", "bw-vote-wait is-vote");
      wait.append(el("p", "bw-kicker", en ? "YOUR VOTE" : "EURE STIMME"),
        el("h1", undefined, en ? "Which entry wins?" : "Welches Ergebnis gewinnt?"));
      wait.append(voteGrid(state, en, false), el("p", "bw-progress", `${state.submittedCount ?? 0} / ${state.playerNames?.length ?? 0} ${en ? "votes" : "Stimmen"}`));
      body.append(wait);
    } else if (stage === "winner") {
      const reveal = el("section", "bw-vote-wait is-winner-scene");
      const winnerCount = state.winnerIds?.length ?? 0;
      reveal.append(el("p", "bw-kicker", en ? "THE RESULT" : "DIE ENTSCHEIDUNG"),
        el("h1", undefined, winnerCount === 0 ? (en ? "No entry this time" : "Diesmal kein Ergebnis") : winnerCount > 1 ? (en ? "The winning entries" : "Diese Ergebnisse gewinnen") : (en ? "The winning entry" : "Dieses Ergebnis gewinnt")),
        voteGrid(state, en, true));
      body.append(reveal);
      if (winnerCount) playCue(`winner:${state.roundIndex}`, true);
    } else if (stage === "scoreboard") {
      body.append(scoreboardNode(state, en));
      playCue(`scoreboard:${state.roundIndex}`);
    } else if (stage === "countdown") {
      const next = el("section", "bw-vote-wait");
      next.append(el("p", "bw-kicker", en ? "NEXT TASK" : "NÄCHSTE AUFGABE"), el("h1", undefined, (state.roundIndex ?? 0) < 0 ? (en ? "Here we go!" : "Los geht’s!") : (en ? "Ready for the next one?" : "Bereit für die nächste Aufgabe?")));
      const clock = el("div", "bw-clock"); clock.append(el("strong", undefined, "3"), el("span", undefined, en ? "SECONDS" : "SEKUNDEN")); next.append(clock);
      body.append(next);
    } else if (stage === "avatar") {
      const intro = el("section", "bw-vote-wait");
      intro.append(el("p", "bw-kicker", en ? "YOUR CHARACTER" : "EUER CHARAKTER"),
        el("h1", undefined, en ? "Your first character selfie" : "Euer erstes Charakterselfie"),
        el("p", undefined, en ? "Take your character photo on your phone." : "Macht euer Charakterfoto auf dem Handy."),
        el("p", "bw-progress", `${state.submittedCount ?? 0} / ${state.playerNames?.length ?? 0}`));
      body.append(intro);
    } else {
      const main = el("div", "bw-main");
      const kind = state?.round?.kind;
      main.append(el("p", "bw-kicker", en ? "YOUR GROUP, YOUR ANSWERS" : "EURE RUNDE, EURE ANTWORTEN"), el("h1", "bw-prompt", state?.round?.prompt ?? ""), el("span", "bw-kind", `${kindIcon(kind)}  ${kindLabel(kind, en)}`));
      if (state?.round?.useOtherAvatar || state?.round?.useOwnAvatar) {
        main.append(el("p", "bw-remix-note", en
          ? "After the vote, your edited selfie becomes that person's new character photo."
          : "Nach der Abstimmung wird das bearbeitete Selfie zum neuen Charakterbild der Person."));
      }
      const side = el("aside", "bw-side");
      const clock = el("div", "bw-clock"); clock.append(el("strong", undefined, "—"), el("span", undefined, en ? "SECONDS" : "SEKUNDEN"));
      const info = el("div"); const count = el("p", "bw-progress", `${state?.submittedCount ?? 0} / ${state?.playerNames?.length ?? 0} ${en ? "in" : "abgegeben"}`);
      const bar = el("div", "bw-progressbar"); const fill = el("i"); const total = state?.playerNames?.length ?? 0; fill.style.setProperty("--done", `${total ? Math.min(100, (state?.submittedCount ?? 0) / total * 100) : 0}%`); bar.append(fill); info.append(count, bar); side.append(clock, info);
      body.append(main, side);
      const roster = el("footer", "bw-roster"); (state?.playerNames ?? []).forEach((player, index) => { const chip = el("span", "bw-player"); chip.style.setProperty("--i", String(index)); chip.append(avatarNode(player.avatar, player.name), document.createTextNode(player.name)); roster.append(chip); });
      layout.append(top, body, roster);
      shell.append(layout);
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
    const duration = state?.stage === "countdown" ? 3_000 : state?.round?.kind === "pick" ? 25_000 : state?.round?.kind === "text" ? 70_000 : state?.round?.kind === "photo" ? 90_000 : 120_000;
    clock.style.setProperty("--progress", `${remaining === null ? 100 : Math.max(0, Math.min(100, remaining / (duration / 1000) * 100))}%`);
  };
  const typedSource = source as HostGameStateSource<HostStateLike>;
  const unsubscribe = typedSource.subscribe(draw);
  const initial = typedSource.getState(); if (initial) draw(initial);
  ticker = window.setInterval(updateClock, 250);
  return () => { unsubscribe(); window.clearInterval(ticker); if (audio) void audio.close(); root.replaceChildren(); root.className = ""; };
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
