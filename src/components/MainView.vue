<template>
  <div>
    <h1>{{ msg }}</h1>
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
    <SpeechWidget :sl_host="sl_host" />
  </div>
</template>

<script>
import SpeechWidget from "./SpeechWidget.vue";

export default {
  name: "HelloWorld",
  components: {
    SpeechWidget
  },
  props: {
    msg: String
  },
  watch: {
    sl_host: function (val) {
      let options = this.getOptionsFromHash();

      if (options.sl_host != val) {
        options.url = val;
        location.hash = encodeURIComponent(JSON.stringify(options));
      }
    }
  },
  methods: {
    getOptionsFromHash() {
      let hash = location.hash.substring(1);

      if (!hash) return {};

      return JSON.parse(decodeURIComponent(location.hash.substring(1)));
    },
    loadOptionsFromHash() {
      try {
        let options = this.getOptionsFromHash();

        if (options.url) {
          this.sl_host = options.url;
        }
      } catch (e) {
        console.warn(e);
      }
    }
  },
  mounted() {
    let me = this;

    me.loadOptionsFromHash();
    window.addEventListener(
      "hashchange",
      function () {
        me.loadOptionsFromHash();
      },
      false
    );
  },
  data() {
    return {
      sl_host: ""
    };
  }
};
</script>

<style scoped>
#sl-host-field {
  width: 75%;
  margin-left: 12.5%;
}
</style>