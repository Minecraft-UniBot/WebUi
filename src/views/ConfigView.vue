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
import Tabs from '@/components/ui/Tabs.vue'
import { get_nested } from '@/utils/format'

const config_store = useConfigStore()
const toast = use_toast()
const {
  schema,
  draft,
  loading,
  saving,
  changes,
  has_changes,
  env_schema,
  env_groups,
  env_draft,
  env_loading,
  env_saving,
  env_changes,
  has_env_changes,
  nonebot_adapters,
  nonebot_plugins,
  nonebot_loading,
} = storeToRefs(config_store)

const active_tab = ref('toml')
const active_group = ref('')
const active_env_group = ref('')
const diff_open = ref(false)
const env_diff_open = ref(false)

// 添加适配器/插件的表单
const adapter_form = ref({ name: '', module_name: '' })
const plugin_form = ref({ name: '', module_name: '' })

const tabs = [
  { value: 'toml', label: 'Config.toml', icon: 'lucide:file-cog' },
  { value: 'env', label: '环境变量', icon: 'lucide:terminal' },
  { value: 'nonebot', label: '插件与适配器', icon: 'lucide:puzzle' },
]

const groups = computed(() => schema.value?.groups || [])

onMounted(async () => {
  try {
    await config_store.fetch_all()
    if (groups.value.length > 0) active_group.value = groups.value[0].name
  } catch (error) {
    toast.error(error.message || '获取配置失败')
  }
  config_store.fetch_env().catch(() => {})
  config_store.fetch_nonebot().catch(() => {})
  if (env_groups.value.length > 0) active_env_group.value = env_groups.value[0].name
})

function fields_of(group) {
  return (schema.value?.fields || []).filter((field) => group.keys.includes(field.key))
}

function env_fields_of(group) {
  return env_schema.value.filter((field) => group.keys.includes(field.key))
}

function draft_value(key) {
  return get_nested(draft.value, key)
}

function env_draft_value(key) {
  return env_draft.value[key]
}

function handle_update(key, value) {
  config_store.update_field(key, value)
}

function handle_env_update(key, value) {
  config_store.update_env_field(key, value)
}

// 列表编辑器（Config.toml）
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

function keyword_entries(key) {
  return Object.entries(draft_value(key) || {}).map(([reply, keywords]) => ({ reply, keywords }))
}

function update_keyword_entry(key, entry_index, property, value) {
  const entries = keyword_entries(key)
  entries[entry_index][property] = value
  handle_update(
    key,
    Object.fromEntries(entries.map((entry) => [entry.reply, entry.keywords])),
  )
}

function add_keyword_entry(key) {
  const entries = keyword_entries(key)
  entries.push({ reply: '', keywords: [] })
  handle_update(key, Object.fromEntries(entries.map((entry) => [entry.reply, entry.keywords])))
}

function remove_keyword_entry(key, entry_index) {
  const entries = keyword_entries(key)
  entries.splice(entry_index, 1)
  handle_update(key, Object.fromEntries(entries.map((entry) => [entry.reply, entry.keywords])))
}

// 列表编辑器（.env）
function add_env_list_item(key) {
  const current = env_draft_value(key)
  handle_env_update(key, [...(current || []), ''])
}

function update_env_list_item(key, index, value) {
  const current = [...(env_draft_value(key) || [])]
  current[index] = value
  handle_env_update(key, current)
}

function remove_env_list_item(key, index) {
  const current = [...(env_draft_value(key) || [])]
  current.splice(index, 1)
  handle_env_update(key, current)
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

async function confirm_env_save() {
  try {
    await config_store.save_env_changes()
    toast.success('环境变量已保存，重启后生效')
    env_diff_open.value = false
  } catch (error) {
    toast.error(error.message || '保存失败')
  }
}

async function submit_add_adapter() {
  if (!adapter_form.value.name || !adapter_form.value.module_name) {
    toast.error('请填写适配器名称和模块路径')
    return
  }
  try {
    await config_store.add_adapter(adapter_form.value.name, adapter_form.value.module_name)
    toast.success('适配器已添加，重启后生效')
    adapter_form.value = { name: '', module_name: '' }
  } catch (error) {
    toast.error(error.message || '添加失败')
  }
}

async function submit_remove_adapter(adapter) {
  try {
    await config_store.remove_adapter(adapter.name, adapter.module_name)
    toast.success('适配器已移除，重启后生效')
  } catch (error) {
    toast.error(error.message || '移除失败')
  }
}

async function submit_add_plugin() {
  if (!plugin_form.value.module_name) {
    toast.error('请填写插件模块路径')
    return
  }
  try {
    await config_store.add_plugin(plugin_form.value.name || plugin_form.value.module_name, plugin_form.value.module_name)
    toast.success('插件已添加，重启后生效')
    plugin_form.value = { name: '', module_name: '' }
  } catch (error) {
    toast.error(error.message || '添加失败')
  }
}

async function submit_remove_plugin(plugin) {
  try {
    await config_store.remove_plugin(plugin.module_name, plugin.module_name)
    toast.success('插件已移除，重启后生效')
  } catch (error) {
    toast.error(error.message || '移除失败')
  }
}
</script>

<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">配置中心</h1>
        <p class="page-desc">管理 Config.toml、环境变量与 NoneBot 插件/适配器</p>
      </div>
    </div>

    <Tabs v-model="active_tab" :tabs="tabs">
      <!-- Config.toml 配置 -->
      <template #toml>
        <div class="tab-actions">
          <Button variant="ghost" :disabled="!has_changes" @click="config_store.reset_draft()">
            撤销修改
          </Button>
          <Button variant="primary" :disabled="!has_changes" @click="diff_open = true">
            <Icon icon="lucide:save" width="15" />
            保存修改
            <span v-if="has_changes" class="change-count">{{ changes.length }}</span>
          </Button>
        </div>

        <div v-if="loading && !draft" class="card">
          <div class="loading-block"><Spinner :size="18" /> 加载配置中…</div>
        </div>

        <div v-else class="config-layout">
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
                  <Switch
                    v-if="field.type === 'boolean'"
                    :model-value="Boolean(draft_value(field.key))"
                    @update:model-value="(value) => handle_update(field.key, value)"
                  />
                  <Input
                    v-else-if="field.type === 'secret'"
                    type="password"
                    :model-value="draft_value(field.key) ?? ''"
                    placeholder="留空则不修改"
                    @update:model-value="(value) => handle_update(field.key, value)"
                  />
                  <Input
                    v-else-if="field.type === 'number'"
                    type="number"
                    :model-value="draft_value(field.key) ?? 0"
                    @update:model-value="(value) => handle_update(field.key, Number(value))"
                  />
                  <Textarea
                    v-else-if="field.type === 'text'"
                    :model-value="draft_value(field.key) ?? ''"
                    @update:model-value="(value) => handle_update(field.key, value)"
                  />
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
                  <div v-else-if="field.type === 'keyword_map'" class="keyword-editor">
                    <div
                      v-for="(entry, entry_index) in keyword_entries(field.key)"
                      :key="entry_index"
                      class="keyword-entry"
                    >
                      <Input
                        :model-value="entry.reply"
                        placeholder="回复内容"
                        @update:model-value="(value) => update_keyword_entry(field.key, entry_index, 'reply', value)"
                      />
                      <Input
                        :model-value="entry.keywords.join(', ')"
                        placeholder="关键词，用逗号分隔"
                        @update:model-value="(value) => update_keyword_entry(field.key, entry_index, 'keywords', value.split(',').map((item) => item.trim()).filter(Boolean))"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        icon-only
                        @click="remove_keyword_entry(field.key, entry_index)"
                      >
                        <Icon icon="lucide:x" width="14" />
                      </Button>
                    </div>
                    <Button variant="secondary" size="sm" @click="add_keyword_entry(field.key)">
                      <Icon icon="lucide:plus" width="13" />
                      添加一条规则
                    </Button>
                  </div>
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
      </template>

      <!-- 环境变量 -->
      <template #env>
        <div class="tab-actions">
          <Button variant="ghost" :disabled="!has_env_changes" @click="config_store.reset_env_draft()">
            撤销修改
          </Button>
          <Button variant="primary" :disabled="!has_env_changes" @click="env_diff_open = true">
            <Icon icon="lucide:save" width="15" />
            保存修改
            <span v-if="has_env_changes" class="change-count">{{ env_changes.length }}</span>
          </Button>
        </div>

        <div v-if="env_loading" class="card">
          <div class="loading-block"><Spinner :size="18" /> 加载环境变量…</div>
        </div>

        <div v-else class="config-layout">
          <nav class="group-nav card">
            <button
              v-for="group in env_groups"
              :key="group.name"
              class="group-item"
              :class="{ 'group-item--active': active_env_group === group.name }"
              @click="active_env_group = group.name"
            >
              {{ group.name }}
              <span
                v-if="group.keys.some((key) => env_changes.some((c) => c.key === key))"
                class="group-dot"
              />
            </button>
          </nav>

          <section class="card config-panel">
            <div class="card-header">
              <h3 class="card-title">{{ active_env_group }}</h3>
              <span class="text-xs text-muted">修改后需重启机器人生效</span>
            </div>
            <div class="field-list">
              <div
                v-for="field in env_fields_of(env_groups.find((g) => g.name === active_env_group) || { keys: [] })"
                :key="field.key"
                class="field-row"
                :class="{ 'field-row--changed': env_changes.some((c) => c.key === field.key) }"
              >
                <div class="field-meta">
                  <label class="field-label">
                    {{ field.label }}
                    <span class="mono field-key">{{ field.key }}</span>
                  </label>
                  <p class="field-desc">{{ field.description }}</p>
                </div>

                <div class="field-control">
                  <Input
                    v-if="field.type === 'secret'"
                    type="password"
                    :model-value="env_draft_value(field.key) ?? ''"
                    placeholder="留空则不修改"
                    @update:model-value="(value) => handle_env_update(field.key, value)"
                  />
                  <Input
                    v-else-if="field.type === 'number'"
                    type="number"
                    :model-value="env_draft_value(field.key) ?? 0"
                    @update:model-value="(value) => handle_env_update(field.key, Number(value))"
                  />
                  <div v-else-if="field.type === 'list'" class="list-editor">
                    <div
                      v-for="(item, index) in env_draft_value(field.key) || []"
                      :key="index"
                      class="list-item"
                    >
                      <Input
                        :model-value="item"
                        @update:model-value="(value) => update_env_list_item(field.key, index, value)"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        icon-only
                        @click="remove_env_list_item(field.key, index)"
                      >
                        <Icon icon="lucide:x" width="14" />
                      </Button>
                    </div>
                    <Button variant="secondary" size="sm" @click="add_env_list_item(field.key)">
                      <Icon icon="lucide:plus" width="13" />
                      添加一项
                    </Button>
                  </div>
                  <Input
                    v-else
                    :model-value="env_draft_value(field.key) ?? ''"
                    @update:model-value="(value) => handle_env_update(field.key, value)"
                  />
                </div>
              </div>
            </div>
          </section>
        </div>
      </template>

      <!-- 插件与适配器 -->
      <template #nonebot>
        <div v-if="nonebot_loading" class="card">
          <div class="loading-block"><Spinner :size="18" /> 加载中…</div>
        </div>

        <div v-else class="nonebot-sections">
          <!-- 适配器 -->
          <section class="card">
            <div class="card-header">
              <h3 class="card-title">已注册适配器</h3>
            </div>
            <div class="card-body">
              <ul class="nonebot-list">
                <li v-for="adapter in nonebot_adapters" :key="adapter.module_name" class="nonebot-item">
                  <div class="nonebot-item-info">
                    <span class="nonebot-item-name">{{ adapter.name }}</span>
                    <span class="mono text-xs text-muted">{{ adapter.module_name }}</span>
                  </div>
                  <Button variant="ghost" size="sm" icon-only @click="submit_remove_adapter(adapter)">
                    <Icon icon="lucide:trash-2" width="14" />
                  </Button>
                </li>
                <li v-if="nonebot_adapters.length === 0" class="nonebot-empty">暂无适配器</li>
              </ul>
              <form class="nonebot-add-form" @submit.prevent="submit_add_adapter">
                <Input v-model="adapter_form.name" placeholder="名称（如 Minecraft）" />
                <Input v-model="adapter_form.module_name" placeholder="模块路径（如 nonebot.adapters.minecraft）" />
                <Button variant="secondary" type="submit">
                  <Icon icon="lucide:plus" width="14" />
                  添加
                </Button>
              </form>
            </div>
          </section>

          <!-- 插件 -->
          <section class="card">
            <div class="card-header">
              <h3 class="card-title">已注册插件</h3>
            </div>
            <div class="card-body">
              <ul class="nonebot-list">
                <li v-for="plugin in nonebot_plugins" :key="plugin.module_name" class="nonebot-item">
                  <div class="nonebot-item-info">
                    <span class="mono">{{ plugin.module_name }}</span>
                    <span class="text-xs text-muted">{{ plugin.enabled ? '已启用' : '已禁用' }}</span>
                  </div>
                  <Button variant="ghost" size="sm" icon-only @click="submit_remove_plugin(plugin)">
                    <Icon icon="lucide:trash-2" width="14" />
                  </Button>
                </li>
                <li v-if="nonebot_plugins.length === 0" class="nonebot-empty">暂无通过 pyproject.toml 注册的插件</li>
              </ul>
              <form class="nonebot-add-form" @submit.prevent="submit_add_plugin">
                <Input v-model="plugin_form.module_name" placeholder="插件模块路径（如 nonebot_plugin_xxx）" />
                <Button variant="secondary" type="submit">
                  <Icon icon="lucide:plus" width="14" />
                  添加
                </Button>
              </form>
            </div>
          </section>

          <p class="text-xs text-muted">修改 pyproject.toml 后需重启机器人生效，新增插件/适配器需先通过 uv 安装依赖。</p>
        </div>
      </template>
    </Tabs>

    <!-- Config.toml 保存前 diff 预览 -->
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

    <!-- .env 保存前 diff 预览 -->
    <Dialog
      v-model="env_diff_open"
      title="确认修改环境变量"
      :description="`共 ${env_changes.length} 项环境变量将被更新，保存后需重启机器人`"
      confirm-text="确认保存"
      :loading="env_saving"
      @confirm="confirm_env_save"
    >
      <ul class="diff-list">
        <li v-for="change in env_changes" :key="change.key" class="diff-item">
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

.field-control > :not(.list-editor):not(.ui-switch) {
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

.keyword-editor {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  align-items: flex-start;
}

.keyword-entry {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
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

  .keyword-entry {
    grid-template-columns: 1fr;
  }
}

/* 标签页操作栏 */
.tab-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  margin: var(--space-4) 0;
}

/* NoneBot 插件/适配器管理 */
.nonebot-sections {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  margin-top: var(--space-4);
}

.nonebot-list {
  display: flex;
  flex-direction: column;
}

.nonebot-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) 0;
  border-bottom: 1px solid var(--border);
}

.nonebot-item:last-child {
  border-bottom: none;
}

.nonebot-item-info {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.nonebot-item-name {
  font-size: var(--text-sm);
  font-weight: 600;
}

.nonebot-empty {
  padding: var(--space-4) 0;
  text-align: center;
  font-size: var(--text-sm);
  color: var(--text-muted);
}

.nonebot-add-form {
  display: flex;
  gap: var(--space-2);
  padding-top: var(--space-4);
  border-top: 1px solid var(--border);
  margin-top: var(--space-2);
}
</style>
