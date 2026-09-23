export function negateScore32(value) {
  return -value;
}

export function raiseLowerBound32(alpha, value) {
  return value > alpha ? value : alpha;
}

export function lowerUpperBound32(beta, value) {
  return value < beta ? value : beta;
}

export function cutoff32(alpha, beta) {
  return alpha >= beta;
}

export function argMaxPlayable32(scoresInOrder, order, count, none) {
  let bestIndex = -1;
  let bestScore = -2147483648;
  for (let index = 0; index < count; index += 1) {
    const score = scoresInOrder[index];
    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  }
  return bestIndex < 0 ? none : order[bestIndex];
}
