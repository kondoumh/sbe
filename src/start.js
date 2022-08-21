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
      const user = await window.api.getUser();
      if (user) {
        this.user = user;
      }
      this.favs = await window.api.getFavs();
      this.history = await window.api.getHistory();
      this.edited = await window.api.getEdited();
      this.projects = await window.api.getProjects();
    },
    timeLineColor (item) {
      if (item.author) {
        return 'orange'
      } else if (item.contributed) {
        return 'blue'
      }
      return 'light-blue lighten-4'
    },
    async openFavsPage () {
      await window.api.openFavsPage();
    },
    async openHistoryPage () {
      await window.api.openHistoryPage();
    }
  },
  data: () => ({
    user: {},
    favs: [],
    history: [],
    projects: [],
    edited: [],
    baseUrl: 'https://scrapbox.io/'
  })
})
