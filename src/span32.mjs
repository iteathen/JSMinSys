export function equalSpan32At(a, aOffset, b, bOffset, wordCount) {
  for (let word = 0; word < wordCount; word += 1) {
    if (a[aOffset + word] !== b[bOffset + word]) return 0;
  }
  return 1;
}

export function subsetSpan32At(a, aOffset, b, bOffset, wordCount) {
  for (let word = 0; word < wordCount; word += 1) {
    if (a[aOffset + word] & ~b[bOffset + word]) return 0;
  }
  return 1;
}

export function orSpan32Into(out, outOffset, a, aOffset, b, bOffset, wordCount) {
  for (let word = 0; word < wordCount; word += 1) {
    out[outOffset + word] = a[aOffset + word] | b[bOffset + word];
  }
  return outOffset;
}

export function andSpan32Into(out, outOffset, a, aOffset, b, bOffset, wordCount) {
  for (let word = 0; word < wordCount; word += 1) {
    out[outOffset + word] = a[aOffset + word] & b[bOffset + word];
  }
  return outOffset;
}

export function andNotSpan32Into(out, outOffset, a, aOffset, b, bOffset, wordCount) {
  for (let word = 0; word < wordCount; word += 1) {
    out[outOffset + word] = a[aOffset + word] & ~b[bOffset + word];
  }
  return outOffset;
}

export function reverseSpan32Into(out, outOffset, source, sourceOffset, count) {
  for (let index = 0; index < count; index += 1) {
    out[outOffset + index] = source[sourceOffset + count - 1 - index];
  }
  return outOffset;
}
