export default function JobQueues(sequelize, DataTypes) {
	const JobQueues = sequelize.define(
		"JobQueues",
		{
			id: {
				type: DataTypes.BIGINT,
				autoIncrement: true,
				primaryKey: true,
				allowNull: false,
			},
			job_id: {
				type: DataTypes.STRING(100),
				allowNull: true,
			},
			job_name: {
				type: DataTypes.STRING(100),
				allowNull: true,
			},
			payloads: {
				type: DataTypes.JSON,
				allowNull: true,
			},
			status: {
				type: DataTypes.STRING(30),
				allowNull: false,
				defaultValue: "pending",
			},
			status_description: {
				type: DataTypes.TEXT,
				allowNull: true,
			},
			created_at: {
				type: DataTypes.DATE,
				allowNull: false,
				defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
			},
			updated_at: {
				type: DataTypes.DATE,
				allowNull: false,
				defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
			},
		},
		{
			tableName: "job_queues",
			timestamps: false,
		}
	);

	return JobQueues;
}
