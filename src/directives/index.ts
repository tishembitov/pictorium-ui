import { App } from 'vue'
import vClickOutside from './vClickOutside'
import vLazyLoad from './vLazyLoad'
import vTooltip from './vTooltip'
import vIntersect from './vIntersect'
import vAutoAnimate from './vAutoAnimate'

export function setupDirectives(app: App) {
  app.directive('click-outside', vClickOutside)
  app.directive('lazy-load', vLazyLoad)
  app.directive('tooltip', vTooltip)
  app.directive('intersect', vIntersect)
  app.directive('auto-animate', vAutoAnimate)
}
