<script setup>
import { ConfigProvider } from 'reka-ui'
import { RouterView } from 'vue-router'
import Toast from '@/components/ui/Toast.vue'
</script>

<template>
  <ConfigProvider>
    <RouterView />
    <Toast />
  </ConfigProvider>
</template>
