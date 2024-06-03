#!/bin/bash
cd /home/ec2-user/webservice
sudo systemctl enable webservice
sudo systemctl start webservice
sudo pm2 reload all --update-env
sudo pm2 start ecosystem.config.js
if [ $? == 0 ]; then echo "Application started successfully"; else echo "Something went wrong while starting the application"; fi
sudo pm2 status