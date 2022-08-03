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
    this.projectName = await window.api.activeProject();
    await this.showProjectInfo();
    this.date = formatDate();
  },
  methods: {
    onFocus () {
      this.$vuetify.theme.dark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
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
