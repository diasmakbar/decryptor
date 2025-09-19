// game-utils.js
import {
  ref, get, set, update, onValue,
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-database.js";
import { db } from "./firebase.js";

/** Ambil ref node penting */
export const gameRef      = (gameId) => ref(db, `games/${gameId}`);
export const roundsRef    = (gameId) => ref(db, `games/${gameId}/rounds`);
export const roundRef     = (gameId, round) => ref(db, `games/${gameId}/rounds/${round}`);
export const codeRef      = (gameId, round) => ref(db, `games/${gameId}/rounds/${round}/code`);
export const teamsRef     = (gameId) => ref(db, `games/${gameId}/teams`);
export const teamRef      = (gameId, team) => ref(db, `games/${gameId}/teams/${team}`);
export const currentRoundRef = (gameId) => ref(db, `games/${gameId}/currentRound`);
export const winnerRef    = (gameId) => ref(db, `games/${gameId}/winner`);
export const teamOrderRef = (gameId) => ref(db, `games/${gameId}/teamOrder`);

/** Hitung host berdasarkan urutan tim & parity round */
export function getHostTeam(teamOrder, round) {
  if (!Array.isArray(teamOrder) || teamOrder.length < 2) return null;
  const idx = (round % 2 === 1) ? 0 : 1; // ganjil = tim pertama
  return teamOrder[idx];
}
export function getOtherTeam(teamOrder, round) {
  if (!Array.isArray(teamOrder) || teamOrder.length < 2) return null;
  const idx = (round % 2 === 1) ? 1 : 0;
  return teamOrder[idx];
}

/** Utility: generate 3 angka unik dari 1..4 */
export function generateUniqueCode() {
  const pool = [1,2,3,4];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0,3);
}

/** Helper: enable/disable tombol */
export function setBtnEnabled(btn, enabled) {
  if (!btn) return;
  btn.disabled = !enabled;
  btn.style.opacity = enabled ? "1" : "0.5";
  btn.style.pointerEvents = enabled ? "auto" : "none";
}

/** Listen winner → tampilkan banner & disable interaksi */
export function mountWinnerBanner(gameId) {
  const bar = document.createElement("div");
  bar.id = "winnerBanner";
  bar.style.cssText = "position:fixed;left:0;right:0;bottom:0;background:#222;color:#fff;padding:12px;text-align:center;font-weight:bold;z-index:9999;";
  document.body.appendChild(bar);

  onValue(winnerRef(gameId), (snap) => {
    const w = snap.val();
    if (!w) {
      bar.textContent = "";
      bar.style.display = "none";
      return;
    }
    bar.style.display = "block";
    const params = new URLSearchParams(window.location.search);
    const myTeam = params.get("team");
    if (myTeam && myTeam === w) {
      bar.textContent = `TEAM ${w.toUpperCase()} MENANG! 🎉`;
    } else {
      bar.textContent = `GAME OVER! Pemenang: ${w.toUpperCase()}`;
    }
    // Optional: disable semua tombol input di page
    document.querySelectorAll("button,input,textarea,select").forEach(el => el.disabled = true);
  });
}

/** Pastikan currentRound terisi (default 1) */
export async function ensureCurrentRound(gameId) {
  const snap = await get(currentRoundRef(gameId));
  if (!snap.exists()) {
    await set(currentRoundRef(gameId), 1);
  }
}

/** Tandai ready tim */
export async function setReady(gameId, team, val) {
  await update(teamRef(gameId, team), { ready: !!val });
}

/** Naikkan ronde & reset ready semua tim */
export async function advanceRoundAndResetReady(gameId, nextRound, teamsObj) {
  const updates = {};
  updates[`games/${gameId}/currentRound`] = nextRound;
  Object.keys(teamsObj || {}).forEach(t => {
    updates[`games/${gameId}/teams/${t}/ready`] = false;
  });
  await update(ref(db), updates);
}

/** Render status siapa yang ready */
export function renderReadyStatus(el, teamsObj) {
  if (!el) return;
  const txt = Object.entries(teamsObj || {})
    .map(([name, t]) => `${name}: ${t.ready ? "✅" : "⌛"}`)
    .join(" | ");
  el.textContent = txt ? `Status: ${txt}` : "";
}
