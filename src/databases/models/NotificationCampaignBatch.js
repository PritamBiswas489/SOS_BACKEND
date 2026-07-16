export default function NotificationCampaignBatch(sequelize, DataTypes) {
  const NotificationCampaignBatch = sequelize.define(
    "NotificationCampaignBatch",
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
      batch_number: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      batch_offset: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      batch_limit: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      first_user_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      last_user_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      rows_inserted: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      started_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
      },
      finished_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: "running",
      },
      error_message: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "notification_campaign_batches",
      timestamps: false,
    }
  );

  return NotificationCampaignBatch;
}
