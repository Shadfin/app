import type HLS from 'hls.js'

declare global {
  interface Window {
    SECRET_PLAYER_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED?: HLS
    MATERIAL_YOU_DYNAMIC_COLOR_WORKER?: Worker
    chrome: {
      app: unknown
    }
    opr: unknown
    opera: unknown
    wails: unknown
    runtime: unknown
  }

  interface opr {
    addons: unknown
  }
}
