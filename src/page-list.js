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
    if (!this.projectName) {
      this.projectName = sessionStorage.getItem("projectName")
      if (!this.projectName) {
        this.projectName = localStorage.getItem("projectName")
        sessionStorage.setItem("projectName", this.projectName)
        localStorage.removeItem("projectName")
      }
    }
    this.fetchData()
    window.addEventListener('focus', this.onFocus)
  },
  methods: {
    async fetchData () {
      const { sortBy, sortDesc, page, itemsPerPage } = this.options
      const skip = (page - 1) * itemsPerPage
      let url = `https://scrapbox.io/api/pages/${this.projectName}?skip=${skip}&limit=${itemsPerPage}&sort=${sortBy}`
      console.log(url)
      const res = await fetch(url)
      const data = await res.json()
      this.items = await data.pages
      console.log(data.count)
      this.pageCount = data.count
      this.length = Math.ceil(this.pageCount / itemsPerPage)
    },
    formatDate (timestamp) {
      let date = new Date()
      date.setTime(timestamp * 1000)
      const params = {
        year: "numeric", month: "numeric", day: "numeric",
        hour: "numeric", minute: "numeric", second: "numeric",
        hour12: false
      }
      return date.toLocaleString(navigator.language, params)
    },
    input () {
      this.fetchData()
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
    ptojectName: '',
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
