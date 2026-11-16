export const categories = [
  { id: 'all', key: 'stack.all' },
  { id: 'system', key: 'stack.system' },
  { id: 'homelab', key: 'stack.homelab' },
  { id: 'hardware', key: 'stack.hardware' },
  { id: 'code', key: 'stack.code' },
  { id: 'tools', key: 'stack.tools' }
]

export const stackItems = [
  {
    id: 'cachyos',
    name: 'CachyOS & Arch',
    desc: 'Linux kernel & desktop daily driver',
    cat: 'system',
    icon: 'terminal'
  },
  {
    id: 'proxmox',
    name: 'Proxmox VE',
    desc: 'Two hypervisor nodes & LXC containers',
    cat: 'homelab',
    icon: 'dns'
  },
  {
    id: 'homeassistant',
    name: 'Home Assistant',
    desc: 'Smart home on a Raspberry Pi',
    cat: 'homelab',
    icon: 'home_iot_device'
  },
  {
    id: 'cloudflare-tunnel',
    name: 'Cloudflare Tunnel',
    desc: 'Public ingress for self-hosted sites',
    cat: 'homelab',
    icon: 'cloud'
  },
  {
    id: 'tailscale',
    name: 'Tailscale',
    desc: 'Remote access to the home LAN',
    cat: 'homelab',
    icon: 'vpn_lock'
  },
  {
    id: 'pterodactyl',
    name: 'Pterodactyl',
    desc: 'Game server panel & Wings nodes',
    cat: 'homelab',
    icon: 'sports_esports'
  },
  {
    id: 'docker',
    name: 'Docker',
    desc: 'Container runtime for game servers',
    cat: 'homelab',
    icon: 'deployed_code'
  },
  {
    id: 'immich',
    name: 'Immich',
    desc: 'Self-hosted photo library',
    cat: 'homelab',
    icon: 'photo_library'
  },
  {
    id: 'adguard',
    name: 'AdGuard Home',
    desc: 'Network-wide DNS ad-blocking',
    cat: 'homelab',
    icon: 'shield'
  },
  {
    id: 'esp32',
    name: 'ESP32 & ESP8266',
    desc: 'Microcontrollers & GPIO telemetry',
    cat: 'hardware',
    icon: 'developer_board'
  },
  {
    id: 'esphome',
    name: 'ESPHome',
    desc: 'Sensor firmware & native HA link',
    cat: 'hardware',
    icon: 'sensors'
  },
  {
    id: 'wled',
    name: 'WLED Builds',
    desc: 'Addressable RGB LED controllers',
    cat: 'hardware',
    icon: 'lightbulb'
  },
  {
    id: 'zigbee',
    name: 'Zigbee2MQTT',
    desc: 'Zigbee sensors, plugs & switches',
    cat: 'hardware',
    icon: 'hub'
  },
  {
    id: 'octoprint',
    name: 'OctoPrint & 3D Printing',
    desc: 'Ender 3 V2 driven from a Raspberry Pi',
    cat: 'hardware',
    icon: 'print'
  },
  {
    id: 'networking',
    name: 'Home Networking',
    desc: 'Wi-Fi 6 router, wired backbone & DNS',
    cat: 'hardware',
    icon: 'router'
  },
  {
    id: 'electrical',
    name: 'Electrical Engineering',
    desc: 'Soldering, PCB assembly & wiring',
    cat: 'hardware',
    icon: 'electrical_services'
  },
  {
    id: 'python',
    name: 'Python',
    desc: 'Backend scripting & API clients',
    cat: 'code',
    icon: 'data_object'
  },
  {
    id: 'javascript',
    name: 'JavaScript & Web APIs',
    desc: 'Reactive UI & frontend architecture',
    cat: 'code',
    icon: 'javascript'
  },
  {
    id: 'htmlcss',
    name: 'HTML5 & Vanilla CSS',
    desc: 'Material 3 design tokens & semantics',
    cat: 'code',
    icon: 'palette'
  },
  {
    id: 'git',
    name: 'Git & GitHub',
    desc: 'Version control & automation flows',
    cat: 'tools',
    icon: 'commit'
  },
  {
    id: 'obsidian',
    name: 'Obsidian',
    desc: 'Second brain & technical docs',
    cat: 'tools',
    icon: 'menu_book'
  }
]
