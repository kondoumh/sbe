const { createApp, ref } = Vue;
const { createVuetify, useTheme } = Vuetify;

let theme;

const app = createApp({
  setup () {
    theme = useTheme();
    setTheme();
  },
  async mounted () {
    window.api.on('browser-window-fucus', this.onFocus);
    window.api.on('browser-window-blur', this.onFocus);
    this.projectName = await window.api.activeProject();
    await this.showProjectInfo();
    this.date = formatDate();
  },
  methods: {
    onFocus () {
      setTheme();
    },
    close () {
      window.close();
    },
    async showProjectInfo () {
      this.totalCount = await window.api.fetchPostCount(this.projectName);
      const skip = 50;
      for (let count = 0; this.totalCount + skip >= count; count += skip) {
        const metrics = await window.api.fetchMetrics(this.projectName, count, skip);
        console.log(metrics);
        this. views += metrics.views;
        this.linked += metrics.linked;
        this.fetched += metrics.fetched;
        this.progress = this.fetched / (this.totalCount) * 100;
      }
    },
    close () {
      window.close();
    },
    copy () {
      let text = 'Project: ' + this.projectName + '\n';
      text += 'date: ' + this.date + '\n';
      text += 'pages: ' + this.totalCount + '\n'
      text += 'views: ' + this.views + '\n';
      text += 'linked: ' + this.linked;
      api.copyToClipboard(text);
    }
  },
  data: () => ({
    date: '',
    projectName: '',
    views: 0,
    linked: 0,
    totalCount: 0,
    fetched: 0,
    progress: 0,
  })
});

function setTheme () {
  const darkTheme = ref(window.matchMedia('(prefers-color-scheme: dark)').matches);
  theme.global.name.value = darkTheme.value ? 'dark' : 'light';
}

const vuetify = new createVuetify();

app.use(vuetify);
app.mount('#app');
