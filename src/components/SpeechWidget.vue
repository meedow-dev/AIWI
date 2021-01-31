<template>
  <div>
    <form novalidate class="md-layout" @submit.prevent="validateForm">
      <md-card class="md-layout-item md-size-50 md-small-size-100">
        <md-card-header>
          <div class="md-title">Speech</div>
        </md-card-header>

        <md-card-content>
          <div class="md-layout md-gutter">
            <div class="md-layout-item md-small-size-100">
              <md-field :class="getValidationClass('speech_type')">
                <label for="speech-type">Type</label>
                <md-select
                  name="speech-type"
                  id="speech-type"
                  v-model="form.speech_type"
                  md-dense
                  :disabled="sending"
                >
                  <md-option value="rlv_folders">Query folders</md-option>
                  <md-option value="owner">OwnerSay (self + @RLV)</md-option>
                  <md-option value="whisper">Whisper (10 m)</md-option>
                  <md-option value="say">Say (20 m)</md-option>
                  <md-option value="shout">Shout (100 m)</md-option>
                </md-select>
                <span class="md-error">The type is required</span>
              </md-field>
            </div>

            <div
              class="md-layout-item md-small-size-100"
              v-if="shouldShowChannel(form.speech_type)"
            >
              <md-field :class="getValidationClass('speech_channel')">
                <label for="speech-channel">Channel</label>
                <md-input
                  type="number"
                  id="speech-channel"
                  name="speech-channel"
                  v-model="form.speech_channel"
                  :disabled="sending"
                />
              </md-field>
            </div>
          </div>

          <md-field
            :class="getValidationClass('speech_name')"
            v-if="shouldShowName(form.speech_type)"
          >
            <label for="speech-name">Name</label>
            <md-input
              type="text"
              name="speech-name"
              id="speech-name"
              autocomplete="speech_name"
              v-model="form.speech_name"
              :disabled="sending"
            />
            <span class="md-error" v-if="!$v.form.speech_name.required"
              >Name is required</span
            >
          </md-field>

          <md-field
            :class="getValidationClass('speech_text')"
            v-if="shouldShowText(form.speech_type)"
          >
            <label for="speech-text">Text</label>
            <md-textarea
              name="speech-text"
              id="speech-text"
              autocomplete="speech_text"
              v-model="form.speech_text"
              :disabled="sending"
            ></md-textarea>
            <span class="md-error" v-if="!$v.form.speech_text.required"
              >Text is required</span
            >
            <span class="md-error" v-else-if="!$v.form.speech_text.maxLength"
              >Max 500 characters</span
            >
          </md-field>

          <md-card class="md-layout-item">
            <md-card-header>
              <div class="md-title">Result</div>
            </md-card-header>
            <md-card-content>
              <pre
                style="width: 100%; text-align: left"
                v-text="responseJSON"
                v-bind:style="{
                  'background-color': lastResponse.succeeded ? '' : 'red'
                }"
              ></pre>
            </md-card-content>
          </md-card>
        </md-card-content>

        <md-progress-bar md-mode="indeterminate" v-if="sending" />

        <md-card-actions>
          <div>
            <md-switch v-model="showHistory" class="md-primary">
              <md-tooltip md-direction="top">Toggle history list</md-tooltip>
              <md-icon v-bind:class="{ 'md-primary': showHistory }"
                >history</md-icon
              >
            </md-switch>
          </div>
          <md-button class="md-primary" @click="formSave" :disabled="sending">
            <md-tooltip md-direction="top">Save</md-tooltip>
            <md-icon>save</md-icon>
          </md-button>
          <md-button @click="formSend" class="md-primary" :disabled="sending">
            <md-tooltip md-direction="top">Execute</md-tooltip>
            <md-icon>send</md-icon>
          </md-button>
        </md-card-actions>
      </md-card>

      <md-card class="md-layout-item" v-if="showHistory">
        <md-card-header>
          <div class="md-title">Speech history</div>
        </md-card-header>

        <md-card-content>
          <md-field md-clearable>
            <md-input
              placeholder="Search..."
              v-model="search"
              @input="searchInHistory"
            />
          </md-field>
          <md-chips
            v-model="searchTags"
            md-placeholder="Search tags..."
          ></md-chips>
          <md-list class="history-list">
            <draggable
              @start="drag = true"
              @end="drag = false"
              v-bind="dragOptions"
            >
              <transition-group
                type="transition"
                :name="!drag ? 'flip-list' : null"
              >
                <md-list-item
                  v-for="item in filteredHistory"
                  v-bind:key="item.id"
                  class="history-list-item"
                >
                  <div class="md-layout md-gutter">
                    <div class="md-layout-item md-size-5">
                      <md-speed-dial
                        md-direction="bottom"
                        class="history-list-item-button"
                      >
                        <md-speed-dial-target
                          @click="historySend(item)"
                          class="md-primary md-mini"
                        >
                          <md-icon>send</md-icon>
                        </md-speed-dial-target>

                        <md-speed-dial-content>
                          <md-button
                            @click="historyEdit(item)"
                            class="md-icon-button"
                          >
                            <md-icon>edit</md-icon>
                          </md-button>
                          <md-button
                            @click="historyDelete(item)"
                            class="md-icon-button"
                          >
                            <md-icon>delete</md-icon>
                          </md-button>
                        </md-speed-dial-content>
                      </md-speed-dial>
                    </div>

                    <div class="md-layout-item">
                      <md-table>
                        <md-table-row>
                          <md-table-cell>
                            <span
                              class="history-list-item-text"
                              style="white-space: pre"
                              >{{ item.text }}</span
                            >
                          </md-table-cell>
                        </md-table-row>
                        <md-table-row>
                          <md-table-cell>
                            <md-chips
                              v-model="item.tags"
                              md-check-duplicated
                              md-placeholder="Add tag..."
                            >
                              <md-chip
                                class="md-primary"
                                style="margin-right: 4px"
                                v-if="item.type != 'owner'"
                                >name:'{{ item.name }}'</md-chip
                              >
                              <md-chip
                                class="md-primary"
                                style="margin-right: 4px"
                                >type:'{{ item.type }}'</md-chip
                              >
                              <md-chip
                                class="md-primary"
                                style="margin-right: 4px"
                                v-if="item.type != 'owner'"
                                >channel:'{{ item.channel }}'</md-chip
                              >
                            </md-chips>
                          </md-table-cell>
                        </md-table-row>
                      </md-table>
                    </div>
                  </div>
                </md-list-item>
              </transition-group>
            </draggable>
          </md-list>
        </md-card-content>
      </md-card>

      <md-card class="md-layout-item">
        <md-card-header>
          <div class="md-title">Clothes</div>
        </md-card-header>

        <md-card-content>
          <md-list class="clothes-list">
            <md-list-item
              v-for="item in clothes"
              v-bind:key="item.name"
              class="clothes-list-item"
            >
              <md-button @click="add_clothing(item)" class="md-icon-button">
                <md-icon>add</md-icon>
              </md-button>

              <md-button @click="remove_clothing(item)" class="md-icon-button">
                <md-icon>remove</md-icon>
              </md-button>

              <div class="md-layout-item">{{ item.name }}</div>
            </md-list-item>
          </md-list>

          <md-field>
            <label for="clothes_template">Template</label>
            <md-textarea
              name="clothes_template"
              v-model="clothes_template"
            ></md-textarea>
          </md-field>

          Message
          <pre v-text="clothes_message" style="text-align: left;"></pre>

          <md-button @click="dumpClothes()" class="md-icon-button">
            <md-icon>edit</md-icon>
          </md-button>

          <md-button @click="updateClothes()" class="md-icon-button">
            <md-icon>refresh</md-icon>
          </md-button>
        </md-card-content>
      </md-card>

      <md-snackbar v-if="lastSpeech" :md-active.sync="formSend"
        >The command "Speech" has issued {{ lastSpeech.type }} with the text "{{
          lastSpeech.text
        }}" on channel {{ lastSpeech.channel }}</md-snackbar
      >
    </form>
  </div>
</template>

<script>
import { validationMixin } from "vuelidate";
import draggable from "vuedraggable";
import { required, maxLength } from "vuelidate/lib/validators";

export default {
  name: "SpeechWidget",
  mixins: [validationMixin],
  components: {
    draggable
  },
  props: {
    sl_host: {
      required: false
    }
  },
  data: () => ({
    nameRegex: /name:'(?<name>[^']+)'/i,
    typeRegex: /type:'(?<type>[^']+)'/i,
    channelRegex: /channel:'(?<channel>[^']+)'/i,
    tagsRegex: /tag:'(?<tag>[^']+)'/gi,

    form: {
      speech_type: "SAY",
      speech_channel: 0,
      speech_name: null,
      speech_text: null
    },

    showHistory: true,
    search: null,
    searchTags: [],

    clothes_template: `Clothes:\n\t<item>`,
    clothes: [],

    haveLoaded: false,

    history_count: 0,
    history: [],

    drag: false,
    sending: false,
    lastSpeech: null,
    lastResponse: { succeeded: true, response: undefined }
  }),
  validations: {
    form: {
      speech_channel: {
        required
      },
      speech_name: {
        required
      },
      speech_text: {
        required,
        maxLength: maxLength(500)
      }
    }
  },
  methods: {
    shouldShowName(type) {
      return !["owner", "rlv_folders"].includes(type);
    },
    shouldShowChannel(type) {
      return !["owner", "rlv_folders"].includes(type);
    },
    shouldShowText(type) {
      return ![].includes(type);
    },
    formToItem() {
      let name = this.form.speech_name;
      let type = this.form.speech_type;
      let text = this.form.speech_text;
      let channel = this.form.speech_channel;

      if (!text && this.shouldShowText(type)) throw "No text!";
      if (!name && this.shouldShowName(type)) throw "No name!";

      let item = {
        name: name,
        type: type,
        text: text,
        channel: channel,
        id: ++this.history_count,
        tags: []
      };

      if (type == "owner") {
        delete item.name;
        delete item.channel;
      } else if (type == "rlv_folders") {
        delete item.name;
        delete item.channel;
        item.type = "RLV_QUERY";
        item.text = `@getinv:${item.text}=456446`;
        item.channel = 456446;
      }

      return item;
    },
    formSave() {
      let item = this.formToItem();

      let name = (item.name || "").toUpperCase(),
        type = item.type.toUpperCase(),
        text = (item.text || "").toUpperCase(),
        channel = item.channel;

      if (
        !this.history.find((h) => {
          return (
            (h.name || "").toUpperCase() == name &&
            h.type.toUpperCase() == type &&
            (h.text || "").toUpperCase() == text &&
            h.channel == channel
          );
        })
      ) {
        this.history.push(item);
      }

      return item;
    },
    sendSpeech(item) {
      const me = this;

      me.lastResponse = { succeeded: true, response: undefined };
      me.sending = true;

      let toSend = {
        cmd: "msg",
        type: item.type,
        text: item.text,
        name: item.name,
        channel: item.channel
      };

      Object.entries(toSend)
        .filter((pair) => pair[1] == undefined)
        .forEach((pair) => delete toSend[pair[0]]);

      if (item.type == "RLV_QUERY") {
        toSend.cmd = "RLV_QUERY";
        delete toSend.type;
      }

      let url = me.sl_host;

      if (url.split("").pop() != "/") url += "/";

      return this.$jsonp(url, toSend)
        .then(
          function (res) {
            if (res.success) {
              me.lastResponse = { succeeded: true, response: res.data };
            } else {
              me.lastResponse = { succeeded: false, response: res.data };
            }

            return me.lastResponse;
          },
          function () {
            me.lastResponse = { succeeded: false, response: "Network / url" };
            me.$emit("recover");
          }
        )
        .finally(() => {
          me.sending = false;
        });
    },
    historySend(item) {
      this.sendSpeech(item);
    },
    historyEdit(item) {
      this.form.speech_name = item.name;
      this.form.speech_type = item.type;
      this.form.speech_text = item.text;
      this.form.speech_channel = item.channel;
    },
    historyDelete(item) {
      let index = this.history.findIndex((i) => i == item);
      if (index != -1) {
        this.history.splice(index, 1);
      }
    },
    searchInHistory() {
      let searchPhrase = this.search || "";

      let nameMatch = this.nameRegex.exec(searchPhrase);
      if (nameMatch) {
        let existing = this.searchTags.findIndex(
          (t) => this.nameRegex.exec(t) != null
        );
        let tagText = `name:'${nameMatch.groups["name"]}'`;

        if (existing != -1) {
          this.searchTags.splice(existing, 1, tagText);
        } else {
          this.searchTags.push(tagText);
        }
      }
      searchPhrase = searchPhrase.replace(this.nameRegex, "");

      let typeMatch = this.typeRegex.exec(searchPhrase);
      if (typeMatch) {
        let existing = this.searchTags.findIndex(
          (t) => this.typeRegex.exec(t) != null
        );
        let tagText = `type:'${typeMatch.groups["type"]}'`;

        if (existing != -1) {
          this.searchTags.splice(existing, 1, tagText);
        } else {
          this.searchTags.push(tagText);
        }
      }
      searchPhrase = searchPhrase.replace(this.typeRegex, "");

      let channelMatch = this.channelRegex.exec(searchPhrase);
      if (channelMatch) {
        let existing = this.searchTags.findIndex(
          (t) => this.channelRegex.exec(t) != null
        );
        let tagText = `channel:'${channelMatch.groups["channel"]}'`;

        if (existing != -1) {
          this.searchTags.splice(existing, 1, tagText);
        } else {
          this.searchTags.push(tagText);
        }
      }
      searchPhrase = searchPhrase.replace(this.channelRegex, "");

      let tagsMatch;
      while ((tagsMatch = this.tagsRegex.exec(searchPhrase)) != null) {
        let tagText = tagsMatch.groups["tag"];
        if (!this.searchTags.find(tagText)) this.searchTags.push(tagText);
      }
      searchPhrase = searchPhrase.replace(this.tagsRegex, "");
      searchPhrase = searchPhrase.trim();

      this.search = searchPhrase;
    },
    getValidationClass(fieldName) {
      const field = this.$v.form[fieldName];

      if (field) {
        return {
          "md-invalid": field.$invalid && field.$dirty
        };
      }
    },
    clearForm() {
      this.$v.$reset();
      this.form.speech_type = "SAY";
      this.form.speech_channel = 0;
      this.form.speech_name = null;
      this.form.speech_text = null;
    },
    formSend() {
      this.sending = true;

      let item = this.formSave();
      this.sendSpeech(item);
    },
    validateForm(e) {
      let target = e.explicitOriginalTarget;
      let found = false;

      while (
        target &&
        !(found = target.tagName == "BUTTON" && target.type == "submit")
      )
        target = target.parentElement;
      if (!found) return false;

      this.$v.$touch();

      if (!this.$v.$invalid) {
        this.formSend();
      }
    },
    updateClothes() {
      this.sendSpeech({
        type: "RLV_QUERY",
        text: `@getinv:.outfits=456445`,
        channel: 456445
      }).then((data) => {
        if (data.succeeded)
        {
          this.clothes = data.response.response.split(',').filter(i => i).sort().map(name => ({ name: name })).sort();
        }
      });
    },
    dumpClothes() {
      if (!this.shouldShowText(this.form.speech_type))
        this.form.speech_type = "SAY";
      this.form.speech_text = this.clothes_message;
    },
    remove_clothing(item) {
      this.sendSpeech({
        type: "owner",
        text: `@detachall:.outfits/${item.name}=force`
      });
    },
    add_clothing(item) {
      this.sendSpeech({
        type: "owner",
        text: `@attachall:.outfits/${item.name}=force`
      });
    }
  },
  computed: {
    clothes_message() {
      return this.clothes_template
        .split("\n")
        .map((line) => {
          if (line.indexOf("<item>") != -1)
            return this.clothes
              .map((c) => line.replace("<item>", c.name))
              .join("\n");
          else return line;
        })
        .join("\n");
    },
    responseJSON() {
      return JSON.stringify(this.lastResponse.response, undefined, 2);
    },
    filteredHistory() {
      let tagsToSearchIn = this.searchTags;

      tagsToSearchIn = tagsToSearchIn.map((t) => t.trim().toUpperCase());

      let nameMatch = this.searchTags
        .map((t) => this.nameRegex.exec(t))
        .filter((t) => t != null)
        .pop();
      const name = nameMatch && nameMatch.groups["name"];

      let typeMatch = this.searchTags
        .map((t) => this.typeRegex.exec(t))
        .filter((t) => t != null)
        .pop();
      const type = typeMatch && typeMatch.groups["type"];

      let channelMatch = this.searchTags
        .map((t) => this.channelRegex.exec(t))
        .filter((t) => t != null)
        .pop();
      const channel = channelMatch && channelMatch.groups["channel"];

      let found = this.history;

      if (name) {
        found = found.filter((h) => h.name.toUpperCase() == name.toUpperCase());
        tagsToSearchIn = tagsToSearchIn.filter(
          (t) => this.nameRegex.exec(t) == null
        );
      }

      if (type) {
        found = found.filter((h) => h.type.toUpperCase() == type.toUpperCase());
        tagsToSearchIn = tagsToSearchIn.filter(
          (t) => this.typeRegex.exec(t) == null
        );
      }

      if (channel) {
        found = found.filter((h) => h.channel == channel);
        tagsToSearchIn = tagsToSearchIn.filter(
          (t) => this.channelRegex.exec(t) == null
        );
      }

      if (tagsToSearchIn.length > 0) {
        found = found.filter((h) =>
          tagsToSearchIn.every((t) =>
            h.tags.find((ht) => ht.toUpperCase() == t)
          )
        );
      }

      if (this.search) {
        let text = this.search.trim();
        if (text)
          found = found.filter((h) =>
            h.text.toUpperCase().includes(text.toUpperCase())
          );
      }

      return found;
    },
    dragOptions() {
      return {
        animation: 200,
        group: "history",
        disabled: false,
        ghostClass: "ghost"
      };
    }
  },
  mounted() {
    let data = localStorage.getItem("speech-history");

    if (data) {
      data = JSON.parse(data);

      this.history = data.history || [];
      this.history_count = data.history_count || 0;
    }

    this.haveLoaded = true;
  },
  watch: {
    history: {
      handler() {
        if (this.haveLoaded) {
          localStorage.setItem(
            "speech-history",
            JSON.stringify({
              history: this.history || [],
              history_count: this.history_count || 0
            })
          );
        }
      },
      deep: true
    }
  }
};
</script>

<style lang="scss" scoped>
.md-button {
  text-transform: unset;
}

.md-progress-bar {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
}

.md-table.md-theme-default
  .md-table-row:hover:not(.md-header-row)
  .md-table-cell {
  background-color: unset;
  background-color: unset;
}
</style>