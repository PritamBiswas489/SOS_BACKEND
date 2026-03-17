export default function OtpVerifications(sequelize, DataTypes) {
	const OtpVerifications = sequelize.define(
		"OtpVerifications",
		{
			id: {
				type: DataTypes.BIGINT,
				autoIncrement: true,
				primaryKey: true,
				allowNull: false
			},
			phone_number: {
				type: DataTypes.STRING(20),
				allowNull: false
			},
			otp_code: {
				type: DataTypes.STRING(10),
				allowNull: false
			},
			expires_at: {
				type: DataTypes.DATE,
				allowNull: false
			},
			is_used: {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: false
			},
			created_at: {
				type: DataTypes.DATE,
				allowNull: false,
				defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
			},
			updated_at: {
				type: DataTypes.DATE,
				allowNull: false,
				defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
			}
		},
		{
			tableName: "otp_verifications",
			timestamps: false
		}
	);
	return OtpVerifications;
}
