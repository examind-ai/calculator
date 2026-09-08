# Manual testing

This is the hand-run checklist for the calculator. It has two parts:

1. **Host checks**, written by hand. These need a person in the real host
   (the EXAMIND assessment room, the demo page, a tablet), because they are
   about focus, clipboard, layout and theme, which no unit test can see.
2. **Engine checks**, generated from `packages/core/src/golden.json`. Every
   row is asserted by the test suite on each commit, so the expected values
   here are exactly what the engine produces. Do not edit that part by hand:
   run `pnpm docs:manual` after changing the table.

Conventions used below:

- Keys are shown as they appear on the keypad. Digits and the point are run
  together, so `123.45` means press 1, 2, 3, ., 4, 5.
- `AC` is the clear key when its label reads AC (keyboard: Escape). `CE` is
  the same key when its label reads C (keyboard: Delete).
- `paste "text"` means put that text on the clipboard, focus the calculator,
  press Ctrl+V (Cmd+V on Mac).
- Displays include thousands separators, as the UI shows them.
- Start every row from a cleared calculator (press AC until it reads 0).

## Host checks

Do these in the real host, in every browser students use, and once on a
tablet if the exam supports one.

### Focus and keyboard

| Do | Expect |
| --- | --- |
| Click the calculator, type `7 + 8` Enter | Shows `15`. Nothing else on the page reacted to those keys. |
| Click into a text field on the page, type `7 + 8` | The calculator did not change. |
| Tab from a page field toward the calculator | Focus reaches the calculator once; Tab leaves it again; nothing is trapped. |
| With the calculator focused, press Escape | Calculator clears. No panel or dialog on the page closed. |
| With the calculator focused, press Backspace | Deletes a digit. The browser did not navigate back. |
| With the calculator focused, press Delete | Acts as CE (clears the current entry only). |
| Type an unmapped key such as `a`, F5, an arrow key | Ignored by the calculator. |

### Clipboard

| Do | Expect |
| --- | --- |
| Copy a number from page text, focus the calculator, Ctrl+V | It appears, with thousands separators. |
| Paste `1,234.50` from page text, then `× 2 =` | `2,469` |
| Paste a word | `Invalid input`; pressing `7` recovers. |
| Ctrl+V with focus in a page text field | Text goes to the field, not the calculator. |
| Right-click the calculator | No Paste item in the browser menu (by browser design; Ctrl+V only). |
| Select the display text, Ctrl+C, paste into a page field | Note what arrives (the grouped text, e.g. `1,234.5`). |

### Layout and theme

| Do | Expect |
| --- | --- |
| Type `123456789012345` | Fits on one line; font shrinks; no clipping. |
| `9 x²` five times, then a sixth | `3.43368382029251e+30` then `1.17901845777386e+61`, both fully visible. |
| Resize the host panel to its narrowest | Display refits; no clipping; keys still tappable. |
| Resize back to widest | Font returns to normal size. |
| `1234567 × 1234567 =` | Top line may end in an ellipsis; the main line is whole. |
| Switch the host between light and dark theme | Key labels legible; operators and `=` distinguishable; colours come from the host. |

## Engine checks

Generated from the golden table. 217 rows in 23 groups.

### Entry and editing

| Keys | Display | Expression line |
| --- | --- | --- |
| `(nothing)` | `0` | `0` |
| `007` | `7` | `7` |
| `1.5.5` | `1.55` | `1.55` |
| `.5` | `0.5` | `0.5` |
| `123 ⌫` | `12` | `12` |
| `1 ⌫` | `0` | `0` |
| `1 ⌫ ⌫` | `0` | `0` |
| `5 ± ⌫` | `0` | `0` |
| `12345678901234567` | `123,456,789,012,345` | `123,456,789,012,345` |

### Arithmetic and precedence

| Keys | Display | Expression line |
| --- | --- | --- |
| `7 + 8 =` | `15` | `7 + 8 =` |
| `7 + 8` | `8` | `7 + 8` |
| `7 +` | `7` | `7 +` |
| `2 + 3 × 4 =` | `14` | `2 + 3 × 4 =` |
| `2 × 3 + 4 =` | `10` | `2 × 3 + 4 =` |
| `10 − 2 − 3 =` | `5` | `10 − 2 − 3 =` |
| `10 ÷ 2 ÷ 5 =` | `1` | `10 ÷ 2 ÷ 5 =` |
| `12 − 2 × 3 =` | `6` | `12 − 2 × 3 =` |
| `0.1 + 0.2 =` | `0.3` | `0.1 + 0.2 =` |
| `1 ÷ 3 =` | `0.333333333333333` | `1 ÷ 3 =` |
| `2 ÷ 3 =` | `0.666666666666667` | `2 ÷ 3 =` |
| `1 ÷ 3 = × 3 =` | `1` | `0.333333333333333 × 3 =` |
| `1 ÷ 3 = × 3 = − 1 =` | `0` | `1 − 1 =` |
| `2 √ x² − 2 =` | `0` | `2 − 2 =` |
| `1 ÷ 7 × 7 − 1 =` | `0` | `1 ÷ 7 × 7 − 1 =` |
| `99999999 × 99999999 =` | `9.9999998e+15` | `99,999,999 × 99,999,999 =` |
| `1234567 × 1234567 =` | `1,524,155,677,489` | `1,234,567 × 1,234,567 =` |
| `5 × 0.000001 =` | `0.000005` | `5 × 0.000001 =` |
| `5 × 0.0000001 =` | `5e-7` | `5 × 1e-7 =` |
| `5. +` | `5` | `5 +` |
| `5. + 2 =` | `7` | `5 + 2 =` |
| `1 ÷ 80000000 =` | `1.25e-8` | `1 ÷ 80,000,000 =` |
| `5. =` | `5` | `5 =` |
| `0. =` | `0` | `0 =` |
| `5 ± =` | `-5` | `-5 =` |
| `− 5 =` | `-5` | `0 − 5 =` |

### Operator swap and bare equals

| Keys | Display | Expression line |
| --- | --- | --- |
| `2 + × 3 =` | `6` | `2 × 3 =` |
| `2 + − 3 =` | `-1` | `2 − 3 =` |
| `9 =` | `9` | `9 =` |
| `9 = =` | `9` | `9 =` |
| `5 + =` | `10` | `5 + 5 =` |
| `5 × =` | `25` | `5 × 5 =` |

### Repeated equals

| Keys | Display | Expression line |
| --- | --- | --- |
| `9 × 6 =` | `54` | `9 × 6 =` |
| `9 × 6 = =` | `324` | `54 × 6 =` |
| `9 × 6 = = =` | `1,944` | `324 × 6 =` |
| `7 + 8 = =` | `23` | `15 + 8 =` |
| `10 − 3 = =` | `4` | `7 − 3 =` |
| `100 ÷ 10 = =` | `1` | `10 ÷ 10 =` |
| `9 × 6 = √ =` | `7.34846922834953` | `7.34846922834953 =` |
| `7 + 8 = ± =` | `-15` | `-15 =` |

### Continuing from a result

| Keys | Display | Expression line |
| --- | --- | --- |
| `7 + 8 = × 2 =` | `30` | `15 × 2 =` |
| `7 + 8 = 2 × 3 =` | `6` | `2 × 3 =` |
| `7 + 8 = .5 =` | `0.5` | `0.5 =` |
| `7 + 8 = √` | `3.87298334620742` | `3.87298334620742` |
| `7 + 8 = x²` | `225` | `225` |

### Percent

| Keys | Display | Expression line |
| --- | --- | --- |
| `50 %` | `0.5` | `0.5` |
| `200 + 10 %` | `20` | `200 + 20` |
| `200 + 10 % =` | `220` | `200 + 20 =` |
| `200 − 10 % =` | `180` | `200 − 20 =` |
| `200 × 10 % =` | `4,000` | `200 × 20 =` |
| `200 ÷ 10 % =` | `10` | `200 ÷ 20 =` |
| `7 + 8 = %` | `0.15` | `0.15` |
| `50 % %` | `0.005` | `0.005` |

### Unary operators

| Keys | Display | Expression line |
| --- | --- | --- |
| `9 √` | `3` | `3` |
| `2 √` | `1.4142135623731` | `1.4142135623731` |
| `5 x²` | `25` | `25` |
| `4 1/x` | `0.25` | `0.25` |
| `3 1/x 1/x` | `3` | `3` |
| `5 + 9 √ =` | `8` | `5 + 3 =` |
| `5 + 9 √ + 2 =` | `10` | `5 + 3 + 2 =` |
| `2 √ x²` | `2` | `2` |
| `1.5 x²` | `2.25` | `2.25` |
| `0.1 x²` | `0.01` | `0.01` |

### Negate

| Keys | Display | Expression line |
| --- | --- | --- |
| `5 ±` | `-5` | `-5` |
| `5 ± ±` | `5` | `5` |
| `0 ±` | `0` | `0` |
| `5 + ±` | `5` | `5 +` |
| `5 + ± 3 =` | `8` | `5 + 3 =` |
| `5 + 3 ± =` | `2` | `5 + -3 =` |
| `9 × 6 = ±` | `-54` | `-54` |
| `9 × 6 = ± × 2 =` | `-108` | `-54 × 2 =` |
| `0.5 ± ⌫ ⌫ 3` | `-3` | `-3` |

### Clear entry vs clear all

| Keys | Display | Expression line |
| --- | --- | --- |
| `5 × 7 CE` | `0` | `5 ×` |
| `5 × 7 CE 8 =` | `40` | `5 × 8 =` |
| `5 × 7 AC` | `0` | `0` |
| `7 + 8 = CE` | `0` | `0` |
| `7 + 8 = CE 2 =` | `2` | `2 =` |
| `7 + 8 = AC 2 =` | `2` | `2 =` |
| `5 CE 3` | `3` | `3` |

### Paste

| Keys | Display | Expression line |
| --- | --- | --- |
| `paste "1,234.5"` | `1,234.5` | `1,234.5` |
| `paste "1,234.5" + 1 =` | `1,235.5` | `1,234.5 + 1 =` |
| `5 + paste "3" =` | `8` | `5 + 3 =` |
| `7 + 8 = paste "2" × 3 =` | `6` | `2 × 3 =` |
| `paste "3.14159265358979323846"` | `3.14159265358979` | `3.14159265358979` |
| `paste "1e-7"` | `1e-7` | `1e-7` |
| `paste "$2,000" × 1.5 =` | `3,000` | `2,000 × 1.5 =` |
| `paste "-3" x²` | `9` | `9` |
| `paste "12" 3` | `3` | `3` |
| `paste "abc"` | `Invalid input` | `0` |
| `5 paste "abc"` | `Invalid input` | `0` |
| `5 + paste "abc"` | `Invalid input` | `5 +` |
| `5 + paste "abc" 3 =` | `8` | `5 + 3 =` |
| `5 + paste "abc" ×` | `Invalid input` | `5 +` |
| `7 paste "abc" × 3 =` | `3` | `3 =` |
| `paste "abc" 7` | `7` | `7` |
| `paste "abc" paste "5"` | `5` | `5` |
| `paste "abc" AC` | `0` | `0` |
| `7 + 8 = paste "abc"` | `Invalid input` | `0` |
| `5 ÷ 0 = paste "3"` | `Error` | `(blank)` |

### Errors and recovery

| Keys | Display | Expression line |
| --- | --- | --- |
| `5 ÷ 0 =` | `Error` | `(blank)` |
| `5 ÷ 0 = 7` | `Error` | `(blank)` |
| `5 ÷ 0 = +` | `Error` | `(blank)` |
| `5 ÷ 0 = AC` | `0` | `0` |
| `5 ÷ 0 = AC 7` | `7` | `7` |
| `5 ÷ 0 = CE` | `0` | `0` |
| `0 1/x` | `Error` | `(blank)` |
| `4 ± √` | `Error` | `(blank)` |
| `4 ± √ AC 4 √` | `2` | `2` |
| `5 + 0 1/x` | `Error` | `(blank)` |

### Rounding at the 15th digit

| Keys | Display | Expression line |
| --- | --- | --- |
| `1 ÷ 6 =` | `0.166666666666667` | `1 ÷ 6 =` |
| `5 ÷ 9 =` | `0.555555555555556` | `5 ÷ 9 =` |
| `1 ÷ 7 =` | `0.142857142857143` | `1 ÷ 7 =` |
| `22 ÷ 7 =` | `3.14285714285714` | `22 ÷ 7 =` |
| `1 ÷ 3 = + 1 ÷ 3 = + 1 ÷ 3 =` | `1` | `0.666666666666667 + 1 ÷ 3 =` |
| `0.1 + 0.7 =` | `0.8` | `0.1 + 0.7 =` |
| `1 − 0.9 =` | `0.1` | `1 − 0.9 =` |
| `1.1 × 1.1 =` | `1.21` | `1.1 × 1.1 =` |

### Cancellation and tiny differences

| Keys | Display | Expression line |
| --- | --- | --- |
| `1000000 − 999999.999999 =` | `0.000001` | `1,000,000 − 999,999.999999 =` |
| `1.00000000000001 − 1 =` | `1e-14` | `1.00000000000001 − 1 =` |
| `0.3 − 0.1 − 0.1 − 0.1 =` | `0` | `0.3 − 0.1 − 0.1 − 0.1 =` |
| `123456789012345 − 123456789012344 =` | `1` | `123,456,789,012,345 − 123,456,789,012,344 =` |
| `999999999999999 + 1 =` | `1e+15` | `999,999,999,999,999 + 1 =` |
| `1 ÷ 7 × 7 − 1 =` | `0` | `1 ÷ 7 × 7 − 1 =` |
| `0.1 × 3 − 0.3 =` | `0` | `0.1 × 3 − 0.3 =` |
| `1 ÷ 3 = × 3 = − 1 =` | `0` | `1 − 1 =` |
| `2 √ x² − 2 =` | `0` | `2 − 2 =` |
| `3 √ x² − 3 =` | `0` | `3 − 3 =` |

### Exponent boundaries

| Keys | Display | Expression line |
| --- | --- | --- |
| `100000000000000 × 10 =` | `1e+15` | `100,000,000,000,000 × 10 =` |
| `0.000001 × 1 =` | `0.000001` | `0.000001 × 1 =` |
| `0.000001 ÷ 10 =` | `1e-7` | `0.000001 ÷ 10 =` |
| `1 ÷ 1000000 =` | `0.000001` | `1 ÷ 1,000,000 =` |
| `1 ÷ 10000000 =` | `1e-7` | `1 ÷ 10,000,000 =` |
| `123456789012345 × 10 =` | `1.23456789012345e+15` | `123,456,789,012,345 × 10 =` |
| `123456789012345 × 10 = ÷ 10 =` | `123,456,789,012,345` | `1.23456789012345e+15 ÷ 10 =` |
| `1 ÷ 3 = × 100000000000000 =` | `33,333,333,333,333.3` | `0.333333333333333 × 100,000,000,000,000 =` |
| `999999999999999 × 999999999999999 =` | `9.99999999999998e+29` | `999,999,999,999,999 × 999,999,999,999,999 =` |

### Chained unary

| Keys | Display | Expression line |
| --- | --- | --- |
| `2 √ √ x² x²` | `2` | `2` |
| `10 1/x (4 times)` | `10` | `10` |
| `3 x² √` | `3` | `3` |
| `0.5 1/x x²` | `4` | `4` |
| `7 √ x² √ x²` | `7` | `7` |
| `16 √ x² 1/x` | `0.0625` | `0.0625` |
| `0.0001 √` | `0.01` | `0.01` |
| `100000000000000 √` | `10,000,000` | `10,000,000` |

### Negatives and precedence

| Keys | Display | Expression line |
| --- | --- | --- |
| `5 ± × 3 ± =` | `15` | `-5 × -3 =` |
| `2 − 3 ± × 4 =` | `14` | `2 − -3 × 4 =` |
| `2 ± x²` | `4` | `4` |
| `2 ± x² √` | `2` | `2` |
| `0 − 5 = x²` | `25` | `25` |
| `10 − 2 × 3 − 4 ÷ 2 =` | `2` | `10 − 2 × 3 − 4 ÷ 2 =` |
| `2 × 3 ± + 4 × 5 ± =` | `-26` | `2 × -3 + 4 × -5 =` |
| `1 ÷ 3 ± = × 3 ± =` | `1` | `-0.333333333333333 × -3 =` |

### Percent chains

| Keys | Display | Expression line |
| --- | --- | --- |
| `100 + 50 % =` | `150` | `100 + 50 =` |
| `100 + 50 % + 50 % =` | `175` | `100 + 50 + 25 =` |
| `200 × 10 % × 2 =` | `8,000` | `200 × 20 × 2 =` |
| `100 − 100 % =` | `0` | `100 − 100 =` |
| `0.5 %` | `0.005` | `0.005` |
| `100 + 1 ÷ 3 % =` | `133.333333333333` | `100 + 1 ÷ 0.03 =` |
| `800 ÷ 20 % =` | `5` | `800 ÷ 160 =` |
| `200 + 10 % + 5 =` | `225` | `200 + 20 + 5 =` |

### Repeated equals with division and negatives

| Keys | Display | Expression line |
| --- | --- | --- |
| `100 ÷ 10 = = =` | `0.1` | `1 ÷ 10 =` |
| `1 ÷ 10 = = =` | `0.001` | `0.01 ÷ 10 =` |
| `8 ÷ 2 ± = =` | `2` | `-4 ÷ -2 =` |
| `2 × 3 = (5 times)` | `486` | `162 × 3 =` |
| `1000 − 1 = = =` | `997` | `998 − 1 =` |
| `1 ÷ 3 = = =` | `0.037037037037037` | `0.111111111111111 ÷ 3 =` |
| `5 × 5 = √ = =` | `5` | `5 =` |

### Entry cap and editing

| Keys | Display | Expression line |
| --- | --- | --- |
| `1234567890123456789` | `123,456,789,012,345` | `123,456,789,012,345` |
| `0.000001234567890123456` | `0.00000123456789012345` | `0.00000123456789012345` |
| `123.45 ⌫ ⌫ ⌫` | `123` | `123` |
| `123.45 ⌫ (5 times)` | `1` | `1` |
| `123.45 ⌫ (6 times)` | `0` | `0` |
| `..5.5` | `0.55` | `0.55` |
| `000.5` | `0.5` | `0.5` |
| `5 ± ⌫ ⌫ 3` | `3` | `3` |
| `123456789012345.67` | `123,456,789,012,345.` | `123,456,789,012,345.` |
| `123456789012345 ⌫ ⌫ 99` | `123,456,789,012,399` | `123,456,789,012,399` |

### Digit grouping

| Keys | Display | Expression line |
| --- | --- | --- |
| `1234567` | `1,234,567` | `1,234,567` |
| `1234.50` | `1,234.50` | `1,234.50` |
| `1234.` | `1,234.` | `1,234.` |
| `1234 ± + 1000 =` | `-234` | `-1,234 + 1,000 =` |
| `123456789012345` | `123,456,789,012,345` | `123,456,789,012,345` |
| `0.123456789` | `0.123456789` | `0.123456789` |

### Paste with arithmetic

| Keys | Display | Expression line |
| --- | --- | --- |
| `paste "1e15"` | `1e+15` | `1e+15` |
| `paste "999999999999999.9"` | `1e+15` | `1e+15` |
| `paste "0.1" + paste "0.2" =` | `0.3` | `0.1 + 0.2 =` |
| `paste "1/3"` | `Invalid input` | `0` |
| `paste "1,000,000" ÷ 3 =` | `333,333.333333333` | `1,000,000 ÷ 3 =` |
| `paste "-0" + 5 =` | `5` | `0 + 5 =` |
| `paste "00012.50"` | `12.5` | `12.5` |
| `paste "1e-6"` | `0.000001` | `0.000001` |
| `paste "1E-7" × 10 =` | `0.000001` | `1e-7 × 10 =` |
| `5 + paste "3" × paste "2" =` | `11` | `5 + 3 × 2 =` |
| `paste "2" √ x²` | `2` | `2` |
| `paste "12345678901234567"` | `1.23456789012346e+16` | `1.23456789012346e+16` |
| `paste "12345678901234567" ÷ 1000000 =` | `12,345,678,901.2346` | `1.23456789012346e+16 ÷ 1,000,000 =` |

### Zero handling

| Keys | Display | Expression line |
| --- | --- | --- |
| `0 × 5 ± =` | `0` | `0 × -5 =` |
| `0 ÷ 5 =` | `0` | `0 ÷ 5 =` |
| `5 ± × 0 =` | `0` | `-5 × 0 =` |
| `0.000 =` | `0` | `0 =` |
| `0 ±` | `0` | `0` |
| `0.0 ± 5` | `-0.05` | `-0.05` |
| `0 √` | `0` | `0` |
| `0 x²` | `0` | `0` |
| `0 %` | `0` | `0` |
| `5 − 5 = ±` | `0` | `0` |

### Overflow

| Keys | Display | Expression line |
| --- | --- | --- |
| `9 x² (53 times)` | `1.08199600795e+8595052419864061` | `1.08199600795e+8595052419864061` |
| `9 x² (54 times)` | `Error` | `(blank)` |
