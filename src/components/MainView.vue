<template>
    <div>
        <h1>{{msg}}</h1>
        <md-field id="sl-host-field">
          <label for="sl-host">SL Host</label>
          <md-input
            type="text"
            name="sl-host"
            id="sl-host"
            autocomplete="sl_host"
            v-model="sl_host"
          />
        </md-field>
        <SpeechWidget :sl_host="sl_host"/>
    </div>
</template>

<script>
import SpeechWidget from './SpeechWidget.vue'

export default {
  name: 'HelloWorld',
  components: {
    SpeechWidget
  },
  props: {
    msg: String
  },
  data () {
    return {
        sl_host: ''
    }
  }
}
</script>

<style scoped>
  #sl-host-field {
    width: 75%;
    margin-left: 12.5%;
  }
</style>