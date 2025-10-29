const { createApp, ref } = Vue;
const { createVuetify, useTheme } = Vuetify;

let theme;

const app = createApp({
  setup() {
    theme = useTheme();
    setTheme();
  },
  async mounted () {
    window.api.on('browser-window-focus', this.onFocus);
    window.api.on('browser-window-blur', this.onFocus);
    window.api.on('bring-to-top', this.onFocus);
    await this.onFocus();
  },
  beforeUnmount () {
    window.api.off('browser-window-focus', this.onFocus);
    window.api.off('browser-window-blur', this.onFocus);
    window.api.off('bring-to-top', this.onFocus);
  },
  methods: {
    async onFocus () {
      setTheme();
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
        return 'orange';
      } else if (item.contributed) {
        return 'blue';
      }
      return 'grey';
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
});

function setTheme() {
  const darkTheme = ref(window.matchMedia('(prefers-color-scheme: dark)').matches);
  theme.global.name.value = darkTheme.value ? 'dark' : 'light';  
}

const vuetify = new createVuetify();

app.use(vuetify);
app.mount('#app');
