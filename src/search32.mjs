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

export function maxValueCutsOff32(value, beta) {
  return value >= beta;
}

export function minValueCutsOff32(value, alpha) {
  return value <= alpha;
}

export function argMaxPlayable32(scoresInOrder, order, count, none) {
  let bestIndex = -1;
  let bestScore = -2147483648;
  let index = 0;
  const paired = count & ~1;

  for (; index < paired; index += 2) {
    let score = scoresInOrder[index];
    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }

    score = scoresInOrder[index + 1];
    if (score > bestScore) {
      bestScore = score;
      bestIndex = index + 1;
    }
  }

  if (index < count) {
    const score = scoresInOrder[index];
    if (score > bestScore) bestIndex = index;
  }
  return bestIndex < 0 ? none : order[bestIndex];
}

export function argMaxPlayableSlot32(scoresInOrder, count) {
  let bestIndex = -1;
  let bestScore = -2147483648;
  let index = 0;
  const paired = count & ~1;

  for (; index < paired; index += 2) {
    let score = scoresInOrder[index];
    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }

    score = scoresInOrder[index + 1];
    if (score > bestScore) {
      bestScore = score;
      bestIndex = index + 1;
    }
  }

  if (index < count) {
    const score = scoresInOrder[index];
    if (score > bestScore) bestIndex = index;
  }
  return bestIndex;
}

export function argMaxPlayableSlot7Nonempty32(scoresInOrder) {
  let bestIndex = 0;
  let bestScore = scoresInOrder[0];

  let score = scoresInOrder[1];
  if (score > bestScore) {
    bestScore = score;
    bestIndex = 1;
  }

  score = scoresInOrder[2];
  if (score > bestScore) {
    bestScore = score;
    bestIndex = 2;
  }

  score = scoresInOrder[3];
  if (score > bestScore) {
    bestScore = score;
    bestIndex = 3;
  }

  score = scoresInOrder[4];
  if (score > bestScore) {
    bestScore = score;
    bestIndex = 4;
  }

  score = scoresInOrder[5];
  if (score > bestScore) {
    bestScore = score;
    bestIndex = 5;
  }

  score = scoresInOrder[6];
  if (score > bestScore) bestIndex = 6;

  return bestIndex;
}

export function physicalColumnFromMoveSlot32(order, slot) {
  return order[slot];
}

export function argMaxPlayableSlot7ScalarsNonempty32(
  score0,
  score1,
  score2,
  score3,
  score4,
  score5,
  score6,
) {
  let bestIndex = 0;
  let bestScore = score0;

  if (score1 > bestScore) {
    bestScore = score1;
    bestIndex = 1;
  }
  if (score2 > bestScore) {
    bestScore = score2;
    bestIndex = 2;
  }
  if (score3 > bestScore) {
    bestScore = score3;
    bestIndex = 3;
  }
  if (score4 > bestScore) {
    bestScore = score4;
    bestIndex = 4;
  }
  if (score5 > bestScore) {
    bestScore = score5;
    bestIndex = 5;
  }
  if (score6 > bestScore) bestIndex = 6;

  return bestIndex;
}

