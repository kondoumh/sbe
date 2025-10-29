const { createApp, ref } = Vue;
const { createVuetify, useTheme } = Vuetify;

let theme;

const app = createApp({
  setup () {
    theme = useTheme();
    setTheme();
  },
  async mounted () {
    window.api.on('browser-window-focus', this.onFocus);
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
  beforeUnmount () {
    window.api.off('browser-window-focus', this.onFocus);
    window.api.off('browser-window-blur', this.onFocus);
  },
  methods: {
    onFocus () {
      setTheme();
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

function setTheme () {
  const darkTheme = ref(window.matchMedia('(prefers-color-scheme: dark)').matches);
  theme.global.name.value = darkTheme.value ? 'dark' : 'light';
}

const vuetify = new createVuetify();

app.use(vuetify);
app.mount('#app');
