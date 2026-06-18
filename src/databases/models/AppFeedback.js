export default function AppFeedback(sequelize, DataTypes) {
	const AppFeedback = sequelize.define(
		"AppFeedback",
		{
			id: {
				type: DataTypes.BIGINT,
				autoIncrement: true,
				primaryKey: true,
				allowNull: false
			},
			user_id: {
				type: DataTypes.BIGINT,
				allowNull: true
			},
			rating: {
				type: DataTypes.INTEGER,
				allowNull: false,
				defaultValue: 1,
				validate: {
					min: 1,
					max: 5
				}
			},
			feedback_type: {
				type: DataTypes.STRING(50),
				allowNull: true
			},
			message: {
				type: DataTypes.TEXT,
				allowNull: true
			},
			screenshot_url: {
				type: DataTypes.TEXT,
				allowNull: true
			},
			app_version: {
				type: DataTypes.STRING(50),
				allowNull: true
			},
			device_info: {
				type: DataTypes.TEXT,
				allowNull: true
			},
			os_version: {
				type: DataTypes.STRING(50),
				allowNull: true
			},
			allow_contact: {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: false
			},
			status: {
				type: DataTypes.STRING(20),
				allowNull: false,
				defaultValue: "new",
				validate: {
					isIn: [["new", "reviewed", "resolved", "ignored"]]
				}
			},
			admin_reply: {
				type: DataTypes.TEXT,
				allowNull: true
			},
			created_at: {
				type: DataTypes.DATE,
				allowNull: false,
				defaultValue: sequelize.literal("CURRENT_TIMESTAMP")
			},
			updated_at: {
				type: DataTypes.DATE,
				allowNull: false,
				defaultValue: sequelize.literal("CURRENT_TIMESTAMP")
			}
		},
		{
			tableName: "app_feedback",
			timestamps: false
		}
	);
	return AppFeedback;
}
