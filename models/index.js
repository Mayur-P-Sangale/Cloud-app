const dbConfig = require("../config/db.config.js");
const fs = require('fs');

const rdsCa = fs.readFileSync(__dirname +'/rds-combined-ca-bundle.pem');

const Sequelize = require("sequelize");
const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  dialect: dbConfig.dialect,
  operatorsAliases: false,
  dialectOptions: {
    ssl: {
        rejectUnauthorized: true,
        ca: [rdsCa]
    }
}
});


const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.picture = require("./picture.model.js")(sequelize, Sequelize);
db.users = require("./user.model.js")(sequelize, Sequelize);


module.exports = db;
