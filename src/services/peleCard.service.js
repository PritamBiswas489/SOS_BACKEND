import "../config/environment.js";
import * as Sentry from "@sentry/node";
import axios from "axios";
import { getPeleCardCurrencyNumber } from "../libraries/utility.js";
import { amountUptotwoDecimalPlaces } from "../libraries/utility.js";
import InterestRatesService from "./interestRates.service.js";

export default class PeleCardService {
  static async ConvertToToken(data) {
    const reqData = {
      terminalNumber: process.env.PELECARD_TERMINAL_NUMBER,
      user: process.env.PELECARD_USER,
      password: process.env.PELECARD_PASSWORD,
      shopNumber: process.env.PELECARD_SHOP_NUMBER,
      creditCard: data?.cardNumber,
      creditCardDateMmYy: data?.creditCardDateMmYy.replace("/", ""),
      addFourDigits: "false",
    };

    try {
      const response = await axios.post(
        "https://gateway21.pelecard.biz/services/ConvertToToken",
        reqData,
        {
          headers: {
            "Content-Type": "application/json; charset=UTF-8",
          },
        }
      );

      return response?.data || {};
    } catch (e) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
      return {
        ERROR: 1,
      };
    }
  }
  static async calculatePaymentAmount(args) {
    const { amount, number_of_payment } = args;
    let interestRate = 0; 
    const getInterestRate = await InterestRatesService.getInterestRatesByPaymentNumber(number_of_payment);
    if (getInterestRate?.data?.interestRate) {
      interestRate = parseFloat(getInterestRate.data.interestRate);
    }
    const interestAmount = (amount * interestRate) / 100;
    const totalAmount = amountUptotwoDecimalPlaces(amount + interestAmount);
    const firstPayment = amountUptotwoDecimalPlaces(totalAmount / number_of_payment);
    const data =  {
      totalAmount,
      interestAmount,
      interestRate: interestRate || 0,
      firstPayment,
      processingfee: 0
    };
    
    return{data};
  }
  static async calculateInstallmentPaymentAmount(args){
    const {amount} = args;
    const getInterestRates = await InterestRatesService.getInterestRates();
    const data = getInterestRates?.data?.map((interestRateDt) => {
      const interestAmount = (amount * interestRateDt.interestRate) / 100;
      const totalAmount = amountUptotwoDecimalPlaces(amount + interestAmount);
      return {
      paymentNumber: interestRateDt.paymentNumber,
      totalAmount,
      interestAmount,
      interestRate: interestRateDt.interestRate,
      firstPayment: amountUptotwoDecimalPlaces(totalAmount / interestRateDt.paymentNumber),
      processingfee: 0
      };
    }) || [];

    return { data };
  }
  static async makePayment(args) {
    const { amount, fromCurrency, userCard, nationalId, userId, number_of_payment } = args;
    const peleCardCurrencyNumber = getPeleCardCurrencyNumber();
    const currency = peleCardCurrencyNumber[fromCurrency];
    let  endPointUrl = "https://gateway20.pelecard.biz/services/DebitRegularType";
    const reqData = {
        terminalNumber: process.env.PELECARD_TERMINAL_NUMBER,
        user: process.env.PELECARD_USER,
        password: process.env.PELECARD_PASSWORD,
        shopNumber: process.env.PELECARD_SHOP_NUMBER,
        token: userCard?.Token,
        total:amount * 100, // PeleCard expects amount in cents
        currency: currency,
        id: nationalId || "", // Customer national ID
        authorizationNumber:"", // Authorization number if available
        paramX: JSON.stringify({ userId: userId || "" }) // Additional parameter, can be used for custom data
    };
    let interestRate = 0;
    const getInterestRate = await InterestRatesService.getInterestRatesByPaymentNumber(parseInt(number_of_payment));
    if(getInterestRate?.data?.interestRate) {
        interestRate = parseFloat(getInterestRate.data.interestRate);
    }
    const getInterestAmount = (amount * interestRate) / 100;
    const totalAmount = amountUptotwoDecimalPlaces(amount + getInterestAmount);
    reqData.total = totalAmount * 100; 

    if(parseInt(number_of_payment) > 1) {
       endPointUrl = "https://gateway20.pelecard.biz/services/DebitPaymentsType";
       const firstPayment = amountUptotwoDecimalPlaces(totalAmount / number_of_payment);
       reqData.paymentsNumber = number_of_payment; 
       reqData.firstPayment = firstPayment * 100; 
       

      //  console.log("PeleCard payment request data:", reqData);

    }

    // return 
    

    try {
      const response = await axios.post(
        endPointUrl,
        reqData,
        {
          headers: {
            "Content-Type": "application/json; charset=UTF-8",
          },
        }
      );
      return {...response?.data,interestRate} || {};
    } catch (e) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
      console.error("Error making payment:", e);
      return {
        ERROR: 1,
      };
    }
  }
  static async getErrorMeaning(errorCode) {
        const  endPoint = 'https://gateway20.pelecard.biz/services/GetErrorMessageHe';
        try {
            const response = await axios.post(endPoint, {
                terminalNumber: process.env.PELECARD_TERMINAL_NUMBER,
                user: process.env.PELECARD_USER,
                password: process.env.PELECARD_PASSWORD,
                shopNumber: process.env.PELECARD_SHOP_NUMBER,
                ErrorCode: errorCode
            }, {
                headers: {
                    "Content-Type": "application/json; charset=UTF-8",
                },
            });
    
            return response.data ||  {};
        } catch (e) {
            process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
            return { ERROR: 1 };
        }

  }
}
