export default function NotificationCampaignTargetUser(sequelize, DataTypes) {
  const NotificationCampaignTargetUser = sequelize.define(
    "NotificationCampaignTargetUser",
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      campaign_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: "notification_campaigns",
          key: "id",
        },
      },
      user_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
    },
    {
      tableName: "notification_campaign_target_users",
      timestamps: false,
    }
  );

  return NotificationCampaignTargetUser;
}
