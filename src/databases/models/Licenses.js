export default function Licenses(sequelize, DataTypes) {
	const Licenses = sequelize.define(
		"Licenses",
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
			license_key: {
				type: DataTypes.STRING(120),
				allowNull: false,
				unique: true
			},
			license_type: {
				type: DataTypes.STRING(50),
				allowNull: true
			},
			status: {
				type: DataTypes.STRING(20),
				allowNull: false,
				validate: {
					isIn: [["active", "expired", "suspended"]]
				}
			},
			expiry_date: {
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
			tableName: "licenses",
			timestamps: false,
             
           
		}
	);
	return Licenses;
}
