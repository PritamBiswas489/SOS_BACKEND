export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn("trusted_contacts", "sos_alert", {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },{
    supportsSearchPath: false
  });
  await queryInterface.addColumn("trusted_contacts", "share_location", {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },{
    supportsSearchPath: false
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.removeColumn("trusted_contacts", "sos_alert",{
    supportsSearchPath: false
  });
  await queryInterface.removeColumn("trusted_contacts", "share_location",{
    supportsSearchPath: false
  });
}
