import Vue from 'vue'
import VueMaterial from 'vue-material'
import 'material-design-icons-iconfont/dist/material-design-icons.css'
import 'vue-material/dist/vue-material.css'
import 'vue-material/dist/theme/black-green-dark.css'
// import './theme.scss'
import App from './App.vue'

Vue.use(VueMaterial);

Vue.config.productionTip = false;

new Vue({
  render: h => h(App),
}).$mount('#app');
