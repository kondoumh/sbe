const { createApp, ref } = Vue;
const { createVuetify, useTheme } = Vuetify;

let theme;

const app = createApp({
  setup () {
    theme = useTheme();
    setTheme();
  },
  async mounted () {
    window.infoApi.on('browser-window-fucus', this.onFocus);
    window.infoApi.on('browser-window-blur', this.onFocus);
    window.infoApi.on('get-page-info', async (e, pageApi, url) => await this.showInfo(pageApi, url));
  },
  methods: {
    onFocus () {
      setTheme();
    },
    close () {
      window.close();
    },
    openPage () {
      window.infoApi.openIt(this.url);
      window.close();
    },
    async showInfo (pageApi, url) {
      this.url = url;
      const data = await window.infoApi.fetchPageInfo(pageApi);
      if (!data) return;
      let info = data.title + ' : by ' + data.user.displayName;
      data.collaborators.forEach(collaborator => {
        info += ', ' + collaborator.displayName;
      });
      this.title = info;
      this.views = ' (Views: ' + data.views + ', Linked: ' + data.linked + ')';
      this.summary = this.renderLines(data.descriptions);
      this.image = data.image ? data.image : '';
      const lines = data.lines.slice(1).map(line => { return line.text; });
      this.text = this.renderLines(lines);  
    },
    renderLines(lines) {
      let content = '';
      lines.forEach(line => {
        content += this.decorateLine(line) + '<br>';
      });
      return content;
    },
    decorateLine(line) {
      const reStrong = /\[(\*+)\s(.+)\]/g;
      const reIndent = /^(\s+)([^\s].+)/;
      let replaced = line.replace(reStrong, '<strong>$2</strong>');
      if (reIndent.test(replaced)) {
        const ar = reIndent.exec(replaced);
        const indent = '&ensp;'.repeat(ar[1].length - 1);
        replaced = indent + '・' + ar[2];
      }
      return replaced;
    }    
  },
  data: () => ({
    title: '',
    views: '',
    summary: '',
    image: '',
    text: '',
    url: '',
  })
});

function setTheme () {
  const darkTheme = ref(window.matchMedia('(prefers-color-scheme: dark)').matches);
  theme.global.name.value = darkTheme.value ? 'dark' : 'light';
}

const vuetify = new createVuetify();

app.use(vuetify);
app.mount('#app');
