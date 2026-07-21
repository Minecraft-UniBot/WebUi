/**
 * 认证 Store：登录态、用户信息、初始化流程
 */
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { http, save_tokens, clear_tokens, get_access_token, get_refresh_token } from '@/utils/http'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)

  const is_logged_in = computed(() => Boolean(get_access_token()))
  const is_admin = computed(() => user.value?.role === 'admin')
  const is_operator = computed(() => ['admin', 'operator'].includes(user.value?.role))

  /** 拉取当前登录用户信息 */
  async function fetch_me() {
    user.value = await http.get('/api/auth/me')
    return user.value
  }

  /** 探测系统是否已初始化（是否存在任意账户） */
  async function fetch_auth_status() {
    const data = await http.get('/api/auth/status', { auth: false })
    return data.initialized
  }

  async function login(username, password) {
    const data = await http.post('/api/auth/login', { username, password }, { auth: false })
    save_tokens(data.access_token, data.refresh_token)
    user.value = data.user
    return data
  }

  /** 首次初始化：创建管理员账户 */
  async function setup(username, password, nickname) {
    await http.post('/api/auth/setup', { username, password, nickname }, { auth: false })
  }

  async function logout() {
    try {
      await http.post('/api/auth/logout', { refresh_token: get_refresh_token() })
    } catch {
      // 登出失败也要清理本地状态
    }
    clear_tokens()
    user.value = null
  }

  async function change_password(old_password, new_password) {
    await http.put('/api/auth/password', { old_password, new_password })
  }

  async function update_profile(nickname) {
    await http.put('/api/auth/profile', { nickname })
    if (user.value) user.value = { ...user.value, nickname }
  }

  return {
    user,
    is_logged_in,
    is_admin,
    is_operator,
    fetch_me,
    fetch_auth_status,
    login,
    setup,
    logout,
    change_password,
    update_profile,
  }
})
