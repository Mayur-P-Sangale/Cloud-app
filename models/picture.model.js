module.exports = (sequelize, Sequelize) => {
    const Picture = sequelize.define(
      "picture",
      {
        file_name: {
            type: Sequelize.STRING,
            allowNull: false,
            readOnly: true,
          },
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
          readOnly: true,
        },
        url: {
          type: Sequelize.STRING,
          allowNull: false,
          readOnly: true,
        },
        user_id: {
          type: Sequelize.STRING,
          allowNull: false,
          readOnly: true,
        },
      },
      {
        createdAt: "upload_date",
        updatedAt: "account_updated",
      }
    );
    return Picture;
  };
  