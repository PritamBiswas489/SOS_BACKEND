export default function RequestIosEmail(sequelize, DataTypes) {
	const RequestIosEmail = sequelize.define(
		"RequestIosEmail",
		{
			id: {
				type: DataTypes.BIGINT,
				autoIncrement: true,
				primaryKey: true,
				allowNull: false,
			},
			testFlightEmail: {
				type: DataTypes.STRING(255),
				allowNull: false,
			},
			userId: {
				type: DataTypes.BIGINT,
				allowNull: false,
				references: {
					model: "users",
					key: "id",
				},
			},
			status: {
				type: DataTypes.ENUM("new", "added", "failed"),
				allowNull: false,
				defaultValue: "new",
			},
			createdAt: {
				type: DataTypes.DATE,
				allowNull: false,
				defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
			},
			updatedAt: {
				type: DataTypes.DATE,
				allowNull: false,
				defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
			},
		},
		{
			tableName: "request_ios_email",
			timestamps: false,
			indexes: [
				{
					name: "idx_request_ios_email_user_id",
					fields: ["userId"],
				},
			],
		},
	);

	return RequestIosEmail;
}
