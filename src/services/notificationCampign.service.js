import db from "../databases/models/index.js";
import * as Sentry from "@sentry/node";
 

const { Op, User, NotificationCampaign, NotificationCampaignBatch, NotificationCampaignUserType, NotificationCampaignTargetUser, NotificationRecipient, sequelize } = db;
 
export default class NotificationCampaignService {
    static async createNotificationCampaign({payload, user}, callback) {
        try {
            // console.log("Creating notification campaign with payload:", payload, "by user:", user?.id);
            if (payload.targetType === "specific") {
                await assertUsersExist(payload.userIds);
            }
            const campignData =  {
                        title: payload.title.trim(),
                        subject: payload.subject || null,
                        body_html: payload.bodyHtml || null,
                        body_text: payload.bodyText || null,
                        template_id: payload.templateId || null,

                        push_title: payload.pushTitle || null,
                        push_body: payload.pushBody || null,
                        push_image_url: payload.pushImageUrl || null,
                        push_data: payload.pushData || {},

                        target_type: payload.targetType,
                        channel: payload.channel,
                        status: "scheduled",
                        scheduled_at: payload.scheduledAt ? new Date(payload.scheduledAt) : new Date(),

                        resolve_batch_size: payload.resolveBatchSize || 1000,
                        created_by:  user?.id,
                    }

            console.log("Prepared campaign data for creation:", campignData);        
            const campaign = await sequelize.transaction(async (t) => {
                const createdCampaign = await NotificationCampaign.create(
                   campignData,
                    { transaction: t }
                );

                if (payload.targetType === "user_type") {
                    const uniqueTypes = [...new Set(payload.userTypes)];
                    await NotificationCampaignUserType.bulkCreate(
                        uniqueTypes.map((userType) => ({ campaign_id: createdCampaign.id, user_type: userType })),
                        { transaction: t }
                    );
                }

                if (payload.targetType === "specific") {
                    const uniqueIds = [...new Set(payload.userIds)];
                    await NotificationCampaignTargetUser.bulkCreate(
                        uniqueIds.map((userId) => ({ campaign_id: createdCampaign.id, user_id: userId })),
                        { transaction: t }
                    );
                }
                return createdCampaign;
            });

            return callback(null, { data: campaign });
        } catch (error) {
            process.env.NODE_ENV === "production" && Sentry.captureException(error);
            console.error("Error in createNotificationCampaign:", error);
            if (error?.name === "ValidationError") {
                return callback(error, null);
            }
            return callback(new Error("CREATE_CAMPAIGN_FAILED"), null);
        }
    }

    static async getNotificationCampaignList({ payload }, callback) {
        try {
            const { page = 1, limit = 10 } = payload;
            const parsedLimit = Number(limit) || 10;
            const parsedPage = Number(page) || 1;
            const offset = (parsedPage - 1) * parsedLimit;

            const campaigns = await NotificationCampaign.findAndCountAll({
                distinct: true,
                attributes: [
                    "id",
                    "title",
                    "subject",
                    "body_html",
                    "body_text",
                    "template_id",
                    "push_title",
                    "push_body",
                    "push_image_url",
                    "push_data",
                    "target_type",
                    "channel",
                    "status",
                    "scheduled_at",
                    "sent_at",
                    "total_recipients",
                    "sent_count",
                    "failed_count",
                    "opened_count",
                    "resolve_batch_size",
                    "resolve_offset",
                    "resolve_total_matched",
                    "resolve_completed_at",
                    "created_by",
                    "created_at",
                    "updated_at",
                ],
                include: [
                    {
                        model: NotificationCampaignTargetUser,
                        as: "target_users",
                        attributes: ["id", "campaign_id", "user_id"],
                        required: false,
                        include: [
                            {
                                model: User,
                                as: "user",
                                attributes: ["id", "name", "email", "phone_number", "profile_photo"],
                                required: false,
                            },
                        ],
                    },
                    {
                        model: NotificationCampaignUserType,
                        as: "user_types",
                        attributes: ["id", "campaign_id", "user_type"],
                        required: false,
                    },
                ],
                order: [["created_at", "DESC"]],
                limit: parsedLimit,
                offset,
            });

            return callback(null, {
                data: {
                    rows: campaigns.rows,
                    totalRecords: campaigns.count,
                    currentPage: parsedPage,
                    totalPages: Math.ceil(campaigns.count / parsedLimit),
                },
            });
        } catch (error) {
            process.env.NODE_ENV === "production" && Sentry.captureException(error);
            console.error("Error in getNotificationCampaignList:", error);
            return callback(new Error("GET_CAMPAIGN_LIST_FAILED"), null);
        }
    }

    static async cancelNotificationCampaign({ payload }, callback) {
        try {
            const campaign = await NotificationCampaign.findByPk(payload.id);

            if (!campaign) {
                return callback(new Error("NOTIFICATION_CAMPAIGN_NOT_FOUND"), null);
            }

            campaign.status = "cancelled";
            await campaign.save();

            return callback(null, { data: campaign });
        } catch (error) {
            process.env.NODE_ENV === "production" && Sentry.captureException(error);
            console.error("Error in cancelNotificationCampaign:", error);
            return callback(new Error("CANCEL_CAMPAIGN_FAILED"), null);
        }
    }

    static async deleteNotificationCampaign({ payload }, callback) {
        try {
            const deletedCampaign = await sequelize.transaction(async (t) => {
                const campaign = await NotificationCampaign.findByPk(payload.id, { transaction: t });

                if (!campaign) {
                    const err = new Error("NOTIFICATION_CAMPAIGN_NOT_FOUND");
                    err.name = "NotFoundError";
                    throw err;
                }

                await NotificationRecipient.destroy({ where: { campaign_id: payload.id }, transaction: t });
                await NotificationCampaignBatch.destroy({ where: { campaign_id: payload.id }, transaction: t });
                await NotificationCampaignTargetUser.destroy({ where: { campaign_id: payload.id }, transaction: t });
                await NotificationCampaignUserType.destroy({ where: { campaign_id: payload.id }, transaction: t });
                await campaign.destroy({ transaction: t });

                return campaign;
            });

            return callback(null, { data: deletedCampaign });
        } catch (error) {
            process.env.NODE_ENV === "production" && Sentry.captureException(error);
            console.error("Error in deleteNotificationCampaign:", error);
            if (error?.name === "NotFoundError") {
                return callback(error, null);
            }
            return callback(new Error("DELETE_CAMPAIGN_FAILED"), null);
        }
    }
}

async function assertUsersExist(userIds) {
    const uniqueIds = [...new Set(userIds)];
    const found = await User.count({ where: { id: { [Op.in]: uniqueIds } } });

    if (found !== uniqueIds.length) {
        const err = new Error(`${uniqueIds.length - found} of the selected user IDs do not exist`);
        err.name = "ValidationError";
        err.details = [err.message];
        throw err;
    }
}
