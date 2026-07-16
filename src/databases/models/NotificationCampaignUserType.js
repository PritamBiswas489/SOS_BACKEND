export default function NotificationCampaignUserType(sequelize, DataTypes) {
  const NotificationCampaignUserType = sequelize.define(
    "NotificationCampaignUserType",
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
      user_type: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
    },
    {
      tableName: "notification_campaign_user_types",
      timestamps: false,
    }
  );

  return NotificationCampaignUserType;
}
