export default function EmergencyServices(sequelize, DataTypes) {
	const EmergencyServices = sequelize.define(
		"EmergencyServices",
		{
			id: {
				type: DataTypes.BIGINT,
				autoIncrement: true,
				primaryKey: true,
				allowNull: false,
			},
			requestBy: {
				type: DataTypes.BIGINT,
				allowNull: true,
				references: {
					model: "users",
					key: "id",
				},
			},
			locationName: {
				type: DataTypes.TEXT,
				allowNull: false,
			},
			latitude: {
				type: DataTypes.DOUBLE,
				allowNull: false,
			},
			longitude: {
				type: DataTypes.DOUBLE,
				allowNull: false,
			},
			address: {
				type: DataTypes.TEXT,
				allowNull: false,
			},
			placeId: {
				type: DataTypes.STRING(255),
				allowNull: false,
			},
			status: {
				type: DataTypes.ENUM("pending", "approved"),
				allowNull: false,
				defaultValue: "pending",
			},
			phoneNumber: {
				type: DataTypes.STRING(30),
				allowNull: false,
			},
			serviceType: {
				type: DataTypes.STRING(100),
				allowNull: false,
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
			tableName: "emergency_services",
			timestamps: false,
			indexes: [
				// ✅ replaces GIST index on location
				{
					name: "idx_emergency_services_lat_lng",
					fields: ["latitude", "longitude"],
				},
				{
					name: "idx_emergency_services_service_type",
					fields: ["serviceType"],
				},
				{
					name: "idx_emergency_services_request_by",
					fields: ["requestBy"],
				},
				{
					name: "idx_emergency_services_service_type_status",
					fields: ["serviceType", "status"],
				},
			],
		}
	);

	return EmergencyServices;
}