export async function up(queryInterface, Sequelize) {
  await queryInterface.addIndex("trusted_contacts", ["user_id", "trusted_user_id"], {
    name: "idx_trusted_contacts_userid_trusteduserid",
    supportsSearchPath: false,
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.removeIndex("trusted_contacts", "idx_trusted_contacts_userid_trusteduserid",{
    supportsSearchPath: false,
  });
}
