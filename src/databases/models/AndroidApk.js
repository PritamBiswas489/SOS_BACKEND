export default function AndroidApk(sequelize, DataTypes) {
    const AndroidApk = sequelize.define(
        "AndroidApk",
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
                allowNull: false
            },
            apk_file: {
                type: DataTypes.STRING,
                allowNull: false
            },
            version: {
                type: DataTypes.STRING,
                allowNull: false
            },
            req_file: {
                    type: DataTypes.JSON,
                    allowNull: true
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
            tableName: "android_apk",
            timestamps: false
        }
    );
    return AndroidApk;
}
