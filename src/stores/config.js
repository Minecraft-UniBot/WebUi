/**
 * 配置 Store：配置值 + Schema + 差异计算与保存
 */
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { http } from '@/utils/http'
import { get_nested, set_nested } from '@/utils/format'

export const useConfigStore = defineStore('config', () => {
  const config_data = ref(null)
  const schema = ref(null)
  const draft = ref(null) // 编辑中的副本
  const loading = ref(false)
  const saving = ref(false)

  /** 草稿相对原配置的变更项：[{ key, label, old_value, new_value }] */
  const changes = computed(() => {
    if (!config_data.value || !draft.value || !schema.value) return []
    const result = []
    for (const field of schema.value.fields) {
      const old_value = get_nested(config_data.value, field.key)
      const new_value = get_nested(draft.value, field.key)
      if (JSON.stringify(old_value) !== JSON.stringify(new_value)) {
        result.push({ key: field.key, label: field.label, old_value, new_value })
      }
    }
    return result
  })

  const has_changes = computed(() => changes.value.length > 0)

  async function fetch_all() {
    loading.value = true
    try {
      const [data, schema_data] = await Promise.all([
        http.get('/api/config'),
        http.get('/api/config/schema'),
      ])
      config_data.value = data
      schema.value = schema_data
      draft.value = JSON.parse(JSON.stringify(data))
    } finally {
      loading.value = false
    }
  }

  function update_field(key, value) {
    draft.value = set_nested(draft.value, key, value)
  }

  function reset_draft() {
    if (config_data.value) {
      draft.value = JSON.parse(JSON.stringify(config_data.value))
    }
  }

  /** 仅提交变更字段（PATCH 深合并） */
  async function save_changes() {
    if (!has_changes.value) return
    saving.value = true
    try {
      const patch = {}
      for (const change of changes.value) {
        const keys = change.key.split('.')
        let current = patch
        for (let index = 0; index < keys.length - 1; index += 1) {
          current[keys[index]] = current[keys[index]] || {}
          current = current[keys[index]]
        }
        current[keys[keys.length - 1]] = change.new_value
      }
      await http.patch('/api/config', patch)
      await fetch_all()
    } finally {
      saving.value = false
    }
  }

  return {
    config_data,
    schema,
    draft,
    loading,
    saving,
    changes,
    has_changes,
    fetch_all,
    update_field,
    reset_draft,
    save_changes,
  }
})
