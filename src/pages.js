const { createApp, ref } = Vue;
const { createVuetify, useTheme } = Vuetify;

let theme;

const app = createApp({
  setup() {
    theme = useTheme();
    setTheme();
  },
  async mounted () {
    window.pagesApi.on('browser-window-fucus', this.onFocus)
    window.pagesApi.on('bring-to-top', this.onFocus)
    await this.onFocus();
  },
  methods: {
    async fetchData () {
      const { sortBy, sortDesc, page, itemsPerPage } = this.options
      const skip = (page - 1) * itemsPerPage
      let url = `https://scrapbox.io/api/pages/${this.projectName}?skip=${skip}&limit=${itemsPerPage}&sort=${sortBy}`
      const data = await window.pagesApi.fetchPages(url)
      this.serverItems = await data.pages
      this.pageCount = data.count
      this.length = Math.ceil(this.pageCount / itemsPerPage)
    },
    formattedDate (timestamp) {
      return formatDate(timestamp);
    },
    async onFocus () {
      this.$vuetify.theme.dark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      await this.setProjects();
      await this.setProjectName();
      if (this.projectName) {
        this.fetchData()
      }
    },
    async setProjectName () {
      if (!this.projectName) {
        const projectName = await window.pagesApi.activeProject()
        if (projectName) {
          this.projectName = projectName;
        } else {
          if (this.projects.length > 0) {
            this.projectName = this.projects[0];
          }
        }
      }
    },
    async setProjects () {
      const projects = await window.pagesApi.getProjects();
      if (projects.length > 0) {
        this.projects = projects
      }
    },
    encodeTitle (title) {
      return encodeURIComponent(title)
    }
  },
  data: () => ({
    page: 1,
    pageCount: 0,
    length: 1,
    serverItems: [],
    projectName: '',
    projects: [],
    options: {
      itemsPerPage: 50,
    },
    headers: [
      { title: 'pin', key: 'pin', sortable: false, width: '25px' },
      { title: 'views', key: 'views', width: '50px' },
      { title: 'linked', key: 'linked', width: '50px' },
      { title: 'updated', key: 'updated', width: '50px' },
      { title: 'title', key: 'title', sortable: false, width: '150px'},
      { title: 'image', key: 'image', sortable: false, width: '350px' }
    ]
  })
});

function setTheme() {
  const darkTheme = ref(window.matchMedia('(prefers-color-scheme: dark)').matches);
  theme.global.name.value = darkTheme.value ? 'dark' : 'light';  
}

const vuetify = new createVuetify();

app.use(vuetify);
app.mount('#app');
