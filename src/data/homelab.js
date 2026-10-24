export const terminalCommand = 'pveversion -v && pvesm status'

export const homelabNodes = [
  {
    name: 'pve-node01.lan',
    role: 'Proxmox VE 8 · Ryzen Cluster Host · ZFS Mirror',
    kind: 'HOST',
    icon: 'dns'
  },
  {
    name: 'truenas.lan [VM 100]',
    role: 'TrueNAS Scale · RAID-Z Storage · SMB/NFS Pools',
    kind: 'VM',
    icon: 'storage'
  },
  {
    name: 'pfsense.lan [VM 101]',
    role: 'pfSense Gateway · VLANs · WireGuard VPN Tunnel',
    kind: 'VM',
    icon: 'router'
  },
  {
    name: 'hassio.lan [VM 102]',
    role: 'Home Assistant OS · Zigbee · ESPHome & Matter',
    kind: 'VM',
    icon: 'home_iot_device'
  },
  {
    name: 'docker.lan [CT 103]',
    role: 'Docker Compose · 24 Containers · Caddy Reverse Proxy',
    kind: 'CT',
    icon: 'deployed_code'
  },
  {
    name: 'nextcloud.lan [CT 104]',
    role: 'Nextcloud Hub · PostgreSQL · Redis Cache',
    kind: 'CT',
    icon: 'cloud'
  },
  {
    name: 'wled-desk.iot [ESP32]',
    role: 'WLED 0.14 · WS2812B Custom Ambience Controller',
    kind: 'HW',
    icon: 'lightbulb'
  },
  {
    name: 'sensors-env.iot [ESP32-C3]',
    role: 'ESPHome · BME280 Temperature & Humidity Telemetry',
    kind: 'HW',
    icon: 'sensors'
  }
]

export const homelabSummary = '8 nodes active · 0 alerts · ZFS pools healthy (ONLINE)'
