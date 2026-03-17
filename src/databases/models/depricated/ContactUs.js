export default function ContactUs(sequelize, DataTypes) {
	return sequelize.define(
		'ContactUs',
		{
			id: {
				type: DataTypes.BIGINT,
				autoIncrement: true,
				primaryKey: true,
			},
            address: {
				type: DataTypes.TEXT,
				allowNull: true,
			},
            phoneOne: {
				type: DataTypes.TEXT,
				allowNull: true,
			},
            phoneTwo: {
				type: DataTypes.TEXT,
				allowNull: true,
			},
            email: {
				type: DataTypes.TEXT,
				allowNull: true,
			},
            website: {
				type: DataTypes.TEXT,
				allowNull: true,
			},
		},
		{
			tableName: 'contact_us',
			timestamps: true,
		}
	);
}
