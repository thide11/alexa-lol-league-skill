const Alexa = require('ask-sdk-core');
const axios = require('axios');
const i18next = require('i18next'); 
const sprintf = require('i18next-sprintf-postprocessor'); 

const languageStrings = {
    'en' : require('./i18n/en'),
    'pt' : require('./i18n/pt'),
}

function configurei18N(locale) {
    const i18n = i18next.use(sprintf).init({
        lng: locale,
        fallbackLng: 'en', // fallback to EN if locale doesn't exist
        resources: languageStrings
    });

    i18n.t = function () {
        const args = arguments;
        let values = [];
    
        for (var i = 1; i < args.length; i++) {
            values.push(args[i]);
        }
        const value = i18next.t(args[0], {
            returnObjects: true,
            postProcess: 'sprintf',
            sprintf: values
        });
    
        if (Array.isArray(value)) {
            return value[Math.floor(Math.random() * value.length)];
        } else {
            return value;
        }
    }
    return i18n;
}

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    async handle(handlerInput) {
        const i18n = configurei18N(handlerInput.requestEnvelope.request.locale);
        const accessToken = handlerInput.requestEnvelope.context.System.user.accessToken
        
        if(!accessToken) {
            return handlerInput.responseBuilder
              .speak(i18n.t("NEED_VINCULATION"))
              .withLinkAccountCard()
              .getResponse();
        }
        
        const baseUrl = `https://alexa-lol-league.herokuapp.com`
        const getEloRequest = await axios.get(`${baseUrl}/getElo?jwt=${accessToken}`);
        const rankedSolo = getEloRequest.data
        if(rankedSolo != null && rankedSolo.message) {
            return handlerInput.responseBuilder
              .speak(i18n.t("NEED_NICKNAME_HEADER"))
              .withSimpleCard(
                i18n.t("NEED_NICKNAME_CARD_HEADER"),
                i18n.t("NEED_NICKNAME_CARD_DESCRIPTION", baseUrl)
              )
              .getResponse();
        }
        let eloMessage;
        if(rankedSolo == null) {
            eloMessage = i18n.t("UNRANKED_MESSAGE")
        } else {
            eloMessage = i18n.t("ELO_TEMPLATE", i18n.t(rankedSolo.tier), rankedSolo.rank, rankedSolo.leaguePoints);
        }
        return handlerInput.responseBuilder
            .speak(eloMessage)
            .getResponse();
    }
};

const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        const i18n = configurei18N(handlerInput.requestEnvelope.request.locale);
        const speakOutput = i18n.t("PROBLEM_MESSAGE");
        console.log(`~~~~ Error handled: ${JSON.stringify(error)}`);

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
    )
    .addErrorHandlers(
        ErrorHandler
    )
    .withCustomUserAgent('v0.2')
    .lambda();