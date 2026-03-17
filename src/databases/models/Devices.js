export default function Devices(sequelize, DataTypes) {
	const Devices = sequelize.define(
		"Devices",
		{
			id: {
				type: DataTypes.BIGINT,
				autoIncrement: true,
				primaryKey: true,
				allowNull: false
			},
			user_id: {
				type: DataTypes.BIGINT,
				allowNull: false
			},
			device_token: {
				type: DataTypes.TEXT,
				allowNull: true
			},
			device_type: {
				type: DataTypes.STRING(20),
				allowNull: true,
				validate: {
					isIn: [["android", "ios", "web"]]
				}
			},
			app_version: {
				type: DataTypes.STRING(20),
				allowNull: true
			},
			os_version: {
				type: DataTypes.STRING(20),
				allowNull: true
			},
			is_active: {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: true
			},
			push_enabled: {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: true
			},
			last_login: {
				type: DataTypes.DATE,
				allowNull: true
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
			tableName: "devices",
			timestamps: false
		}
	);
	return Devices;
}
