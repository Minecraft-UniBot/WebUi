/**
 * 纯函数工具：Minecraft 服务端类型 → 图标 / 标签映射
 */

/** 服务端类型元信息 */
const SERVER_TYPE_META = {
  vanilla: { label: '原版', icon: 'lucide:box' },
  spigot: { label: 'Spigot', icon: 'lucide:package' },
  paper: { label: 'Paper', icon: 'lucide:file-text' },
  fabric: { label: 'Fabric', icon: 'lucide:layers' },
  forge: { label: 'Forge', icon: 'lucide:anvil' },
  neoforge: { label: 'NeoForge', icon: 'lucide:hammer' },
}

const DEFAULT_META = { label: '未知', icon: 'lucide:server' }

/** 根据服务端类型返回 { label, icon }，未知类型回退到默认 */
export function server_type_meta(server_type) {
  const key = (server_type || '').toLowerCase()
  return SERVER_TYPE_META[key] || DEFAULT_META
}

/** 仅返回图标名 */
export function server_type_icon(server_type) {
  return server_type_meta(server_type).icon
}

/** 仅返回中文标签 */
export function server_type_label(server_type) {
  return server_type_meta(server_type).label
}
