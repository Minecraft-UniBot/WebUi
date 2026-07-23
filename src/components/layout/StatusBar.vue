<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useStatusStore } from '@/stores/status'
import { format_uptime, format_mb } from '@/utils/format'

const status_store = useStatusStore()
const { status } = storeToRefs(status_store)

const uptime_text = computed(() => format_uptime(status.value?.uptime))
</script>

<template>
  <footer class="statusbar">
    <span>UniBot {{ status?.version || '—' }}</span>
    <span class="statusbar-sep">·</span>
    <span>运行 {{ uptime_text }}</span>
    <span class="statusbar-sep">·</span>
    <span>内存 {{ format_mb(status?.memory_mb) }}</span>
    <span class="statusbar-sep">·</span>
    <span>CPU {{ status?.cpu_percent ?? '—' }}%</span>
  </footer>
</template>

<style scoped>
.statusbar {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  height: var(--statusbar-height);
  padding: 0 var(--space-6);
  background: var(--surface);
  border-top: 1px solid var(--border);
  font-size: var(--text-xs);
  color: var(--text-muted);
  flex-shrink: 0;
}

.statusbar-sep {
  color: var(--border-strong);
}
</style>
