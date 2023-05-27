#cloud-config
# sync with cloudinit-*.yml.tpl
runcmd:
  - sed -i -e '/^\(#\|\)PasswordAuthentication/s/^.*$/PasswordAuthentication no/' /etc/ssh/sshd_config
  - mkdir -p /opt/nomad/volumes/certs
  - chown -R nomad:nomad /opt/nomad/volumes
  - systemctl stop systemd-resolved
  - systemctl disable systemd-resolved
  - systemctl enable nomad consul dnsmasq
  - systemctl start nomad consul dnsmasq
  - DD_AGENT_MAJOR_VERSION=7 DD_API_KEY=${datadog_api_key} DD_SITE="datadoghq.com" bash -c "$(curl -L https://s3.amazonaws.com/dd-agent/scripts/install_script.sh)"
  - usermod -a -G docker dd-agent
  - "echo \"dogstatsd_non_local_traffic: true\napm_config:\n  apm_non_local_traffic: true\" >> /etc/datadog-agent/datadog.yaml"
  - systemctl restart datadog-agent
apt:
  sources:
    hashicorp:
      source: "deb [arch=amd64] https://apt.releases.hashicorp.com $RELEASE main"
      keyid: 798AEC654E5C15428C8E42EEAA16FCBCA621E701
packages:
  - apt-transport-https
  - nomad
  - consul
  - dnsmasq
  - mariadb-client
  - jq
write_files:
  - path: /etc/dnsmasq.conf
    content: |
      local-service
      no-resolv
      server=/consul/127.0.0.1#8600
      server=185.12.64.1
      server=185.12.64.2
      address=/brawltime.ninja/10.0.0.2
      cache-size=65536
  - path: /etc/nomad.d/nomad.hcl
    content: |
      bind_addr = "{{ GetPrivateInterfaces | include \"address\" \"10.0.0.*\" | attr \"address\" }}"
      datacenter = "dc1"
      data_dir = "/opt/nomad"

      client {
        enabled = true
        network_interface = "{{ GetPrivateInterfaces | include \"address\" \"10.0.0.*\" | attr \"name\" }}"

        reserved {
          reserved_ports = "22"
        }

        node_class = "${class}"
      }

      plugin "docker" {
        config {
          allow_privileged = true
        }
      }

      telemetry {
        publish_allocation_metrics = true
        publish_node_metrics = true
        datadog_address = "localhost:8125"
        disable_hostname = true
        collection_interval = "10s"
      }
  - path: /etc/consul.d/consul.hcl
    content: |
      advertise_addr = "{{ GetPrivateInterfaces | include \"address\" \"10.0.0.*\" | attr \"address\" }}"
      client_addr = "0.0.0.0"
      datacenter = "dc1"
      data_dir = "/opt/consul"

      ui_config {
        enabled = true
      }

      retry_join = ["10.0.0.2"]
  # disable userland proxy to (hopefully) fix network issues
  - path: /etc/docker/daemon.json
    content: |
      {
        "userland-proxy": false
      }
