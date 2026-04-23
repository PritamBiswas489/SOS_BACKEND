export default function SosSessionAudioRecords(sequelize, DataTypes) {
  const SosSessionAudioRecords = sequelize.define(
    "SosSessionAudioRecords",
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      sos_session_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: "sos_sessions",
          key: "id",
        },
      },
      file_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "sos_session_audio_records",
      timestamps: false,
    }
  );

  return SosSessionAudioRecords;
}
