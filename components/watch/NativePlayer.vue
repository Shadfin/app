<script setup lang="ts">
import { setBackground } from '~/native/app/App'
import {
  onPlayerLoaded,
  onPlayerLoading,
  onPlayerMessage,
  onPlayerPlaybackRestart,
  onPlayerPosition,
} from '~/native/player/events'
import {
  destroy,
  setPlayerAudioTrack,
  setPlayerPause,
  setPlayerPosition,
  setPlayerSubtitleTrack,
  setURL,
  start,
} from '~/native/player/Player'
import { getAudioStreams, getSubtitleStreams } from '~/lib/player'

const { startPosition = 0 } = defineProps<{ startPosition: number }>()
const playerStore = usePlayerStore()
const mediaBrowser = useMediaBrowserStore()
const playbackStore = usePlaybackStore()

const item = computed(() => playerStore.item)
const paused = computed(() => playerStore.paused)
const position = computed(() => playerStore.positionTimeline)
const audioSource = computed(() => playerStore.audio)
const subtitleSource = computed(() => playerStore.subtitle)

const audioStreams = getAudioStreams(item.value!)
const subtitleStreams = getSubtitleStreams(item.value!, false)

const nativePlayerLoaded = ref(false)

const root = document.documentElement

playerStore.settings.native.transparent = true
playerStore.type = 'native'

onMounted(async () => {
  if (!item.value) return

  setBackground(0, 0, 0)
  root.setAttribute('transparent-player', 'true')
  const streamURL = mediaBrowser.generateDownloadURL(item.value)

  await setURL(streamURL)
  await start()

  onPlayerLoaded(async (duration_sec) => {
    await setPlayerPosition(ticksToSeconds(startPosition))
    if (item.value) playbackStore.startPlaybackProgress(item.value, ticksToSeconds(startPosition))

    playerStore.loading = false
    playerStore.loaded = true
    playerStore.paused = false
    playerStore.duration = duration_sec * 1000
  })

  onPlayerLoading(() => {
    playerStore.loading = true
  })

  onPlayerMessage((message) => {
    console.log('Got message from player', message)
  })

  let lastCurrentTime = 0
  onPlayerPosition((position_sec) => {
    if (Math.round(position_sec) === lastCurrentTime || !item.value?.Id) return
    // Round our position_sec to reduce unnecessary component updates
    lastCurrentTime = Math.round(position_sec)
    // Save this progress on the server
    playbackStore.savePlaybackProgress(item.value.Id, Math.floor(position_sec))
    // Set the player store position
    playerStore.position = {
      percent: (position_sec / (playerStore.duration / 1000)) * 100,
      value: position_sec,
    }
  })

  onPlayerPlaybackRestart(() => {
    playerStore.seeking.value = false
    playerStore.loading = false
  })

  nativePlayerLoaded.value = true
})

watch(paused, async () => {
  setPlayerPause(paused.value)
})

watch(position, async () => {
  await setPlayerPosition(position.value)
})

watch(audioSource, async (audioSource) => {
  playerStore.loading = true

  const audioIndex = audioStreams.findIndex(a => a.source?.Index === audioSource?.source.Index)

  waitUntil(nativePlayerLoaded, async () => {
    await setPlayerAudioTrack(audioIndex + 1 || -1)
  })

  playerStore.loading = false
})

watch(subtitleSource, async (subtitleSource) => {
  playerStore.loading = true

  const subtitleIndex = subtitleStreams.findIndex(s => s.source?.Index === subtitleSource?.source?.Index)

  waitUntil(nativePlayerLoaded, async () => {
    await setPlayerSubtitleTrack(subtitleIndex + 1 || -1)
  })

  playerStore.loading = false
})

onUnmounted(async () => {
  if (!item.value || !item.value?.Id) return

  playerStore.settings.native.transparent = false
  root.setAttribute('transparent-player', 'false')
  setBackground(16, 18, 19)
  // Destroy MPV player
  await destroy()
  // Stop playback progress on backend
  playbackStore.stopPlaybackProgress(item.value.Id, playerStore.position.value)
  // Reset player store state
  playerStore.resetPlayer()
})
</script>

<style lang="scss">
@import url("~/assets/css/native.scss");
</style>
