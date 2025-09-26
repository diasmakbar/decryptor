import { ref, update, onValue } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-database.js";
import { db } from "./firebase.js";

/* ------------------ REFERENSI PATH ------------------ */
export const gameRef        = (gameId) => ref(db, `games/decrypto/${gameId}`);
export const teamsRef       = (gameId) => ref(db, `games/decrypto/${gameId}/teams`);
export const teamRef        = (gameId, team) => ref(db, `games/decrypto/${gameId}/teams/${team}`);
export const playersRef     = (gameId) => ref(db, `games/decrypto/${gameId}/players`);
export const playerRef      = (gameId, user) => ref(db, `games/decrypto/${gameId}/players/${user}`);
export const roundsRef      = (gameId) => ref(db, `games/decrypto/${gameId}/rounds`);
export const roundRef       = (gameId, round) => ref(db, `games/decrypto/${gameId}/rounds/${round}`);
export const codeRef        = (gameId, round) => ref(db, `games/decrypto/${gameId}/rounds/${round}/code`);
export const currentRoundRef= (gameId) => ref(db, `games/decrypto/${gameId}/currentRound`);
export const teamOrderRef   = (gameId) => ref(db, `games/decrypto/${gameId}/teamOrder`);

/* ------------------ GENERATOR CODE ------------------ */
export function generateUniqueCode() {
  let nums = [1, 2, 3, 4];
  for (let i = nums.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [nums[i], nums[j]] = [nums[j], nums[i]];
  }
  return nums.slice(0, 3); // 3 angka unik
}

/* ------------------ BUTTON UTILS ------------------ */
export function setBtnEnabled(btn, enabled) {
  if (!btn) return;
  btn.disabled = !enabled;
}

/* ------------------ READY STATUS ------------------ */
export function renderReadyStatus(el, teamsObj) {
  if (!el) return;
  const status = Object.entries(teamsObj).map(([t, v]) =>
    `${t}: ${v.ready ? "✅" : "⌛"}`
  ).join(" | ");
  el.textContent = "Ready status → " + status;
}

/* ------------------ ADVANCE ROUND ------------------ */
export async function advanceRoundAndResetReady(gameId, newRound, teamsObj) {
  const updates = {};
  updates[`games/decrypto/${gameId}/currentRound`] = newRound;
  updates[`games/decrypto/${gameId}/rounds/${newRound}`] = {};
  for (const t of Object.keys(teamsObj)) {
    updates[`games/decrypto/${gameId}/teams/${t}/ready`] = false;
  }
  updates[`games/decrypto/${gameId}/rounds/${newRound - 1}/revealed`] = true;
  await update(ref(db), updates);
}

/* ------------------ HOST TEAM ------------------ */
// export function getHostTeam(teamOrder, roundNum) {
//   if (!Array.isArray(teamOrder) || teamOrder.length === 0) return null;
//   const idx = (roundNum - 1) % teamOrder.length;
//   return teamOrder[idx];
// }

export function getHostTeam(teamOrder, round) {
  if (!Array.isArray(teamOrder) || teamOrder.length < 2) return teamOrder?.[0] || null;
  return (round % 2 === 1) ? teamOrder[0] : teamOrder[1];
}
export function getOtherTeam(teamOrder, round) {
  if (!Array.isArray(teamOrder) || teamOrder.length < 2) return null;
  return (round % 2 === 1) ? teamOrder[1] : teamOrder[0];
}

/* ------------------ WINNER BANNER ------------------ */
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
