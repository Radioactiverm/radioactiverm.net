export const terminalCommand = './inventory.sh --all'

export const homelabNodes = [
  {
    name: 'pve1',
    role: 'Intel NUC · Proxmox VE · 16 GB RAM · 7 LXCs',
    kind: 'HOST',
    icon: 'dns'
  },
  {
    name: 'pve2',
    role: 'i5 desktop · Proxmox VE · 32 GB RAM · 3 LXCs',
    kind: 'HOST',
    icon: 'dns'
  },
  {
    name: 'cloudflared [pve1]',
    role: 'Cloudflare Tunnel · ingress for the sites & game panel',
    kind: 'LXC',
    icon: 'cloud'
  },
  {
    name: 'web ×4 [pve1]',
    role: 'radioactiverm.net · KdeJeBus.cz · elektrohelper +1',
    kind: 'LXC',
    icon: 'language'
  },
  {
    name: 'pterodactyl [pve2]',
    role: 'Game panel + Wings · Minecraft SMPs via playit.gg',
    kind: 'LXC',
    icon: 'sports_esports'
  },
  {
    name: 'media ×2 [pve1 · pve2]',
    role: 'Immich photo library · Fireshare game clips',
    kind: 'LXC',
    icon: 'photo_library'
  },
  {
    name: 'homeassistant',
    role: 'Raspberry Pi · HA OS · Zigbee2MQTT · AdGuard Home DNS',
    kind: 'SBC',
    icon: 'home_iot_device'
  },
  {
    name: 'wing2',
    role: 'Debian · old Fujitsu Lifebook · second Pterodactyl Wing',
    kind: 'HOST',
    icon: 'laptop'
  },
  {
    name: 'octoprint',
    role: 'Raspberry Pi · OctoPrint → Ender 3 V2',
    kind: 'SBC',
    icon: 'print'
  },
  {
    name: 'esp ×5',
    role: 'WLED matrix + 2 strips · ESPHome phone & IR controllers',
    kind: 'HW',
    icon: 'lightbulb'
  }
]

export const homelabSummary = '2 Proxmox nodes · 10 LXCs · 8 Zigbee devices · snapshot Nov 2026'
