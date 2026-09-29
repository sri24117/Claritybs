#!/usr/bin/env bash
# RUN ONLY AFTER your SSH public key is in ~/.ssh/authorized_keys, or you will
# lock yourself out of your own server.
set -euo pipefail

apt-get update
apt-get -y install ufw fail2ban unattended-upgrades

ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin prohibit-password/' /etc/ssh/sshd_config
systemctl restart ssh || systemctl restart sshd

systemctl enable --now fail2ban
dpkg-reconfigure -f noninteractive unattended-upgrades

mkdir -p /data/reports && chmod 700 /data/reports

echo "Done. Note: Docker bypasses UFW for published ports. Only Caddy publishes 80/443."
