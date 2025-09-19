// game-utils.js
import {
  ref, get, set, update, onValue,
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-database.js";
import { db } from "./firebase.js";

export const gameRef         = (gameId)         => ref(db, `games/${gameId}`);
export const roundsRef       = (gameId)         => ref(db, `games/${gameId}/rounds`);
export const roundRef        = (gameId, r)      => ref(db, `games/${gameId}/rounds/${r}`);
export const codeRef         = (gameId, r)      => ref(db, `games/${gameId}/rounds/${r}/code`);
export const teamsRef        = (gameId)         => ref(db, `games/${gameId}/teams`);
export const teamRef         = (gameId, team)   => ref(db, `games/${gameId}/teams/${team}`);
export const currentRoundRef = (gameId)         => ref(db, `games/${gameId}/currentRound`);
export const winnerRef       = (gameId)         => ref(db, `games/${gameId}/winner`);
export const teamOrderRef    = (gameId)         => ref(db, `games/${gameId}/teamOrder`);

export function getHostTeam(teamOrder, round) {
  if (!Array.isArray(teamOrder) || teamOrder.length < 2) return teamOrder?.[0] || null;
  return (round % 2 === 1) ? teamOrder[0] : teamOrder[1];
}
export function getOtherTeam(teamOrder, round) {
  if (!Array.isArray(teamOrder) || teamOrder.length < 2) return null;
  return (round % 2 === 1) ? teamOrder[1] : teamOrder[0];
}

export function generateUniqueCode() {
  const pool = [1,2,3,4];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0,3);
}

export function setBtnEnabled(btn, enabled) {
  if (!btn) return;
  btn.disabled = !enabled;
  btn.style.opacity = enabled ? "1" : "0.5";
  btn.style.pointerEvents = enabled ? "auto" : "none";
}

export function mountWinnerBanner(gameId) {
  const bar = document.createElement("div");
  bar.id = "winnerBanner";
  bar.style.cssText = "position:fixed;left:0;right:0;bottom:0;background:#222;color:#fff;padding:12px;text-align:center;font-weight:bold;z-index:9999;display:none;";
  document.body.appendChild(bar);
  onValue(winnerRef(gameId), (snap) => {
    const w = snap.val();
    if (!w) { bar.style.display="none"; bar.textContent=""; return; }
    bar.style.display = "block";
    const myTeam = new URLSearchParams(location.search).get("team");
    bar.textContent = (myTeam && myTeam === w) ? `TEAM ${w.toUpperCase()} MENANG! 🎉` : `GAME OVER! Pemenang: ${w.toUpperCase()}`;
    // Matikan semua input
    document.querySelectorAll("button,input,textarea,select").forEach(el => el.disabled = true);
  });
}

export async function advanceRoundAndResetReady(gameId, nextRound, teamsObj) {
  const updates = {};
  updates[`games/${gameId}/currentRound`] = nextRound;
  Object.keys(teamsObj||{}).forEach(t => {
    updates[`games/${gameId}/teams/${t}/ready`] = false;
  });
  await update(ref(db), updates);
}

export function renderReadyStatus(el, teamsObj) {
  if (!el) return;
  const txt = Object.entries(teamsObj || {})
    .map(([name, t]) => `${name}: ${t.ready ? "✅" : "⌛"}`).join(" | ");
  el.textContent = txt ? `Status: ${txt}` : "";
}
