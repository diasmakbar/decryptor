// scoring.js
import {
  ref, get, update, runTransaction
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-database.js";
import { db } from "./firebase.js";
import { gameRef, roundRef, codeRef, teamsRef, teamOrderRef, getHostTeam, getOtherTeam } from "./game-utils.js";

/**
 * Cek & lakukan scoring untuk round aktif (idempotent, pakai flag `scored`)
 * Aturan:
 * - Skor mulai dihitung dari round >= 3
 * - Host salah => host score -=1
 * - Lawan benar => lawan score +=1
 * - Kemenangan: score == 2 menang, atau lawan == -2 kalah → tim lain menang
 */
export async function maybeScoreCurrentRound(gameId) {
  // Ambil state game
  const gameSnap = await get(gameRef(gameId));
  if (!gameSnap.exists()) return;
  const game = gameSnap.val();
  const round = game.currentRound || 1;
  if (round < 3) return; // belum waktunya skor

  // Ambil data round
  const rSnap = await get(roundRef(gameId, round));
  if (!rSnap.exists()) return;
  const rData = rSnap.val() || {};
  if (rData.scored === true) return; // sudah dinilai

  // Pastikan code ada
  const code = rData.code;
  if (!Array.isArray(code) || code.length !== 3) return;

  // Ambil order tim (harus 2)
  const orderSnap = await get(teamOrderRef(gameId));
  const teamOrder = orderSnap.val();
  if (!Array.isArray(teamOrder) || teamOrder.length < 2) return;

  const hostTeam = getHostTeam(teamOrder, round);
  const otherTeam = getOtherTeam(teamOrder, round);

  const guesses = rData.guesses || {};
  const hostGuess = guesses[hostTeam];
  const otherGuess = guesses[otherTeam];

  // Tunggu sampai kedua guess tersedia
  if (!Array.isArray(hostGuess) || hostGuess.length !== 3) return;
  if (!Array.isArray(otherGuess) || otherGuess.length !== 3) return;

  // Set flag `scored` dengan transaction (biar sekali saja)
  const scoredRef = ref(db, `games/${gameId}/rounds/${round}/scored`);
  const trx = await runTransaction(scoredRef, (prev) => {
    if (prev === true) return; // abort → sudah dinilai
    return true;               // set true → kita yang menilai
  });
  if (!trx.committed || trx.snapshot.val() !== true) return; // pihak lain sudah menilai

  // Hitung skor
  const codeKey = code.join("-");
  const hostKey = hostGuess.join("-");
  const otherKey = otherGuess.join("-");

  const scoreUpdates = {};
  // default skor 0 kalau belum ada
  const hostScorePath  = `games/${gameId}/teams/${hostTeam}/score`;
  const otherScorePath = `games/${gameId}/teams/${otherTeam}/score`;

  // ambil skor sekarang
  const tSnap = await get(teamsRef(gameId));
  const teams = tSnap.val() || {};
  const hostScoreNow  = (teams[hostTeam]?.score ?? 0);
  const otherScoreNow = (teams[otherTeam]?.score ?? 0);

  let newHostScore  = hostScoreNow;
  let newOtherScore = otherScoreNow;

  if (hostKey !== codeKey) {
    newHostScore -= 1;
  }
  if (otherKey === codeKey) {
    newOtherScore += 1;
  }

  scoreUpdates[hostScorePath]  = newHostScore;
  scoreUpdates[otherScorePath] = newOtherScore;

  // Cek pemenang
  let winner = null;
  if (newOtherScore >= 2) winner = otherTeam;        // +2 menang
  if (newHostScore <= -2)  winner = otherTeam;       // lawan -2 -> other menang

  if (winner) {
    scoreUpdates[`games/${gameId}/winner`] = winner;
  }

  await update(ref(db), scoreUpdates);
}
