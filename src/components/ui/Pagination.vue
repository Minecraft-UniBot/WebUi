<script setup>
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import Button from './Button.vue'

const props = defineProps({
  page: { type: Number, required: true },
  pageSize: { type: Number, required: true },
  total: { type: Number, required: true },
})

const emit = defineEmits(['page-change'])

const total_pages = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)))

function go_to(target_page) {
  if (target_page < 1 || target_page > total_pages.value) return
  emit('page-change', target_page)
}
</script>

<template>
  <div class="ui-pagination">
    <span class="ui-pagination-info">
      共 {{ total }} 条 · 第 {{ page }} / {{ total_pages }} 页
    </span>
    <Button variant="secondary" size="sm" icon-only :disabled="page <= 1" @click="go_to(page - 1)">
      <Icon icon="lucide:chevron-left" width="14" />
    </Button>
    <Button
      variant="secondary"
      size="sm"
      icon-only
      :disabled="page >= total_pages"
      @click="go_to(page + 1)"
    >
      <Icon icon="lucide:chevron-right" width="14" />
    </Button>
  </div>
</template>

<style scoped>
.ui-pagination {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.ui-pagination-info {
  font-size: var(--text-xs);
  color: var(--text-muted);
  margin-right: var(--space-2);
}
</style>
