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
    <SpeechWidget :sl_host="sl_host" @recover="recover" />
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
    },
    recovery_key: function (val) {
      let options = this.getOptionsFromHash();

      if (options.recovery != val) {
        options.recovery = val;
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

        if (options.recovery) {
          this.recovery_key = options.recovery;
        }
      } catch (e) {
        console.warn(e);
      }
    },
    async recover() {
      let me = this;

      if (me.recovery_key) {
        return fetch(
          "https://cors-anywhere.herokuapp.com/http://xmlrpc.secondlife.com/cgi-bin/xmlrpc.cgi",
          {
            method: "POST",
            headers: {
              "Content-Type": "text/xml"
            },
            body: `<?xml version="1.0"?>
<methodCall>
    <methodName>llRemoteData</methodName>
    <params>
        <param>
            <value>
                <struct>
                    <member>
                        <name>Channel</name>
                        <value><string>${me.recovery_key}</string></value>
                    </member>
                    <member>
                        <name>IntValue</name>
                        <value><int>0</int></value>
                    </member>
                    <member>
                        <name>StringValue</name>
                        <value><string>Recover</string></value>
                    </member>
                </struct>
            </value>
        </param>
    </params>
</methodCall>`
          }
        ).then(
          async function (res) {
            let parser = new DOMParser(),
              doc = parser.parseFromString(await res.text(), "application/xml"),
              result = doc.evaluate(
                `//member[contains(name,'StringValue')]/value/string/text()`,
                doc,
                null,
                XPathResult.STRING_TYPE
              ).stringValue;

            if (result) {
              me.sl_host = result;
              return true;
            } else {
              return false;
            }
          },
          function () {
            console.warn("Failed recovery!");
            return false;
          }
        );
      } else {
        return false;
      }
    },
    ping() {
      let me = this,
        rePing = function () {
          setTimeout(function () {
            me.ping();
          }, 30 * 1000);
        };

      if (!me.sl_host) {
        rePing();
        return;
      }

      return me
        .$jsonp(me.sl_host, { cmd: "PING" })
        .then(
          function (res) {
            if (res.success) {
              me.recovery_key = res.data.refresh;
            }
          },
          async function () {
            await me.recover();
          }
        )
        .finally(() => {
          rePing();
        });
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

    me.ping();
  },
  data() {
    return {
      sl_host: "",
      recovery_key: ""
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