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
 * Cek & lakukan scoring untuk round aktif (idempotent, pakai flag `scored`)
 * Aturan:
 * - Host salah (round >= 1) => host score -= 1
 * - Lawan benar (round >= 3) => lawan score += 1
 * - Win condition:
 *   - host.score <= -2 => otherTeam menang
 *   - otherTeam.score >= 2 => otherTeam menang
 */
export async function maybeScoreCurrentRound(gameId) {
  // ambil state game
  const gameSnap = await get(gameRef(gameId));
  if (!gameSnap.exists()) return;
  const game = gameSnap.val();
  const round = game.currentRound || 1;

  // ambil data round
  const rSnap = await get(roundRef(gameId, round));
  if (!rSnap.exists()) return;
  const rData = rSnap.val() || {};

  if (rData.scored === true) return; // sudah dinilai
  const code = rData.code;
  if (!Array.isArray(code) || code.length !== 3) return;

  // ambil order tim
  const orderSnap = await get(teamOrderRef(gameId));
  const teamOrder = orderSnap.val();
  if (!Array.isArray(teamOrder) || teamOrder.length < 2) return;

  const hostTeam = getHostTeam(teamOrder, round);
  const otherTeam = getOtherTeam(teamOrder, round);

  const guesses = rData.guesses || {};
  const hostGuess = guesses[hostTeam];
  const otherGuess = guesses[otherTeam];

  // tunggu sampai kedua guess tersedia
  if (!Array.isArray(hostGuess) || hostGuess.length !== 3) return;
  if (!Array.isArray(otherGuess) || otherGuess.length !== 3) return;

  // set flag `scored` pakai transaction (idempotent)
  const scoredRef = ref(db, `games/${gameId}/rounds/${round}/scored`);
  const trx = await runTransaction(scoredRef, (prev) => {
    if (prev === true) return; // sudah dinilai
    return true;               // set true → kita yang nilai
  });
  if (!trx.committed || trx.snapshot.val() !== true) return;

  // ambil skor sekarang
  const tSnap = await get(teamsRef(gameId));
  const teams = tSnap.val() || {};
  const hostScoreNow  = (teams[hostTeam]?.score ?? 0);
  const otherScoreNow = (teams[otherTeam]?.score ?? 0);

  // hitung skor
  const codeKey  = code.join("-");
  const hostKey  = hostGuess.join("-");
  const otherKey = otherGuess.join("-");

  let newHostScore  = hostScoreNow;
  let newOtherScore = otherScoreNow;

  // host salah berlaku dari ronde pertama
  if (hostKey !== codeKey) {
    newHostScore -= 1;
  }

  // lawan benar berlaku dari ronde 3
  if (round >= 3 && otherKey === codeKey) {
    newOtherScore += 1;
  }

  const scoreUpdates = {
    [`games/${gameId}/teams/${hostTeam}/score`]: newHostScore,
    [`games/${gameId}/teams/${otherTeam}/score`]: newOtherScore,
  };

  // cek kemenangan
  let winner = null;
  if (newHostScore <= -2) winner = otherTeam;   // host kalah
  if (newOtherScore >= 2) winner = otherTeam;   // lawan menang

  if (winner) {
    scoreUpdates[`games/${gameId}/winner`] = winner;
  }

  await update(ref(db), scoreUpdates);
}
