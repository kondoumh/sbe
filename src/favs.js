const { createApp, ref, toRaw } = Vue;
const { createVuetify, useTheme } = Vuetify;

let theme;

const app = createApp({
  setup() {
    theme = useTheme();
    setTheme();
  },
  async mounted () {
    window.favsApi.on('theme-updated', this.onUpdateTheme);
    window.favsApi.on('browser-window-focus', this.onFocus);
    window.favsApi.on('browser-window-blur', this.onFocus);
    window.favsApi.on('bring-to-top', this.onFocus);
    await this.onFocus();
  },
  methods: {
    onUpdateTheme () {
      setTheme();
    },
    async onFocus () {
      const favs = await window.favsApi.getFavs();
      this.items = favs;
    },
    deleteItem (item) {
      this.favDelete = item;
      this.dialogDelete = true;
    },
    async deleteItemConfirm () {
      const favs = await window.favsApi.deleteFav(toRaw(this.favDelete));
      this.items = favs;
      this.closeDelete();
    },
    closeDelete () {
      this.dialogDelete = false;
    }
  },
  data: () => ({
    dialogDelete: false,
    selectedItem: 0,
    items: [],
    favDelete: null,
  })
});

function setTheme() {
  const darkTheme = ref(window.matchMedia('(prefers-color-scheme: dark)').matches);
  theme.global.name.value = darkTheme.value ? 'dark' : 'light';  
}

const vuetify = new createVuetify();

app.use(vuetify);
app.mount('#app');
