import DefaultTheme from 'vitepress/theme'
import {inBrowser, useData} from "vitepress";
import {h, watchEffect} from "vue";
import PlatformSelector from './components/PlatformSelector.vue'
import HeroScene from './components/HeroScene.vue'
import PricingPage from './components/PricingPage.vue'
import './custom.css'
import './styles/platform.css'

export default {
    extends: DefaultTheme,
    Layout() {
        return h(DefaultTheme.Layout, null, {
            'home-hero-before': () => h(HeroScene),
            'sidebar-nav-before': () => h(PlatformSelector)
        })
    },
    enhanceApp({app}) {
        app.component('PricingPage', PricingPage)
    },
    setup() {
        const { lang } = useData()
        watchEffect(() => {
            if (inBrowser) {
                document.cookie = `nf_lang=${lang.value}; expires=Mon, 1 Jan 2024 00:00:00 UTC; path=/`
            }
        })
    }
}
