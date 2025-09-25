// scoring.js
import { ref, get, update } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-database.js";
import { db } from "./firebase.js";
import { gameRef, roundRef, getHostTeam, getOtherTeam } from "./game-utils.js";

export async function maybeScoreCurrentRound(gameId) {
  const gameSnap = await get(gameRef(gameId));
  if (!gameSnap.exists()) return;
  const game = gameSnap.val();

  const round = game.currentRound || 1;
  const teams = game.teams || {};
  const teamCount = Object.keys(teams).length;
  const roundSnap = await get(roundRef(gameId, round));
  if (!roundSnap.exists()) return;
  const r = roundSnap.val();

  const guesses = r.guesses || {};
  const clues   = r.clues   || {};
  const code    = r.code    || null;

  // belum ada kode → skip
  if (!code) return;

  // cek apakah semua tim sudah submit
  const submittedTeams = Object.keys(guesses).length;
  if (submittedTeams < teamCount) return; // tunggu semua submit

  // ✅ Semua tim sudah submit → lanjut scoring
  let newScores = { ...teams };

  const hostTeam  = getHostTeam(Object.keys(teams), round);
  const otherTeam = getOtherTeam(Object.keys(teams), round);
  const codeKey   = code.join("-");

  Object.entries(guesses).forEach(([t, g]) => {
    const guessKey = g.join("-");
    if (t === hostTeam) {
      // host salah → minus 1
      if (guessKey !== codeKey) {
        newScores[t].score = (newScores[t].score || 0) - 1;
      }
    } else {
      // tim lawan: poin baru dihitung mulai round ke-(teamCount+1)
      if (round >= teamCount + 1 && guessKey === codeKey) {
        newScores[t].score = (newScores[t].score || 0) + 1;
      }
    }
  });

  // update Firebase
  const updates = {};

  // update skor tiap tim
  Object.entries(newScores).forEach(([t, obj]) => {
    updates[`games/decrypto/${gameId}/teams/${t}/score`] = obj.score;
  });

  // tandai round sudah direveal
  updates[`games/decrypto/${gameId}/rounds/${round}/revealed`] = true;

  // cek pemenang
  const winner = checkWinner(newScores);
  if (winner) {
    updates[`games/decrypto/${gameId}/winner`] = winner;
  }

  await update(ref(db), updates);
}

// ✅ Cek pemenang: 
// - Kalau ada tim dengan score <= -2 → kalah → tim lain menang
// - Kalau ada tim dengan score >= +2 → langsung menang
function checkWinner(teams) {
  const entries = Object.entries(teams);

  // cek kalah -2
  const loser = entries.find(([t, obj]) => (obj.score || 0) <= -2);
  if (loser) {
    const winner = entries.find(([t, obj]) => t !== loser[0]);
    return winner ? winner[0] : null;
  }

  // cek menang +2
  const win = entries.find(([t, obj]) => (obj.score || 0) >= 2);
  if (win) return win[0];

  return null;
}
