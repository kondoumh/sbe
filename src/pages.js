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
    this.projectName = await window.pagesApi.activeProject()
    this.projects = await window.pagesApi.openedProjects()
    this.fetchData()
    window.pagesApi.on('browser-window-fucus', this.onFocus)
    window.pagesApi.on('browser-window-blur', this.onFocus)
  },
  methods: {
    async fetchData () {
      const { sortBy, sortDesc, page, itemsPerPage } = this.options
      const skip = (page - 1) * itemsPerPage
      let url = `https://scrapbox.io/api/pages/${this.projectName}?skip=${skip}&limit=${itemsPerPage}&sort=${sortBy}`
      const data = await window.pagesApi.fetchPages(url)
      this.items = await data.pages
      this.pageCount = data.count
      this.length = Math.ceil(this.pageCount / itemsPerPage)
    },
    formatDate (timestamp) {
      let date = new Date()
      date.setTime(timestamp * 1000)
      const params = {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: 'numeric', second: 'numeric',
        hour12: false
      }
      return date.toLocaleString(navigator.language, params)
    },
    onFocus () {
      this.$vuetify.theme.dark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      this.fetchData()
    },
    encodeTitle(title) {
      return encodeURIComponent(title)
    }
  },
  watch: {
    options: {
      handler () {
        this.fetchData()
      },
      deep: true
    }
  },
  data: () => ({
    page: 1,
    pageCount: 0,
    length: 1,
    items: [],
    projectName: '',
    projects: [],
    options: {
      itemsPerPage: 50,
    },
    headers: [
      { text: 'pin', value: 'pin', sortable: false, width: '25px' },
      { text: 'views', value: 'views', width: '50px' },
      { text: 'linked', value: 'linked', width: '50px' },
      { text: 'updated', value: 'updated', width: '50px' },
      { text: 'title', value: 'title', sortable: false, width: '150px'},
      { text: 'image', value: 'image', sortable: false, width: '350px' }
    ]
  })
})
