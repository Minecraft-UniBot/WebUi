<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { Icon } from '@iconify/vue'
import { storeToRefs } from 'pinia'
import { useLogStore } from '@/stores/log'
import { useAuthStore } from '@/stores/auth'
import { use_toast } from '@/composables/use_toast'
import { use_websocket } from '@/composables/use_websocket'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import Select from '@/components/ui/Select.vue'
import Badge from '@/components/ui/Badge.vue'
import Pagination from '@/components/ui/Pagination.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import Spinner from '@/components/ui/Spinner.vue'
import Dialog from '@/components/ui/Dialog.vue'
import { format_bytes, format_datetime, level_class } from '@/utils/format'

const log_store = useLogStore()
const auth_store = useAuthStore()
const toast = use_toast()
const { on_event } = use_websocket()
const {
  file_list,
  current_file,
  log_items,
  total,
  page,
  page_size,
  level_filter,
  keyword_filter,
  loading,
} = storeToRefs(log_store)

const active_tab = ref('history') // history | realtime
const keyword_input = ref('')
const auto_scroll = ref(true)
const live_logs = ref([])
const live_container = ref(null)
const delete_target = ref('')
const deleting = ref(false)

let unsubscribe_log = null

const level_options = [
  { value: 'all', label: '全部级别' },
  { value: 'DEBUG', label: 'DEBUG' },
  { value: 'INFO', label: 'INFO' },
  { value: 'SUCCESS', label: 'SUCCESS' },
  { value: 'WARNING', label: 'WARNING' },
  { value: 'ERROR', label: 'ERROR' },
]

const live_level_filter = ref('all')
const filtered_live_logs = computed(() => {
  if (!live_level_filter.value || live_level_filter.value === 'all') return live_logs.value
  return live_logs.value.filter((log) => log.level === live_level_filter.value)
})

onMounted(async () => {
  try {
    await log_store.fetch_file_list()
    if (file_list.value.length > 0) {
      log_store.select_file(file_list.value[0].name)
      await log_store.fetch_content()
    }
  } catch (error) {
    toast.error(error.message || '获取日志失败')
  }

  unsubscribe_log = on_event('log', (data) => {
    live_logs.value.push(data)
    if (live_logs.value.length > 500) live_logs.value.shift()
    if (auto_scroll.value) {
      nextTick(() => {
        if (live_container.value) {
          live_container.value.scrollTop = live_container.value.scrollHeight
        }
      })
    }
  })
})

onUnmounted(() => {
  unsubscribe_log?.()
})

async function select_file(name) {
  log_store.select_file(name)
  keyword_input.value = ''
  try {
    await log_store.fetch_content()
  } catch (error) {
    toast.error(error.message || '读取日志失败')
  }
}

async function apply_keyword() {
  log_store.set_keyword_filter(keyword_input.value.trim())
  try {
    await log_store.fetch_content()
  } catch (error) {
    toast.error(error.message || '过滤失败')
  }
}

async function change_level(level) {
  log_store.set_level_filter(level)
  try {
    await log_store.fetch_content()
  } catch (error) {
    toast.error(error.message || '过滤失败')
  }
}

async function handle_page_change(target_page) {
  log_store.set_page(target_page)
  try {
    await log_store.fetch_content()
  } catch (error) {
    toast.error(error.message || '加载失败')
  }
}

function confirm_delete(name) {
  delete_target.value = name
}

async function submit_delete() {
  deleting.value = true
  try {
    await log_store.delete_file(delete_target.value)
    toast.success('日志文件已删除')
    delete_target.value = ''
  } catch (error) {
    toast.error(error.message || '删除失败')
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">日志查看器</h1>
        <p class="page-desc">浏览历史日志文件，或跟踪实时日志流</p>
      </div>
      <div class="page-actions">
        <div class="tab-switch">
          <button
            class="tab-item"
            :class="{ 'tab-item--active': active_tab === 'history' }"
            @click="active_tab = 'history'"
          >
            <Icon icon="lucide:file-text" width="14" />
            历史日志
          </button>
          <button
            class="tab-item"
            :class="{ 'tab-item--active': active_tab === 'realtime' }"
            @click="active_tab = 'realtime'"
          >
            <Icon icon="lucide:radio" width="14" />
            实时日志
            <span class="live-dot" />
          </button>
        </div>
      </div>
    </div>

    <!-- 历史日志 -->
    <div v-if="active_tab === 'history'" class="log-layout">
      <aside class="file-panel card">
        <div class="card-header">
          <h3 class="card-title">日志文件</h3>
          <Button variant="ghost" size="sm" icon-only @click="log_store.fetch_file_list()">
            <Icon icon="lucide:refresh-cw" width="13" />
          </Button>
        </div>
        <ul class="file-list">
          <li
            v-for="file in file_list"
            :key="file.name"
            class="file-item"
            :class="{ 'file-item--active': current_file === file.name }"
            @click="select_file(file.name)"
          >
            <Icon icon="lucide:file-text" width="14" class="file-icon" />
            <div class="file-info">
              <span class="file-name mono">{{ file.name }}</span>
              <span class="file-meta">
                {{ format_bytes(file.size) }} · {{ format_datetime(file.modified) }}
              </span>
            </div>
            <button
              v-if="auth_store.is_admin"
              class="file-delete"
              title="删除"
              @click.stop="confirm_delete(file.name)"
            >
              <Icon icon="lucide:trash-2" width="13" />
            </button>
          </li>
          <li v-if="file_list.length === 0" class="file-empty">暂无日志文件</li>
        </ul>
      </aside>

      <section class="content-panel card">
        <div class="filter-bar">
          <Select
            :model-value="level_filter"
            :options="level_options"
            @update:model-value="change_level"
          />
          <form class="keyword-box" @submit.prevent="apply_keyword">
            <Input
              v-model="keyword_input"
              placeholder="按关键词过滤…"
              @keydown.enter="apply_keyword"
            />
            <Button variant="secondary" size="sm" type="submit">过滤</Button>
          </form>
          <span class="text-xs text-muted">共 {{ total }} 行</span>
        </div>

        <div v-if="!current_file" class="content-empty">
          <EmptyState icon="lucide:file-text" title="请选择左侧日志文件" />
        </div>
        <div v-else-if="loading" class="loading-block"><Spinner :size="18" /> 加载中…</div>
        <div v-else-if="log_items.length === 0" class="content-empty">
          <EmptyState icon="lucide:search-x" title="没有匹配的日志行" />
        </div>
        <div v-else class="log-content">
          <div v-for="item in log_items" :key="item.line" class="log-line">
            <span class="line-no">{{ item.line }}</span>
            <span class="log-time mono">{{ item.time || '—' }}</span>
            <span class="log-level mono" :class="level_class(item.level)">
              {{ item.level || '—' }}
            </span>
            <span class="log-message">{{ item.message }}</span>
          </div>
        </div>

        <div v-if="total > 0" class="content-footer">
          <Pagination
            :page="page"
            :page-size="page_size"
            :total="total"
            @page-change="handle_page_change"
          />
        </div>
      </section>
    </div>

    <!-- 实时日志 -->
    <section v-else class="card realtime-panel">
      <div class="filter-bar">
        <Select v-model="live_level_filter" :options="level_options" />
        <button
          class="auto-scroll"
          :class="{ 'auto-scroll--on': auto_scroll }"
          @click="auto_scroll = !auto_scroll"
        >
          <Icon icon="lucide:arrow-down-to-line" width="13" />
          自动滚动 {{ auto_scroll ? '开' : '关' }}
        </button>
        <Button variant="ghost" size="sm" @click="live_logs = []">清空</Button>
        <span class="text-xs text-muted">已接收 {{ live_logs.length }} 条</span>
      </div>
      <div ref="live_container" class="live-stream">
        <div v-if="filtered_live_logs.length === 0" class="live-empty">等待日志推送…</div>
        <div
          v-for="(log, index) in filtered_live_logs"
          :key="`${log.time}-${index}`"
          class="log-line"
        >
          <span class="log-time mono">{{ log.time }}</span>
          <span class="log-level mono" :class="level_class(log.level)">{{ log.level }}</span>
          <span class="log-module mono">{{ log.module }}</span>
          <span class="log-message">{{ log.message }}</span>
        </div>
      </div>
    </section>

    <!-- 删除确认 -->
    <Dialog
      :model-value="Boolean(delete_target)"
      title="删除日志文件"
      :description="`确定要删除 ${delete_target} 吗？此操作不可恢复。`"
      confirm-text="删除"
      confirm-variant="danger"
      :loading="deleting"
      @update:model-value="(open) => !open && (delete_target = '')"
      @confirm="submit_delete"
    />
  </div>
</template>

<style scoped>
.tab-switch {
  display: inline-flex;
  gap: var(--space-1);
  padding: var(--space-1);
  background: rgb(0 0 0 / 0.04);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
}

.tab-item {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  height: 30px;
  padding: 0 var(--space-4);
  border-radius: var(--radius);
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--text-muted);
  transition:
    background-color var(--transition),
    color var(--transition);
}

.tab-item--active {
  background: var(--surface);
  color: var(--text);
  box-shadow: var(--shadow);
}

.live-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--success);
  animation: blink 1.5s ease-in-out infinite;
}

@keyframes blink {
  50% {
    opacity: 0.3;
  }
}

/* 双栏布局 */
.log-layout {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: var(--space-5);
  align-items: start;
}

.file-list {
  max-height: 560px;
  overflow-y: auto;
  padding: var(--space-2);
}

.file-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius);
  cursor: pointer;
  transition: background-color var(--transition);
}

.file-item:hover {
  background: var(--surface-sunken);
}

.file-item--active {
  background: var(--accent-soft);
}

.file-icon {
  color: var(--text-muted);
  flex-shrink: 0;
}

.file-item--active .file-icon {
  color: var(--accent);
}

.file-info {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.file-name {
  font-size: var(--text-xs);
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-meta {
  font-size: 11px;
  color: var(--text-muted);
}

.file-delete {
  color: var(--text-muted);
  padding: var(--space-1);
  border-radius: 4px;
  opacity: 0;
  transition:
    opacity var(--transition),
    color var(--transition);
}

.file-item:hover .file-delete {
  opacity: 1;
}

.file-delete:hover {
  color: var(--danger);
}

.file-empty {
  padding: var(--space-4);
  text-align: center;
  font-size: var(--text-xs);
  color: var(--text-muted);
}

/* 过滤栏 */
.filter-bar {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--border);
}

.keyword-box {
  display: flex;
  gap: var(--space-2);
  width: 260px;
}

.auto-scroll {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-3);
  border: 1px solid var(--border);
  border-radius: 999px;
  font-size: var(--text-xs);
  color: var(--text-muted);
  transition:
    border-color var(--transition),
    color var(--transition);
}

.auto-scroll--on {
  border-color: var(--success);
  color: var(--success);
}

/* 日志内容 */
.log-content,
.live-stream {
  height: 520px;
  overflow-y: auto;
  padding: var(--space-3) var(--space-4);
  background: var(--surface-sunken);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  line-height: 1.7;
}

.content-empty {
  height: 520px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.log-line {
  display: flex;
  gap: var(--space-3);
  padding: 1px 0;
}

.line-no {
  width: 44px;
  text-align: right;
  color: var(--border-strong);
  flex-shrink: 0;
  user-select: none;
}

.log-time {
  color: var(--text-muted);
  flex-shrink: 0;
}

.log-level {
  width: 60px;
  flex-shrink: 0;
  font-weight: 600;
}

.log-module {
  color: var(--text-muted);
  flex-shrink: 0;
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.log-message {
  color: var(--text-secondary);
  word-break: break-all;
}

.live-empty {
  padding: var(--space-6);
  text-align: center;
  color: var(--text-muted);
}

.content-footer {
  display: flex;
  justify-content: flex-end;
  padding: var(--space-3) var(--space-4);
  border-top: 1px solid var(--border);
}

@media (max-width: 900px) {
  .log-layout {
    grid-template-columns: 1fr;
  }
}
</style>
