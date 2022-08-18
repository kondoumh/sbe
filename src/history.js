const app = new Vue({
  vuetify: new Vuetify({
    icons : {
      iconfont: 'mdi'
    },
    theme: {
      dark: window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    }
  }),
  el: '#app',
  async mounted () {
    window.api.on('browser-window-fucus', this.onFocus);
    window.api.on('browser-window-blur', this.onFocus);
    window.api.on('bring-to-top', this.onFocus);
    await this.onFocus();
  },
  methods: {
    async onFocus () {
      this.$vuetify.theme.dark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      const history = await window.api.getHistory();
      this.items = history;
    },
    deleteItem (item) {
      this.historyDelete = item
      this.dialogDelete = true;
    },
    async deleteItemConfirm () {
      const history = await window.api.deleteHistory(this.historyDelete);
      this.items = history;
      this.closeDelete();
    },
    closeDelete () {
      console.log("close delete dialog");
      this.dialogDelete = false;
    }
  },
  data: () => ({
    dialogDelete: false,
    selectedItem: 0,
    items: [],
    historyDelete: null,
  })
})
