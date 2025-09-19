// scoring.js
import {
  ref, get, update, runTransaction
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-database.js";
import { db } from "./firebase.js";
import {
  gameRef, roundRef, teamsRef, teamOrderRef,
  getHostTeam, getOtherTeam
} from "./game-utils.js";

/**
 * Aturan skor:
 * - Host salah (round >=1)  => host -1
 * - Lawan benar (round >=3) => lawan +1
 * Round direveal (rounds/{r}/revealed=true) HANYA setelah kedua tim sudah submit.
 * Pemenang:
 * - host.score <= -2 -> other menang
 * - other.score >= 2 -> other menang
 */
export async function maybeScoreCurrentRound(gameId) {
  const gameSnap = await get(gameRef(gameId));
  if (!gameSnap.exists()) return;
  const game = gameSnap.val();
  const round = game.currentRound || 1;

  const rSnap = await get(roundRef(gameId, round));
  if (!rSnap.exists()) return;
  const rData = rSnap.val() || {};
  const code = rData.code;
  if (!Array.isArray(code) || code.length !== 3) return;

  // order tim
  const orderSnap = await get(teamOrderRef(gameId));
  const teamOrder = orderSnap.val();
  if (!Array.isArray(teamOrder) || teamOrder.length < 2) return;

  const hostTeam = getHostTeam(teamOrder, round);
  const otherTeam = getOtherTeam(teamOrder, round);
  const guesses = rData.guesses || {};
  const hostGuess  = guesses[hostTeam];
  const otherGuess = guesses[otherTeam];

  // tunggu sampai kedua guess ada → baru reveal & skor
  if (!Array.isArray(hostGuess) || hostGuess.length !== 3) return;
  if (!Array.isArray(otherGuess) || otherGuess.length !== 3) return;

  // ensure idempotent: pakai transaction pada flag 'scored'
  const scoredRef = ref(db, `games/${gameId}/rounds/${round}/scored`);
  const trx = await runTransaction(scoredRef, (prev) => (prev === true ? undefined : true));
  if (!trx.committed || trx.snapshot.val() !== true) return;

  // Ambil skor terkini
  const tSnap = await get(teamsRef(gameId));
  const teams = tSnap.val() || {};
  let hostScore  = (teams[hostTeam]?.score ?? 0);
  let otherScore = (teams[otherTeam]?.score ?? 0);

  const codeKey  = code.join("-");
  const hostKey  = hostGuess.join("-");
  const otherKey = otherGuess.join("-");

  // host salah mulai round 1
  if (hostKey !== codeKey) hostScore -= 1;
  // lawan benar mulai round 3
  if (round >= 3 && otherKey === codeKey) otherScore += 1;

  const updates = {
    [`games/${gameId}/rounds/${round}/revealed`]: true, // tampilkan di history setelah dua-duanya submit
    [`games/${gameId}/teams/${hostTeam}/score`]:  hostScore,
    [`games/${gameId}/teams/${otherTeam}/score`]: otherScore
  };

  // cek pemenang
  let winner = null;
  if (hostScore <= -2) winner = otherTeam;
  if (otherScore >= 2) winner = otherTeam;
  if (winner) updates[`games/${gameId}/winner`] = winner;

  await update(ref(db), updates);
}
