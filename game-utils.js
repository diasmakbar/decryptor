// game-utils.js (tambahan kecil)
import {
  ref, get, set, update, onValue,
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-database.js";
import { db } from "./firebase.js";

export const gameRef         = (gameId)         => ref(db, `games/decrypto/${gameId}`);
export const roundsRef       = (gameId)         => ref(db, `games/decrypto/${gameId}/rounds`);
export const roundRef        = (gameId, r)      => ref(db, `games/decrypto/${gameId}/rounds/${r}`);
export const codeRef         = (gameId, r)      => ref(db, `games/decrypto/${gameId}/rounds/${r}/code`);
export const teamsRef        = (gameId)         => ref(db, `games/decrypto/${gameId}/teams`);
export const teamRef         = (gameId, team)   => ref(db, `games/decrypto/${gameId}/teams/${team}`);
export const currentRoundRef = (gameId)         => ref(db, `games/decrypto/${gameId}/currentRound`);
export const winnerRef       = (gameId)         => ref(db, `games/decrypto/${gameId}/winner`);
export const teamOrderRef    = (gameId)         => ref(db, `games/decrypto/${gameId}/teamOrder`);
// NEW:
export const playersRef      = (gameId)         => ref(db, `games/decrypto/${gameId}/players`);
export const playerRef       = (gameId, user)   => ref(db, `games/decrypto/${gameId}/players/${user}`);

export function getHostTeam(teamOrder, round) {
  if (!Array.isArray(teamOrder) || teamOrder.length < 2) return teamOrder?.[0] || null;
  return (round % 2 === 1) ? teamOrder[0] : teamOrder[1];
}
export function getOtherTeam(teamOrder, round) {
  if (!Array.isArray(teamOrder) || teamOrder.length < 2) return null;
  return (round % 2 === 1) ? teamOrder[1] : teamOrder[0];
}

// ... (generateUniqueCode, setBtnEnabled, mountWinnerBanner, advanceRoundAndResetReady, renderReadyStatus tetap sama)
