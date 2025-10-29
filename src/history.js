const { createApp, ref, toRaw } = Vue;
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
  methods: {
    async onFocus () {
      this.$vuetify.theme.dark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      const history = await window.api.getHistory();
      this.items = history;
    },
    deleteItem (item) {
      this.historyDelete = item
      this.dialogDelete = true;
    },
    async deleteItemConfirm () {
      const history = await window.api.deleteHistory(toRaw(this.historyDelete));
      this.items = history;
      this.closeDelete();
    },
    closeDelete () {
      console.log("close delete dialog");
      this.dialogDelete = false;
    }
  },
  data: () => ({
    dialogDelete: false,
    selectedItem: 0,
    items: [],
    historyDelete: null,
  })
});

function setTheme() {
  const darkTheme = ref(window.matchMedia('(prefers-color-scheme: dark)').matches);
  theme.global.name.value = darkTheme.value ? 'dark' : 'light';  
}

const vuetify = new createVuetify();

app.use(vuetify);
app.mount('#app');

