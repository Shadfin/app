/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { QuantizerCelebi } from '../quantize/quantizer_celebi.js'
import { Score } from '../score/score.js'

import { argbFromRgb } from './color_utils.js'

/**
 * Get ranked colors from image bytes.
 *
 * @param imageBytes The image bytes
 * @return Ranked colors - the colors most suitable for creating a UI theme
 */
export function rankedColorsFromImageBytes(imageBytes: Uint8ClampedArray) {
  // Convert Image data to Pixel Array
  const pixels: number[] = []
  for (let i = 0; i < imageBytes.length; i += 4) {
    const r = imageBytes[i]
    const g = imageBytes[i + 1]
    const b = imageBytes[i + 2]
    const a = imageBytes[i + 3]
    if (a < 255) {
      continue
    }
    const argb = argbFromRgb(r, g, b)
    pixels.push(argb)
  }

  // Convert Pixels to Material Colors
  const result = QuantizerCelebi.quantize(pixels, 128)
  const ranked = Score.score(result)
  return ranked
}
