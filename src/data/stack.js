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
    desc: 'Type-1 hypervisor cluster & ZFS',
    cat: 'homelab',
    icon: 'dns'
  },
  {
    id: 'truenas',
    name: 'TrueNAS Scale',
    desc: 'Network attached storage & pools',
    cat: 'homelab',
    icon: 'storage'
  },
  {
    id: 'pfsense',
    name: 'pfSense Router',
    desc: 'Edge routing, firewall & NAT',
    cat: 'homelab',
    icon: 'router'
  },
  {
    id: 'homeassistant',
    name: 'Home Assistant',
    desc: 'Smart home ecosystem automation',
    cat: 'homelab',
    icon: 'home_iot_device'
  },
  {
    id: 'docker',
    name: 'Docker & Compose',
    desc: 'Containerized production services',
    cat: 'homelab',
    icon: 'deployed_code'
  },
  {
    id: 'nextcloud',
    name: 'Nextcloud Hub',
    desc: 'Self-hosted cloud productivity',
    cat: 'homelab',
    icon: 'cloud'
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
    id: 'networking',
    name: 'Networking & VLANs',
    desc: 'Managed switches & WireGuard VPN',
    cat: 'hardware',
    icon: 'hub'
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
