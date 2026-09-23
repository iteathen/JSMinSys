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

export function maxChildRaisesAlpha32(score, alpha) {
  return score > alpha;
}

export function minChildLowersBeta32(score, beta) {
  return score < beta;
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

export function argMaxPlayableSlot2Nonempty32(scoresInOrder) {
  let bestIndex = 0;
  let bestScore = scoresInOrder[0];

  let score = scoresInOrder[1];
  if (score > bestScore) {
    bestIndex = 1;
  }

  return bestIndex;
}

export function argMaxPlayableSlot3Nonempty32(scoresInOrder) {
  let bestIndex = 0;
  let bestScore = scoresInOrder[0];

  let score = scoresInOrder[1];
  if (score > bestScore) {
    bestScore = score;
    bestIndex = 1;
  }

  score = scoresInOrder[2];
  if (score > bestScore) {
    bestIndex = 2;
  }

  return bestIndex;
}

export function argMaxPlayableSlot4Nonempty32(scoresInOrder) {
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
    bestIndex = 3;
  }

  return bestIndex;
}

export function argMaxPlayableSlot5Nonempty32(scoresInOrder) {
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
    bestIndex = 4;
  }

  return bestIndex;
}

export function argMaxPlayableSlot6Nonempty32(scoresInOrder) {
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
    bestIndex = 5;
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

export function argMaxPlayableSlot8Nonempty32(scoresInOrder) {
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
  if (score > bestScore) {
    bestScore = score;
    bestIndex = 6;
  }

  score = scoresInOrder[7];
  if (score > bestScore) {
    bestIndex = 7;
  }

  return bestIndex;
}

export function argMaxPlayableSlot9Nonempty32(scoresInOrder) {
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
  if (score > bestScore) {
    bestScore = score;
    bestIndex = 6;
  }

  score = scoresInOrder[7];
  if (score > bestScore) {
    bestScore = score;
    bestIndex = 7;
  }

  score = scoresInOrder[8];
  if (score > bestScore) {
    bestIndex = 8;
  }

  return bestIndex;
}

export function argMaxPlayableSlot10Nonempty32(scoresInOrder) {
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
  if (score > bestScore) {
    bestScore = score;
    bestIndex = 6;
  }

  score = scoresInOrder[7];
  if (score > bestScore) {
    bestScore = score;
    bestIndex = 7;
  }

  score = scoresInOrder[8];
  if (score > bestScore) {
    bestScore = score;
    bestIndex = 8;
  }

  score = scoresInOrder[9];
  if (score > bestScore) {
    bestIndex = 9;
  }

  return bestIndex;
}

export function physicalColumnFromMoveSlot32(order, slot) {
  return order[slot];
}

export function argMaxPlayableSlot2ScalarsNonempty32(
  score0,
  score1,
) {
  let bestIndex = 0;
  let bestScore = score0;

  if (score1 > bestScore) {
    bestIndex = 1;
  }

  return bestIndex;
}

export function argMaxPlayableSlot3ScalarsNonempty32(
  score0,
  score1,
  score2,
) {
  let bestIndex = 0;
  let bestScore = score0;

  if (score1 > bestScore) {
    bestScore = score1;
    bestIndex = 1;
  }

  if (score2 > bestScore) {
    bestIndex = 2;
  }

  return bestIndex;
}

export function argMaxPlayableSlot4ScalarsNonempty32(
  score0,
  score1,
  score2,
  score3,
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
    bestIndex = 3;
  }

  return bestIndex;
}

export function argMaxPlayableSlot5ScalarsNonempty32(
  score0,
  score1,
  score2,
  score3,
  score4,
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
    bestIndex = 4;
  }

  return bestIndex;
}

export function argMaxPlayableSlot6ScalarsNonempty32(
  score0,
  score1,
  score2,
  score3,
  score4,
  score5,
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
    bestIndex = 5;
  }

  return bestIndex;
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

export function argMaxPlayableSlot8ScalarsNonempty32(
  score0,
  score1,
  score2,
  score3,
  score4,
  score5,
  score6,
  score7,
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

  if (score6 > bestScore) {
    bestScore = score6;
    bestIndex = 6;
  }

  if (score7 > bestScore) {
    bestIndex = 7;
  }

  return bestIndex;
}

export function argMaxPlayableSlot9ScalarsNonempty32(
  score0,
  score1,
  score2,
  score3,
  score4,
  score5,
  score6,
  score7,
  score8,
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

  if (score6 > bestScore) {
    bestScore = score6;
    bestIndex = 6;
  }

  if (score7 > bestScore) {
    bestScore = score7;
    bestIndex = 7;
  }

  if (score8 > bestScore) {
    bestIndex = 8;
  }

  return bestIndex;
}

export function argMaxPlayableSlot10ScalarsNonempty32(
  score0,
  score1,
  score2,
  score3,
  score4,
  score5,
  score6,
  score7,
  score8,
  score9,
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

  if (score6 > bestScore) {
    bestScore = score6;
    bestIndex = 6;
  }

  if (score7 > bestScore) {
    bestScore = score7;
    bestIndex = 7;
  }

  if (score8 > bestScore) {
    bestScore = score8;
    bestIndex = 8;
  }

  if (score9 > bestScore) {
    bestIndex = 9;
  }

  return bestIndex;
}

