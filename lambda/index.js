/* *
 * This sample demonstrates handling intents from an Alexa skill using the Alexa Skills Kit SDK (v2).
 * Please visit https://alexa.design/cookbook for additional examples on implementing slots, dialog management,
 * session persistence, api calls, and more.
 * */
const Alexa = require('ask-sdk-core');
const axios = require('axios');
const Util = require('./util.js');


const eloToPortuguese = {
  "IRON": "FERRO",
  "BRONZE": "BRONZE",
  "SILVER": "PRATA",
  "GOLD": "OURO",
  "PLATINUM": "PLATINA",
  "DIAMOND": "DIAMANTE",
  "MASTER": "MESTRE",
  "GRANDMASTER": "GRÃO MESTRE",
  "CHALLANGER": "DESAFIANTE",
}

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    async handle(handlerInput) {
        const accessToken = handlerInput.requestEnvelope.context.System.user.accessToken
        
        if(!accessToken) {
            return handlerInput.responseBuilder
              .speak("Por favor, vincule sua conta para cadastrar seu nick do lol!")
              .withLinkAccountCard()
              .getResponse();
        }
        
        const baseUrl = `https://alexa-lol-league.herokuapp.com`
        const rankedSolo = (await axios.get(`${baseUrl}/getElo?jwt=${accessToken}`)).data
        if(rankedSolo.message) {
            return handlerInput.responseBuilder
              .speak("Cadastro de nickname do lol necessário, verifique o card adicionado no seu app da alexa")
              .withSimpleCard(
                "Vinculação de nick necessária",
                `Por favor, Acesse ${baseUrl} pelo navegador, autentique com sua conta amazon e insire seu nome de invocador lá`
              )
              .getResponse();
        }
        const eloMessage = `Você está no ${eloToPortuguese[rankedSolo.tier]} ${rankedSolo.rank}, com ${rankedSolo.leaguePoints} de PDL`;
        return handlerInput.responseBuilder
            .speak(eloMessage)
            .getResponse();
    }
};
/**
 * Generic error handling to capture any syntax or routing errors. If you receive an error
 * stating the request handler chain is not found, you have not implemented a handler for
 * the intent being invoked or included it in the skill builder below 
 * */
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        const speakOutput = 'Sorry, I had trouble doing what you asked. Please try again.';
        console.log(`~~~~ Error handled: ${JSON.stringify(error)}`);

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

/**
 * This handler acts as the entry point for your skill, routing all request and response
 * payloads to the handlers above. Make sure any new handlers or interceptors you've
 * defined are included below. The order matters - they're processed top to bottom 
 * */
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,)
    .addErrorHandlers(
        ErrorHandler)
    .withCustomUserAgent('sample/hello-world/v1.2')
    .lambda();