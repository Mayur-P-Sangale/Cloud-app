#!/bin/bash
cd ~/webservice
pm2 delete all
source /etc/profile
mkdir -p ~/logs
pm2 startOrReload ecosystem.config.js
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/home/ec2-user/webservice/AmazonCloudWatch-agent-config.json -s