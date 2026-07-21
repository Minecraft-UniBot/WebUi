<script setup>
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { Icon } from '@iconify/vue'
import { useAuthStore } from '@/stores/auth'
import { useStatusStore } from '@/stores/status'
import { use_toast } from '@/composables/use_toast'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import Badge from '@/components/ui/Badge.vue'
import { role_label, format_datetime } from '@/utils/format'

const auth_store = useAuthStore()
const status_store = useStatusStore()
const toast = use_toast()
const { user } = storeToRefs(auth_store)
const { status } = storeToRefs(status_store)

const nickname = ref(user.value?.nickname || '')
const saving_profile = ref(false)

const password_form = ref({ old_password: '', new_password: '', confirm_password: '' })
const saving_password = ref(false)

const avatar_text = computed(() =>
  (user.value?.nickname || user.value?.username || '?').slice(0, 1),
)

async function save_profile() {
  if (!nickname.value.trim()) {
    toast.error('昵称不能为空')
    return
  }
  saving_profile.value = true
  try {
    await auth_store.update_profile(nickname.value.trim())
    toast.success('昵称已更新')
  } catch (error) {
    toast.error(error.message || '更新失败')
  } finally {
    saving_profile.value = false
  }
}

async function save_password() {
  const { old_password, new_password, confirm_password } = password_form.value
  if (!old_password || !new_password) {
    toast.error('请填写完整')
    return
  }
  if (new_password.length < 6) {
    toast.error('新密码至少 6 位')
    return
  }
  if (new_password !== confirm_password) {
    toast.error('两次输入的新密码不一致')
    return
  }
  saving_password.value = true
  try {
    await auth_store.change_password(old_password, new_password)
    toast.success('密码已修改')
    password_form.value = { old_password: '', new_password: '', confirm_password: '' }
  } catch (error) {
    toast.error(error.message || '修改失败')
  } finally {
    saving_password.value = false
  }
}
</script>

<template>
  <div class="page settings-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">个人设置</h1>
        <p class="page-desc">管理你的账户信息与会话</p>
      </div>
    </div>

    <!-- 账户信息 -->
    <section class="card">
      <div class="card-header">
        <h3 class="card-title">账户信息</h3>
      </div>
      <div class="card-body profile-body">
        <div class="profile-card">
          <span class="profile-avatar">{{ avatar_text }}</span>
          <div class="profile-text">
            <div class="profile-name">
              {{ user?.nickname || user?.username }}
              <Badge variant="accent">{{ role_label(user?.role) }}</Badge>
            </div>
            <div class="profile-meta mono">@{{ user?.username }}</div>
            <div class="profile-meta text-muted">
              注册于 {{ format_datetime(user?.created_at) }}
            </div>
          </div>
        </div>

        <form class="profile-form" @submit.prevent="save_profile">
          <div class="form-row">
            <label class="form-label">昵称</label>
            <Input v-model="nickname" placeholder="显示名称" />
          </div>
          <Button variant="primary" type="submit" :loading="saving_profile">保存昵称</Button>
        </form>
      </div>
    </section>

    <!-- 修改密码 -->
    <section class="card">
      <div class="card-header">
        <h3 class="card-title">修改密码</h3>
      </div>
      <div class="card-body">
        <form class="password-form" @submit.prevent="save_password">
          <div class="form-row">
            <label class="form-label">当前密码</label>
            <Input v-model="password_form.old_password" type="password" />
          </div>
          <div class="form-row">
            <label class="form-label">新密码</label>
            <Input v-model="password_form.new_password" type="password" placeholder="至少 6 位" />
          </div>
          <div class="form-row">
            <label class="form-label">确认新密码</label>
            <Input v-model="password_form.confirm_password" type="password" />
          </div>
          <Button variant="primary" type="submit" :loading="saving_password">
            <Icon icon="lucide:key-round" width="14" />
            修改密码
          </Button>
        </form>
      </div>
    </section>

    <!-- 当前会话 -->
    <section class="card">
      <div class="card-header">
        <h3 class="card-title">当前会话</h3>
      </div>
      <div class="card-body session-body">
        <div class="session-row">
          <span class="session-label">机器人版本</span>
          <span class="mono">{{ status?.version || '—' }}</span>
        </div>
        <div class="session-row">
          <span class="session-label">最后登录</span>
          <span>{{ format_datetime(user?.last_login_at) }}</span>
        </div>
        <div class="session-row">
          <span class="session-label">access_token 有效期</span>
          <span>2 小时（过期自动刷新）</span>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.settings-page {
  max-width: 760px;
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.settings-page .page-header {
  margin-bottom: 0;
}

.profile-body {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-6);
  align-items: center;
}

.profile-card {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.profile-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--accent);
  color: #ffffff;
  font-size: var(--text-xl);
  font-weight: 700;
  text-transform: uppercase;
  flex-shrink: 0;
}

.profile-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.profile-name {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-md);
  font-weight: 600;
}

.profile-meta {
  font-size: var(--text-xs);
  color: var(--text-secondary);
}

.profile-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  align-items: flex-start;
}

.password-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  max-width: 360px;
}

.password-form .ui-button,
.password-form button {
  align-self: flex-start;
}

.session-body {
  display: flex;
  flex-direction: column;
}

.session-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) 0;
  border-bottom: 1px solid var(--border);
  font-size: var(--text-sm);
}

.session-row:last-child {
  border-bottom: none;
}

.session-label {
  color: var(--text-muted);
}

@media (max-width: 700px) {
  .profile-body {
    grid-template-columns: 1fr;
  }
}
</style>
