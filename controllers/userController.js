const db = require("../models");
const User = db.users;
const bcrypt = require("bcrypt");
require("dotenv").config();


//Validators
const emailValidator = require("email-validator");
const passwordValidator = require("password-validator");
var statsDClient = require("statsd-client");
var sdc = new statsDClient({ host: "localhost", port: 8125, debug: true });
const jwt = require("jsonwebtoken");
const dynamo = require("../config/dynamodb.config");
const sns = require("../config/sns.config");
const crypto= require('crypto')

const passValidator = new passwordValidator();
passValidator
  .is()
  .min(5) // Minimum length 5
  .is()
  .max(50) // Maximum length 50
  .has()
  .uppercase() // Must have uppercase letters
  .has()
  .lowercase() // Must have lowercase letters
  .has()
  .digits(1) // Must have at least 1 digits
  .has()
  .not()
  .spaces();

//Adding User to app
const addUser = async (req, res) => {
  
    sdc.increment("/v1/user");
    console.log("hit /v1/user - add User");
    if (
      !req.body.username ||
      !req.body.firstName ||
      !req.body.lastName ||
      !req.body.password
    ) {
      res.status(400).send();
    } else {
      // generate salt to hash password
      const salt = await bcrypt.genSalt(10);
      const hashPassword = await bcrypt.hash(req.body.password, salt);

      let info = {
        username: req.body.username,
        lastName: req.body.lastName,
        firstName: req.body.firstName,
        password: hashPassword,
      };

      if (
        !emailValidator.validate(`${req.body.username}`) ||
        !passValidator.validate(`${req.body.password}`) ||
        !req.body.firstName ||
        !req.body.lastName
      ) {
        res.status(400).send();
      } else {
        const findUser = await User.findOne({
          where: { username: `${req.body.username}` },
        });
        if (findUser === null) {
          // const user = await
          User.create(info).then((data) => {
            const token = crypto.randomBytes(16).toString("hex")
            //Add record in DynamoDB
            const putParams = {
              TableName: "TokenTable",
              Item: {
                username: { S: data.username },
                token: { S: token },
                ttl: {N: (Math.floor(Date.now()/1000) + 120).toString()},
              },
            };
            dynamo.dynamoDBClient.putItem(putParams, (err, putItemResponse) => {
              if (err) {
                console.error(`[ERROR]: ${err.message}`);
                res.status(504).send("1");
              } else {
                console.log(
                  `[INFO]: New user token uploaded to DynamoDB : ${token}`
                );
                //Publish in Amazon SNS
            const message = {
              Message: `${data} : ${token} : "String"`,
              TopicArn: "arn:aws:sns:us-east-1:960807583305:UserVerificationTopic",
              MessageAttributes: {
                'emailid': {
                    DataType: 'String',
                    StringValue: req.body.username
                },
                'token': {
                  DataType: 'String',
                  StringValue: token
              }
            }
            };
            console.log("message is: ", message);

            sns.publishTextPromise.publish(message).promise().then(function (data1) {
                console.log(
                  `[INFO]: Message ${message.Message} sent to the topic ${message.TopicArn}`
                );
                console.log("[INFO]: MessageID is " + data1.MessageId);

                res.status(201).json({
                  id: data.id,
                  username: data.username,
                  firstName: data.firstName,
                  lastName: data.lastName,
                  account_created: data.account_created,
                  account_updated: data.account_updated,
                });
              })
              .catch(function (err) {
                console.error(`[ERROR]: ${err.message}`);
                res.status(504).send("2");
              });
              }
            });
            
          });

          // res.status(201).send();
        } else {
          res.status(400).send();
        }
      }
    }
};

// Retrieving User information after basic authentication.
const userInfo = async (req, res) => {
  sdc.increment("/v1/user");
  console.log("hit /v1/user -- Get User");
  console.log(db);
  if (req.headers.authorization === undefined) {
    res.status(403).send();
  } else {
    //grab the encoded value, format: bearer <Token>, need to extract only <token>
    var encoded = req.headers.authorization.split(" ")[1];
    // decode it using base64
    var decoded = new Buffer(encoded, "base64").toString();
    var username = decoded.split(":")[0];
    var password = decoded.split(":")[1];

    // check if the passed username and password match with the values in our database.\

    const findUser = await User.findOne({
      where: { username: username },
    });
    if (findUser !== null) {
      if (await bcrypt.compare(password, findUser.password)) {
        if (findUser.status === "Verified") {
          let plainUser = {
            id: findUser.id,
            username: findUser.username,
            firstName: findUser.firstName,
            lastName: findUser.lastName,
            account_created: findUser.account_created,
            account_updated: findUser.account_updated,
          };
          res.status(200).json(plainUser);
        } else {
          console.error(`[ERROR]: User email id not verified`);
          res.status(403).json({
            success: false,
            message: "Please verify your email id",
          });
        }
      } else {
        res.status(401).send();
      }
    } else {
      res.status(400).send();
    }
  }
};

//Updating user information
const updateUser = async (req, res) => {
  sdc.increment("/v1/user");
  console.log("hit /v1/user -- Update User");
  if (req.body.id || req.body.account_created || req.body.account_updated) {
    res.status(400).send();
  } else {
    if (
      !req.body.username ||
      !req.body.firstName ||
      !req.body.lastName ||
      !req.body.password
    ) {
      res.status(400).send();
    } else {
      if (req.headers.authorization === undefined) {
        res.status(403).send();
      } else {
        //grab the encoded value, format: bearer <Token>, need to extract only <token>
        var encoded = req.headers.authorization.split(" ")[1];
        // decode it using base64
        var decoded = new Buffer(encoded, "base64").toString();
        var username = decoded.split(":")[0];
        var password = decoded.split(":")[1];

        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(req.body.password, salt);
        // check if the passed username and password match with the values in our database.\

        const findUser = await User.findOne({
          where: { username: username },
        });
        if (findUser !== null) {
          if (!req.body.firstName || !req.body.lastName || !req.body.password) {
            res.status(400).send();
          } else {
              if (await bcrypt.compare(password, findUser.password)) {

                if (findUser.status === "Verified"){
                  if (passValidator.validate(`${req.body.password}`)) {
                    findUser.update({
                      firstName: `${req.body.firstName}`,
                      lastName: `${req.body.lastName}`,
                      password: hashPassword,
                    });
                    res.status(204).send();
                  } else {
                    res.status(400).send();
                  }
              }else {
                console.error(`[ERROR]: User email id not verified`);
                res.status(403).json({
                  success: false,
                  message: "Please verify your email id",
                });
              }
              res.status(401).send();
            }
          }
        } else {
          res.status(400).send();
        }
      }
    }
  }
};

//Verify user ID
const verifyUser = (req, res) => {
  console.log("VerifyUser endpoint hit");
  let email = req.query.email
  let token = req.query.token
  User.findOne({
    where: { username: email },
  }).then(async (response) => {
    if (response == null) {
      //User not present
      console.log("[ERROR] 400: User not found");
      res.status(400).send();
    } else {
      //Get token from DynamoDB
      const getParams = {
        TableName: "TokenTable",
        Key: {
          username: { S: response.dataValues.username },
        },
      };
      dynamo.dynamoDBClient.getItem(getParams, (err, getResponseItem) => {
        if (err) {
         console.log(`[ERROR]: ${err.message}`);
          res.status(504).send();
        } else {
          console.log(
            `[INFO]: User verification token retrieved from DynamoDB`
          );
          console.log("-----------------------------------"+getResponseItem.Item.ttl.N);
          if (getResponseItem.Item.token.S === token && Math.floor(Date.now()/1000) < getResponseItem.Item.ttl.N) {
            response.update({
              status: "Verified"
            });
            res.status(204).send();
          } else {
            console.log(`[ERROR]: Token mismatch`);
            res.status(400).json({
              success: false,
              message: "DDB Token and Params Token mismatch",
            });
          }
        }
      });
    }
  });
};

module.exports = {
  addUser,
  userInfo,
  updateUser,
  verifyUser,
};
