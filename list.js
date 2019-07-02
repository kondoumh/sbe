const app = new Vue({
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
    window.addEventListener('focus', this.onActive)
  },
  methods: {
    async fetchData () {
      const skip = (this.pagination.page - 1) * this.pagination.rowsPerPage
      let url = `https://scrapbox.io/api/pages/${this.projectName}?skip=${skip}&limit=${this.pagination.rowsPerPage}&sort=${this.pagination.sortBy}`
      const res = await fetch(url)
      const data = await res.json()
      this.items = await data.pages // .filter(page => page.pin === 0)
      this.pagination.totalItems = data.count // - res.data.pages.filter(page => page.pin !== 0).length
    },
    formatDate (timestamp) {
      let date = new Date()
      date.setTime(timestamp * 1000)
      const options = {
        year: "numeric", month: "numeric", day: "numeric",
        hour: "numeric", minute: "numeric", second: "numeric",
        hour12: false
      }
      return date.toLocaleString(navigator.language, options)
    },
    input (page) {
      this.fetchData()
    },
    onActive () {
      this.fetchData()
    }
  },
  computed: {
    page () {
      if (this.pagination.rowsPerPage == null || this.pagination.totalItems == null ) return 0
      return Math.ceil(this.pagination.totalItems / this.pagination.rowsPerPage)
    }
  },
  watch: {
    pagination: {
      handler () {
        this.pagination.descending = false
        this.fetchData()
      }
    }
  },
  data: () => ({
    items: [],
    ptojectName: '',
    rowsPerPageItems: [15, 20, 25, 50, 75, 100],
    pagination: {
      sortBy: 'updated',
      rowsPerPage: 50,
      totalItems: 0
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