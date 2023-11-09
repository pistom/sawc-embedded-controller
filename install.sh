#!/bin/bash

filename="sawcctrl.service"
node_path=$(which node)
apps_location="$(cd "$(dirname "$0")" && cd ../ && pwd)"

# determine username. if sudo, use SUDO_USER
if [ "$EUID" -ne 0 ]
  then username="$USER"
  else
    if [ -z "$SUDO_USER" ]
      then username="$USER"
      else
        username="$SUDO_USER"
    fi
fi

declare -A names_map
names_map["app"]="app,server.js"
names_map["controller"]="controller,server.js"
names_map["worker"]="controller,worker.js"

# iterate through names_map
for name in "${!names_map[@]}"
do
IFS=',' read -r -a value <<< "${names_map[$name]}"
echo "Service: $name"

content="[Unit] \n\
Description=SAWC $key \n\
After=network.target \n\
\n\
[Service] \n\
Environment=NODE_ENV=prod \n\
Type=simple \n\
User=$username \n\
WorkingDirectory=$apps_location/sawc-embedded-${value[0]} \n\
ExecStart=$node_path $apps_location/sawc-embedded-${value[0]}/${value[1]} \n\
Restart=on-failure \n\
\n\
[Install] \n\
WantedBy=multi-user.target"

echo -e "$content" | sudo tee "/etc/systemd/system/sawc-$name.service" > /dev/null
done

sudo systemctl daemon-reload

for name in "${!names_map[@]}"
do
sudo systemctl enable sawc-$name.service
sudo systemctl start sawc-$name.service
done
