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
    const info = await window.api.getVersionInfo();
    this.title = 'Scrapbox in Electron';
    this.image = '../icons/png/256x256.png';
    this.version = info.version;
    this.copyright = info.copyright;
    this.electronVersion = info.electronVersion;
    this.chromeVersion = info.chromeVersion;
    this.platform = info.platform;
    this.arch = info.arch;
  },
  methods: {
    onFocus () {
      this.$vuetify.theme.dark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    },
    close () {
      window.close();
    },
  },
  data: () => ({
    image: '',
    title: '',
    version: '',
    copyright: '',
    electronVersion: '',
    chromeVersion: '',
    platform: '',
    arch: ''
  })
});
