# Cycle reduction round-070 — power-of-two coordinate decode

Physical cells use row-major indexing:

cell = row * columns + column

When runtime-configured columns is a power of two, initialization can prepare:

columnMask = columns - 1
columnShift = log2(columns)

Then:

column = cell & columnMask
row = cell >>> columnShift

Each decode costs one ALU cycle instead of an L1/L2/L3 table load.

The generic coordinate tables remain for non-power-of-two widths. If no other consumer needs coordinate tables, eligible configurations can omit their initialization and storage entirely.
