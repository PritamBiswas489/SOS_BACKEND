export default function CrashReports(sequelize, DataTypes) {
	const CrashReports = sequelize.define(
		'CrashReports',
		{
			id: {
				type: DataTypes.BIGINT,
				allowNull: false,
				autoIncrement: true,
				primaryKey: true,
			},
			error_payload: {
				type: DataTypes.JSON,
				allowNull: false,
			},
			created_at: {
				type: DataTypes.DATE,
				allowNull: false,
				defaultValue: DataTypes.NOW,
			},
			updated_at: {
				type: DataTypes.DATE,
				allowNull: false,
				defaultValue: DataTypes.NOW,
			},
		},
		{
			tableName: 'crash_reports',
			timestamps: false,
		}
	);
	return CrashReports;
};
