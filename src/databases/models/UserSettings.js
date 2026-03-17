export default function UserSettings(sequelize, DataTypes) {
	const UserSettings = sequelize.define(
		"UserSettings",
		{
			id: {
				type: DataTypes.BIGINT,
				autoIncrement: true,
				primaryKey: true,
				allowNull: false
			},
			user_id: {
				type: DataTypes.BIGINT,
				allowNull: false,
				unique: true
			},
			shake_sensitivity: {
				type: DataTypes.STRING(20),
				allowNull: false,
				defaultValue: 'medium'
			},
			silent_mode_alert: {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: true
			},
			share_location_with: {
				type: DataTypes.STRING(20),
				allowNull: false,
				defaultValue: 'trusted_only'
			},
			fake_call_number: {
				type: DataTypes.STRING(20),
				allowNull: true
			},
			language: {
				type: DataTypes.STRING(10),
				allowNull: false,
				defaultValue: 'en'
			},
			updated_at: {
				type: DataTypes.DATE,
				allowNull: false,
				defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
			},
			created_at: {
				type: DataTypes.DATE,
				allowNull: false,
				defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
			}
		},
		{
			tableName: "user_settings",
			timestamps: false
		}
	);
	return UserSettings;
}
