import DefaultTheme from 'vitepress/theme'
import {inBrowser, useData} from "vitepress";
import {watchEffect} from "vue";
import PricingPage from './components/PricingPage.vue'
import HomeLanding from './components/HomeLanding.vue'
import HomeMatrix from './components/HomeMatrix.vue'
import MarketingLayout from './components/MarketingLayout.vue'
import './custom.css'
import './styles/platform.css'
import './styles/navigation.css'
import './styles/landing.css'
import './styles/landing-sections.css'
import './styles/site.css'
import './styles/pricing.css'
import './styles/motion.css'

export default {
    extends: DefaultTheme,
    Layout: MarketingLayout,
    enhanceApp({app}) {
        app.component('PricingPage', PricingPage)
        app.component('HomeLanding', HomeLanding)
        app.component('HomeMatrix', HomeMatrix)
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
