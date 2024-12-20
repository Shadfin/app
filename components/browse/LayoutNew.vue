<script setup lang="ts">
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import {
  PhDotsThreeVertical,
  PhHeart,
  PhPlay,
  PhStar,
} from '@phosphor-icons/vue'
import { animate } from 'motion'
import { Button } from '@/components/ui/button'
import Radial from '@/components/ui/radial/Radial.vue'

const {
  background,
  logo,
  defaultSources,
  videoSources,
  audioSources,
  subtitleSources,
  currentWatch,
} = defineProps<{
  currentWatch?: BaseItemDto
  background: string
  logo: string
  defaultSources?: {
    video: VideoSource | null
    audio: AudioSource | null
    subtitle: SubtitleSource | null
  }
  videoSources?: VideoSource[]
  audioSources?: AudioSource[]
  subtitleSources?: SubtitleSource[]
}>()

const router = useRouter()
const item = defineModel<BaseItemDto>('item', { required: true })
const mediaBrowserStore = useMediaBrowserStore()

const state = ref({
  load: {
    like: false,
    play: false,
  },
})

const bgImageLoaded = (ev: Event) => {
  const imageElement = ev.currentTarget as HTMLElement | null
  if (!imageElement) return
  animate(imageElement, { opacity: [0, 1], y: [20, 0], filter: ['blur(8px)', 'blur(4px)'] }, { duration: 0.5, delay: 0.04 }).play()
}

const toggleLike = async () => {
  if (item.value.UserData?.IsFavorite) return await unlike()

  return await like()
}

const like = async () => {
  state.value.load.like = true
  try {
    item.value.UserData = await mediaBrowserStore.favoriteItem(item.value)
  }
  finally {
    state.value.load.like = false
  }
}

const unlike = async () => {
  state.value.load.like = true
  try {
    item.value.UserData = await mediaBrowserStore.unfavoriteItem(item.value)
  }
  finally {
    state.value.load.like = false
  }
}

const play = () => {
  router.push({ name: 'authenticated-new-watch-id', params: { id: currentWatch?.Id || '' } })
}
</script>

<template>
  <div class="w-full">
    <div class="flex flex-col justify-center items-start min-h-[100vh] w-full py-8">
      <img
        id="bg-image-layout"
        :src="background"
        class="absolute h-full w-full overflow-hidden blur-[8px] fade-bg object-cover top-0 left-0 fade-gradient -z-1"
        alt="hello"
        @load="bgImageLoaded"
      >
      <div class="inline-flex flex-col justify-center items-center gap-8 show-content z-[2] max-w-full">
        <div class="inline-flex flex-col justify-center items-center gap-2 lg:w-[600px] w-[85%] max-w-full">
          <img
            :src="logo"
            class="w-full"
          >
        </div>

        <div
          class="show-details inline-flex flex-col gap-3 bg-black/50 p-4 rounded-lg backdrop-blur-lg max-w-[90%] lg:text-[1.2em]"
        >
          <div class="inline-flex justify-between flex-wrap">
            <h1 class="rounded-lg text-2xl font-semibold inline-flex flex-wrap gap-4">
              {{ item.Name }}
              <span
                v-if="item.OriginalTitle && item.OriginalTitle != item.Name"
                class="text-white/75 font-normal"
              >{{
                item.OriginalTitle }}</span>
            </h1>

            <div class="inline-flex gap-2 items-center justify-center">
              <Button
                variant="outline"
                size="icon"
                @click="play"
              >
                <PhPlay size="24" />
              </Button>
              <Button
                v-if="false"
                variant="ghost"
              >
                Movie Reel
              </Button>
              <Button
                variant="outline"
                size="icon"
                :disabled="state.load.like"
                @click="toggleLike"
              >
                <PhHeart
                  :size="24"
                  :weight="item.UserData?.IsFavorite ? 'fill' : 'regular'"
                />
              </Button>
              <Button
                variant="outline"
                size="icon"
                disabled
              >
                <PhDotsThreeVertical
                  :size="24"
                  weight="bold"
                />
              </Button>
            </div>
          </div>
          <div
            v-if="item.ProductionYear"
            class="inline-flex gap-4 w-full"
          >
            <span>
              {{ item.ProductionYear }}
            </span>

            <div
              v-if="item.CommunityRating"
              class="stars inline-flex items-center justify-center gap-2"
            >
              <PhStar
                weight="fill"
                class="text-orange-400 lg:h-[1.25rem]"
              />
              <span>{{ item.CommunityRating?.toFixed(1) }}</span>
            </div>
          </div>

          <div class="inline-flex flex-col justify-start items-start gap-1 text-[1rem]">
            <div
              v-if="defaultSources?.video"
              id="video"
              class="inline-flex gap-4 items-center justify-center w-full"
            >
              <h3 class="text-white/75 w-[120px]">
                Video
              </h3>

              <Select
                :default-value="defaultSources.video.source.Index?.toString() || '0'
                "
              >
                <SelectTrigger class="flex-grow-1">
                  <SelectValue :placeholder="defaultSources.video?.title" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="(video, index) in videoSources"
                    :key="index"
                    :value="video?.source?.Index?.toString() || '0'"
                  >
                    <TextVideoWithFeatures
                      v-if="video"
                      :video="video"
                    />
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div
              v-if="defaultSources?.audio"
              id="audio"
              class="inline-flex gap-4 items-center justify-center w-full"
            >
              <h3 class="text-white/75 w-[120px]">
                Audio
              </h3>

              <Select
                :default-value="defaultSources.audio.source.Index?.toString() || '0'
                "
              >
                <SelectTrigger class="flex-grow-1">
                  <SelectValue :placeholder="defaultSources.video?.title" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="(audio, index) in audioSources"
                    :key="index"
                    :value="audio?.source?.Index?.toString() || '0'"
                  >
                    <TextAudioWithFeatures
                      v-if="audio"
                      :audio="audio"
                    />
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div
              v-if="defaultSources?.subtitle"
              id="subtitle"
              class="inline-flex gap-4 items-center justify-center w-full"
            >
              <h3 class="text-white/75 w-[120px]">
                Subtitle
              </h3>

              <Select
                :default-value="defaultSources.subtitle.source?.Index?.toString() || '0'
                "
              >
                <SelectTrigger class="flex-grow-1">
                  <SelectValue :placeholder="defaultSources.subtitle?.title" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="(subtitle, index) in subtitleSources"
                    :key="index"
                    :value="subtitle?.source?.Index?.toString() || '0'"
                  >
                    {{ subtitle.title }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <p
            v-if="item.Overview"
            class="max-w-full w-[700px] overview"
          >
            {{ item.Overview }}
          </p>

          <p
            v-else
            class="max-w-full w-[700px] overview"
          >
            No overview provided
          </p>
          <div class="item-details inline-flex max-w-[800px] w-full flex-col justify-start items-start text-white/50">
            <div
              v-if="item.Tags!!.length > 0"
              id="tags"
              class="inline-flex gap-1"
            >
              <p>
                <span class="text-white/75 text-lg">Tags:</span>
                {{ item.Tags?.join(", ") }}
              </p>
            </div>

            <div
              v-if="item.GenreItems!!.length > 0"
              id="genres"
              class="inline-flex justify-center items-center gap-4 text-white/75 max-w-full"
            >
              <h2 class="text-lg">
                Genres
              </h2>

              <div
                class="inline-flex gap-1 flex-wrap"
              >
                <BrowseInternalLinkedContent
                  v-for="(genre, index) in item.GenreItems"
                  :key="index"
                  :tag="genre"
                  type="genre"
                  :last="item.GenreItems!!.length - 1 == index"
                />
              </div>
            </div>

            <div
              v-if="item.Studios && item.Studios.length > 0"
              class="inline-flex justify-center items-start max-w-full gap-2"
            >
              <h2 class="text-lg text-white/75">
                Studios
              </h2>

              <div

                class="inline-flex gap-1 flex-wrap"
              >
                <BrowseInternalLinkedContent
                  v-for="(studio, index) in item.Studios"
                  :key="index"
                  :tag="studio"
                  type="studio"
                  :last="item.Studios!!.length - 1 == index"
                />
              </div>
            </div>

            <!-- <div class="inline-flex flex-col gap-2" v-if="movie.DateCreated">
                                        <h2 class="text-lg">Date Added</h2>

                                        <div class="inline-flex flex-wrap gap-[4px] text-white/50">
                                            <span>{{ movie.DateCreated }}</span>
                                        </div>
                                    </div> -->

            <div
              v-if="item.OfficialRating"
              class="inline-flex justify-center items-center max-w-full gap-4"
            >
              <h2 class="text-lg text-white/75">
                Audience
              </h2>

              <div class="inline-flex flex-">
                <span>{{ item.OfficialRating }}</span>
              </div>
            </div>

            <div class="inline-flex flex-wrap justify-center items-center gap-3 complete mt-3">
              <Radial
                :max="100"
                :min="0"
                :value="item.UserData!!.Played
                  ? 100
                  : item.UserData?.PlayedPercentage!!
                "
                class-name="size-8"
                gauge-primary-color="rgb(255, 255, 255)"
                gauge-secondary-color="rgba(0, 0, 0, 0.5)"
                :show-complete="true"
              />

              <span v-if="!item.UserData?.Played">{{ item.UserData?.UnplayedItemCount }} episodes left</span>
              <span v-else>Completed</span>
            </div>
          </div>
        </div>
      </div>

      <slot name="sections" />
    </div>
  </div>
</template>

<style>
.fade-gradient {
  mask-image: linear-gradient(to top,
      rgba(0, 0, 0, 0) 0%,
      rgba(0, 0, 0, 0.1) 30%,
      rgba(0, 0, 0, 0.2) 40%,
      rgba(0, 0, 0, 0.6) 80%,
      rgba(0, 0, 0, 0.5) 100%);
}
</style>
