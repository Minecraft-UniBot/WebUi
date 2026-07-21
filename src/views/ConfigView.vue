<script setup>
import { ref, computed, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import { storeToRefs } from 'pinia'
import { useConfigStore } from '@/stores/config'
import { use_toast } from '@/composables/use_toast'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import Textarea from '@/components/ui/Textarea.vue'
import Switch from '@/components/ui/Switch.vue'
import Dialog from '@/components/ui/Dialog.vue'
import Spinner from '@/components/ui/Spinner.vue'
import { get_nested } from '@/utils/format'

const config_store = useConfigStore()
const toast = use_toast()
const { schema, draft, loading, saving, changes, has_changes } = storeToRefs(config_store)

const active_group = ref('')
const diff_open = ref(false)

const groups = computed(() => schema.value?.groups || [])

onMounted(async () => {
  try {
    await config_store.fetch_all()
    if (groups.value.length > 0) active_group.value = groups.value[0].name
  } catch (error) {
    toast.error(error.message || '获取配置失败')
  }
})

function fields_of(group) {
  return (schema.value?.fields || []).filter((field) => group.keys.includes(field.key))
}

function draft_value(key) {
  return get_nested(draft.value, key)
}

function handle_update(key, value) {
  config_store.update_field(key, value)
}

// 列表编辑器
function add_list_item(key) {
  const current = draft_value(key)
  handle_update(key, [...(current || []), ''])
}

function update_list_item(key, index, value) {
  const current = [...(draft_value(key) || [])]
  current[index] = value
  handle_update(key, current)
}

function remove_list_item(key, index) {
  const current = [...(draft_value(key) || [])]
  current.splice(index, 1)
  handle_update(key, current)
}

function display_value(value) {
  if (value === undefined || value === null || value === '') return '（空）'
  if (typeof value === 'boolean') return value ? '开启' : '关闭'
  if (Array.isArray(value)) return value.length > 0 ? value.join(', ') : '（空列表）'
  return String(value)
}

async function confirm_save() {
  try {
    await config_store.save_changes()
    toast.success('配置已保存并热更新')
    diff_open.value = false
  } catch (error) {
    toast.error(error.message || '保存失败')
  }
}
</script>

<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">配置中心</h1>
        <p class="page-desc">修改后保存将写回 Config.toml 并热更新</p>
      </div>
      <div class="page-actions">
        <Button variant="ghost" :disabled="!has_changes" @click="config_store.reset_draft()">
          撤销修改
        </Button>
        <Button variant="primary" :disabled="!has_changes" @click="diff_open = true">
          <Icon icon="lucide:save" width="15" />
          保存修改
          <span v-if="has_changes" class="change-count">{{ changes.length }}</span>
        </Button>
      </div>
    </div>

    <div v-if="loading && !draft" class="card">
      <div class="loading-block"><Spinner :size="18" /> 加载配置中…</div>
    </div>

    <div v-else class="config-layout">
      <!-- 分组导航 -->
      <nav class="group-nav card">
        <button
          v-for="group in groups"
          :key="group.name"
          class="group-item"
          :class="{ 'group-item--active': active_group === group.name }"
          @click="active_group = group.name"
        >
          {{ group.name }}
          <span
            v-if="group.keys.some((key) => changes.some((c) => c.key === key))"
            class="group-dot"
          />
        </button>
      </nav>

      <!-- 字段表单 -->
      <section class="card config-panel">
        <div class="card-header">
          <h3 class="card-title">{{ active_group }}</h3>
        </div>
        <div class="field-list">
          <div
            v-for="field in fields_of(groups.find((g) => g.name === active_group) || { keys: [] })"
            :key="field.key"
            class="field-row"
            :class="{ 'field-row--changed': changes.some((c) => c.key === field.key) }"
          >
            <div class="field-meta">
              <label class="field-label">
                {{ field.label }}
                <span class="mono field-key">{{ field.key }}</span>
              </label>
              <p class="field-desc">{{ field.description }}</p>
            </div>

            <div class="field-control">
              <!-- 开关 -->
              <Switch
                v-if="field.type === 'boolean'"
                :model-value="Boolean(draft_value(field.key))"
                @update:model-value="(value) => handle_update(field.key, value)"
              />

              <!-- 密码/密钥 -->
              <Input
                v-else-if="field.type === 'secret'"
                type="password"
                :model-value="draft_value(field.key) ?? ''"
                placeholder="留空则不修改"
                @update:model-value="(value) => handle_update(field.key, value)"
              />

              <!-- 数字 -->
              <Input
                v-else-if="field.type === 'number'"
                type="number"
                :model-value="draft_value(field.key) ?? 0"
                @update:model-value="(value) => handle_update(field.key, Number(value))"
              />

              <!-- 长文本 -->
              <Textarea
                v-else-if="field.type === 'text'"
                :model-value="draft_value(field.key) ?? ''"
                @update:model-value="(value) => handle_update(field.key, value)"
              />

              <!-- 列表 -->
              <div v-else-if="field.type === 'list'" class="list-editor">
                <div
                  v-for="(item, index) in draft_value(field.key) || []"
                  :key="index"
                  class="list-item"
                >
                  <Input
                    :model-value="item"
                    @update:model-value="(value) => update_list_item(field.key, index, value)"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    icon-only
                    @click="remove_list_item(field.key, index)"
                  >
                    <Icon icon="lucide:x" width="14" />
                  </Button>
                </div>
                <Button variant="secondary" size="sm" @click="add_list_item(field.key)">
                  <Icon icon="lucide:plus" width="13" />
                  添加一项
                </Button>
              </div>

              <!-- 字符串 -->
              <Input
                v-else
                :model-value="draft_value(field.key) ?? ''"
                @update:model-value="(value) => handle_update(field.key, value)"
              />
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- 保存前 diff 预览 -->
    <Dialog
      v-model="diff_open"
      title="确认修改"
      :description="`共 ${changes.length} 项配置将被更新`"
      confirm-text="确认保存"
      :loading="saving"
      @confirm="confirm_save"
    >
      <ul class="diff-list">
        <li v-for="change in changes" :key="change.key" class="diff-item">
          <div class="diff-label">{{ change.label }}</div>
          <div class="diff-values mono">
            <span class="diff-old">{{ display_value(change.old_value) }}</span>
            <Icon icon="lucide:arrow-right" width="13" class="text-muted" />
            <span class="diff-new">{{ display_value(change.new_value) }}</span>
          </div>
        </li>
      </ul>
    </Dialog>
  </div>
</template>

<style scoped>
.change-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  background: rgb(255 255 255 / 0.25);
  font-size: var(--text-xs);
}

.config-layout {
  display: grid;
  grid-template-columns: 180px 1fr;
  gap: var(--space-5);
  align-items: start;
}

/* 分组导航 */
.group-nav {
  padding: var(--space-2);
  position: sticky;
  top: var(--space-4);
}

.group-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius);
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--text-muted);
  text-align: left;
  transition:
    background-color var(--transition),
    color var(--transition);
}

.group-item:hover {
  background: rgb(0 0 0 / 0.04);
  color: var(--text);
}

.group-item--active {
  background: var(--accent-soft);
  color: var(--accent);
}

.group-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--warning);
}

/* 字段行 */
.field-list {
  padding: var(--space-2) var(--space-5);
}

.field-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-6);
  padding: var(--space-4) 0;
  border-bottom: 1px solid var(--border);
}

.field-row:last-child {
  border-bottom: none;
}

.field-row--changed {
  background: linear-gradient(to right, var(--warning-soft), transparent 60%);
  margin: 0 calc(-1 * var(--space-5));
  padding-left: var(--space-5);
  padding-right: var(--space-5);
  border-radius: var(--radius);
}

.field-meta {
  flex: 1;
  min-width: 0;
}

.field-label {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text);
}

.field-key {
  font-size: 11px;
  color: var(--text-muted);
  background: var(--surface-sunken);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 0 var(--space-1);
}

.field-desc {
  margin-top: 2px;
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.field-control {
  width: 320px;
  flex-shrink: 0;
  display: flex;
  justify-content: flex-end;
}

.field-control > :not(.list-editor) {
  width: 100%;
}

.list-editor {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  align-items: flex-start;
}

.list-item {
  display: flex;
  gap: var(--space-1);
  width: 100%;
}

/* diff 预览 */
.diff-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  max-height: 320px;
  overflow-y: auto;
}

.diff-item {
  padding: var(--space-3);
  background: var(--surface-sunken);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}

.diff-label {
  font-size: var(--text-sm);
  font-weight: 600;
  margin-bottom: var(--space-1);
}

.diff-values {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-xs);
  flex-wrap: wrap;
}

.diff-old {
  color: var(--danger);
  text-decoration: line-through;
}

.diff-new {
  color: var(--success);
  font-weight: 600;
}

@media (max-width: 900px) {
  .config-layout {
    grid-template-columns: 1fr;
  }

  .field-row {
    flex-direction: column;
    gap: var(--space-3);
  }

  .field-control {
    width: 100%;
  }
}
</style>
