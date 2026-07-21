/**
 * HTTP 请求封装
 * - 统一携带 JWT（Authorization: Bearer）
 * - access_token 过期（401）时自动用 refresh_token 刷新并重试
 * - 统一解析 { code, data, message } 响应格式
 */

const ACCESS_TOKEN_KEY = 'unibot_access_token'
const REFRESH_TOKEN_KEY = 'unibot_refresh_token'

export function get_access_token() {
  return localStorage.getItem(ACCESS_TOKEN_KEY) || ''
}

export function get_refresh_token() {
  return localStorage.getItem(REFRESH_TOKEN_KEY) || ''
}

export function save_tokens(access_token, refresh_token) {
  if (access_token) localStorage.setItem(ACCESS_TOKEN_KEY, access_token)
  if (refresh_token) localStorage.setItem(REFRESH_TOKEN_KEY, refresh_token)
}

export function clear_tokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

/** 业务错误：code !== 0 时抛出，携带 code 与 message */
export class ApiError extends Error {
  constructor(code, message) {
    super(message)
    this.name = 'ApiError'
    this.code = code
  }
}

let refresh_promise = null

async function refresh_access_token() {
  const refresh_token = get_refresh_token()
  if (!refresh_token) throw new ApiError(401, '登录已过期')
  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token }),
  })
  const result = await response.json()
  if (result.code !== 0) throw new ApiError(result.code, result.message || '刷新失败')
  save_tokens(result.data.access_token)
  return result.data.access_token
}

async function request(method, path, { body, query, auth = true } = {}) {
  const url = new URL(path, window.location.origin)
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, value)
      }
    }
  }

  const do_fetch = async () => {
    const headers = { 'Content-Type': 'application/json' }
    if (auth) {
      const token = get_access_token()
      if (token) headers.Authorization = `Bearer ${token}`
    }
    return fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  }

  let response = await do_fetch()

  // access_token 过期：尝试刷新一次后重试（登录/刷新接口除外）
  if (response.status === 401 && auth && !path.startsWith('/api/auth/')) {
    try {
      refresh_promise = refresh_promise || refresh_access_token()
      await refresh_promise
      refresh_promise = null
      response = await do_fetch()
    } catch (error) {
      refresh_promise = null
      clear_tokens()
      window.dispatchEvent(new CustomEvent('unibot:unauthorized'))
      throw error
    }
  }

  if (response.status === 401) {
    clear_tokens()
    window.dispatchEvent(new CustomEvent('unibot:unauthorized'))
    throw new ApiError(401, '登录已过期')
  }

  let result
  try {
    result = await response.json()
  } catch {
    throw new ApiError(response.status, `请求失败：${response.status}`)
  }

  if (result.code !== 0) {
    throw new ApiError(result.code, result.message || '请求失败')
  }
  return result.data
}

export const http = {
  get: (path, options) => request('GET', path, options),
  post: (path, body, options) => request('POST', path, { ...options, body }),
  put: (path, body, options) => request('PUT', path, { ...options, body }),
  patch: (path, body, options) => request('PATCH', path, { ...options, body }),
  delete: (path, options) => request('DELETE', path, options),
}
