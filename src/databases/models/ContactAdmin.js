export default function ContactAdmin(sequelize, DataTypes) {
	const ContactAdmin = sequelize.define(
		"ContactAdmin",
		{
			id: {
				type: DataTypes.BIGINT,
				autoIncrement: true,
				primaryKey: true,
				allowNull: false,
			},
			message: {
				type: DataTypes.TEXT,
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
			tableName: "contact_admin",
			timestamps: false,
		},
	);

	return ContactAdmin;
}
