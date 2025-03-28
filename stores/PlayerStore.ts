import type {
  BaseItemDto,
  MediaStream,
  PlaybackInfoResponse,
} from '@jellyfin/sdk/lib/generated-client'
import type { ILogger } from 'hls.js'
import { defineStore } from 'pinia'
import {
  createAudioSource,
  createSubtitleSource,
  createVideoSource,
  getVideoResolutionFromVideoSource,
  VideoBitrate,
  VideoResolution,
} from '~/lib/player'

export enum VideoQualityPreset {
  ADAPTIVE,
  DISPLAY,
  SOURCE,
}

export interface VideoSource {
  source: MediaStream
  hdr: boolean
  dolbyDigital: boolean
  title: string
}

export interface AudioSource {
  source: MediaStream
  dolbyAudio: boolean
  dtsAudio: boolean
  title: string
}

export interface SubtitleSource {
  source?: MediaStream
  title: string
}

export interface HLSLog {
  type: LogLevel
  message?: unknown
  optionalParams: unknown[]
}

export type LogLevel = 'trace' | 'debug' | 'log' | 'warn' | 'info' | 'error'
export class HLSLogAdapter implements ILogger {
  logs: HLSLog[]
  constructor(logs: HLSLog[]) {
    this.logs = logs
  }

  trace(_?: unknown, ...__: unknown[]) {}
  debug(_?: unknown, ...__: unknown[]) {}

  log(message?: unknown, ...optionalParams: unknown[]) {
    this.logs.push({ type: 'log', message, optionalParams })
  }

  warn(message?: unknown, ...optionalParams: unknown[]) {
    this.logs.push({ type: 'warn', message, optionalParams })
  }

  info(message?: unknown, ...optionalParams: unknown[]) {
    this.logs.push({ type: 'info', message, optionalParams })
  }

  error(message?: unknown, ...optionalParams: unknown[]) {
    this.logs.push({ type: 'error', message, optionalParams })
  }
}

export const usePlayerStore = defineStore('player', {
  state: () => ({
    hideControls: true,
    loaded: false,
    type: 'transcode' as 'transcode' | 'direct' | 'native',
    pause: null as null | (() => void),
    duration: 0,
    seeking: {
      value: false,
      position: 0,
    },

    loading: true,
    paused: true,
    volume: 100,
    muted: false,
    pictureInPicture: false,
    fullscreen: false,

    position: {
      value: 0,
      percent: 0,
    },

    positionTimeline: 0,

    buffer: {
      percent: 0,
    },

    video: null as null | VideoSource,
    audio: null as null | AudioSource,
    subtitle: null as null | SubtitleSource,

    subtitleSyncCallback: null as null | ((currentTime: number) => void),
    subtitleLoading: null as null | string,
    subtitleTimeSyncOffset: 0 as number,
    item: null as null | BaseItemDto,

    debug: {
      enabled: false,
      hls: false,
      data: {
        logs: [] as HLSLog[],
      },
    },
    settings: {
      native: {
        transparent: false,
        enabled: true,
      },
      subtitle: {
        global: 'video_width',
      },

      video_new: {
        preset: VideoQualityPreset.ADAPTIVE,
        resolution: VideoResolution.ULTRA_HD,
        bitrate: {
          value: 0,
          type: VideoBitrate.MEDIUM,
        },
      },
      video: {
        global: {
          height: 480,
          bitrate: 'auto',
        },
        local: {
          bitrate: 'auto',
          height: 480,
        },
      },

      audio: {},
    },
  }),
  actions: {
    getDefaultMediaStreams(playback: PlaybackInfoResponse | BaseItemDto) {
      if (!playback.MediaSources || !playback.MediaSources[0])
        throw new PlaybackInfoError('No MediaSource found', playback)
      const mediaSource = playback.MediaSources[0]
      const mediaStreams = mediaSource.MediaStreams!

      const defaultVideo = mediaStreams.find(
        src => src.Type === 'Video' && src.IsDefault,
      )
      const defaultAudio = mediaStreams.find(
        src => src.Type === 'Audio' && src.IsDefault,
      )
      const defaultSubtitle = mediaStreams.find(
        src => src.Type === 'Subtitle' && src.IsDefault,
      )

      this.video = createVideoSource(defaultVideo)
      this.audio = createAudioSource(defaultAudio)
      this.subtitle = createSubtitleSource(defaultSubtitle)
    },
    setPauseCallback(callback: () => void) {
      this.pause = callback
    },
    async getPlayerItem(id: string) {
      const browserStore = useMediaBrowserStore()

      this.item = await browserStore.getItem(id)

      return this.item
    },

    resetPlayer() {
      this.hideControls = true
      this.loaded = false
      this.seeking = { value: false, position: 0 }
      this.loading = true
      this.paused = true
      this.volume = 100
      this.muted = false
      this.pictureInPicture = false
      this.fullscreen = false
      this.position = { value: 0, percent: 0 }
      this.positionTimeline = 0
      this.buffer = { percent: 0 }
      this.video = null
      this.audio = null
      this.subtitle = null
      this.subtitleSyncCallback = null
      this.subtitleLoading = null
      this.subtitleTimeSyncOffset = 0
      this.item = null
      this.settings.video.local = this.settings.video.global
    },

    createLogger() {
      return new HLSLogAdapter(this.debug.data.logs)
    },

    isResolutionSupported(resolution: VideoResolution) {
      if (!this.video) return false
      return getVideoResolutionFromVideoSource(this.video.source) >= resolution
    },

    setVideoQuality(type: { resolution: VideoResolution, bitrate: VideoBitrate }, bitrate: number) {
      this.settings.video_new = {
        preset: VideoQualityPreset.SOURCE,
        resolution: type.resolution,
        bitrate: {
          type: type.bitrate,
          value: bitrate,
        },
      }
    },
  },

  persist: {
    pick: [
      'settings.video.global',
      'settings.native.enabled',
      'debug.enabled',
      'debug.hls',
    ],
  },
})

export class PlaybackInfoError extends Error {
  info?: PlaybackInfoError | unknown

  constructor(msg: string, info?: PlaybackInfoResponse | unknown) {
    super(msg)
    this.info = info

    Object.setPrototypeOf(this, PlaybackInfoError.prototype)
  }
}
