/**
 * 日志 Store：文件列表 + 内容分页过滤
 */
import { ref } from 'vue'
import { defineStore } from 'pinia'
import { http } from '@/utils/http'

export const useLogStore = defineStore('log', () => {
  const file_list = ref([])
  const current_file = ref('')
  const log_items = ref([])
  const total = ref(0)
  const page = ref(1)
  const page_size = ref(500)
  const level_filter = ref('all')
  const keyword_filter = ref('')
  const loading = ref(false)

  async function fetch_file_list() {
    file_list.value = (await http.get('/api/logs')) || []
    return file_list.value
  }

  async function fetch_content() {
    if (!current_file.value) return
    loading.value = true
    try {
      const data = await http.get(`/api/logs/${encodeURIComponent(current_file.value)}`, {
        query: {
          level: level_filter.value === 'all' ? '' : level_filter.value,
          keyword: keyword_filter.value,
          page: page.value,
          page_size: page_size.value,
        },
      })
      log_items.value = data.items
      total.value = data.total
    } finally {
      loading.value = false
    }
  }

  async function delete_file(name) {
    await http.delete(`/api/logs/${encodeURIComponent(name)}`)
    if (current_file.value === name) {
      current_file.value = ''
      log_items.value = []
      total.value = 0
    }
    await fetch_file_list()
  }

  function select_file(name) {
    current_file.value = name
    page.value = 1
  }

  function set_level_filter(level) {
    level_filter.value = level
    page.value = 1
  }

  function set_keyword_filter(keyword) {
    keyword_filter.value = keyword
    page.value = 1
  }

  function set_page(value) {
    page.value = value
  }

  return {
    file_list,
    current_file,
    log_items,
    total,
    page,
    page_size,
    level_filter,
    keyword_filter,
    loading,
    fetch_file_list,
    fetch_content,
    delete_file,
    select_file,
    set_level_filter,
    set_keyword_filter,
    set_page,
  }
})
