<script setup lang="ts">
import { ClickScrollPlugin, OverlayScrollbars } from 'overlayscrollbars'
import { setBackground } from './native/app/App'
import { onAppResize } from './native/app/events'
import 'overlayscrollbars/overlayscrollbars.css'
import { PhCircleHalf, PhCircleNotch } from '@phosphor-icons/vue'
import pkg from '~/package.json'

const deviceStore = useDeviceStore()
const l = useLoggerStore()
const loading = ref(true)

let carouselRotate: NodeJS.Timeout | undefined

onMounted(() => {
  // optional: use the ClickScrollPlugin to make the option "scrollbars.clickScroll: true" available
  OverlayScrollbars.plugin(ClickScrollPlugin)

  OverlayScrollbars(document.body, {
    scrollbars: {
      clickScroll: true,
    },
  })

  const event = new Event('carousel-update')

  carouselRotate = setInterval(() => {
    window.dispatchEvent(event)
  }, 5000)

  if (window.runtime || window.wails) {
    const root = document.documentElement
    l.$log({
      type: 'info',
      location: 'App',
      message:
        'Running on native desktop app, special features will be avaliable :0',
    })
    deviceStore.nativeEnvironment = true
    setBackground(16, 18, 19)

    let prevResizeTimeout: NodeJS.Timeout | undefined
    let lastResize = 0
    root.style.transition = 'opacity 250ms ease'
    onAppResize(() => {
      l.$log({ location: 'App', message: 'Received backend resize event..' })

      const resizeTime = performance.now()
      if (resizeTime < lastResize + 20) {
        l.$log({
          location: 'App',
          message: 'A resize event just happened, ignoring this one...',
        })
        return
      }
      if (prevResizeTimeout) clearTimeout(prevResizeTimeout)
      l.$log({
        location: 'App',
        message: 'Setting window opacity to 0 during resize',
      })
      root.style.opacity = '0'

      lastResize = resizeTime
      prevResizeTimeout = setTimeout(() => {
        root.style.opacity = '1'
        l.$log({
          location: 'App',
          message: 'Window opacity reset back to 1 (normal)',
        })
      }, 150)
    })
  }
})

onUnmounted(() => {
  clearInterval(carouselRotate)
})

deviceStore.testSetDeviceProfile()

useNuxtApp().hook('page:finish', () => {
  loading.value = false
})
</script>

<template>
  <div id="shadfin-ui">
    <Transition name="fade-short-slide">
      <div
        v-if="loading"
        class="loading-screen flex justify-center overflow-none items-center flex-col gap-2 fixed w-full h-[100dvh] bg-background z-[999] select-none"
      >
        <img
          src="~/public/shadfin_concept_vertical.svg"
          alt="Sharkfin with text below Shadfin"
          class="max-w-[100%] w-[500px] select-none"
        >
        <span class="select none">{{ pkg.version }}</span>
        <PhCircleNotch
          size="32px"
          class="text-primary animate-spin"
        />
      </div>
    </Transition>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<style lang="scss">
.os-scrollbar-handle {
  @apply bg-primary/50 !w-[3px] hover:!w-2 hover:!bg-primary/85 transition-all duration-200 ease-in hidden md:block;
}

.os-scrollbar-vertical {
  right: 2px;
}
</style>
