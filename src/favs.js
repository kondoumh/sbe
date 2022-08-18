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
    window.favsApi.on('browser-window-fucus', this.onFocus);
    window.favsApi.on('browser-window-blur', this.onFocus);
    window.favsApi.on('bring-to-top', this.onFocus);
    await this.onFocus();
  },
  methods: {
    async onFocus () {
      this.$vuetify.theme.dark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      const favs = await window.favsApi.getFavs();
      this.items = favs;
    },
    deleteItem (item) {
      this.favDelete = item
      this.dialogDelete = true;
    },
    async deleteItemConfirm () {
      const favs = await window.favsApi.deleteFav(this.favDelete);
      this.items = favs;
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
    favDelete: null,
  })
})
