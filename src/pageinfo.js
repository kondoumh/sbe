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
    window.infoApi.on('browser-window-fucus', this.onFocus);
    window.infoApi.on('browser-window-blur', this.onFocus);
    window.infoApi.on('showPageInfo', async (e, pageApi, url) => this.showInfo(pageApi, url));
  },
  methods: {
    onFocus () {
      this.$vuetify.theme.dark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
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
