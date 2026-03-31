export async function up(queryInterface, Sequelize) {
  await queryInterface.addIndex("trusted_contacts", ["user_id"], {
    name: "idx_trusted_contacts_user_id"
  });
  await queryInterface.addIndex("trusted_contacts", ["trusted_user_id"], {
    name: "idx_trusted_contacts_trusted_user_id"
  });
  await queryInterface.addIndex("trusted_contacts", ["status"], {
    name: "idx_trusted_contacts_status"
  });
  // Composite indexes
  await queryInterface.addIndex("trusted_contacts", ["user_id", "status"], {
    name: "idx_trusted_contacts_user_id_status"
  });
  await queryInterface.addIndex("trusted_contacts", ["trusted_user_id", "status"], {
    name: "idx_trusted_contacts_trusted_user_id_status"
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.removeIndex("trusted_contacts", "idx_trusted_contacts_user_id");
  await queryInterface.removeIndex("trusted_contacts", "idx_trusted_contacts_trusted_user_id");
  await queryInterface.removeIndex("trusted_contacts", "idx_trusted_contacts_status");
  await queryInterface.removeIndex("trusted_contacts", "idx_trusted_contacts_user_id_status");
  await queryInterface.removeIndex("trusted_contacts", "idx_trusted_contacts_trusted_user_id_status");
}
