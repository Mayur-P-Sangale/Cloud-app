# NETWORK STRUCTURES AND CLOUD COMPUTING COURSE SPRING2022
This is a Repository for the course Network Structures and Cloud Computing at Northeastern University.  
------------------
Prerequisites:
1. Node
2. Express
3. Nodemon
4. Postman
5. Mocha
6. Supertest
7. Assert
--------------------
Steps to Build the Application:
1. run "npm i" or "npm install" -- to install dependencies
2. run "npm i sequelize mysql2 email-validator password-validator" -- to install additional packages
3. run "npm run dev" -- to start the server on dev environment
4. run "npm test" -- to run mocha test cases
------------------
Starting mysql server locally:
mysql -u root -pmuraliroot
------------------ 
Steps to install Packer:
1. brew tap hashicorp/tap
2. brew install hashicorp/tap/packer
3. packer
------------------ 
Steps to authenticate Packer to create/modify/delete ec2
1. export AWS_ACCESS_KEY_ID=YOUR_ACCESS_KEY
2. export AWS_SECRET_ACCESS_KEY=YOUR_SECRET_KEY
------------------ 
After writing the HCL script run:
1. packer init .
2. packer fmt .
3. packer validate .
4. packer build ami-builder.pkr.hcl
------------------ 
To delete AMI and packer snapshot:
1. aws ec2 deregister-image --image-id <AMI-ID> --region us-east-1
2. aws ec2 delete-snapshot --snapshot-id <snapshot-ID> --region us-east-1
----------------------
To run Jmeter Tests:
sh jmeter -n -t /Users/murali/Downloads/apache-jmeter-5.4.3/bin/csye6225-testPlan.jmx
-------------------
Cmds to check SSL status in RDS:
1. \s
2. status
3. SHOW STATUS LIKE 'Ssl_cipher';