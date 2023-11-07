#!/bin/bash

filename="sawcctrl.service"
node_path=$(which node)
apps_location="$(cd "$(dirname "$0")" && cd ../ && pwd)"
username="$SUDO_USER"

names=("app" "controller")

for name in "${names[@]}"
do
content="[Unit] \n\
Description=SAWC $name \n\
After=network.target \n\
\n\
[Service] \n\
Environment=NODE_ENV=prod \n\
Type=simple \n\
User=$username \n\
WorkingDirectory=$apps_location/sawc-embedded-$name \n\
ExecStart=$node_path $apps_location/sawc-embedded-$name/server.js \n\
Restart=on-failure \n\
\n\
[Install] \n\
WantedBy=multi-user.target"
echo -e "$content" | sudo tee "/etc/systemd/system/sawc-$name.service" > /dev/null
done

sudo systemctl daemon-reload

for name in "${names[@]}"
do
sudo systemctl enable sawc-$name.service
sudo systemctl start sawc-$name.service
done