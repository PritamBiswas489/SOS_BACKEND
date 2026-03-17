import moment from "moment-timezone";
import "../../config/environment.js";
export default function Transfer(sequelize, DataTypes) {
  const Transfer = sequelize.define(
    "Transfer",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      senderId: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      receiverId: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      currency: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      message: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      expireAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      senderLatitude: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      senderLongitude: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      receiverLatitude: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      receiverLongitude: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "transfer",
      timestamps: true,
    }
  );
  Transfer.prototype.toJSON = function () {
    const values = { ...this.dataValues };

    if (values.createdAt) {
      values.createdAt = moment
        .utc(values.createdAt)
        .tz(process.env.TIMEZONE)
        .format("YYYY-MM-DD HH:mm:ss");
    }

    if (values.updatedAt) {
      values.updatedAt = moment
        .utc(values.updatedAt)
        .tz(process.env.TIMEZONE)
        .format("YYYY-MM-DD HH:mm:ss");
    }

    if (values.expireAt) {
      const now = moment();
      const expiredMoment = moment(values.expireAt);
      const diffSeconds = expiredMoment.diff(now, "seconds");
      let remainingTime = null;
      if (diffSeconds > 0) {
        const duration = moment.duration(diffSeconds, "seconds");
        if (duration.asDays() >= 1) {
          remainingTime = `${Math.floor(duration.asDays())} day(s)`;
        } else if (duration.asHours() >= 1) {
          remainingTime = `${Math.floor(duration.asHours())} hour(s)`;
        } else if (duration.asMinutes() >= 1) {
          remainingTime = `${Math.floor(duration.asMinutes())} min(s)`;
        } else {
          remainingTime = `${Math.floor(duration.asSeconds())} sec(s)`;
        }
      } else {
        remainingTime = "Expired";
      }
      values.remainingTime = remainingTime;
    } else {
      values.remainingTime = null;
    }

    return values;
  };
  Transfer.prototype.formatResponse = function () {
    const values = { ...this.get({ plain: true }) };

    if (values.createdAt) {
      values.createdAt = moment
        .utc(values.createdAt)
        .tz(process.env.TIMEZONE)
        .format("YYYY-MM-DD HH:mm:ss");
    }

    if (values.updatedAt) {
      values.updatedAt = moment
        .utc(values.updatedAt)
        .tz(process.env.TIMEZONE)
        .format("YYYY-MM-DD HH:mm:ss");
    }

    if (values.expireAt) {
      const now = moment();
      const expiredMoment = moment(values.expireAt);
      const diffSeconds = expiredMoment.diff(now, "seconds");
      let remainingTime = null;
      if (diffSeconds > 0) {
        const duration = moment.duration(diffSeconds, "seconds");
        if (duration.asDays() >= 1) {
          remainingTime = `${Math.floor(duration.asDays())} day(s)`;
        } else if (duration.asHours() >= 1) {
          remainingTime = `${Math.floor(duration.asHours())} hour(s)`;
        } else if (duration.asMinutes() >= 1) {
          remainingTime = `${Math.floor(duration.asMinutes())} min(s)`;
        } else {
          remainingTime = `${Math.floor(duration.asSeconds())} sec(s)`;
        }
      } else {
        remainingTime = "Expired";
      }
      values.remainingTime = remainingTime;
    } else {
      values.remainingTime = null;
    }

    return values;
  };
  return Transfer;
}
