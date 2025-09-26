// scoring.js
import {
  get, update, runTransaction, child
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-database.js";
import { db } from "./firebase.js";
import {
  gameRef, roundRef, getHostTeam
} from "./game-utils.js";

export async function maybeScoreCurrentRound(gameId) {
  // Ambil state game
  const gameSnap = await get(gameRef(gameId));
  if (!gameSnap.exists()) return;
  const game = gameSnap.val();

  const round = game.currentRound || 1;
  const teamsMap = game.teams || {};
  const teamNames = Object.keys(teamsMap);
  const teamCount = teamNames.length;
  if (teamCount === 0) return;

  const rSnap = await get(roundRef(gameId, round));
  if (!rSnap.exists()) return;
  const r = rSnap.val() || {};

  const code = r.code;
  if (!Array.isArray(code) || code.length !== 3) return; // belum ada code

  const guesses = r.guesses || {};
  const submittedTeams = Object.keys(guesses).length;

  // Belum semua tim submit → jangan nilai
  if (submittedTeams < teamCount) return;

  // Idempotent: supaya cuma sekali scoring per round
  const scoredRef = child(roundRef(gameId, round), "scored");
  const trx = await runTransaction(scoredRef, (prev) => (prev ? prev : true));
  if (!trx.committed || trx.snapshot.val() !== true) {
    return; // sudah pernah dinilai
  }

  // -------- Hitung skor --------
  const codeKey = code.join("-");
  const order = Array.isArray(game.teamOrder) && game.teamOrder.length >= 2
    ? game.teamOrder
    : teamNames;

  const hostTeam = getHostTeam(order, round);

  // Clone skor awal
  const scores = {};
  teamNames.forEach(t => { scores[t] = (teamsMap[t]?.score ?? 0); });

  // Host dihukum -1 kalau salah (berlaku dari round 1)
  {
    const hostGuess = guesses[hostTeam];
    if (Array.isArray(hostGuess) && hostGuess.length === 3) {
      if (hostGuess.join("-") !== codeKey) {
        scores[hostTeam] = (scores[hostTeam] ?? 0) - 1;
      }
    }
  }

  // Non-host dapat +1 kalau benar, mulai round >= teamCount+1
  if (round >= teamCount + 1) {
    for (const [t, g] of Object.entries(guesses)) {
      if (t === hostTeam) continue;
      if (Array.isArray(g) && g.length === 3) {
        if (g.join("-") === codeKey) {
          scores[t] = (scores[t] ?? 0) + 1;
        }
      }
    }
  }

  // -------- Eliminasi & Winner --------
  const eliminated = [];
  let winner = null;

  // Eliminasi tim ≤ -2
  for (const [t, s] of Object.entries(scores)) {
    if ((s ?? 0) <= -2) {
      eliminated.push(t);
    }
  }

  // Cek winner
  // 1. Ada yang +2 → langsung menang
  const plusTwo = Object.entries(scores).find(([t, s]) => (s ?? 0) >= 2);
  if (plusTwo) {
    winner = plusTwo[0];
  } else {
    // 2. Kalau sisa 1 tim yang belum eliminated → dia menang
    const aliveTeams = teamNames.filter(t => !eliminated.includes(t) && !(teamsMap[t]?.eliminated));
    if (aliveTeams.length === 1) {
      winner = aliveTeams[0];
    }
  }

  // -------- Commit ke Firebase --------
  const updates = {
    [`rounds/${round}/revealed`]: true,
  };

  // Update skor tiap tim
  teamNames.forEach(t => {
    updates[`teams/${t}/score`] = scores[t] ?? 0;
  });

  // Tandai eliminated
  eliminated.forEach(t => {
    updates[`teams/${t}/eliminated`] = true;
  });

  // Kalau ada winner final
  if (winner) updates[`winner`] = winner;

  await update(gameRef(gameId), updates);
}
