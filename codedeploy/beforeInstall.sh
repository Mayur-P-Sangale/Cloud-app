#!/bin/bash
sudo pm2 status
echo "Stopping pm2 process"
sudo pm2 stop all
echo "Deleting pm2 process"
sudo pm2 delete all
sudo pm2 status