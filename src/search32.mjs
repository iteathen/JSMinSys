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

export function argMaxPlayable32(scores, heights, order, count, fullHeight, none) {
  let best = none;
  let bestScore = -2147483648;
  for (let index = 0; index < count; index += 1) {
    const column = order[index];
    if (heights[column] >= fullHeight) continue;
    const score = scores[column];
    if (score > bestScore) {
      bestScore = score;
      best = column;
    }
  }
  return best;
}
