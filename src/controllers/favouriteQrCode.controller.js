import "../config/environment.js";
import FavouriteQrCodeService from "../services/favouriteQrCode.service.js";
export default class FavouriteQrCodeController {
  static async listFavouriteQrCodes(request) {
    const {
      headers: { i18n },
      user,
      payload,
    } = request;
    const userId = user?.id || 1;

    return new Promise((resolve) => {
      FavouriteQrCodeService.getFavouriteQrCodes(
        { userId, payload, i18n },
        (err, response) => {
          if (err) {
            return resolve({
              status: 400,
              data: null,
              error: {
                message: i18n.__(
                  err.message || "GET_FAVOURITE_QR_CODES_FAILED"
                ),
                reason: err.message,
              },
            });
          }
          return resolve({
            status: 200,
            data: response.data,
            message: i18n.__("GET_FAVOURITE_QR_CODES_SUCCESSFUL"),
            error: null,
          });
        }
      );
    });
  }
  static async removeFavouriteQrCode(request) {
    // Implementation for removing a favourite QR code
    const {
      headers: { i18n },
      user,
      payload,
    } = request;
    const userId = user?.id || 1;
    const { id } = payload;
    return new Promise((resolve) => {
      FavouriteQrCodeService.removeFavouriteQrCode(
        { userId, id, i18n },
        (err, response) => {
          if (err) {
            return resolve({
              status: 400,
              data: null,
              error: {
                message: i18n.__(
                  err.message || "REMOVE_FAVOURITE_QR_CODE_FAILED"
                ),
                reason: err.message,
              },
            });
          }
          return resolve({
            status: 200,
            data: response.data,
            message: i18n.__("REMOVE_FAVOURITE_QR_CODE_SUCCESSFUL"),
            error: null,
          });
        }
      );
    });
  }
}
