import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import * as labsComponents from 'vuetify/labs/components'

const vuetify = createVuetify({
  components: {
    ...components,
    ...labsComponents,
  },
  directives,
})

const pinia = createPinia()
const app = createApp(App)

app.use(pinia)
app.use(vuetify)
app.mount('#app')
