import { App } from 'vue'
import { VueMasonryPlugin } from 'vue-masonry'

export function setupMasonry(app: App) {
  app.use(VueMasonryPlugin)
}
