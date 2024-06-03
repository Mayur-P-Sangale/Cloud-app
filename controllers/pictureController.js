require("dotenv").config();
const aws = require("aws-sdk");
const multer = require("multer");
const multerS3 = require("multer-s3");
const { v4: uuidv4 } = require("uuid");
const db = require("../models");
const User = db.users;
const Picture = db.picture;
const bcrypt = require("bcrypt");
var statsDClient = require('statsd-client')
var sdc = new statsDClient({host: 'localhost', port: 8125, debug: true});
const morgan = require('morgan');


//Accepted FileFormats
const acceptedFileFormats = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

//S3 Connection
const s3 = new aws.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  region: process.env.AWS_BUCKET_REGION,
});

//Adding/Updating user profile pic
//Create Picture
const createPicture = async (req, res) => {
  sdc.increment('/v1/user/self/pic');
  console.log("hit /v1/user/self/pic");
  if (req.headers.authorization === undefined) {
    res.status(403).send();
  }
  //grab the encoded value, format: bearer <Token>, need to extract only <token>
  var encoded = req.headers.authorization.split(" ")[1];
  // decode it using base64
  var decoded = new Buffer(encoded, "base64").toString();
  var username = decoded.split(":")[0];
  var password = decoded.split(":")[1];

  try {
    //Check if user exists
    User.findOne({
      where: { username: username },
    })
      .then((user) => {
        if (user) {
          //Check if passwords are same
          const isPasswordCorrect = bcrypt.compareSync(password, user.password);
          if (isPasswordCorrect) {
            if(user.status==="Verified"){
              Picture.findOne({
                where: { user_id: user.id },
              }).then(async (picture) => {
                if (picture) {
                  await s3.deleteObject(
                    {
                      Key: picture.url,
                      Bucket: process.env.AWS_BUCKET_NAME,
                    },
                    (err, data) => {
                      if (err) {
                        console.log(err);
                        return res
                          .status(500)
                          .send("Cannot connect to S3 Bucket");
                      } else {
                        picture.destroy();
                      }
                    }
                  );
                }
                //Upload file to S3
                let actualFileName, fileName, filePath;
                const uploadSingle = multer({
                  storage: multerS3({
                    s3,
                    bucket: process.env.AWS_BUCKET_NAME,
                    key: (req, file, cb) => {
                      fileName = `${file.originalname}`;
                      filePath = `${user.id}/${fileName}`;
                      bucketName=`${process.env.AWS_BUCKET_NAME}`;
                      cb(null, filePath);
                    },
                  }),
                  fileFilter: acceptedFileFormats,
                }).single("picture-upload");
                //Upload to DB
                uploadSingle(req, res, async (err) => {
                  //console.log(req.file);
                  if (err) res.status(400).json({ err });
                  else {
                    if (req.file) {
                      //Save file in DB
                      await Picture.create({
                        file_name: fileName,
                        id: uuidv4(),
                        url: filePath,
                        user_id: user.id,
                      }).then((profilePic) => {
                        const { file_name, id, url, user_id, upload_date} =
                          profilePic;
                        res.status(201).json({
                          file_name,
                          id,
                          url:`${process.env.AWS_BUCKET_NAME}/${user.id}/${fileName}`,
                          upload_date,
                          user_id,
                          
                        });
                      });
                    } else {
                      return res
                        .status(400)
                        .json({ message: "Image is not valid" });
                    }
                  }
                });
              });
            } else{
              console.log(`[ERROR]: User email id not verified`)
              res.status(403).json({
                  success: false,
                  message: "Please verify your email id"
              })
            }
            } else {
              return res
                .status(401)
                .json({ message: "The user is unauthorized" });
            }
          
        } else {
          return res.status(404).json({ message: "User does not exist" });
        }
      })
      .catch((err) => {
        return res.status(500).json({ message: err.message });
      });
  } catch (err) {
    return res.status(400).json(err.message);
  }
};




//Get Picture
const getPicture = async (req, res) => {
  sdc.increment('/v1/user/self/pic');
  console.log("hit /v1/user/self/pic");
    if (req.headers.authorization === undefined) {
        res.status(403).send();
      }
      //grab the encoded value, format: bearer <Token>, need to extract only <token>
      var encoded = req.headers.authorization.split(" ")[1];
      // decode it using base64
      var decoded = new Buffer(encoded, "base64").toString();
      var username = decoded.split(":")[0];
      var password = decoded.split(":")[1];
    try {
      //Check if user exists
      User.findOne({
        where: { username: username },
      })
        .then((user) => {
          if (user) {
            //Check if passwords are same
            const isPasswordCorrect = bcrypt.compareSync(
              password,
              user.password
            );
            if (isPasswordCorrect) {
              //Check if picture exists
              if(user.status==="Verified"){
                  Picture.findOne({
                    where: { user_id: user.id },
                  }).then((picture) => {
                    if (picture) {
                      const { file_name, id, url, upload_date, user_id } = picture;
                      res.status(200).send({
                        file_name,  
                        id,
                        url:`${process.env.AWS_BUCKET_NAME}/${user.id}/${file_name}`,
                        upload_date,
                        user_id,
                      });
                    } else {
                      return res
                        .status(404)
                        .json({ message: "No profile picture available" });
                    }
                  });
              }else{
                console.log(`[ERROR]: User email id not verified`)
                res.status(403).json({
                    success: false,
                    message: "Please verify your email id"
                })
              }
            } else {
              return res
                .status(401)
                .json({ message: "The user is unauthorized" });
            }
          } else {
            return res.status(404).json({ message: "User does not exist" });
          }
        })
        .catch((err) => {
          return res.status(500).json({ message: err.message });
        });
    } catch (err) {
      return es.status(400).json(err.message);
    }
  };



//Delete Picture
const deletePicture = async (req, res) => {

  sdc.increment('/v1/user/self/pic');
  console.log("hit /v1/user/self/pic");
    if (req.headers.authorization === undefined) {
        res.status(403).send();
      }
      //grab the encoded value, format: bearer <Token>, need to extract only <token>
      var encoded = req.headers.authorization.split(" ")[1];
      // decode it using base64
      var decoded = new Buffer(encoded, "base64").toString();
      var username = decoded.split(":")[0];
      var password = decoded.split(":")[1];
    try {
      //Check if user exists
      User.findOne({
        where: { username: username },
      })
        .then((user) => {
          if (user) {
            //Check if passwords are same
            const isPasswordCorrect = bcrypt.compareSync(
              password,
              user.password
            );
            if (isPasswordCorrect) {
              //Check if picture exists
              if(user.status==="Verified"){
                  Picture.findOne({
                    where: { user_id: user.id },
                  }).then(async (picture) => {
                    if (picture) {
                      await s3.deleteObject(
                        {
                          Key: picture.url,
                          Bucket: process.env.AWS_BUCKET_NAME,
                        },
                        (err, data) => {
                          if (err) {
                            console.log(err);
                            return res
                              .status(500)
                              .send("Cannot connect to S3 Bucket");
                          } else {
                            picture.destroy();
                            res.sendStatus(204);
                            return;
                          }
                        }
                      );
                    } else {
                      res
                        .status(404)
                        .json({ message: "No profile picture available" });
                    }
                  });

              }else{
                console.log(`[ERROR]: User email id not verified`)
                res.status(403).json({
                    success: false,
                    message: "Please verify your email id"
                })
              }
            } else {
              return res
                .status(401)
                .json({ message: "The user is unauthorized" });
            }
          } else {
            return res.status(404).json({ message: "User does not exist" });
          }
        })
        .catch((err) => {
          return res.status(500).json({ message: err.message });
        });
    } catch (err) {
      return res.status(400).json(err.message);
    }
  };
  
  


module.exports = {
  createPicture,getPicture,deletePicture
};
