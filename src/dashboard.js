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
      const favs = await window.api.getFavs();
      this.favs = favs;
      const history = await window.api.getHistory();
      this.history = history.slice(0, 10);
    },
    timeLineColor(item) {
      if (item.author) {
        return 'pink'
      } else if (item.contributed) {
        return 'orange'
      }
      return 'blue'
    }
  },
  data: () => ({
    selectedItem: 0,
    favs: [],
    history: []
  })
})
