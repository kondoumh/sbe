const { createApp, ref } = Vue;
const { createVuetify, useTheme } = Vuetify;

let theme;

const app = createApp({
  setup() {
    theme = useTheme();
    setTheme();
  },
  async mounted () {
    this.addPageHandler = (e, contentId, title, activate, icon) => {
      const item = { title: title, contentId: contentId, icon: icon };
      this.items.push(item);
      if (activate) {
        this.tab = this.items.length - 1;
      }
    };
    this.navigationFinishedHandler = (e, title, contentId) => {
      const item = this.items.find(item => item.contentId === contentId);
      item.title = title;
    };
    this.parseHtmlHandler = (e, url, body) => {
      const doc = new DOMParser().parseFromString(body, 'text/html');
      const title = doc.title ? doc.title : 'no title'
      window.api.sendTitle(url, title);
    };
    this.showMessageHandler = (e, message) => {
      this.message = message;
    };
    this.browserWindowFocusHandler = () => {
      setTheme();
    };
    this.browserWindowBlurHandler = () => {
      setTheme();
    };
    this.closeCurrentTabHandler = () => {
      this.closePage();
    };
    this.bringToTopHandler = (e, contentId) => {
      const idx = this.items.findIndex(item => item.contentId === contentId);
      this.tab = idx;
    };
    this.queryTitleHandler = (e, title) => {
      this.selectByTitle(title);
    };
    this.focusSearchTextHandler = () => {
      this.fucusSearchText();
    };

    window.api.on('add-page', this.addPageHandler);
    window.api.on('navigation-finished', this.navigationFinishedHandler);
    window.api.on('parse-html', this.parseHtmlHandler);
    window.api.on('show-message', this.showMessageHandler);
    window.api.on('browser-window-focus', this.browserWindowFocusHandler);
    window.api.on('browser-window-blur', this.browserWindowBlurHandler);
    window.api.on('close-current-tab', this.closeCurrentTabHandler);
    window.api.on('bring-to-top', this.bringToTopHandler);
    window.api.on('query-title', this.queryTitleHandler);
    window.api.on('focus-search-text', this.focusSearchTextHandler);
  },
  beforeUnmount () {
    window.api.off('add-page', this.addPageHandler);
    window.api.off('navigation-finished', this.navigationFinishedHandler);
    window.api.off('parse-html', this.parseHtmlHandler);
    window.api.off('show-message', this.showMessageHandler);
    window.api.off('browser-window-focus', this.browserWindowFocusHandler);
    window.api.off('browser-window-blur', this.browserWindowBlurHandler);
    window.api.off('close-current-tab', this.closeCurrentTabHandler);
    window.api.off('bring-to-top', this.bringToTopHandler);
    window.api.off('query-title', this.queryTitleHandler);
    window.api.off('focus-search-text', this.focusSearchTextHandler);
  },
  data: () => ({
    searchText: '',
    tab: null,
    items: [],
    message: 'ready'
  }),
  methods: {
    goBack() {
      window.api.goBack();
    },
    goForward() {
      window.api.goForward();
    },
    reload() {
      console.log('reload');
    },
    searchStart() {
      window.api.searchStart(this.searchText);
    },
    searchStop() {
      this.searchText = '';
      window.api.searchStop();
      this.$refs.searchText.blur();
    },
    selectPage(idx) {
      if (idx !== undefined) {
        window.api.selectPage(this.items[idx].contentId);
      }
    },
    debugWindow() {
      window.api.debugWindow();
    },
    debugView() {
      window.api.debugView();
    },
    closePage() {
      const item = this.items[this.tab];
      //console.log('removing page:', item);
      if (!item) return
      window.api.unloadPage(item.contentId);
      if (this.tab === this.items.length - 1) {
        this.items.pop();
      }
      this.items.splice(this.tab, 1);
    },
    isActive(contentId) {
      if (contentId === undefined) {
        return false;
      }
      const item = this.items[this.tab];
      if (!item) return false;
      return contentId === item.contentId;
    },
    openPageList() {
      window.api.openPageList();
    },
    openFavsPage() {
      window.api.openFavsPage();
    },
    openHistoryPage() {
      window.api.openHistoryPage();
    },
    selectByTitle(title) {
      const item = this.items.find(item => item.title === title);
      const idx = this.items.findIndex(item => item.title === title);
      if (item) {
        window.api.sendIdByTitle(item.contentId);
        this.tab = idx;
        window.api.selectPage(item.contentId);
      } else {
        window.api.sendIdByTitle(-1);
      }
    },
    fucusSearchText() {
      this.$refs.searchText.focus();
    },
  }
});

function setTheme() {
  const darkTheme = ref(window.matchMedia('(prefers-color-scheme: dark)').matches);
  theme.global.name.value = darkTheme.value ? 'dark' : 'light';  
}

const vuetify = new createVuetify();

app.use(vuetify);
app.mount('#app');
